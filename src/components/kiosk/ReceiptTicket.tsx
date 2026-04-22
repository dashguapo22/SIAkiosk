<<<<<<< HEAD
import { Order } from '@/types/database';
import { QRCodeSVG } from 'qrcode.react';
=======
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Order,
  OrderWithItems,
  PaymentMethod,
  PAYMENT_METHOD_LABELS,
  SIZE_LABELS,
  TEMPERATURE_LABELS,
} from '@/types/database';
>>>>>>> 59a7110e2dbc1a95acbfbce2dc6b07f03f225148

interface ReceiptTicketProps {
  order: Order | OrderWithItems;
  paymentMethod?: PaymentMethod | null;
  cashReceived?: number;
  changeDue?: number;
}

<<<<<<< HEAD
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
=======
export function ReceiptTicket({
  order,
  paymentMethod,
  cashReceived,
  changeDue,
}: ReceiptTicketProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const dateObject = new Date(order.created_at ?? Date.now());
  const currentDate = isNaN(dateObject.getTime())
    ? '-'
    : dateObject.toLocaleDateString();
  const currentTime = isNaN(dateObject.getTime())
    ? '-'
    : dateObject.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const items = 'order_items' in order && Array.isArray(order.order_items)
    ? order.order_items
    : [];

  useEffect(() => {
    const qrValue = `ORDER:${order.order_number}|ID:${order.id}|TOTAL:${order.total}`;

    QRCode.toDataURL(qrValue, { margin: 0, width: 180 })
      .then(setQrCodeUrl)
      .catch((error) => {
        console.error('Failed to generate QR code', error);
      });
  }, [order.id, order.order_number, order.total]);

  const formatMoney = (value: number) => `PHP${value.toFixed(2)}`;

  return (
    <div id="receipt-ticket" className="receipt-ticket">
      <div className="receipt-header">
        <h1 className="receipt-title">Order #{order.order_number}</h1>
        <p className="receipt-subtitle">Receipt</p>
        <div className="receipt-divider"></div>
      </div>

      <div className="receipt-order-info">
        <div className="receipt-row">
          <span className="receipt-label">Date:</span>
          <span className="receipt-value">{currentDate}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-label">Time:</span>
          <span className="receipt-value">{currentTime}</span>
        </div>
      </div>

      {items.length > 0 && (
        <div className="receipt-items">
          {items.map((item) => (
            <div key={item.id} className="receipt-item">
              <div className="receipt-item-main">
                <span className="receipt-item-name">{item.quantity}x {item.item_name}</span>
                <span className="receipt-item-price">{formatMoney(Number(item.total_price))}</span>
              </div>
              <div className="receipt-item-meta">
                {SIZE_LABELS[item.size]} • {TEMPERATURE_LABELS[item.temperature]}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="receipt-divider"></div>

      <div className="receipt-total receipt-summary">
        <div className="receipt-row">
          <span className="receipt-label">Total</span>
          <span className="receipt-value receipt-total-amount">
            {formatMoney(Number(order.total))}
          </span>
        </div>
        {paymentMethod && (
          <div className="receipt-row">
            <span className="receipt-label">Payment Method:</span>
            <span className="receipt-value">{PAYMENT_METHOD_LABELS[paymentMethod]}</span>
          </div>
        )}
        {cashReceived !== undefined && (
          <div className="receipt-row">
            <span className="receipt-label">Cash Received</span>
            <span className="receipt-value">{formatMoney(cashReceived)}</span>
          </div>
        )}
        {changeDue !== undefined && (
          <div className="receipt-row">
            <span className="receipt-label">Change Due</span>
            <span className="receipt-value">{formatMoney(changeDue)}</span>
          </div>
        )}
      </div>

      <div className="receipt-divider"></div>

      {qrCodeUrl && (
        <div className="receipt-qr">
          <img src={qrCodeUrl} alt="Order QR code" />
        </div>
      )}

      <div className="receipt-footer">
        <p className="receipt-thank-you">Thank you for your order!</p>
        <p className="receipt-visit-again">Visit us again soon</p>
      </div>

      <div className="receipt-cut-line"></div>
>>>>>>> 59a7110e2dbc1a95acbfbce2dc6b07f03f225148
    </div>
  );
}
