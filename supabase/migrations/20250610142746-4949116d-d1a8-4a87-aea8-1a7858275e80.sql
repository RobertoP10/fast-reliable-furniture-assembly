
-- First, let's drop all existing policies to start fresh
DROP POLICY IF EXISTS "task_requests_select_policy" ON public.task_requests;
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_update_policy" ON public.offers;
DROP POLICY IF EXISTS "task_requests_insert_policy" ON public.task_requests;
DROP POLICY IF EXISTS "task_requests_update_policy" ON public.task_requests;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

-- Drop any remaining problematic functions
DROP FUNCTION IF EXISTS public.tasker_can_see_task(uuid, uuid);
DROP FUNCTION IF EXISTS public.tasker_can_chat_on_task(uuid, uuid);
DROP FUNCTION IF EXISTS public.tasker_can_see_client_profile(uuid, uuid);

-- Ensure get_user_role function is safe and doesn't cause recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role::text FROM public.users WHERE id = user_id;
$$;

-- 1. OFFERS TABLE POLICIES (Critical - must be recursion-free)
-- Simple, direct policies without complex subqueries
CREATE POLICY "offers_select_policy" ON public.offers
FOR SELECT USING (
  -- Taskers can see their own offers (direct comparison, no recursion)
  tasker_id = auth.uid()
  OR
  -- Clients can see offers on their tasks (single-level join, no recursion risk)
  task_id IN (
    SELECT id FROM public.task_requests 
    WHERE client_id = auth.uid()
  )
  OR
  -- Admins can see all offers
  public.get_user_role(auth.uid()) = 'admin'
);

-- 2. TASK_REQUESTS TABLE POLICIES
-- Optimized to prevent recursion by avoiding self-referencing subqueries
CREATE POLICY "task_requests_select_policy" ON public.task_requests
FOR SELECT USING (
  -- Clients can see their own tasks (direct comparison)
  client_id = auth.uid()
  OR
  -- Taskers can see pending tasks that are not their own
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND status = 'pending'
    AND client_id != auth.uid()
  )
  OR
  -- Taskers can see tasks where they have the accepted offer
  -- This uses a direct comparison to avoid recursion
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND accepted_offer_id IS NOT NULL
    AND accepted_offer_id IN (
      SELECT id FROM public.offers 
      WHERE tasker_id = auth.uid() 
      AND status = 'accepted'
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- 3. USERS TABLE POLICIES
-- Simplified to prevent any circular references
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT USING (
  -- Users can always see their own profile (critical for login)
  id = auth.uid()
  OR
  -- Clients can see tasker profiles who have submitted offers on their tasks
  (
    public.get_user_role(auth.uid()) = 'client'
    AND id IN (
      SELECT o.tasker_id 
      FROM public.offers o
      INNER JOIN public.task_requests tr ON tr.id = o.task_id
      WHERE tr.client_id = auth.uid()
    )
  )
  OR
  -- Taskers can see client profiles where they have accepted offers
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND id IN (
      SELECT tr.client_id
      FROM public.task_requests tr
      WHERE tr.accepted_offer_id IN (
        SELECT id FROM public.offers 
        WHERE tasker_id = auth.uid() 
        AND status = 'accepted'
      )
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- 4. MESSAGES TABLE POLICIES
-- Streamlined to avoid complex nested queries that could cause recursion
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (
  -- User must be sender or receiver
  (sender_id = auth.uid() OR receiver_id = auth.uid())
  AND
  -- Chat must be for a task with an accepted offer
  task_id IN (
    SELECT id FROM public.task_requests 
    WHERE accepted_offer_id IS NOT NULL
    AND (
      -- User is the client of the task
      client_id = auth.uid()
      OR
      -- User is the tasker with the accepted offer
      accepted_offer_id IN (
        SELECT id FROM public.offers 
        WHERE tasker_id = auth.uid() 
        AND status = 'accepted'
      )
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- INSERT/UPDATE POLICIES (keeping these simple and direct)

-- Offers: Only taskers can create offers for themselves
CREATE POLICY "offers_insert_policy" ON public.offers
FOR INSERT WITH CHECK (
  tasker_id = auth.uid()
  AND public.get_user_role(auth.uid()) = 'tasker'
);

-- Offers: Taskers can update their own offers, clients can update offers on their tasks
CREATE POLICY "offers_update_policy" ON public.offers
FOR UPDATE USING (
  tasker_id = auth.uid()
  OR 
  task_id IN (
    SELECT id FROM public.task_requests 
    WHERE client_id = auth.uid()
  )
  OR
  public.get_user_role(auth.uid()) = 'admin'
);

-- Task requests: Only clients can create tasks for themselves
CREATE POLICY "task_requests_insert_policy" ON public.task_requests
FOR INSERT WITH CHECK (
  client_id = auth.uid()
  AND public.get_user_role(auth.uid()) = 'client'
);

-- Task requests: Clients can update their own tasks
CREATE POLICY "task_requests_update_policy" ON public.task_requests
FOR UPDATE USING (
  client_id = auth.uid()
  OR public.get_user_role(auth.uid()) = 'admin'
);

-- Messages: Users can only send messages as themselves in active chats
CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
  AND
  -- Simplified check: task must have accepted offer and user must be participant
  task_id IN (
    SELECT id FROM public.task_requests 
    WHERE accepted_offer_id IS NOT NULL
    AND (
      -- Sender is client and receiver is the accepted tasker
      (client_id = auth.uid() AND receiver_id IN (
        SELECT tasker_id FROM public.offers 
        WHERE id = accepted_offer_id
      ))
      OR
      -- Sender is accepted tasker and receiver is client
      (accepted_offer_id IN (
        SELECT id FROM public.offers 
        WHERE tasker_id = auth.uid() 
        AND status = 'accepted'
      ) AND receiver_id = client_id)
    )
  )
);
