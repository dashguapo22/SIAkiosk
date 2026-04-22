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
    <div
      id="pos-receipt-ticket"
      style={{
        width: 260,
        fontFamily: 'monospace',
        fontSize: 13,
        padding: 8,
        margin: 0,
        boxSizing: 'border-box',
        display: 'block',
        position: 'static',
        minHeight: 0,
        height: 'auto',
        maxHeight: 'none',
        verticalAlign: 'top',
        background: '#fff',
        color: '#000',
      }}
    >
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
        {items.map((item, idx) => {
          const unitPrice = item.quantity > 0 ? item.price / item.quantity : item.price;

          return (
            <div key={idx} style={{ marginBottom: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.name}</span>
                <span>PHP{item.price.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#444', marginLeft: 4 }}>
                {item.quantity} x PHP{unitPrice.toFixed(2)}
                {item.notes && <span><br />{item.notes}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
        <span>Total</span>
        <span>PHP{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>Cash</span>
        <span>PHP{cash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span>Change</span>
        <span>PHP{change.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginTop: 4 }}>
        <span>{currentDate}</span>
        <span>{currentTime}</span>
      </div>
    </div>
  );
};
