import React from 'react';

interface POSReceiptItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

interface POSReceiptProps {
  orderNumber: number | string;
  employee: string;
  pos: string;
  type: 'Dine in' | 'Take out';
  items: POSReceiptItem[];
  total: number;
  cash: number;
  change: number;
  date?: string;
  time?: string;
}

export const POSReceiptTicket: React.FC<POSReceiptProps> = ({
  orderNumber,
  employee,
  pos,
  type,
  items,
  total,
  cash,
  change,
  date,
  time,
}) => {
  const currentDate = date || new Date().toLocaleDateString();
  const currentTime = time || new Date().toLocaleTimeString();

  return (
    <div id="pos-receipt-ticket" style={{ width: 260, fontFamily: 'monospace', fontSize: 13, padding: 8 }}>
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 }}>Cafe Maestro</div>
      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ fontSize: 11 }}>
        Order: <b>{orderNumber}</b><br />
        Employee: <b>{employee}</b><br />
        POS: <b>{pos}</b><br />
        <span style={{ fontWeight: 'bold' }}>{type}</span>
      </div>
      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />
      <div>
        {items.map((item, idx) => (
          <div key={idx} style={{ marginBottom: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{item.name}</span>
              <span>₱{item.price.toFixed(2)}</span>
            </div>
            <div style={{ fontSize: 11, color: '#444', marginLeft: 4 }}>
              1 x ₱{item.price.toFixed(2)}
              {item.notes && <span>\n{item.notes}</span>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>Total</span>
        <span>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>Cash</span>
        <span>₱{cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>Change</span>
        <span>₱{change.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
        <span>{currentDate}</span>
        <span>{currentTime}</span>
      </div>
    </div>
  );
};
