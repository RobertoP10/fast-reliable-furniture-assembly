
-- Add 'task_completed' to the allowed notification types
ALTER TABLE public.notifications 
DROP CONSTRAINT notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('chat_message', 'new_task', 'offer_accepted', 'offer_rejected', 'task_cancelled', 'task_completed'));
