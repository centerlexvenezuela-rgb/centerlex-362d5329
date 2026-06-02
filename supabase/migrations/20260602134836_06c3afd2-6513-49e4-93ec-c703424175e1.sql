-- Per-lawyer Google Drive integration
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS google_email TEXT,
  ADD COLUMN IF NOT EXISTS google_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMPTZ;

-- Allow lawyers to update their own profile (needed so the OAuth callback can store the refresh token via service role,
-- and so the user can disconnect from the client). Service role already bypasses RLS, but we also let users update their own row.
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Documents: store Drive file id, keep content nullable for migrated/new docs (no content in DB)
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS drive_file_id TEXT;

ALTER TABLE public.documents
  ALTER COLUMN content DROP NOT NULL,
  ALTER COLUMN content SET DEFAULT NULL;
