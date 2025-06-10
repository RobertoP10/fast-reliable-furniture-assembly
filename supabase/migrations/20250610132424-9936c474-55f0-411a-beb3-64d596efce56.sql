
-- Update the accept_offer_and_reject_others function to properly set offer statuses
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
    
    -- Update the accepted offer with both is_accepted and status
    UPDATE public.offers 
    SET is_accepted = TRUE, status = 'accepted'
    WHERE id = offer_id_param AND task_id = task_id_param;
    
    -- Reject ALL other offers for this task (set both is_accepted = false and status = 'rejected')
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
      'Your offer for "' || task_title || '" has been accepted! You can now chat with the client.',
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
    
    -- Insert welcome message from client to accepted tasker to activate chat
    INSERT INTO public.messages (task_id, sender_id, receiver_id, content, is_read)
    VALUES (
      task_id_param,
      (SELECT client_id FROM public.task_requests WHERE id = task_id_param),
      accepted_tasker_id,
      'Your offer was accepted! You can now chat with me about the task details.',
      false
    );
    
    RETURN TRUE;
END;
$function$
