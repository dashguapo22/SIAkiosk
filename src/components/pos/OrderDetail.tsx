import { useState, useEffect, type ComponentProps } from 'react';
import './pos-receipt-print.css';
import { POSReceiptTicket } from './POSReceiptTicket';
import { OrderWithItems, OrderStatus, PaymentMethod, STATUS_LABELS, PAYMENT_METHOD_LABELS, SIZE_LABELS, TEMPERATURE_LABELS } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateOrderStatus, useProcessPayment } from '@/hooks/useOrders';
import { Banknote, CreditCard, Globe, ArrowRight, Check, X, Loader2 } from 'lucide-react';
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

  const { user } = useAuth();
  const updateStatus = useUpdateOrderStatus();
  const processPayment = useProcessPayment();
  const orderTotal = Number(order?.total ?? 0);

  const cashChange = selectedPaymentMethod === 'cash' && cashReceived 
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
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const handlePayment = async () => {
    if (!order || !selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    const parsedCash = selectedPaymentMethod === 'cash' && cashReceived ? parseFloat(cashReceived) : undefined;
    try {
      await processPayment.mutateAsync({
        orderId: order.id,
        paymentMethod: selectedPaymentMethod,
      });
      toast.success(`Payment received for Order #${order.order_number}`);
      setPosReceiptData({
        orderNumber: order.order_number,
        employee: user?.email ?? 'Cashier',
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
    } catch (error) {
      toast.error('Failed to process payment');
    }
  };

  if (!order) {
    return (
      <Card className="h-full flex items-center justify-center">
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
      <Card className="h-full flex flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-display">
              Order #{order.order_number}
            </CardTitle>
            <Badge className={cn('mt-2', statusColors[order.status])}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto py-4">
        <div className="space-y-3 mb-6">
          <h3 className="font-semibold text-lg">Order Items</h3>
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div>
                <p className="font-medium">{item.quantity}x {item.item_name}</p>
                <p className="text-sm text-muted-foreground">
                  {SIZE_LABELS[item.size] ?? item.size} • {TEMPERATURE_LABELS[item.temperature] ?? item.temperature}
                </p>
              </div>
              <span className="font-semibold">PHP{Number(item.total_price).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 mb-6 space-y-2">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>PHP{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
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
                className="w-full h-12"
              >
                {updateStatus.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Mark as {STATUS_LABELS[nextStatus[order.status]!]}
              </Button>
            )}

            {order.status === 'pending' && order.payment_status === 'unpaid' && (
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-lg">Process Payment</h3>

                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map(({ method, icon: Icon, label }) => (
                    <button
                      key={method}
                      onClick={() => setSelectedPaymentMethod(method)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                        selectedPaymentMethod === method
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>

                {selectedPaymentMethod === 'cash' && (
                  <div className="space-y-3 p-4 bg-secondary/30 rounded-xl">
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
                        className="mt-1 text-lg h-12"
                      />
                    </div>
                    {cashReceived && cashChange >= 0 && (
                      <div className="flex justify-between items-center text-lg font-bold text-success">
                        <span>Change Due:</span>
                        <span>PHP{cashChange.toFixed(2)}</span>
                      </div>
                    )}
                    {cashReceived && cashChange < 0 && (
                      <p className="text-destructive text-sm">
                        Amount received is less than total
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={
                    !selectedPaymentMethod ||
                    processPayment.isPending ||
                    (selectedPaymentMethod === 'cash' && (!cashReceived || cashChange < 0))
                  }
                  className="w-full h-14 text-lg"
                >
                  {processPayment.isPending ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5 mr-2" />
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
          <div className="text-center py-8">
            <Badge className={cn('text-lg py-2 px-4', statusColors[order.status])}>
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
