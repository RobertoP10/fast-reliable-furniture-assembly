
-- Fix the RLS policy bug in task_requests_update_policy
-- The current policy has o.task_id = o.id which should be o.task_id = task_requests.id
DROP POLICY IF EXISTS "task_requests_update_policy" ON public.task_requests;

CREATE POLICY "task_requests_update_policy" ON public.task_requests
FOR UPDATE USING (
  client_id = auth.uid()
  OR (
    get_user_role(auth.uid()) = 'tasker'
    AND EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.task_id = task_requests.id 
      AND o.tasker_id = auth.uid() 
      AND o.is_accepted = true
    )
  )
  OR get_user_role(auth.uid()) = 'admin'
);
