-- Create maps table to store user maps
CREATE TABLE public.maps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Untitled Map',
  nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
  edges JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.maps ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own maps" 
ON public.maps 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own maps" 
ON public.maps 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own maps" 
ON public.maps 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own maps" 
ON public.maps 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_maps_updated_at
BEFORE UPDATE ON public.maps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();