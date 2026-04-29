import { useAllHistorySalesAndOrders, useCashierSalesProfiles, useTodaysSales } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { BarChart , Bar , CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function SalesSummary() {
  const { user } = useAuth();
  const { data, isLoading } = useTodaysSales();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 animate-pulse rounded bg-secondary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { totalSales = 0, orderCount = 0 } = data || {};
  const averageOrder = orderCount > 0 ? totalSales / orderCount : 0;

  const stats = [
    {
      title: "Today's Sales",
      value: `PHP ${totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Paid Orders',
      value: orderCount.toString(),
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Avg. Order Value',
      value: `PHP ${averageOrder.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-caramel',
      bgColor: 'bg-caramel/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
          
      <div className="grid gap-6 xl:grid-cols-2">
        <SalesHistoryChart title="Sales Over Time" dataKey="sales" />
        <SalesHistoryChart title="Orders Over Time" dataKey="orders" />
      </div>

      <CashierProfilesSection currentUserId={user?.id ?? null} />
    </div>
  );
}

function SalesHistoryChart({ title, dataKey }: { title: string; dataKey: 'sales' | 'orders' }) {
  const { data, isLoading } = useAllHistorySalesAndOrders();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid stroke="#dbce9f" strokeDasharray="5 5" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={dataKey} fill="#d65f0f"  />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function CashierProfilesSection({ currentUserId }: { currentUserId: string | null }) {
  const { data, isLoading } = useCashierSalesProfiles();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashier Profiles and Sales</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading cashier profiles...</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No cashier profiles found yet.</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {data.map((cashier) => (
              <div key={cashier.userId} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{cashier.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {cashier.role === 'admin' ? 'Admin access' : 'Cashier access'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentUserId === cashier.userId && <Badge>You</Badge>}
                    <Badge variant="secondary">{cashier.role}</Badge>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-secondary/40 p-3">
                    <p className="text-muted-foreground">Total Sales</p>
                    <p className="mt-1 text-xl font-semibold">PHP {cashier.totalSales.toFixed(2)}</p>
                  </div>
                  <div className="rounded-md bg-secondary/40 p-3">
                    <p className="text-muted-foreground">Paid Orders</p>
                    <p className="mt-1 text-xl font-semibold">{cashier.totalOrders}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium">Sales by Date</p>
                  {cashier.salesByDate.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No paid sales recorded for this cashier yet.</p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {cashier.salesByDate.map((saleDay) => (
                        <div key={saleDay.dateKey} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                          <div>
                            <p className="font-medium">{saleDay.dateLabel}</p>
                            <p className="text-muted-foreground">{saleDay.orderCount} paid orders</p>
                          </div>
                          <p className="font-semibold">PHP {saleDay.totalSales.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
