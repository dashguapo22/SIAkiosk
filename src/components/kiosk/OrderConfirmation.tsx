import { useEffect } from 'react';
import { Order } from '@/types/database';
import { Button } from '@/components/ui/button';
import { CheckCircle, Coffee, Printer } from 'lucide-react';
import { ReceiptTicket } from './ReceiptTicket';

interface OrderConfirmationProps {
  order: Order;
  onNewOrder: () => void;
}

export function OrderConfirmation({ order, onNewOrder }: OrderConfirmationProps) {
  // Automatically print receipt when component mounts
  useEffect(() => {
    const printReceipt = () => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        window.print();
      }, 500);
    };

    printReceipt();
  }, []);

  const handleManualPrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen gradient-cream flex flex-col items-center justify-center p-8 text-center">
      {/* Hidden receipt for printing */}
      <ReceiptTicket order={order} />

      <div className="animate-fade-in max-w-md">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-14 h-14 text-success" />
        </div>

        <h1 className="text-4xl font-display font-bold text-primary mb-4">
          Order Placed!
        </h1>

        <p className="text-lg text-muted-foreground mb-8">
          Your order has been sent to our baristas. Please proceed to the counter for payment.
        </p>

        {/* Order Number */}
        <div className="bg-card rounded-2xl p-8 shadow-lg mb-8">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Your Order Number
          </p>
          <div className="text-6xl font-bold text-primary font-display">
            #{order.order_number}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Total: <span className="font-semibold text-foreground">PHP{Number(order.total).toFixed(2)}</span>
          </p>
        </div>

        {/* Instructions */}
        <div className="flex items-center justify-center gap-3 text-muted-foreground mb-6">
          <Coffee className="w-5 h-5" />
          <span>Please tell the cashier your order number</span>
        </div>

        {/* Print Receipt Button */}
        <Button
          onClick={handleManualPrint}
          variant="outline"
          size="sm"
          className="mb-4 flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          Print Receipt Again
        </Button>

        <Button
          onClick={onNewOrder}
          variant="outline"
          size="lg"
          className="touch-target h-14 px-12 text-lg rounded-xl"
        >
          Start New Order
        </Button>
      </div>
    </div>
  );
}
