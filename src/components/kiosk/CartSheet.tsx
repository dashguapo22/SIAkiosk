import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { SIZE_LABELS, TEMPERATURE_LABELS } from '@/types/database';

interface CartSheetProps {
  onCheckout: () => void;
}

export function CartSheet({ onCheckout }: CartSheetProps) {
  const { items, removeItem, updateQuantity, subtotal, tax, total, itemCount } = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="fixed bottom-6 right-6 h-16 px-6 rounded-2xl shadow-2xl z-50 gap-3"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="text-lg font-semibold">
            View Cart ({itemCount})
          </span>
          <span className="bg-primary-foreground/20 px-3 py-1 rounded-lg">
            PHP{total.toFixed(2)}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-card">
        <SheetHeader>
          <SheetTitle className="text-2xl font-display">Your Order</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-140px)] mt-6">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground">Add some delicious drinks!</p>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {items.map((item, index) => (
                  <div
                    key={`${item.menuItem.id}-${item.size}-${item.temperature}-${index}`}
                    className="bg-secondary/30 rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{item.menuItem.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {SIZE_LABELS[item.size]} • {TEMPERATURE_LABELS[item.temperature]}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center hover:bg-secondary"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <span className="font-semibold">
                        PHP{(item.unitPrice * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t border-border pt-4 mt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>PHP{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                  <span>Total</span>
                  <span>PHP{total.toFixed(2)}</span>
                </div>

                <Button
                  onClick={onCheckout}
                  className="w-full touch-target h-14 text-lg font-semibold rounded-xl mt-4"
                >
                  Place Order
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
