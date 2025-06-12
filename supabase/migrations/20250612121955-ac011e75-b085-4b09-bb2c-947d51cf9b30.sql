
-- Add a column to track tasks that need location review
ALTER TABLE public.task_requests 
ADD COLUMN needs_location_review boolean DEFAULT false;

-- Add a column to store manually entered addresses for "Other" locations
ALTER TABLE public.task_requests 
ADD COLUMN manual_address text;

-- Create an index for efficient querying of tasks needing review
CREATE INDEX idx_task_requests_needs_location_review 
ON public.task_requests(needs_location_review) 
WHERE needs_location_review = true;
