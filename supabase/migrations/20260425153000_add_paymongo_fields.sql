ALTER TABLE public.orders
ADD COLUMN paymongo_checkout_session_id TEXT,
ADD COLUMN paymongo_payment_intent_id TEXT,
ADD COLUMN paymongo_payment_id TEXT,
ADD COLUMN paymongo_reference_number TEXT;
