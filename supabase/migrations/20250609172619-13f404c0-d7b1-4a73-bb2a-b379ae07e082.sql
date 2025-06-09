
-- Add required fields for task scheduling and completion proof
ALTER TABLE public.task_requests 
ADD COLUMN IF NOT EXISTS required_date DATE,
ADD COLUMN IF NOT EXISTS required_time TIME,
ADD COLUMN IF NOT EXISTS completion_proof_urls TEXT[],
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add task cancellation support
ALTER TABLE public.task_requests 
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Update task status enum to include cancelled
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status' AND 'cancelled' = ANY(enum_range(NULL::task_status)::text[])) THEN
        ALTER TYPE task_status ADD VALUE 'cancelled';
    END IF;
END $$;

-- Create function to handle offer acceptance with proper rejection of other offers
CREATE OR REPLACE FUNCTION public.accept_offer_and_reject_others(offer_id_param UUID, task_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the accepted offer
    UPDATE public.offers 
    SET is_accepted = TRUE 
    WHERE id = offer_id_param AND task_id = task_id_param;
    
    -- Reject all other offers for this task
    UPDATE public.offers 
    SET is_accepted = FALSE 
    WHERE task_id = task_id_param AND id != offer_id_param;
    
    -- Update task status and accepted_offer_id
    UPDATE public.task_requests 
    SET status = 'accepted', accepted_offer_id = offer_id_param 
    WHERE id = task_id_param;
    
    RETURN TRUE;
END;
$$;

-- Create function to cancel task (only if no offers accepted)
CREATE OR REPLACE FUNCTION public.cancel_task(task_id_param UUID, reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow cancellation if no offer has been accepted
    IF EXISTS (SELECT 1 FROM public.task_requests WHERE id = task_id_param AND accepted_offer_id IS NOT NULL) THEN
        RETURN FALSE;
    END IF;
    
    UPDATE public.task_requests 
    SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = reason
    WHERE id = task_id_param AND client_id = auth.uid();
    
    RETURN TRUE;
END;
$$;

-- Create function to mark task as completed (client confirmation)
CREATE OR REPLACE FUNCTION public.complete_task(task_id_param UUID, proof_urls TEXT[] DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.task_requests 
    SET status = 'completed', completed_at = NOW(), completion_proof_urls = proof_urls
    WHERE id = task_id_param AND client_id = auth.uid() AND status = 'accepted';
    
    RETURN FOUND;
END;
$$;

-- Update RLS policies for messages to only allow chat after offer acceptance
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;

CREATE POLICY "messages_select_policy" ON public.messages
FOR SELECT USING (
    public.can_chat_on_task(task_id)
);

CREATE POLICY "messages_insert_policy" ON public.messages
FOR INSERT WITH CHECK (
    public.can_chat_on_task(task_id) AND sender_id = auth.uid()
);
