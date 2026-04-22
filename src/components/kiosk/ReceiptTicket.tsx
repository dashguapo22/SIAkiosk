import { Order, OrderWithItems, PaymentMethod } from '@/types/database';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiptTicketProps {
  order: Order | OrderWithItems;
  paymentMethod?: PaymentMethod | null;
  cashReceived?: number;
  changeDue?: number;
}

export function ReceiptTicket({ order }: ReceiptTicketProps) {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const qrValue = `ORDER-${order.order_number}`;

  return (
    <div id="receipt-ticket" className="receipt-ticket new-receipt-design">
      {/* Logo and Shop Name */}
      <div className="receipt-logo" style={{ textAlign: 'center', marginBottom: '2mm' }}>
        {/* Replace with your logo if available */}
        <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '1mm' }}>☕</div>
        <div style={{ fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>CAFE MAESTRO</div>
      </div>

      {/* Order Number Section */}
      <div style={{ textAlign: 'center', margin: '4mm 0 2mm 0' }}>
        <div style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '2mm' }}>YOUR ORDER NUMBER</div>
        <div className="receipt-order-number" style={{ fontSize: '38px', fontWeight: 'bold', margin: '0 0 2mm 0', lineHeight: 1 }}>
          #{order.order_number}
        </div>
      </div>

      {/* Total */}
      <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Total: </span>
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>₱{Number(order.total).toFixed(2)}</span>
      </div>

      {/* QR Code */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4mm' }}>
        <QRCodeSVG value={qrValue} size={80} level="M" />
      </div>

      {/* Instructional Message */}
      <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 'bold', fontStyle: 'italic', marginBottom: '6mm', opacity: 0.9, color: 'black' }}>
        Your order has been sent to our baristas. Please<br />
        proceed to the counter for payment.
      </div>

      {/* Date and Time Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginTop: '8mm', fontWeight: 'bold' }}>
        <span style={{ fontWeight: 'bold' }}>DATE: {currentDate}</span>
        <span style={{ fontWeight: 'bold' }}>TIME: {currentTime}</span>
      </div>
    </div>
  );
}
