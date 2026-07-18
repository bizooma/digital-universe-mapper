
-- 1. Entitlements table
CREATE TABLE IF NOT EXISTS public.user_entitlements (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_entitlements TO authenticated;
GRANT ALL ON public.user_entitlements TO service_role;

ALTER TABLE public.user_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own entitlement" ON public.user_entitlements;
CREATE POLICY "Users can view own entitlement"
  ON public.user_entitlements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Effective tier resolver
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier text;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'free';
  END IF;

  -- Admins always get team tier
  IF public.has_role(_user_id, 'admin') THEN
    RETURN 'team';
  END IF;

  -- Lifetime purchase wins over entitlements
  SELECT plan INTO _tier
  FROM public.lifetime_purchases
  WHERE user_id = _user_id
  LIMIT 1;
  IF _tier IS NOT NULL THEN
    RETURN _tier;
  END IF;

  -- Team member => team tier
  IF EXISTS (SELECT 1 FROM public.team_members WHERE user_id = _user_id) THEN
    RETURN 'team';
  END IF;

  SELECT tier INTO _tier
  FROM public.user_entitlements
  WHERE user_id = _user_id;

  RETURN COALESCE(_tier, 'free');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_tier(uuid) TO authenticated, service_role;

-- 3. Node cap per tier
CREATE OR REPLACE FUNCTION public.get_tier_node_cap(_tier text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN _tier = 'free' THEN 5 ELSE 2147483647 END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tier_node_cap(text) TO authenticated, service_role;

-- 4. Trigger: enforce map & node limits
CREATE OR REPLACE FUNCTION public.enforce_map_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier text;
  _cap integer;
  _node_count integer;
  _existing_maps integer;
BEGIN
  _tier := public.get_user_tier(NEW.user_id);
  _cap := public.get_tier_node_cap(_tier);

  -- Free tier: only 1 map
  IF TG_OP = 'INSERT' AND _tier = 'free' THEN
    SELECT count(*) INTO _existing_maps
    FROM public.maps
    WHERE user_id = NEW.user_id;
    IF _existing_maps >= 1 THEN
      RAISE EXCEPTION 'Free plan is limited to 1 map. Upgrade to create more.'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  -- Node cap
  IF NEW.nodes IS NOT NULL THEN
    _node_count := jsonb_array_length(NEW.nodes);
    IF _node_count > _cap THEN
      RAISE EXCEPTION 'Plan (%) limited to % nodes per map (attempted %).', _tier, _cap, _node_count
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_map_limits_trg ON public.maps;
CREATE TRIGGER enforce_map_limits_trg
  BEFORE INSERT OR UPDATE ON public.maps
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_map_limits();
