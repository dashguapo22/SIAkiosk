ALTER TABLE public.orders
ADD COLUMN cashier_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN cashier_name TEXT,
ADD COLUMN paid_at TIMESTAMP WITH TIME ZONE;

CREATE POLICY "Authenticated users can view staff roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can view staff profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);
