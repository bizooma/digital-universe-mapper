-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Team',
  owner_id UUID NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- Create team_invitations table
CREATE TABLE public.team_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL,
  token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (team_id, email, status)
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Team owners can view their teams"
ON public.teams FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.team_members
  WHERE team_members.team_id = teams.id
  AND team_members.user_id = auth.uid()
));

CREATE POLICY "Users can create teams"
ON public.teams FOR INSERT
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update their teams"
ON public.teams FOR UPDATE
USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams"
ON public.teams FOR DELETE
USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Team owners can manage members"
ON public.team_members FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.teams
  WHERE teams.id = team_members.team_id
  AND teams.owner_id = auth.uid()
));

CREATE POLICY "Team members can view other members"
ON public.team_members FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.team_members AS tm
  WHERE tm.team_id = team_members.team_id
  AND tm.user_id = auth.uid()
));

-- Team invitations policies
CREATE POLICY "Team owners can manage invitations"
ON public.team_invitations FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.teams
  WHERE teams.id = team_invitations.team_id
  AND teams.owner_id = auth.uid()
));

CREATE POLICY "Invited users can view their invitations"
ON public.team_invitations FOR SELECT
USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_team_invitations_token ON public.team_invitations(token);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);