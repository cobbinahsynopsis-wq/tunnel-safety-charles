-- Systems table: one row per subsystem, holds full analysis as JSON
CREATE TABLE public.systems (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Revision snapshots
CREATE TABLE public.system_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id TEXT NOT NULL,
  revision_number INTEGER NOT NULL,
  revision_label TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_by TEXT,
  comments TEXT,
  trigger TEXT NOT NULL DEFAULT 'signoff',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (system_id, revision_number)
);
CREATE INDEX idx_system_revisions_system ON public.system_revisions(system_id, revision_number DESC);

-- Shared app-wide metadata (engineer name, project notes, etc.) — single row keyed 'global'
CREATE TABLE public.app_metadata (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_metadata ENABLE ROW LEVEL SECURITY;

-- Permissive policies (name-gate model, no auth yet)
CREATE POLICY "public read systems" ON public.systems FOR SELECT USING (true);
CREATE POLICY "public write systems" ON public.systems FOR INSERT WITH CHECK (true);
CREATE POLICY "public update systems" ON public.systems FOR UPDATE USING (true);
CREATE POLICY "public delete systems" ON public.systems FOR DELETE USING (true);

CREATE POLICY "public read revisions" ON public.system_revisions FOR SELECT USING (true);
CREATE POLICY "public write revisions" ON public.system_revisions FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete revisions" ON public.system_revisions FOR DELETE USING (true);

CREATE POLICY "public read meta" ON public.app_metadata FOR SELECT USING (true);
CREATE POLICY "public write meta" ON public.app_metadata FOR INSERT WITH CHECK (true);
CREATE POLICY "public update meta" ON public.app_metadata FOR UPDATE USING (true);

-- Realtime
ALTER TABLE public.systems REPLICA IDENTITY FULL;
ALTER TABLE public.system_revisions REPLICA IDENTITY FULL;
ALTER TABLE public.app_metadata REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.systems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_revisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_metadata;