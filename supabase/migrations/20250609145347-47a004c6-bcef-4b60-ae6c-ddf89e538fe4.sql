
-- Drop all existing policies that depend on the functions first
DROP POLICY IF EXISTS "task_requests_select_policy" ON public.task_requests;
DROP POLICY IF EXISTS "task_requests_update_policy" ON public.task_requests;
DROP POLICY IF EXISTS "task_requests_insert_policy" ON public.task_requests;
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_update_policy" ON public.offers;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;

-- Now drop the functions
DROP FUNCTION IF EXISTS public.get_user_role(uuid);
DROP FUNCTION IF EXISTS public.is_task_participant(uuid, uuid);

-- Create improved security definer functions to avoid recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

CREATE OR REPLACE FUNCTION public.user_can_see_task(task_id uuid, user_id uuid)
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
      OR (
        public.get_user_role(user_id) = 'tasker' 
        AND tr.status = 'pending'
      )
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_see_offer(offer_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.id = offer_id 
    AND o.tasker_id = user_id
  )
  OR EXISTS (
    SELECT 1 FROM public.offers o
    JOIN public.task_requests tr ON tr.id = o.task_id
    WHERE o.id = offer_id 
    AND tr.client_id = user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_see_profile(profile_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT profile_id = user_id
  OR public.get_user_role(user_id) = 'admin'
  OR EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.client_id = user_id AND tr.client_id = profile_id
  )
  OR EXISTS (
    SELECT 1 FROM public.offers o
    WHERE o.tasker_id = user_id AND o.tasker_id = profile_id
  );
$$;

-- Create simplified RLS policies to avoid recursion
CREATE POLICY "task_requests_select_policy" ON public.task_requests
FOR SELECT USING (
  client_id = auth.uid()
  OR (
    public.get_user_role(auth.uid()) = 'tasker'
    AND status = 'pending'
  )
  OR public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "offers_select_policy" ON public.offers
FOR SELECT USING (
  public.user_can_see_offer(id, auth.uid())
  OR public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "users_select_policy" ON public.users
FOR SELECT USING (
  public.user_can_see_profile(id, auth.uid())
);

-- Recreate INSERT/UPDATE policies
CREATE POLICY "offers_insert_policy" ON public.offers
FOR INSERT WITH CHECK (tasker_id = auth.uid());

CREATE POLICY "offers_update_policy" ON public.offers
FOR UPDATE USING (
  tasker_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = task_id AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "task_requests_insert_policy" ON public.task_requests
FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "task_requests_update_policy" ON public.task_requests
FOR UPDATE USING (
  client_id = auth.uid()
  OR public.get_user_role(auth.uid()) = 'admin'
);
