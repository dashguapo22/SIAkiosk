import { Order } from '@/types/database';

interface ReceiptTicketProps {
  order: Order;
}

export function ReceiptTicket({ order }: ReceiptTicketProps) {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();

  return (
    <div id="receipt-ticket" className="receipt-ticket">
      {/* Header */}
      <div className="receipt-header">
        <h1 className="receipt-title">Brew & Co.</h1>
        <p className="receipt-subtitle">Coffee Shop</p>
        <div className="receipt-divider"></div>
      </div>

      {/* Order Info */}
      <div className="receipt-order-info">
        <div className="receipt-row">
          <span className="receipt-label">Order #:</span>
          <span className="receipt-value">#{order.order_number}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Date:</span>
          <span className="receipt-value">{currentDate}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Time:</span>
          <span className="receipt-value">{currentTime}</span>
        </div>
      </div>

      <div className="receipt-divider"></div>

      {/* Total */}
      <div className="receipt-total">
        <div className="receipt-row">
          <span className="receipt-label">TOTAL:</span>
          <span className="receipt-value receipt-total-amount">
            ${Number(order.total).toFixed(2)}
          </span>
        </div>
      </div>

      <div className="receipt-divider"></div>

      {/* Footer */}
      <div className="receipt-footer">
        <p className="receipt-thank-you">Thank you for your order!</p>
        <p className="receipt-visit-again">Visit us again soon</p>
      </div>

      {/* Cut line for thermal printer */}
      <div className="receipt-cut-line"></div>
    </div>
  );
}