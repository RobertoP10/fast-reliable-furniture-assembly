
-- Drop the problematic admin policies that cause circular dependencies
DROP POLICY IF EXISTS "admin_full_access_transactions" ON public.transactions;
DROP POLICY IF EXISTS "admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_task_requests" ON public.task_requests;
DROP POLICY IF EXISTS "admin_full_access_offers" ON public.offers;
DROP POLICY IF EXISTS "admin_full_access_reviews" ON public.reviews;

-- Create safe admin policies that don't cause circular dependencies
-- For users table - critical for authentication
CREATE POLICY "users_can_view_own_profile" ON public.users
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "admin_can_view_all_users" ON public.users
FOR SELECT 
USING (auth.uid() IN (
  SELECT id FROM public.users WHERE role = 'admin'
));

-- For transactions table
CREATE POLICY "admin_can_manage_transactions" ON public.transactions
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- For task_requests table
CREATE POLICY "admin_can_manage_task_requests" ON public.task_requests
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- For offers table
CREATE POLICY "admin_can_manage_offers" ON public.offers
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- For reviews table
CREATE POLICY "admin_can_manage_reviews" ON public.reviews
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);
