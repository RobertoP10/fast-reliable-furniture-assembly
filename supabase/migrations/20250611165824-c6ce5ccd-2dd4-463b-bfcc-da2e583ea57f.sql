
-- Drop any existing policies first
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "transactions_select_own" ON public.transactions;

-- Drop ALL problematic admin policies that cause circular dependencies and login issues
DROP POLICY IF EXISTS "admin_full_access_transactions" ON public.transactions;
DROP POLICY IF EXISTS "admin_full_access_users" ON public.users;
DROP POLICY IF EXISTS "admin_full_access_task_requests" ON public.task_requests;
DROP POLICY IF EXISTS "admin_full_access_offers" ON public.offers;
DROP POLICY IF EXISTS "admin_full_access_reviews" ON public.reviews;
DROP POLICY IF EXISTS "admin_can_manage_transactions" ON public.transactions;
DROP POLICY IF EXISTS "admin_can_manage_task_requests" ON public.task_requests;
DROP POLICY IF EXISTS "admin_can_manage_offers" ON public.offers;
DROP POLICY IF EXISTS "admin_can_manage_reviews" ON public.reviews;
DROP POLICY IF EXISTS "admin_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON public.users;

-- Create clean, working policies without recursion
-- Users table - basic access for users to see their own profile
CREATE POLICY "users_select_own" ON public.users
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
FOR UPDATE 
USING (id = auth.uid());

-- Transactions table - basic user access
CREATE POLICY "transactions_select_own" ON public.transactions
FOR SELECT 
USING (client_id = auth.uid() OR tasker_id = auth.uid());

-- Ensure RLS is enabled on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
