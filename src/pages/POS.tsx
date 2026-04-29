import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useActiveOrders } from '@/hooks/useOrders';
import { OrderWithItems, OrderStatus, STATUS_LABELS } from '@/types/database';
import { OrderCard } from '@/components/pos/OrderCard';
import { OrderDetail } from '@/components/pos/OrderDetail';
import { SalesSummary } from '@/components/pos/SalesSummary';
import { MenuManagement } from '@/components/pos/MenuManagement';
import { HistorySummary} from '@/components/pos/HistorySummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Coffee, LogOut, RefreshCw, Loader2, ClipboardList, DollarSign, Settings, Search, History} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function POSPage() {
  const { user, displayName, isLoading: authLoading, isRolesLoading, isCashier, isAdmin, signOut } = useAuth();
  const { data: orders, isLoading: ordersLoading, refetch } = useActiveOrders();
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (user && isRolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check for cashier access
  if (!authLoading && user && !isCashier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access the POS system.</p>
          <Button onClick={signOut}>Sign Out</Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const normalizedOrderSearch = orderSearch.trim();

  const filteredOrders = orders?.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesOrderNumber =
      normalizedOrderSearch.length === 0 ||
      order.order_number.toString().includes(normalizedOrderSearch);

    return matchesStatus && matchesOrderNumber;
  }) || [];

  const statusFilters: { value: OrderStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: orders?.length || 0 },
    { value: 'pending', label: 'New', count: orders?.filter(o => o.status === 'pending').length || 0 },
    { value: 'in_progress', label: 'Preparing', count: orders?.filter(o => o.status === 'in_progress').length || 0 },
    { value: 'ready', label: 'Ready', count: orders?.filter(o => o.status === 'ready').length || 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground px-6 py-4">
        <div className="grid items-center gap-4 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Cafe Maestro POS</h1>
              <p className="text-sm text-primary-foreground/70">Cashier Dashboard</p>
            </div>
          </div>
          <div className="xl:justify-self-center">
            <div className="rounded-full bg-primary-foreground/10 px-4 py-2 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-primary-foreground/60">Current POS User</p>
              <p className="font-semibold">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 xl:justify-self-end">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => refetch()}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="orders" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Sales
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="menu" className="gap-2">
                <Settings className="w-4 h-4" />
                Menu
              </TabsTrigger>
            )}
           {isAdmin && (
              <TabsTrigger value="history" className="gap-2">
                <History className="w-4 h-4" />
                History
              </TabsTrigger>
            )}
          </TabsList>
      

          {/* Orders Tab */}
          <TabsContent value="orders">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Status Filters */}
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {statusFilters.map((filter) => (
                      <Button
                        key={filter.value}
                        variant={statusFilter === filter.value ? "default" : "outline"}
                        onClick={() => setStatusFilter(filter.value)}
                        className="gap-2"
                      >
                        {filter.label}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs",
                          statusFilter === filter.value 
                            ? "bg-primary-foreground/20"
                            : "bg-secondary"
                        )}>
                          {filter.count}
                        </span>
                      </Button>
                    ))}
                  </div>

                  <div className="flex w-full max-w-sm items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value.replace(/\D/g, ''))}
                        placeholder="Search order number"
                        className="pl-9"
                        inputMode="numeric"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        if (!normalizedOrderSearch) return;
                        const matchedOrder = filteredOrders[0];
                        if (matchedOrder) {
                          setSelectedOrder(matchedOrder);
                        }
                      }}
                    >
                      <Search className="h-4 w-4" />
                      Search
                    </Button>
                  </div>
                </div>

                {/* Orders Grid */}
                {ordersLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-40 bg-card animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : filteredOrders.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onSelect={setSelectedOrder}
                        isSelected={selectedOrder?.id === order.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-card rounded-xl">
                    <ClipboardList className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground">
                      {normalizedOrderSearch
                        ? `No order found for #${normalizedOrderSearch}`
                        : statusFilter === 'all'
                          ? 'No active orders'
                          : `No ${STATUS_LABELS[statusFilter as OrderStatus].toLowerCase()} orders`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {normalizedOrderSearch
                        ? 'Try another order number or clear the search field'
                        : 'Orders from the kiosk will appear here in real-time'}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Detail Panel */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <OrderDetail
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales">
            <SalesSummary />
          </TabsContent>

          {/* Menu Tab (Admin Only) */}
          {isAdmin && (
            <TabsContent value="menu">
              <MenuManagement />
            </TabsContent>
          )}

          
          {isAdmin && (
            <TabsContent value="history">
              <HistorySummary />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
