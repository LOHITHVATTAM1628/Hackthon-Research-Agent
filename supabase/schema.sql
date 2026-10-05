-- ==============================================================================
-- MULTI-AGENT RESEARCH SYSTEM: SUPABASE DATABASE INITIALIZATION SCHEMA
-- Full schema for Phase 1 (Auth & Users) and Phase 2 (Research Pipeline & Realtime)
-- ==============================================================================

-- 1. Create public.users table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'researcher' CHECK (role IN ('researcher', 'admin')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Research Projects Table
CREATE TABLE IF NOT EXISTS public.research_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'researching', 'completed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.research_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.research_projects(status);
ALTER TABLE public.research_projects ENABLE ROW LEVEL SECURITY;

-- 3. Research Runs Table
CREATE TABLE IF NOT EXISTS public.research_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_runs_project ON public.research_runs(research_project_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON public.research_runs(status);
ALTER TABLE public.research_runs ENABLE ROW LEVEL SECURITY;

-- 4. Sources Table
CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    source_type TEXT DEFAULT 'webpage',
    published_date TEXT,
    relevance_score FLOAT DEFAULT 0.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sources_run ON public.sources(research_run_id);
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

-- 5. Agent Logs Table (Supports Supabase Realtime)
CREATE TABLE IF NOT EXISTS public.agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_run ON public.agent_logs(research_run_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON public.agent_logs(timestamp);
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- 6. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    research_project_id UUID NOT NULL REFERENCES public.research_projects(id) ON DELETE CASCADE,
    research_run_id UUID NOT NULL REFERENCES public.research_runs(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_project ON public.reports(research_project_id);
CREATE INDEX IF NOT EXISTS idx_reports_run ON public.reports(research_run_id);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 7. Realtime Replication Enablement
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_logs;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.research_runs;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sources;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 8. Row Level Security Policies
-- Users RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'admin')
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Service role bypass users" ON public.users;
CREATE POLICY "Service role bypass users" ON public.users FOR ALL USING (auth.jwt() ->> 'role' = 'service_role') WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Research Projects RLS
DROP POLICY IF EXISTS "Users can manage their own projects" ON public.research_projects;
CREATE POLICY "Users can manage their own projects" ON public.research_projects FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Admins can view all projects" ON public.research_projects;
CREATE POLICY "Admins can view all projects" ON public.research_projects FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE public.users.id = auth.uid() AND public.users.role = 'admin')
);

-- Research Runs RLS
DROP POLICY IF EXISTS "Users can view runs of their projects" ON public.research_runs;
CREATE POLICY "Users can view runs of their projects" ON public.research_runs FOR ALL USING (true);

-- Sources RLS
DROP POLICY IF EXISTS "Users can view sources" ON public.sources;
CREATE POLICY "Users can view sources" ON public.sources FOR ALL USING (true);

-- Agent Logs RLS
DROP POLICY IF EXISTS "Users can view logs" ON public.agent_logs;
CREATE POLICY "Users can view logs" ON public.agent_logs FOR ALL USING (true);

-- Reports RLS
DROP POLICY IF EXISTS "Users can view reports" ON public.reports;
CREATE POLICY "Users can view reports" ON public.reports FOR ALL USING (true);

-- 9. Trigger Function to auto-sync new registered users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT;
    v_name TEXT;
BEGIN
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'researcher');
    IF v_role NOT IN ('researcher', 'admin') THEN
        v_role := 'researcher';
    END IF;

    v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

    INSERT INTO public.users (id, name, email, role, created_at, updated_at)
    VALUES (
        NEW.id,
        v_name,
        NEW.email,
        v_role,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
