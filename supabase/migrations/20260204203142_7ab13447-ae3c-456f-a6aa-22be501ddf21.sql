-- Add is_public column to maps table
ALTER TABLE public.maps 
ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Create RLS policy to allow anyone to view public maps
CREATE POLICY "Anyone can view public maps" 
ON public.maps 
FOR SELECT 
USING (is_public = true);

-- Create index for better performance on public map queries
CREATE INDEX idx_maps_is_public ON public.maps(is_public) WHERE is_public = true;