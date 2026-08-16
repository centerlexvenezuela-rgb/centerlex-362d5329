CREATE TABLE public.directory_lawyers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text,
  last_name text,
  bar_association text,
  city text,
  state text,
  whatsapp text,
  photo_url text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.directory_lawyers TO authenticated;
GRANT ALL ON public.directory_lawyers TO service_role;

ALTER TABLE public.directory_lawyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage directory lawyers"
ON public.directory_lawyers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_directory_lawyers_updated_at
BEFORE UPDATE ON public.directory_lawyers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP VIEW IF EXISTS public.lawyers_directory;

CREATE VIEW public.lawyers_directory AS
SELECT
  p.user_id::text AS entry_id,
  'user'::text AS source,
  p.first_name,
  p.last_name,
  p.whatsapp,
  p.bar_association,
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
  d.city,
  d.state,
  d.photo_url
FROM public.directory_lawyers d
WHERE d.published = true;

GRANT SELECT ON public.lawyers_directory TO anon, authenticated;