-- Enable pg_net extension for HTTP requests from database functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Update the notify_new_task function to use HTTP POST instead of pg_notify
CREATE OR REPLACE FUNCTION public.notify_new_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  task_json jsonb;
  request_id bigint;
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
  
  -- Prepare task data for email notifications
  task_json := json_build_object(
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
    'client_id', NEW.client_id,
    'created_at', NEW.created_at
  );
  
  -- Send HTTP POST request to edge function for email notifications
  -- This is non-blocking and won't affect task creation if it fails
  BEGIN
    SELECT net.http_post(
      url := 'https://yedytkprmsmwvqhxvmcz.supabase.co/functions/v1/send-task-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZHl0a3BybXNtd3ZxaHh2bWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4NTYwOTksImV4cCI6MjA2NDQzMjA5OX0.2lW_MduBsK7wO9br7goF7n1gd1IZfG6CSNsf7lQa1lY'
      ),
      body := jsonb_build_object('task', task_json)
    ) INTO request_id;
    
    -- Log success (optional, can be removed in production)
    RAISE LOG 'Email notification HTTP request sent for task %, request_id: %', NEW.id, request_id;
    
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the task creation
    RAISE LOG 'Failed to send email notification for task %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;