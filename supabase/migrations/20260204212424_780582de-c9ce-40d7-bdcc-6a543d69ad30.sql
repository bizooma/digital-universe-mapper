-- Create map_views table to track view events
CREATE TABLE public.map_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_agent TEXT,
  referrer TEXT,
  country TEXT
);

-- Create index for efficient querying by map
CREATE INDEX idx_map_views_map_id ON public.map_views(map_id);
CREATE INDEX idx_map_views_viewed_at ON public.map_views(viewed_at);

-- Enable RLS
ALTER TABLE public.map_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert views (tracking is anonymous)
CREATE POLICY "Anyone can record a view" 
ON public.map_views 
FOR INSERT 
WITH CHECK (true);

-- Only map owners can view their analytics
CREATE POLICY "Map owners can view their analytics" 
ON public.map_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.maps 
    WHERE maps.id = map_views.map_id 
    AND maps.user_id = auth.uid()
  )
);