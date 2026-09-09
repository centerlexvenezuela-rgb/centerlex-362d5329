ALTER TABLE public.directory_lawyers ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE UNIQUE INDEX IF NOT EXISTS directory_lawyers_user_id_key ON public.directory_lawyers(user_id) WHERE user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_profile_to_directory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.directory_enabled THEN
    INSERT INTO public.directory_lawyers AS d
      (user_id, first_name, last_name, bar_association, job_title, specialty, city, state, whatsapp, photo_url, published)
    VALUES
      (NEW.user_id, NEW.first_name, NEW.last_name, NEW.bar_association, NEW.job_title, NEW.specialty,
       NEW.city, NEW.state, NEW.whatsapp, NEW.photo_url, true)
    ON CONFLICT (user_id) WHERE user_id IS NOT NULL DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      bar_association = EXCLUDED.bar_association,
      job_title = EXCLUDED.job_title,
      specialty = EXCLUDED.specialty,
      city = EXCLUDED.city,
      state = EXCLUDED.state,
      whatsapp = EXCLUDED.whatsapp,
      photo_url = EXCLUDED.photo_url,
      published = true,
      updated_at = now();
  ELSE
    UPDATE public.directory_lawyers SET published = false, updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_sync_directory ON public.profiles;
CREATE TRIGGER trg_profiles_sync_directory
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_to_directory();

-- Backfill de perfiles ya habilitados
INSERT INTO public.directory_lawyers
  (user_id, first_name, last_name, bar_association, job_title, specialty, city, state, whatsapp, photo_url, published)
SELECT p.user_id, p.first_name, p.last_name, p.bar_association, p.job_title, p.specialty,
       p.city, p.state, p.whatsapp, p.photo_url, true
FROM public.profiles p
WHERE p.directory_enabled = true
  AND NOT EXISTS (SELECT 1 FROM public.directory_lawyers d WHERE d.user_id = p.user_id);

DROP VIEW IF EXISTS public.lawyers_directory;
CREATE VIEW public.lawyers_directory
WITH (security_invoker = true) AS
SELECT d.id::text AS entry_id,
       CASE WHEN d.user_id IS NULL THEN 'admin' ELSE 'user' END AS source,
       d.first_name, d.last_name, d.whatsapp, d.bar_association,
       d.job_title, d.specialty, d.city, d.state, d.photo_url
FROM public.directory_lawyers d
WHERE d.published = true;

GRANT SELECT ON public.lawyers_directory TO anon, authenticated;
GRANT ALL ON public.lawyers_directory TO service_role;