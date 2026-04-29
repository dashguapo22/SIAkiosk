import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  AppRole,
  CartItem,
  Order,
  OrderStatus,
  OrderWithItems,
  PaymentMethod,
  UserProfile,
} from '@/types/database';

interface CashierSalesDay {
  dateKey: string;
  dateLabel: string;
  orderCount: number;
  totalSales: number;
}

export interface CashierSalesProfile {
  userId: string;
  fullName: string;
  role: AppRole;
  totalSales: number;
  totalOrders: number;
  lastSaleAt: string | null;
  salesByDate: CashierSalesDay[];
}

const getSaleTimestamp = (order: Pick<Order, 'paid_at' | 'completed_at' | 'created_at'>) =>
  order.paid_at ?? order.completed_at ?? order.created_at;

const getDateKey = (isoTimestamp: string) => {
  const date = new Date(isoTimestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateLabel = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00`).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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

export function useOrderWithItems(orderId: string, options?: { refetchInterval?: number | false }) {
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
    refetchInterval: options?.refetchInterval,
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

      const orderIds = orders.map((order) => order.id);
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) throw itemsError;

      return orders.map((order) => ({
        ...order,
        order_items: items.filter((item) => item.order_id === order.id),
      })) as OrderWithItems[];
    },
  });

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
    mutationFn: async ({
      cartItems,
      subtotal,
      tax,
      total,
      paymentMethod,
    }: {
      cartItems: CartItem[];
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod?: PaymentMethod | null;
    }) => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          payment_method: paymentMethod ?? null,
          subtotal,
          tax,
          total,
          status: 'pending',
          payment_status: 'unpaid',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map((item) => ({
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
    mutationFn: async ({
      orderId,
      paymentMethod,
      cashierUserId,
      cashierName,
    }: {
      orderId: string;
      paymentMethod: PaymentMethod;
      cashierUserId: string;
      cashierName: string;
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({
          payment_method: paymentMethod,
          payment_status: 'paid',
          status: 'in_progress',
          cashier_user_id: cashierUserId,
          cashier_name: cashierName,
          paid_at: new Date().toISOString(),
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
      queryClient.invalidateQueries({ queryKey: ['todays-sales'] });
      queryClient.invalidateQueries({ queryKey: ['all-history-sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['cashier-sales-profiles'] });
    },
  });
}
export function useDailySummary(date?: string) {
  return useQuery({
    queryKey: ['daily-summary', date],
    queryFn: async () => {
      const targetDate = date ?? new Date().toLocaleDateString('en-CA', {
        timeZone: 'Asia/Manila'
      });

      const startOfDay = new Date(`${targetDate}T00:00:00+08:00`);
      const endOfDay = new Date(`${targetDate}T23:59:59+08:00`);

      // ✅ Add these logs
      console.log('Target date:', targetDate);
      console.log('Start:', startOfDay.toISOString());
      console.log('End:', endOfDay.toISOString());

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'paid')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // ✅ Add these logs
      console.log('Orders found:', orders?.length);
      console.log('Error:', error);
      console.log('Orders:', orders);

      if (error) throw error;
      if (!orders?.length) return null;

      const orderIds = orders.map((o) => o.id);

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('item_name, quantity, total_price')
        .in('order_id', orderIds);

      console.log('Items found:', items?.length);
      console.log('Items error:', itemsError);

      if (itemsError) throw itemsError;

      const productMap: Record<string, {
        item_name: string;
        total_quantity: number;
        total_revenue: number;
      }> = {};

      items.forEach((item) => {
        if (!productMap[item.item_name]) {
          productMap[item.item_name] = {
            item_name: item.item_name,
            total_quantity: 0,
            total_revenue: 0,
          };
        }
        productMap[item.item_name].total_quantity += item.quantity;
        productMap[item.item_name].total_revenue += Number(item.total_price);
      });

      const products = Object.values(productMap)
        .sort((a, b) => b.total_quantity - a.total_quantity);

      const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
      const totalOrders = orders.length;
      const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

      const paymentBreakdown: Record<string, number> = {};
      orders.forEach((order) => {
        const method = order.payment_method ?? 'unknown';
        paymentBreakdown[method] =
          (paymentBreakdown[method] || 0) + Number(order.total);
      });

      return {
        date: targetDate,
        totalSales,
        totalOrders,
        totalItems,
        products,
        paymentBreakdown,
        orders,
      };
    },
  });
}
export function useTodaysSales() {
  return useQuery({
    queryKey: ['todays-sales'],
    queryFn: async () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_status', 'paid');

      if (error) throw error;

      const orders = (data as Order[]).filter((order) => {
        const saleTimestamp = getSaleTimestamp(order);
        return new Date(saleTimestamp).getTime() >= startOfToday.getTime();
      });

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

      const grouped: Record<string, { orders: number; sales: number }> = {};

      for (const order of data as Order[]) {
        const dateKey = getDateKey(getSaleTimestamp(order));
        if (!grouped[dateKey]) {
          grouped[dateKey] = { orders: 0, sales: 0 };
        }
        grouped[dateKey].orders += 1;
        grouped[dateKey].sales += Number(order.total);
      }

      return Object.entries(grouped)
        .map(([dateKey, totals]) => ({
          dateKey,
          day: formatDateLabel(dateKey),
          orders: totals.orders,
          sales: totals.sales,
        }))
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    },
  });
}

export function useCashierSalesProfiles() {
  return useQuery({
    queryKey: ['cashier-sales-profiles'],
    queryFn: async () => {
      const [
        { data: profiles, error: profilesError },
        { data: roles, error: rolesError },
        { data: orders, error: ordersError },
      ] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('orders').select('*').eq('payment_status', 'paid'),
      ]);

      if (profilesError) throw profilesError;
      if (rolesError) throw rolesError;
      if (ordersError) throw ordersError;

      const roleMap = new Map<string, AppRole[]>();
      for (const roleRow of roles ?? []) {
        const currentRoles = roleMap.get(roleRow.user_id) ?? [];
        currentRoles.push(roleRow.role as AppRole);
        roleMap.set(roleRow.user_id, currentRoles);
      }

      const salesMap = new Map<string, CashierSalesProfile>();
      for (const profile of (profiles as UserProfile[])) {
        const currentRoles = roleMap.get(profile.user_id) ?? [];
        if (!currentRoles.includes('cashier') && !currentRoles.includes('admin')) {
          continue;
        }

        salesMap.set(profile.user_id, {
          userId: profile.user_id,
          fullName: profile.full_name?.trim() || 'Unnamed Cashier',
          role: currentRoles.includes('admin') ? 'admin' : 'cashier',
          totalSales: 0,
          totalOrders: 0,
          lastSaleAt: null,
          salesByDate: [],
        });
      }

      for (const order of orders as Order[]) {
        if (!order.cashier_user_id) {
          continue;
        }

        const saleTimestamp = getSaleTimestamp(order);
        const existing = salesMap.get(order.cashier_user_id) ?? {
          userId: order.cashier_user_id,
          fullName: order.cashier_name?.trim() || 'Unknown Cashier',
          role: 'cashier' as AppRole,
          totalSales: 0,
          totalOrders: 0,
          lastSaleAt: null,
          salesByDate: [],
        };

        existing.totalSales += Number(order.total);
        existing.totalOrders += 1;
        existing.lastSaleAt =
          !existing.lastSaleAt || saleTimestamp > existing.lastSaleAt
            ? saleTimestamp
            : existing.lastSaleAt;

        const dateKey = getDateKey(saleTimestamp);
        const salesDay = existing.salesByDate.find((entry) => entry.dateKey === dateKey);

        if (salesDay) {
          salesDay.orderCount += 1;
          salesDay.totalSales += Number(order.total);
        } else {
          existing.salesByDate.push({
            dateKey,
            dateLabel: formatDateLabel(dateKey),
            orderCount: 1,
            totalSales: Number(order.total),
          });
        }

        salesMap.set(order.cashier_user_id, existing);
      }

      return Array.from(salesMap.values())
        .map((profile) => ({
          ...profile,
          salesByDate: [...profile.salesByDate].sort((a, b) => b.dateKey.localeCompare(a.dateKey)),
        }))
        .sort((a, b) => {
          if (b.totalSales !== a.totalSales) {
            return b.totalSales - a.totalSales;
          }

          return a.fullName.localeCompare(b.fullName);
        });
    },
  });
}
