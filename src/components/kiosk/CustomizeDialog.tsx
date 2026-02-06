import { useState } from 'react';
import { MenuItem, DrinkSize, DrinkTemperature, SIZE_PRICES, SIZE_LABELS, TEMPERATURE_LABELS } from '@/types/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coffee, Minus, Plus, Flame, Snowflake } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomizeDialogProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (item: MenuItem, size: DrinkSize, temperature: DrinkTemperature) => void;
}

export function CustomizeDialog({ item, open, onClose, onAddToCart }: CustomizeDialogProps) {
  const [size, setSize] = useState<DrinkSize>('medium');
  const [temperature, setTemperature] = useState<DrinkTemperature>('iced');
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  const unitPrice = item.base_price + SIZE_PRICES[size];
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAddToCart(item, size, temperature);
    }
    // Reset state
    setSize('medium');
    setTemperature('iced');
    setQuantity(1);
    onClose();
  };

  const sizes: DrinkSize[] = ['small', 'medium', 'large'];
  const temperatures: DrinkTemperature[] = item.allows_iced ? ['hot', 'iced'] : ['iced'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display">{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Item Preview */}
          <div className="flex items-center gap-4 p-4 bg-secondary/30 rounded-xl">
            <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Coffee className="w-10 h-10 text-coffee-medium" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="text-lg font-semibold text-primary mt-1">
                Starting at PHP {item.base_price.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <h4 className="font-medium mb-3">Select Size</h4>
            <div className="grid grid-cols-3 gap-3">
              {sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "touch-target p-4 rounded-xl border-2 transition-all text-center",
                    size === s
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="block font-medium">{SIZE_LABELS[s]}</span>
                  <span className="text-sm text-muted-foreground">
                    {SIZE_PRICES[s] === 0 
                      ? `PHP${item.base_price.toFixed(2)}` 
                      : SIZE_PRICES[s] > 0 
                        ? `+PHP${SIZE_PRICES[s].toFixed(2)}`
                        : `-PHP${Math.abs(SIZE_PRICES[s]).toFixed(2)}`
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Temperature Selection */}
          {item.allows_iced && (
            <div>
              <h4 className="font-medium mb-3">Temperature</h4>
              <div className="grid grid-cols-2 gap-3">
                {temperatures.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTemperature(t)}
                    className={cn(
                      "touch-target p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2",
                      temperature === t
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {t === 'hot' ? (
                      <Flame className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Snowflake className="w-5 h-5 text-blue-500" />
                    )}
                    <span className="font-medium">{TEMPERATURE_LABELS[t]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h4 className="font-medium mb-3">Quantity</h4>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="touch-target h-12 w-12 rounded-xl"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-5 h-5" />
              </Button>
              <span className="text-3xl font-bold w-16 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                className="touch-target h-12 w-12 rounded-xl"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          className="w-full touch-target h-14 text-lg font-semibold rounded-xl"
        >
          Add to Cart - PHP {totalPrice.toFixed(2)}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
