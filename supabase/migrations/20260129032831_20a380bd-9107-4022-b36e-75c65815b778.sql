-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'in_progress', 'ready', 'completed', 'cancelled');

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'online');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid');

-- Create enum for drink size
CREATE TYPE public.drink_size AS ENUM ('small', 'medium', 'large');

-- Create enum for drink temperature
CREATE TYPE public.drink_temperature AS ENUM ('hot', 'iced');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'cashier');

-- Create categories table
CREATE TABLE public.categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create menu_items table
CREATE TABLE public.menu_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    allows_iced BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number SERIAL,
    status order_status NOT NULL DEFAULT 'pending',
    payment_method payment_method,
    payment_status payment_status NOT NULL DEFAULT 'unpaid',
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create order_items table
CREATE TABLE public.order_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    size drink_size NOT NULL DEFAULT 'medium',
    temperature drink_temperature NOT NULL DEFAULT 'hot',
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table for admin/cashier access
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table for user info
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view active categories"
    ON public.categories FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for menu_items (public read, admin write)
CREATE POLICY "Anyone can view available menu items"
    ON public.menu_items FOR SELECT
    USING (is_available = true);

CREATE POLICY "Admins can manage menu items"
    ON public.menu_items FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for orders (public insert, authenticated read/update)
CREATE POLICY "Anyone can create orders"
    ON public.orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can view orders"
    ON public.orders FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can update orders"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- RLS Policies for order_items
CREATE POLICY "Anyone can create order items"
    ON public.order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Anyone can view order items"
    ON public.order_items FOR SELECT
    USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Insert default categories
INSERT INTO public.categories (name, description, display_order) VALUES
    ('Hot Coffee', 'Classic hot coffee drinks', 1),
    ('Iced Drinks', 'Refreshing iced beverages', 2),
    ('Specialty', 'Our signature specialty drinks', 3),
    ('Tea', 'Hot and iced tea selections', 4);

-- Insert sample menu items
INSERT INTO public.menu_items (category_id, name, description, base_price, allows_iced, display_order) VALUES
    ((SELECT id FROM public.categories WHERE name = 'Hot Coffee'), 'Espresso', 'Rich, bold single shot', 3.50, false, 1),
    ((SELECT id FROM public.categories WHERE name = 'Hot Coffee'), 'Americano', 'Espresso with hot water', 4.00, true, 2),
    ((SELECT id FROM public.categories WHERE name = 'Hot Coffee'), 'Latte', 'Espresso with steamed milk', 4.50, true, 3),
    ((SELECT id FROM public.categories WHERE name = 'Hot Coffee'), 'Cappuccino', 'Espresso with foamed milk', 4.50, false, 4),
    ((SELECT id FROM public.categories WHERE name = 'Hot Coffee'), 'Mocha', 'Espresso with chocolate and milk', 5.00, true, 5),
    ((SELECT id FROM public.categories WHERE name = 'Iced Drinks'), 'Iced Coffee', 'Cold brewed coffee over ice', 4.00, true, 1),
    ((SELECT id FROM public.categories WHERE name = 'Iced Drinks'), 'Cold Brew', 'Smooth, slow-steeped cold coffee', 4.50, true, 2),
    ((SELECT id FROM public.categories WHERE name = 'Iced Drinks'), 'Frappe', 'Blended iced coffee drink', 5.50, true, 3),
    ((SELECT id FROM public.categories WHERE name = 'Specialty'), 'Caramel Macchiato', 'Vanilla, milk, espresso, caramel', 5.50, true, 1),
    ((SELECT id FROM public.categories WHERE name = 'Specialty'), 'Vanilla Latte', 'Latte with vanilla syrup', 5.00, true, 2),
    ((SELECT id FROM public.categories WHERE name = 'Specialty'), 'Hazelnut Mocha', 'Mocha with hazelnut flavor', 5.50, true, 3),
    ((SELECT id FROM public.categories WHERE name = 'Tea'), 'Earl Grey', 'Classic black tea with bergamot', 3.50, true, 1),
    ((SELECT id FROM public.categories WHERE name = 'Tea'), 'Green Tea', 'Light and refreshing', 3.50, true, 2),
    ((SELECT id FROM public.categories WHERE name = 'Tea'), 'Chai Latte', 'Spiced tea with steamed milk', 4.50, true, 3);