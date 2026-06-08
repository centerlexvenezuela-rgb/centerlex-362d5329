
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS bar_association text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS directory_enabled boolean NOT NULL DEFAULT false;

CREATE OR REPLACE VIEW public.lawyers_directory
WITH (security_invoker = true) AS
SELECT
  p.user_id,
  p.first_name,
  p.last_name,
  p.whatsapp,
  p.bar_association,
  p.city,
  p.state,
  p.photo_url,
  u.email
FROM public.profiles p
JOIN auth.users u ON u.id = p.user_id
WHERE p.directory_enabled = true;

-- Allow anonymous & authenticated read of approved lawyers via the view
CREATE POLICY "Anyone can view approved directory profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (directory_enabled = true);

GRANT SELECT ON public.lawyers_directory TO anon, authenticated;
