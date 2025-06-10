
-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "task_requests_select_policy" ON public.task_requests;
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_update_policy" ON public.offers;
DROP POLICY IF EXISTS "task_requests_insert_policy" ON public.task_requests;
DROP POLICY IF EXISTS "task_requests_update_policy" ON public.task_requests;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

-- Create updated helper function for checking if tasker can see task
CREATE OR REPLACE FUNCTION public.tasker_can_see_task(task_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = task_id 
    AND (
      -- Task is pending (available for offers)
      tr.status = 'pending'
      OR
      -- Tasker's offer was accepted for this task
      EXISTS (
        SELECT 1 FROM public.offers o
        WHERE o.task_id = tr.id 
        AND o.tasker_id = user_id 
        AND o.id = tr.accepted_offer_id
        AND o.status = 'accepted'
      )
    )
  );
$$;

-- Create function to check if tasker can access chat for a task
CREATE OR REPLACE FUNCTION public.tasker_can_chat_on_task(task_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_requests tr
    JOIN public.offers o ON o.id = tr.accepted_offer_id
    WHERE tr.id = task_id 
    AND o.tasker_id = user_id
    AND o.status = 'accepted'
    AND tr.status = 'accepted'
  );
$$;

-- Create function to check if tasker can see client profile
CREATE OR REPLACE FUNCTION public.tasker_can_see_client_profile(client_id uuid, tasker_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.task_requests tr
    JOIN public.offers o ON o.id = tr.accepted_offer_id
    WHERE tr.client_id = client_id
    AND o.tasker_id = tasker_id
    AND o.status = 'accepted'
    AND tr.status = 'accepted'
  );
$$;

-- RLS Policy for task_requests: Taskers see pending tasks or tasks where their offer was accepted
CREATE POLICY "task_requests_select_policy" ON public.task_requests
FOR SELECT USING (
  -- Clients can see their own tasks
  client_id = auth.uid()
  OR
  -- Taskers can see tasks they can access
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND public.tasker_can_see_task(task_requests.id, auth.uid())
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- RLS Policy for offers: Taskers see their own offers, clients see offers on their tasks
CREATE POLICY "offers_select_policy" ON public.offers
FOR SELECT USING (
  -- Taskers can see their own offers
  tasker_id = auth.uid()
  OR
  -- Clients can see offers on their tasks
  EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = offers.task_id AND tr.client_id = auth.uid()
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- RLS Policy for messages: Only participants in active chats can see messages
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (
  -- User is the sender
  sender_id = auth.uid()
  OR
  -- User is the receiver
  receiver_id = auth.uid()
  OR
  -- Additional check: ensure tasker can only see messages if their offer was accepted
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND public.tasker_can_chat_on_task(messages.task_id, auth.uid())
  )
  OR
  -- Client can see messages on their tasks if offer was accepted
  (
    public.get_user_role(auth.uid()) = 'client'
    AND EXISTS (
      SELECT 1 FROM public.task_requests tr
      WHERE tr.id = messages.task_id 
      AND tr.client_id = auth.uid()
      AND tr.accepted_offer_id IS NOT NULL
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- RLS Policy for users: Restricted profile visibility
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT USING (
  -- Users can see their own profile
  users.id = auth.uid()
  OR
  -- Taskers can see client profiles only if their offer was accepted
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND public.tasker_can_see_client_profile(users.id, auth.uid())
  )
  OR
  -- Clients can see tasker profiles if they have an accepted offer
  (
    public.get_user_role(auth.uid()) = 'client'
    AND EXISTS (
      SELECT 1 FROM public.task_requests tr
      JOIN public.offers o ON o.id = tr.accepted_offer_id
      WHERE tr.client_id = auth.uid()
      AND o.tasker_id = users.id
      AND o.status = 'accepted'
    )
  )
  OR
  -- Allow clients to see tasker profiles when viewing offers on their tasks
  (
    public.get_user_role(auth.uid()) = 'client'
    AND EXISTS (
      SELECT 1 FROM public.offers o
      JOIN public.task_requests tr ON tr.id = o.task_id
      WHERE tr.client_id = auth.uid()
      AND o.tasker_id = users.id
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- Recreate INSERT/UPDATE policies to maintain existing functionality
CREATE POLICY "offers_insert_policy" ON public.offers
FOR INSERT WITH CHECK (tasker_id = auth.uid());

CREATE POLICY "offers_update_policy" ON public.offers
FOR UPDATE USING (
  tasker_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = offers.task_id AND tr.client_id = auth.uid()
  )
);

CREATE POLICY "task_requests_insert_policy" ON public.task_requests
FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "task_requests_update_policy" ON public.task_requests
FOR UPDATE USING (
  client_id = auth.uid()
  OR public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND (
    -- Client can send messages on their tasks if offer accepted
    (
      public.get_user_role(auth.uid()) = 'client'
      AND EXISTS (
        SELECT 1 FROM public.task_requests tr
        WHERE tr.id = messages.task_id 
        AND tr.client_id = auth.uid()
        AND tr.accepted_offer_id IS NOT NULL
      )
    )
    OR
    -- Tasker can send messages only if their offer was accepted
    (
      public.get_user_role(auth.uid()) = 'tasker'
      AND public.tasker_can_chat_on_task(messages.task_id, auth.uid())
    )
  )
);
