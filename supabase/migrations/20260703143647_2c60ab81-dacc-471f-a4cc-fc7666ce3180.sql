ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS documents_case_event_idx
  ON public.documents(case_id, COALESCE(event_date, created_at) DESC);