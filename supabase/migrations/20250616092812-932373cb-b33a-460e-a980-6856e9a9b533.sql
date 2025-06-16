
-- Create a function to notify users about new tasks
CREATE OR REPLACE FUNCTION public.notify_new_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Notify all approved taskers about the new task
  INSERT INTO public.notifications (user_id, type, title, message, task_id)
  SELECT 
    u.id,
    'new_task',
    'New Task Available',
    'A new task "' || NEW.title || '" is available in ' || NEW.location || '. Budget: £' || NEW.price_range_min || ' - £' || NEW.price_range_max,
    NEW.id
  FROM public.users u
  WHERE u.role = 'tasker' AND u.approved = true;
  
  -- Notify all admin users about the new task
  INSERT INTO public.notifications (user_id, type, title, message, task_id)
  SELECT 
    u.id,
    'new_task',
    'New Task Created',
    'Client "' || (SELECT full_name FROM public.users WHERE id = NEW.client_id) || '" created a new task: "' || NEW.title || '"',
    NEW.id
  FROM public.users u
  WHERE u.role = 'admin';
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically notify users when a new task is created
CREATE TRIGGER on_task_created
  AFTER INSERT ON public.task_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_task();
