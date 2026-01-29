import { useTodaysSales } from '@/hooks/useOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';

export function SalesSummary() {
  const { data, isLoading } = useTodaysSales();

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 bg-secondary animate-pulse rounded" />
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
      value: `$${totalSales.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: "Orders Completed",
      value: orderCount.toString(),
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: "Avg. Order Value",
      value: `$${averageOrder.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-caramel',
      bgColor: 'bg-caramel/10',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
