import { Link, useSearchParams } from 'react-router-dom';
import { useOrderWithItems } from '@/hooks/useOrders';
import { OrderConfirmation } from '@/components/kiosk/OrderConfirmation';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id') ?? '';
  const status = searchParams.get('status');

  const { data: order, isLoading } = useOrderWithItems(orderId, {
    refetchInterval: status === 'success' ? 2000 : false,
  });

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="mb-2 text-2xl font-bold">Missing order reference</h1>
          <p className="mb-6 text-muted-foreground">The payment return URL did not include an order id.</p>
          <Link to="/kiosk">
            <Button>Back to Kiosk</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-warning" />
          <h1 className="mb-2 text-2xl font-bold">Payment not completed</h1>
          <p className="mb-6 text-muted-foreground">The PayMongo checkout was cancelled. You can start a new order or pay at the counter.</p>
          <div className="flex justify-center gap-3">
            <Link to="/kiosk">
              <Button>Back to Kiosk</Button>
            </Link>
            <Link to="/pos">
              <Button variant="outline">Open POS</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !order || order.payment_status !== 'paid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <h1 className="mb-2 text-2xl font-bold">Confirming payment</h1>
          <p className="text-muted-foreground">
            PayMongo redirected back successfully. Waiting for the payment confirmation webhook to update your order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <Link to="/kiosk" className="absolute left-6 top-6 z-10">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Kiosk
        </Button>
      </Link>
      <div className="absolute right-6 top-6 z-10 flex items-center gap-2 rounded-full bg-success/10 px-4 py-2 text-success">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Paid with PayMongo</span>
      </div>
      <OrderConfirmation order={order} onNewOrder={() => { window.location.href = '/kiosk'; }} paymentMode="online" />
    </div>
  );
}
