import { useState } from 'react';
import { useDailySummary } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, FileText, Printer } from 'lucide-react';
import { PAYMENT_METHOD_LABELS } from '@/types/database';
import { SummaryReceipt } from '@/components/pos/SummaryReceiptTicket'; // adjust path as needed

export function HistorySummary() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const [selectedDate, setSelectedDate] = useState(today);
  const { data, isLoading } = useDailySummary(selectedDate);

  const handlePrint = () => {
   window.print();
   
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sales History</h2>

      {/* Hidden receipt — rendered for print only */}
      {data && <SummaryReceipt date={selectedDate} data={data} />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Daily Sales Summary</CardTitle>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                max={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
              {data && (
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Summary
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading summary...</p>
          ) : !data ? (
            <p className="text-sm text-muted-foreground">
              No sales recorded on{' '}
              {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-PH', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-PH', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                })}
              </p>

              {/* Overall Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg bg-success/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold text-success">PHP {data.totalSales.toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-blue-500/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-500">{data.totalOrders}</p>
                </div>
                <div className="rounded-lg bg-caramel/10 p-4 text-center">
                  <p className="text-xs text-muted-foreground">Items Sold</p>
                  <p className="text-2xl font-bold text-caramel">{data.totalItems}</p>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="mb-6">
                <p className="text-sm font-semibold mb-3">Payment Breakdown</p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(data.paymentBreakdown).map(([method, amount]) => (
                    <div key={method} className="rounded-lg border p-3 text-center">
                      <p className="text-xs text-muted-foreground capitalize">
                        {PAYMENT_METHOD_LABELS[method as keyof typeof PAYMENT_METHOD_LABELS] ?? method}
                      </p>
                      <p className="mt-1 font-bold">PHP {(amount as number).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Table */}
              <div>
                <p className="text-sm font-semibold mb-3">
                  Products Sold ({data.products.length} items)
                </p>
                <div className="rounded-lg border overflow-hidden">
                  <div className="grid grid-cols-4 bg-secondary/50 px-4 py-2 text-xs font-semibold text-muted-foreground">
                    <span className="col-span-2">Product</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Revenue</span>
                  </div>
                  {data.products.map((product, index) => (
                    <div
                      key={product.item_name}
                      className={`grid grid-cols-4 px-4 py-3 text-sm items-center
                        ${index % 2 === 0 ? 'bg-background' : 'bg-secondary/20'}`}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        {index === 0 && (
                          <span className="text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded font-bold">#1</span>
                        )}
                        <span className="font-medium">{product.item_name}</span>
                      </div>
                      <span className="text-center font-semibold">{product.total_quantity}</span>
                      <span className="text-right font-semibold text-success">
                        PHP {product.total_revenue.toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-4 px-4 py-3 text-sm font-bold border-t bg-primary/5">
                    <span className="col-span-2">TOTAL</span>
                    <span className="text-center">{data.totalItems}</span>
                    <span className="text-right text-success">PHP {data.totalSales.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}