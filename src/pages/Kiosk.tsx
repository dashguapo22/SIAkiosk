import { useState } from 'react';
import { MenuItem, Order } from '@/types/database';
import { useCategories, useMenuItems } from '@/hooks/useMenu';
import { useCart, CartProvider } from '@/hooks/useCart';
import { useCreateOrder } from '@/hooks/useOrders';
import { WelcomeScreen } from '@/components/kiosk/WelcomeScreen';
import { CategoryTabs } from '@/components/kiosk/CategoryTabs';
import { MenuItemCard } from '@/components/kiosk/MenuItemCard';
import { CustomizeDialog } from '@/components/kiosk/CustomizeDialog';
import { CartSheet } from '@/components/kiosk/CartSheet';
import { OrderConfirmation } from '@/components/kiosk/OrderConfirmation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Coffee, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type KioskView = 'welcome' | 'menu' | 'confirmation';

function KioskContent() {
  const [view, setView] = useState<KioskView>('welcome');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: menuItems, isLoading: itemsLoading } = useMenuItems(selectedCategoryId || undefined);
  const { items, addItem, clearCart, subtotal, tax, total, itemCount } = useCart();
  const createOrder = useCreateOrder();

  const handleStartOrder = () => {
    setView('menu');
    if (categories && categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(categories[0].id);
    }
  };

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        cartItems: items,
        subtotal,
        tax,
        total,
      });
      
      setConfirmedOrder(order);
      clearCart();
      setView('confirmation');
      toast.success('Order placed successfully!');
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
      console.error('Order creation error:', error);
    }
  };

  const handleNewOrder = () => {
    setConfirmedOrder(null);
    setSelectedCategoryId(categories?.[0]?.id || null);
    setView('welcome');
  };

  // Welcome Screen
  if (view === 'welcome') {
    return <WelcomeScreen onStartOrder={handleStartOrder} />;
  }

  // Order Confirmation Screen
  if (view === 'confirmation' && confirmedOrder) {
    return <OrderConfirmation order={confirmedOrder} onNewOrder={handleNewOrder} />;
  }

  // Menu View
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setView('welcome')}
              className="touch-target"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-coffee flex items-center justify-center">
                <Coffee className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-display font-bold text-primary">Cafe Maestro</h1>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-4">
          {categoriesLoading ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-12 w-28 bg-secondary animate-pulse rounded-xl" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <CategoryTabs
              categories={categories}
              selectedId={selectedCategoryId}
              onSelect={setSelectedCategoryId}
            />
          ) : null}
        </div>
      </header>

      {/* Menu Grid */}
      <main className="p-6 pb-28">
        {itemsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-[3/4] bg-card animate-pulse rounded-xl" />
            ))}
          </div>
        ) : menuItems && menuItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {menuItems.map((item, index) => (
              <div 
                key={item.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <MenuItemCard item={item} onSelect={handleSelectItem} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Coffee className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">No items in this category</p>
          </div>
        )}
      </main>

      {/* Customize Dialog */}
      <CustomizeDialog
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToCart={addItem}
      />

      {/* Cart Button */}
      {itemCount > 0 && (
        <CartSheet onCheckout={handleCheckout} />
      )}

      {/* Loading Overlay for Checkout */}
      {createOrder.isPending && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-lg font-medium">Placing your order...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KioskPage() {
  return (
    <CartProvider>
      <KioskContent />
    </CartProvider>
  );
}
