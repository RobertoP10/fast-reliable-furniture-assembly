
-- Drop all existing policies that are causing issues
DROP POLICY IF EXISTS "task_requests_select_policy" ON public.task_requests;
DROP POLICY IF EXISTS "offers_select_policy" ON public.offers;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "users_select_policy" ON public.users;
DROP POLICY IF EXISTS "offers_insert_policy" ON public.offers;
DROP POLICY IF EXISTS "offers_update_policy" ON public.offers;
DROP POLICY IF EXISTS "task_requests_insert_policy" ON public.task_requests;
DROP POLICY IF EXISTS "task_requests_update_policy" ON public.task_requests;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

-- Drop problematic helper functions that cause recursion
DROP FUNCTION IF EXISTS public.tasker_can_see_task(uuid, uuid);
DROP FUNCTION IF EXISTS public.tasker_can_chat_on_task(uuid, uuid);
DROP FUNCTION IF EXISTS public.tasker_can_see_client_profile(uuid, uuid);

-- Keep only the safe get_user_role function
-- This is safe because it only queries users table and doesn't reference back to protected tables

-- 1. USERS TABLE POLICIES
-- Users can always see their own profile, and limited visibility for interaction partners
CREATE POLICY "users_select_policy" ON public.users
FOR SELECT USING (
  -- Users can see their own profile (critical for login)
  users.id = auth.uid()
  OR
  -- Clients can see tasker profiles if tasker submitted offers on their tasks
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
  -- Taskers can see client profiles if they have accepted offers on client's tasks
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND EXISTS (
      SELECT 1 FROM public.task_requests tr
      JOIN public.offers o ON o.id = tr.accepted_offer_id
      WHERE tr.client_id = users.id
      AND o.tasker_id = auth.uid()
      AND o.status = 'accepted'
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- 2. TASK_REQUESTS TABLE POLICIES  
-- Direct logic without helper functions to avoid recursion
CREATE POLICY "task_requests_select_policy" ON public.task_requests
FOR SELECT USING (
  -- Clients can see their own tasks
  client_id = auth.uid()
  OR
  -- Taskers can see pending tasks (but not their own tasks)
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND status = 'pending'
    AND client_id != auth.uid()
  )
  OR
  -- Taskers can see tasks where their offer was accepted
  (
    public.get_user_role(auth.uid()) = 'tasker'
    AND accepted_offer_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.id = accepted_offer_id
      AND o.tasker_id = auth.uid()
      AND o.status = 'accepted'
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- 3. OFFERS TABLE POLICIES
-- Taskers see their offers, clients see offers on their tasks
CREATE POLICY "offers_select_policy" ON public.offers
FOR SELECT USING (
  -- Taskers can see their own offers
  tasker_id = auth.uid()
  OR
  -- Clients can see offers on their tasks
  EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = offers.task_id 
    AND tr.client_id = auth.uid()
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- 4. MESSAGES TABLE POLICIES
-- Only participants in active chats (after offer acceptance) can see messages
CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (
  -- User is the sender or receiver
  (sender_id = auth.uid() OR receiver_id = auth.uid())
  AND
  -- Additional constraint: chat must be active (offer accepted)
  EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = messages.task_id
    AND tr.accepted_offer_id IS NOT NULL
    AND (
      -- Client owns the task
      tr.client_id = auth.uid()
      OR
      -- Tasker has the accepted offer
      EXISTS (
        SELECT 1 FROM public.offers o
        WHERE o.id = tr.accepted_offer_id
        AND o.tasker_id = auth.uid()
        AND o.status = 'accepted'
      )
    )
  )
  OR
  -- Admins can see all
  public.get_user_role(auth.uid()) = 'admin'
);

-- RECREATE INSERT/UPDATE POLICIES FOR DATA INTEGRITY

-- Offers: Only taskers can create offers for themselves
CREATE POLICY "offers_insert_policy" ON public.offers
FOR INSERT WITH CHECK (
  tasker_id = auth.uid()
  AND public.get_user_role(auth.uid()) = 'tasker'
);

-- Offers: Taskers can update their own offers, clients can accept/reject offers on their tasks
CREATE POLICY "offers_update_policy" ON public.offers
FOR UPDATE USING (
  tasker_id = auth.uid()
  OR 
  EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = offers.task_id 
    AND tr.client_id = auth.uid()
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

-- Task requests: Clients can update their own tasks, admins can update any
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
  -- Must be an active chat (offer accepted)
  EXISTS (
    SELECT 1 FROM public.task_requests tr
    WHERE tr.id = messages.task_id
    AND tr.accepted_offer_id IS NOT NULL
    AND (
      -- Sender is the client who owns the task
      (tr.client_id = auth.uid() AND receiver_id IN (
        SELECT o.tasker_id FROM public.offers o 
        WHERE o.id = tr.accepted_offer_id
      ))
      OR
      -- Sender is the tasker with accepted offer
      (EXISTS (
        SELECT 1 FROM public.offers o
        WHERE o.id = tr.accepted_offer_id
        AND o.tasker_id = auth.uid()
        AND o.status = 'accepted'
      ) AND receiver_id = tr.client_id)
    )
  )
);
