   import { useAllHistorySalesAndOrders, useTodaysSales } from '@/hooks/useOrders';
   import { Card, CardContent } from '@/components/ui/card'; 
   import { DollarSign, ShoppingBag, TrendingUp } from 'lucide-react'; 
   import { LineChart,Line, Legend,CartesianGrid, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'; // --- Sales Summary Cards ---   
     
   
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
          value: `PHP${totalSales.toFixed(2)}`, 
          icon: DollarSign, color: 'text-success', 
          bgColor: 'bg-success/10', 
        },
        { 
          title: "Orders Completed", 
          value: orderCount.toString(), 
          icon: ShoppingBag, color: 'text-blue-500', 
          bgColor: 'bg-blue-500/10', 
        }, 
        { 
          title: "Avg. Order Value", 
          value: `PHP ${averageOrder.toFixed(2)}`, 
          icon: TrendingUp, color: 'text-caramel', 
          bgColor: 'bg-caramel/10', 
        }, 
      ];
       return ( 
       <div className="space-y-6">  
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
        
        <div className="bg-white rounded-lg shadow p-6">
          <AllHistoryChart />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <AllHistoryChartorder />
        </div>
      </div> 
      ); 
    } 

    
//------------------- Charts for Sales and Orders Over Time ------------------
export function AllHistoryChart() {
  const { data, isLoading } = useAllHistorySalesAndOrders();
  if (isLoading) return <p>Loading chart...</p>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-center">Sales Over Time</h2>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid  stroke="#dbce9f" strokeWidth="5 5" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sales" stroke="#d65f0fc3" strokeWidth={2}/>
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
export function AllHistoryChartorder() {
  const { data, isLoading } = useAllHistorySalesAndOrders();
  if (isLoading) return <p>Loading chart...</p>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-center">Orders Over Time</h2>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid  stroke="#dbce9f" strokeWidth="5 5" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="orders" stroke="#d65f0fc3" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
    </div>
  );
}
