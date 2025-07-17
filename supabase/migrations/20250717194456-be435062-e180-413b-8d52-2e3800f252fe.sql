
-- Add email notifications preference column to users table
ALTER TABLE public.users 
ADD COLUMN email_notifications_enabled boolean DEFAULT true;

-- Add comment to document the purpose
COMMENT ON COLUMN public.users.email_notifications_enabled IS 'Controls whether user receives email notifications for new tasks';
