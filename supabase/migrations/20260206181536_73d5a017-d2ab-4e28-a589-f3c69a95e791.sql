-- Create lifetime_purchases table to track one-time lifetime deal purchases
CREATE TABLE public.lifetime_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_payment_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'proplus',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.lifetime_purchases ENABLE ROW LEVEL SECURITY;

-- Users can only view their own lifetime purchases
CREATE POLICY "Users can view own lifetime purchases"
  ON public.lifetime_purchases FOR SELECT
  USING (auth.uid() = user_id);