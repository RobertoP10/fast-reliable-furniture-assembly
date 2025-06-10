
-- Create storage bucket for task completion proof images
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-proofs', 'task-proofs', true);

-- Create policy to allow taskers to upload proof images
CREATE POLICY "Taskers can upload proof images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'task-proofs' AND auth.role() = 'authenticated');

-- Create policy to allow viewing proof images
CREATE POLICY "Anyone can view proof images"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-proofs');
