-- Add logo_url column to maps table for Pro users
ALTER TABLE public.maps 
ADD COLUMN logo_url text;

-- Create storage bucket for map logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('map-logos', 'map-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own logos
CREATE POLICY "Users can upload their own map logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'map-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own map logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'map-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own map logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'map-logos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to logos (for exports and sharing)
CREATE POLICY "Anyone can view map logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'map-logos');