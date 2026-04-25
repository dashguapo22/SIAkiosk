import { useEffect, useState, type ComponentProps } from 'react';
import './pos-receipt-print.css';
import { POSReceiptTicket } from './POSReceiptTicket';
import {
  OrderStatus,
  OrderWithItems,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  SIZE_LABELS,
  STATUS_LABELS,
  TEMPERATURE_LABELS,
} from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useProcessPayment, useUpdateOrderStatus } from '@/hooks/useOrders';
import { ArrowRight, Banknote, Check, CreditCard, Globe, Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OrderDetailProps {
  order: OrderWithItems | null;
  onClose: () => void;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-warning text-warning-foreground',
  in_progress: 'bg-blue-500 text-white',
  ready: 'bg-success text-white',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
};

export function OrderDetail({ order, onClose }: OrderDetailProps) {
  const [cashReceived, setCashReceived] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [posReceiptData, setPosReceiptData] = useState<ComponentProps<typeof POSReceiptTicket> | null>(null);

  const { user, displayName } = useAuth();
  const updateStatus = useUpdateOrderStatus();
  const processPayment = useProcessPayment();
  const orderTotal = Number(order?.total ?? 0);

  const cashChange =
    selectedPaymentMethod === 'cash' && cashReceived
      ? parseFloat(cashReceived) - orderTotal
      : 0;

  const paymentMethods: { method: PaymentMethod; icon: typeof Banknote; label: string }[] = [
    { method: 'cash', icon: Banknote, label: 'Cash' },
    { method: 'card', icon: CreditCard, label: 'Card' },
    { method: 'online', icon: Globe, label: 'Online/Pre-paid' },
  ];

  const nextStatus: Record<OrderStatus, OrderStatus | null> = {
    pending: null,
    in_progress: 'ready',
    ready: 'completed',
    completed: null,
    cancelled: null,
  };

  useEffect(() => {
    setSelectedPaymentMethod(null);
    setCashReceived('');
    setPosReceiptData(null);
  }, [order?.id]);

  useEffect(() => {
    if (!posReceiptData) return;

    const handleAfterPrint = () => {
      setPosReceiptData(null);
      onClose();
    };

    const timer = window.setTimeout(() => {
      window.print();
    }, 500);

    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [posReceiptData, onClose]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;

    try {
      await updateStatus.mutateAsync({ orderId: order.id, status: newStatus });
      toast.success(`Order #${order.order_number} updated to ${STATUS_LABELS[newStatus]}`);
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const handlePayment = async () => {
    if (!order || !selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!user?.id) {
      toast.error('Cashier session not found');
      return;
    }

    const parsedCash = selectedPaymentMethod === 'cash' && cashReceived ? parseFloat(cashReceived) : undefined;

    try {
      if (selectedPaymentMethod === 'online') {
        const { data, error } = await supabase.functions.invoke('create-paymongo-checkout', {
          body: {
            orderId: order.id,
            returnOrigin: window.location.origin,
          },
        });

        if (error) {
          throw error;
        }

        if (!data?.checkoutUrl) {
          throw new Error('PayMongo checkout URL was not returned');
        }

        const checkoutWindow = window.open(data.checkoutUrl as string, '_blank', 'noopener,noreferrer');
        if (!checkoutWindow) {
          window.location.href = data.checkoutUrl as string;
        }

        toast.success(`PayMongo checkout opened for Order #${order.order_number}`);
        return;
      }

      await processPayment.mutateAsync({
        orderId: order.id,
        paymentMethod: selectedPaymentMethod,
        cashierUserId: user.id,
        cashierName: displayName,
      });

      toast.success(`Payment received for Order #${order.order_number}`);
      setPosReceiptData({
        orderNumber: order.order_number,
        employee: displayName,
        pos: 'POS-1',
        type: 'Take out',
        items: order.order_items.map((item) => ({
          name: item.item_name,
          quantity: item.quantity,
          price: Number(item.total_price),
          notes: `${SIZE_LABELS[item.size] ?? item.size} / ${TEMPERATURE_LABELS[item.temperature] ?? item.temperature}`,
        })),
        total: orderTotal,
        cash: parsedCash ?? orderTotal,
        change: parsedCash !== undefined ? parsedCash - orderTotal : 0,
      });
      setSelectedPaymentMethod(null);
      setCashReceived('');
    } catch {
      toast.error('Failed to process payment');
    }
  };

  if (!order) {
    return (
      <Card className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Select an order to view details</p>
      </Card>
    );
  }

  return (
    <>
      {posReceiptData && (
        <div className="pos-print-area">
          <POSReceiptTicket {...posReceiptData} />
        </div>
      )}
      <Card className="flex h-full flex-col">
        <CardHeader className="border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl font-display">Order #{order.order_number}</CardTitle>
              <Badge className={cn('mt-2', statusColors[order.status])}>{STATUS_LABELS[order.status]}</Badge>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto py-4">
          <div className="mb-6 space-y-3">
            <h3 className="text-lg font-semibold">Order Items</h3>
            {order.order_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                <div>
                  <p className="font-medium">
                    {item.quantity}x {item.item_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {SIZE_LABELS[item.size] ?? item.size} / {TEMPERATURE_LABELS[item.temperature] ?? item.temperature}
                  </p>
                </div>
                <span className="font-semibold">PHP{Number(item.total_price).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="mb-6 space-y-2 border-t border-border pt-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>PHP{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-xl font-bold">
              <span>Total</span>
              <span>PHP{order.total.toFixed(2)}</span>
            </div>
          </div>

          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="space-y-4">
              {order.status !== 'pending' && nextStatus[order.status] && (
                <Button
                  onClick={() => handleStatusChange(nextStatus[order.status]!)}
                  disabled={updateStatus.isPending}
                  className="h-12 w-full"
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4" />
                  )}
                  Mark as {STATUS_LABELS[nextStatus[order.status]!]}
                </Button>
              )}

              {order.status === 'pending' && order.payment_status === 'unpaid' && (
                <div className="space-y-4 border-t border-border pt-4">
                  <h3 className="text-lg font-semibold">Process Payment</h3>

                  <div className="grid grid-cols-3 gap-2">
                    {paymentMethods.map(({ method, icon: Icon, label }) => (
                      <button
                        key={method}
                        onClick={() => setSelectedPaymentMethod(method)}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                          selectedPaymentMethod === method
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>

                  {selectedPaymentMethod === 'cash' && (
                    <div className="space-y-3 rounded-xl bg-secondary/30 p-4">
                      <div>
                        <Label htmlFor="cash-received">Cash Received</Label>
                        <Input
                          id="cash-received"
                          type="number"
                          step="0.01"
                          min={order.total}
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          placeholder="Enter amount received"
                          className="mt-1 h-12 text-lg"
                        />
                      </div>
                      {cashReceived && cashChange >= 0 && (
                        <div className="flex items-center justify-between text-lg font-bold text-success">
                          <span>Change Due:</span>
                          <span>PHP{cashChange.toFixed(2)}</span>
                        </div>
                      )}
                      {cashReceived && cashChange < 0 && (
                        <p className="text-sm text-destructive">Amount received is less than total</p>
                      )}
                    </div>
                  )}

                  {selectedPaymentMethod === 'online' && (
                    <div className="rounded-xl bg-secondary/30 p-4 text-sm text-muted-foreground">
                      This opens the PayMongo checkout page for GCash and other online payments. The order will update automatically after PayMongo confirms the payment.
                    </div>
                  )}

                  <Button
                    onClick={handlePayment}
                    disabled={
                      !selectedPaymentMethod ||
                      processPayment.isPending ||
                      (selectedPaymentMethod === 'cash' && (!cashReceived || cashChange < 0))
                    }
                    className="h-14 w-full text-lg"
                  >
                    {processPayment.isPending ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-5 w-5" />
                    )}
                    Complete Payment
                  </Button>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => handleStatusChange('cancelled')}
                disabled={updateStatus.isPending}
                className="w-full text-destructive hover:text-destructive"
              >
                Cancel Order
              </Button>
            </div>
          )}

          {(order.status === 'completed' || order.status === 'cancelled') && (
            <div className="py-8 text-center">
              <Badge className={cn('px-4 py-2 text-lg', statusColors[order.status])}>
                {STATUS_LABELS[order.status]}
              </Badge>
              {order.payment_method && (
                <p className="mt-4 text-muted-foreground">
                  Paid via {PAYMENT_METHOD_LABELS[order.payment_method]}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
