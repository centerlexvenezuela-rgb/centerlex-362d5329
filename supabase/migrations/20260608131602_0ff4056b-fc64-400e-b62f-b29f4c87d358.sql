
-- 1. Add email to profiles and backfill
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND (p.email IS NULL OR p.email = '');

-- 2. Drop and recreate the view without auth.users, with security_invoker
DROP VIEW IF EXISTS public.lawyers_directory;

CREATE VIEW public.lawyers_directory
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
  p.email
FROM public.profiles p
WHERE p.directory_enabled = true;

GRANT SELECT ON public.lawyers_directory TO anon, authenticated;

-- 3. Column-level grants on profiles so the view (security_invoker) works
--    without exposing sensitive columns to public SELECT *.
GRANT SELECT (user_id, first_name, last_name, whatsapp, bar_association, city, state, photo_url, email, directory_enabled)
  ON public.profiles TO anon, authenticated;

-- 4. RLS policy allowing read of approved directory rows only
CREATE POLICY "Public can read approved directory profiles"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (directory_enabled = true);
