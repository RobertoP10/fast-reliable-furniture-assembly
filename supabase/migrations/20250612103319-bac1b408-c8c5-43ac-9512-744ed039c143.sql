
-- Update the cancel_task function to also mark offers as cancelled
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
    
    -- Mark all offers for this task as cancelled
    UPDATE public.offers 
    SET status = 'cancelled'
    WHERE task_id = task_id_param;
    
    -- Send notifications to all taskers who submitted offers
    INSERT INTO public.notifications (user_id, type, title, message, task_id)
    SELECT 
      o.tasker_id,
      'task_cancelled',
      'Task Cancelled',
      'The client has cancelled the task you submitted an offer for: ' || task_title || '.',
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
