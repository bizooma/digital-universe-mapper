-- Add screenshot_url column to support_tickets
ALTER TABLE public.support_tickets
ADD COLUMN screenshot_url TEXT;

-- Create storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-attachments', 'ticket-attachments', true);

-- Allow authenticated users to upload to ticket-attachments bucket
CREATE POLICY "Authenticated users can upload ticket attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments');

-- Allow public read access for viewing screenshots
CREATE POLICY "Public can view ticket attachments"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ticket-attachments');