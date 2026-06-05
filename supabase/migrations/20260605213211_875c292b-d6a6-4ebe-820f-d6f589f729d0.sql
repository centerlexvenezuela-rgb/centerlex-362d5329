ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'writing',
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS file_name text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint;

ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_kind_check;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_kind_check CHECK (kind IN ('writing','file'));