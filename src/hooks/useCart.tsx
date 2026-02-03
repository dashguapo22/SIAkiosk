import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CartItem, MenuItem, DrinkSize, DrinkTemperature, SIZE_PRICES } from '@/types/database';

interface CartContextType {
  items: CartItem[];
  addItem: (menuItem: MenuItem, size: DrinkSize, temperature: DrinkTemperature) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const TAX_RATE = 0; // No tax

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const calculatePrice = (basePrice: number, size: DrinkSize): number => {
    return Math.max(0, basePrice + SIZE_PRICES[size]);
  };

  const addItem = useCallback((menuItem: MenuItem, size: DrinkSize, temperature: DrinkTemperature) => {
    const unitPrice = calculatePrice(menuItem.base_price, size);
    
    setItems(prev => {
      // Check if same item with same options exists
      const existingIndex = prev.findIndex(
        item => 
          item.menuItem.id === menuItem.id && 
          item.size === size && 
          item.temperature === temperature
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      return [...prev, { menuItem, size, temperature, quantity: 1, unitPrice }];
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(index);
      return;
    }
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity };
      return updated;
    });
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      subtotal,
      tax,
      total,
      itemCount,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
