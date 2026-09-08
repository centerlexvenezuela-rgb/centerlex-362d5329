CREATE TABLE public.directory_specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.directory_specialties TO authenticated;
GRANT SELECT ON public.directory_specialties TO anon;
GRANT ALL ON public.directory_specialties TO service_role;

ALTER TABLE public.directory_specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view specialties"
ON public.directory_specialties FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins can manage specialties"
ON public.directory_specialties FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER directory_specialties_updated_at
BEFORE UPDATE ON public.directory_specialties
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE public.directory_lawyers ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.directory_lawyers ADD COLUMN IF NOT EXISTS specialty text;

GRANT SELECT (job_title, specialty) ON public.profiles TO anon, authenticated;

DROP VIEW IF EXISTS public.lawyers_directory;

CREATE VIEW public.lawyers_directory AS
SELECT
  p.user_id::text AS entry_id,
  'user'::text AS source,
  p.first_name,
  p.last_name,
  p.whatsapp,
  p.bar_association,
  p.job_title,
  p.specialty,
  p.city,
  p.state,
  p.photo_url
FROM public.profiles p
WHERE p.directory_enabled = true AND p.account_active = true
UNION ALL
SELECT
  d.id::text AS entry_id,
  'admin'::text AS source,
  d.first_name,
  d.last_name,
  d.whatsapp,
  d.bar_association,
  d.job_title,
  d.specialty,
  d.city,
  d.state,
  d.photo_url
FROM public.directory_lawyers d
WHERE d.published = true;

ALTER VIEW public.lawyers_directory SET (security_invoker = true);

GRANT SELECT ON public.lawyers_directory TO anon, authenticated;

INSERT INTO public.directory_specialties (name, display_order) VALUES
  ('Derecho Civil', 1),
  ('Derecho Penal', 2),
  ('Derecho Laboral', 3),
  ('Derecho Mercantil', 4),
  ('Derecho Administrativo', 5),
  ('Derecho de Familia', 6),
  ('Derecho Tributario', 7),
  ('Derecho Inmobiliario', 8)
ON CONFLICT (name) DO NOTHING;