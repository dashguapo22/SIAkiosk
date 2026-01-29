export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'unpaid' | 'paid';
export type DrinkSize = 'small' | 'medium' | 'large';
export type DrinkTemperature = 'hot' | 'iced';
export type AppRole = 'admin' | 'cashier';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number;
  image_url: string | null;
  is_available: boolean;
  allows_iced: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: number;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  size: DrinkSize;
  temperature: DrinkTemperature;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface CartItem {
  menuItem: MenuItem;
  size: DrinkSize;
  temperature: DrinkTemperature;
  quantity: number;
  unitPrice: number;
}

// Size price modifiers
export const SIZE_PRICES: Record<DrinkSize, number> = {
  small: -0.50,
  medium: 0,
  large: 0.75,
};

export const SIZE_LABELS: Record<DrinkSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
};

export const TEMPERATURE_LABELS: Record<DrinkTemperature, string> = {
  hot: 'Hot',
  iced: 'Iced',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'New Order',
  in_progress: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  online: 'Online/Pre-paid',
};
