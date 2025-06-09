
-- First, let's enable RLS on all tables if not already enabled
ALTER TABLE public.task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "task_requests_select_policy" ON public.task_requests;
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_task_participant(task_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = task_id 
    AND (
      tr.client_id = user_id 
      OR EXISTS (
        SELECT 1 FROM public.offers o 
        WHERE o.task_id = tr.id AND o.tasker_id = user_id
      )
    )
  );
$$;

-- RLS Policy for task_requests
CREATE POLICY "task_requests_select_policy" ON public.task_requests
FOR SELECT USING (
  -- Clients can see their own tasks
  client_id = auth.uid()
  OR
  -- Taskers can see tasks they can bid on (pending status) or have offers on
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND (
      status = 'pending'
      OR EXISTS (
        SELECT 1 FROM public.offers o 
        WHERE o.task_id = id AND o.tasker_id = auth.uid()
      )
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- RLS Policy for offers
CREATE POLICY "offers_select_policy" ON public.offers
FOR SELECT USING (
  -- Taskers can see their own offers
  tasker_id = auth.uid()
  OR
  -- Clients can see offers on their tasks
  EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = task_id AND tr.client_id = auth.uid()
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- RLS Policy for users (to allow viewing tasker names on offers)
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT USING (
  -- Users can see their own profile
  id = auth.uid()
  OR
  -- Users can see profiles of people they interact with through tasks/offers
  EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE (tr.client_id = auth.uid() OR tr.client_id = id)
    AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.task_id = tr.id AND (o.tasker_id = auth.uid() OR o.tasker_id = id)
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- Allow INSERT operations for offers
CREATE POLICY "offers_insert_policy" ON public.offers
FOR INSERT WITH CHECK (tasker_id = auth.uid());

-- Allow UPDATE operations for offers (for acceptance)
CREATE POLICY "offers_update_policy" ON public.offers
FOR UPDATE USING (
  tasker_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = task_id AND tr.client_id = auth.uid()
  )
);

-- Allow INSERT operations for task_requests
CREATE POLICY "task_requests_insert_policy" ON public.task_requests
FOR INSERT WITH CHECK (client_id = auth.uid());

-- Allow UPDATE operations for task_requests
CREATE POLICY "task_requests_update_policy" ON public.task_requests
FOR UPDATE USING (
  client_id = auth.uid()
  OR public.get_user_role(auth.uid()) = 'admin'
);
