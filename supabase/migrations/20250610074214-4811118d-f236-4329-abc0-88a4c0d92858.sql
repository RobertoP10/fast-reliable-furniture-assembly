
-- Add status column to offers table to track rejected offers
ALTER TABLE public.offers 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Update existing offers to have proper status
UPDATE public.offers 
SET status = CASE 
  WHEN is_accepted = true THEN 'accepted'
  WHEN is_accepted = false THEN 'rejected'
  ELSE 'pending'
END;

-- Create notifications table for red badge functionality
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('chat_message', 'new_task', 'offer_accepted', 'offer_rejected', 'task_cancelled')),
  title TEXT NOT NULL,
  message TEXT,
  task_id UUID REFERENCES public.task_requests(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Update the accept_offer_and_reject_others function to handle status and notifications
CREATE OR REPLACE FUNCTION public.accept_offer_and_reject_others(offer_id_param uuid, task_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  accepted_tasker_id UUID;
  task_title TEXT;
BEGIN
    -- Get the tasker ID and task title for notifications
    SELECT o.tasker_id, tr.title INTO accepted_tasker_id, task_title
    FROM public.offers o
    JOIN public.task_requests tr ON tr.id = o.task_id
    WHERE o.id = offer_id_param;
    
    -- Update the accepted offer
    UPDATE public.offers 
    SET is_accepted = TRUE, status = 'accepted'
    WHERE id = offer_id_param AND task_id = task_id_param;
    
    -- Reject all other offers for this task
    UPDATE public.offers 
    SET is_accepted = FALSE, status = 'rejected'
    WHERE task_id = task_id_param AND id != offer_id_param;
    
    -- Update task status and accepted_offer_id
    UPDATE public.task_requests 
    SET status = 'accepted', accepted_offer_id = offer_id_param 
    WHERE id = task_id_param;
    
    -- Create notification for accepted tasker
    INSERT INTO public.notifications (user_id, type, title, message, task_id, offer_id)
    VALUES (
      accepted_tasker_id, 
      'offer_accepted', 
      'Offer Accepted!', 
      'Your offer for "' || task_title || '" has been accepted!',
      task_id_param,
      offer_id_param
    );
    
    -- Create notifications for rejected taskers
    INSERT INTO public.notifications (user_id, type, title, message, task_id, offer_id)
    SELECT 
      o.tasker_id,
      'offer_rejected',
      'Offer Not Selected',
      'Your offer for "' || task_title || '" was not selected.',
      task_id_param,
      o.id
    FROM public.offers o
    WHERE o.task_id = task_id_param 
    AND o.id != offer_id_param
    AND o.status = 'rejected';
    
    -- Insert welcome message from system to accepted tasker
    INSERT INTO public.messages (task_id, sender_id, receiver_id, content, is_read)
    VALUES (
      task_id_param,
      (SELECT client_id FROM public.task_requests WHERE id = task_id_param),
      accepted_tasker_id,
      'Your offer was accepted! You can now chat with the client.',
      false
    );
    
    RETURN TRUE;
END;
$function$;

-- Update cancel_task function to send notifications
CREATE OR REPLACE FUNCTION public.cancel_task(task_id_param uuid, reason text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  task_title TEXT;
BEGIN
    -- Only allow cancellation if no offer has been accepted
    IF EXISTS (SELECT 1 FROM public.task_requests WHERE id = task_id_param AND accepted_offer_id IS NOT NULL) THEN
        RETURN FALSE;
    END IF;
    
    -- Get task title for notifications
    SELECT title INTO task_title FROM public.task_requests WHERE id = task_id_param;
    
    -- Update task status
    UPDATE public.task_requests 
    SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = reason
    WHERE id = task_id_param AND client_id = auth.uid();
    
    -- Send notifications to all taskers who submitted offers
    INSERT INTO public.notifications (user_id, type, title, message, task_id)
    SELECT 
      o.tasker_id,
      'task_cancelled',
      'Task Cancelled',
      'The task "' || task_title || '" has been cancelled by the client.',
      task_id_param
    FROM public.offers o
    WHERE o.task_id = task_id_param;
    
    -- Send messages in chat to all taskers who submitted offers
    INSERT INTO public.messages (task_id, sender_id, receiver_id, content, is_read)
    SELECT 
      task_id_param,
      (SELECT client_id FROM public.task_requests WHERE id = task_id_param),
      o.tasker_id,
      'The task has been cancelled by the client. Reason: ' || COALESCE(reason, 'No reason provided'),
      false
    FROM public.offers o
    WHERE o.task_id = task_id_param;
    
    RETURN TRUE;
END;
$function$;

-- Update complete_task function to mark completion properly
CREATE OR REPLACE FUNCTION public.complete_task(task_id_param uuid, proof_urls text[] DEFAULT NULL::text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  client_id_var UUID;
  task_title TEXT;
BEGIN
    -- Get client ID and task title for notification
    SELECT client_id, title INTO client_id_var, task_title
    FROM public.task_requests 
    WHERE id = task_id_param;
    
    -- Update task to completed (can be done by either client or accepted tasker)
    UPDATE public.task_requests 
    SET status = 'completed', completed_at = NOW(), completion_proof_urls = proof_urls
    WHERE id = task_id_param 
    AND (
      client_id = auth.uid() 
      OR EXISTS (
        SELECT 1 FROM public.offers o 
        WHERE o.task_id = task_id_param 
        AND o.tasker_id = auth.uid() 
        AND o.is_accepted = true
      )
    )
    AND status = 'accepted';
    
    -- Create notification for client if completed by tasker
    IF EXISTS (
      SELECT 1 FROM public.offers o 
      WHERE o.task_id = task_id_param 
      AND o.tasker_id = auth.uid() 
      AND o.is_accepted = true
    ) THEN
      INSERT INTO public.notifications (user_id, type, title, message, task_id)
      VALUES (
        client_id_var,
        'task_completed',
        'Task Completed',
        'Your task "' || task_title || '" has been marked as completed by the tasker.',
        task_id_param
      );
    END IF;
    
    RETURN FOUND;
END;
$function$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(user_id_param uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
AS $function$
  SELECT COALESCE(COUNT(*), 0)::integer
  FROM public.notifications
  WHERE user_id = user_id_param AND is_read = false;
$function$;
