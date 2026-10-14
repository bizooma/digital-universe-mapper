CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _tier text;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'free';
  END IF;

  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized to read another user''s tier';
  END IF;

  IF public.has_role(_user_id, 'admin') THEN
    RETURN 'team';
  END IF;

  SELECT plan INTO _tier FROM public.lifetime_purchases WHERE user_id = _user_id LIMIT 1;
  IF _tier IS NOT NULL THEN
    RETURN _tier;
  END IF;

  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _user_id) THEN
    RETURN 'team';
  END IF;

  SELECT tier INTO _tier FROM public.user_entitlements WHERE user_id = _user_id;
  RETURN COALESCE(_tier, 'free');
END;
$function$;

REVOKE ALL ON FUNCTION public.get_user_tier(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tier(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.get_tier_node_cap(_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT CASE WHEN _tier = 'free' THEN 5 ELSE 2147483647 END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_map_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.is_team_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can record a view" ON public.map_views;
CREATE POLICY "Views can be recorded for public maps"
ON public.map_views FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.maps m WHERE m.id = map_views.map_id AND m.is_public = true));

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Public can view ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload ticket attachments" ON storage.objects;

CREATE POLICY "Users can upload own ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ticket-attachments' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners and admins can view ticket attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ticket-attachments' AND ((auth.uid())::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));