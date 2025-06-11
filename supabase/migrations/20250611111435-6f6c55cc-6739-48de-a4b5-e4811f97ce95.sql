
-- Drop all existing RLS policies on offers table to start fresh
DROP POLICY IF EXISTS "offers_select_tasker_client" ON public.offers;
DROP POLICY IF EXISTS "offers_insert_tasker" ON public.offers;
DROP POLICY IF EXISTS "offers_update_tasker_or_client" ON public.offers;

-- Drop all existing RLS policies on task_requests table
DROP POLICY IF EXISTS "task_requests_select_all_roles" ON public.task_requests;
DROP POLICY IF EXISTS "task_requests_insert_client" ON public.task_requests;
DROP POLICY IF EXISTS "task_requests_update_client" ON public.task_requests;

-- Create a helper function to get user role without recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Create safe RLS policies for offers table
CREATE POLICY "offers_select_policy" ON public.offers
FOR SELECT 
USING (
  tasker_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.task_requests tr 
    WHERE tr.id = task_id AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "offers_insert_policy" ON public.offers
FOR INSERT 
WITH CHECK (
  tasker_id = auth.uid() 
  AND public.get_user_role(auth.uid()) = 'tasker'
);

CREATE POLICY "offers_update_policy" ON public.offers
FOR UPDATE 
USING (
  tasker_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM public.task_requests tr 
    WHERE tr.id = task_id AND tr.client_id = auth.uid()
  )
);

-- Create safe RLS policies for task_requests table
CREATE POLICY "task_requests_select_policy" ON public.task_requests
FOR SELECT 
USING (
  client_id = auth.uid()
  OR (
    public.get_user_role(auth.uid()) = 'tasker' 
    AND (status = 'pending' OR status = 'accepted' OR status = 'completed')
  )
);

CREATE POLICY "task_requests_insert_policy" ON public.task_requests
FOR INSERT 
WITH CHECK (
  client_id = auth.uid() 
  AND public.get_user_role(auth.uid()) = 'client'
);

CREATE POLICY "task_requests_update_policy" ON public.task_requests
FOR UPDATE 
USING (
  client_id = auth.uid()
  OR (
    public.get_user_role(auth.uid()) = 'tasker' 
    AND EXISTS (
      SELECT 1 FROM public.offers o 
      WHERE o.task_id = id AND o.tasker_id = auth.uid() AND o.is_accepted = true
    )
  )
);

-- Create RLS policies for messages table
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT 
USING (
  sender_id = auth.uid() 
  OR receiver_id = auth.uid()
);

CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid()
  AND public.can_chat_on_task(task_id)
);

-- Create RLS policies for notifications table
CREATE POLICY "notifications_select_policy" ON public.notifications
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "notifications_update_policy" ON public.notifications
FOR UPDATE 
USING (user_id = auth.uid());

-- Create RLS policies for reviews table
CREATE POLICY "reviews_select_policy" ON public.reviews
FOR SELECT 
USING (
  reviewer_id = auth.uid() 
  OR reviewee_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.task_requests tr 
    WHERE tr.id = task_id AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "reviews_insert_policy" ON public.reviews
FOR INSERT 
WITH CHECK (reviewer_id = auth.uid());

-- Ensure RLS is enabled on all tables
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
