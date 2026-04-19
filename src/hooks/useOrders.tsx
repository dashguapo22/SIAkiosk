import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, OrderWithItems, OrderStatus, PaymentMethod, CartItem } from '@/types/database';

export function useOrders(status?: OrderStatus | OrderStatus[]) {
  return useQuery({
    queryKey: ['orders', status],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (status) {
        if (Array.isArray(status)) {
          query = query.in('status', status);
        } else {
          query = query.eq('status', status);
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrderWithItems(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (orderError) throw orderError;

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);
      
      if (itemsError) throw itemsError;

      return { ...order, order_items: items } as OrderWithItems;
    },
    enabled: !!orderId,
  });
}

export function useActiveOrders() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'in_progress', 'ready'])
        .order('created_at', { ascending: true });
      
      if (ordersError) throw ordersError;

      // Fetch items for all orders
      const orderIds = orders.map(o => o.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);
      
      if (itemsError) throw itemsError;

      return orders.map(order => ({
        ...order,
        order_items: items.filter(item => item.order_id === order.id),
      })) as OrderWithItems[];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-orders'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'order_items' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['active-orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cartItems, subtotal, tax, total }: {
      cartItems: CartItem[];
      subtotal: number;
      tax: number;
      total: number;
    }) => {
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          subtotal,
          tax,
          total,
          status: 'pending',
          payment_status: 'unpaid',
        })
        .select()
        .single();
      
      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItem.id,
        item_name: item.menuItem.name,
        size: item.size,
        temperature: item.temperature,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.unitPrice * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) throw itemsError;

      return order as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const updateData: Partial<Order> = { status };
      
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    },
  });
}

export function useProcessPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, paymentMethod }: { orderId: string; paymentMethod: PaymentMethod }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_method: paymentMethod,
          payment_status: 'paid',
          status: 'in_progress',
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
    },
  });
}

export function useTodaysSales() {
  return useQuery({
    queryKey: ['todays-sales'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'paid')
        .gte('created_at', today.toISOString());
      
      if (error) throw error;
      
      const orders = data as Order[];
      const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const orderCount = orders.length;
      
      return { orders, totalSales, orderCount };
    },
  });
}
export function useAllHistorySalesAndOrders() {
  return useQuery({
    queryKey: ['all-history-sales-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'paid');

        if (error) throw error;

        const grouped: Record<string, { orders: number; sales: number} > = {};

        data.forEach((order) => {
          const day = new Date(order.created_at).toLocaleDateString('en-PH');
          if (!grouped[day]) grouped[day] = { orders: 0, sales: 0 };
          grouped[day].orders += 1;
          grouped[day].sales += Number(order.total);
        });

        return Object.entries(grouped)
        .map(([day, { orders, sales }]) => ({
          day,
          orders,
          sales,
        }))
        .sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime());
    },
  });
}
