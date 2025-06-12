
-- Add phone number column to users table
ALTER TABLE public.users 
ADD COLUMN phone_number text;

-- Add terms acceptance tracking
ALTER TABLE public.users 
ADD COLUMN terms_accepted boolean DEFAULT false;

ALTER TABLE public.users 
ADD COLUMN terms_accepted_at timestamp with time zone;
