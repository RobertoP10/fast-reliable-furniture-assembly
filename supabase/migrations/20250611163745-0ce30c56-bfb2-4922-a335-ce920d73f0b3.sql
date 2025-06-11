
-- Create admin RLS policies to allow full access to transactions data
CREATE POLICY "admin_full_access_transactions" ON public.transactions
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create admin RLS policies for users table
CREATE POLICY "admin_full_access_users" ON public.users
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create admin RLS policies for task_requests table  
CREATE POLICY "admin_full_access_task_requests" ON public.task_requests
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create admin RLS policies for offers table
CREATE POLICY "admin_full_access_offers" ON public.offers
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create admin RLS policies for reviews table
CREATE POLICY "admin_full_access_reviews" ON public.reviews
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Enable RLS on transactions table if not already enabled
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
