
-- Update the notify_new_task function to also send email notifications
CREATE OR REPLACE FUNCTION public.notify_new_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Notify all approved taskers about the new task (existing in-app notifications)
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
  
  -- Send email notifications via edge function (non-blocking)
  PERFORM pg_notify('task_created', json_build_object(
    'id', NEW.id,
    'title', NEW.title,
    'description', NEW.description,
    'category', NEW.category,
    'subcategory', NEW.subcategory,
    'location', NEW.location,
    'price_range_min', NEW.price_range_min,
    'price_range_max', NEW.price_range_max,
    'required_date', NEW.required_date,
    'required_time', NEW.required_time,
    'payment_method', NEW.payment_method,
    'client_id', NEW.client_id
  )::text);
  
  RETURN NEW;
END;
$$;
