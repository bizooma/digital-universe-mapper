-- Refactor "Team members can view other members" policy to use a SECURITY DEFINER
-- helper so it can't recurse into team_members while evaluating team_members RLS.

CREATE OR REPLACE FUNCTION public.is_team_member(_user_id uuid, _team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE user_id = _user_id
      AND team_id = _team_id
  )
$$;

DROP POLICY IF EXISTS "Team members can view other members" ON public.team_members;

CREATE POLICY "Team members can view other members"
ON public.team_members
FOR SELECT
TO authenticated
USING (public.is_team_member(auth.uid(), team_id));