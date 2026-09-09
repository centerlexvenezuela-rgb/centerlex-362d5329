DROP VIEW IF EXISTS public.lawyers_directory;

CREATE VIEW public.lawyers_directory
WITH (security_invoker = false) AS
SELECT p.user_id::text AS entry_id,
       'user'::text AS source,
       p.first_name, p.last_name, p.whatsapp, p.bar_association,
       p.job_title, p.specialty, p.city, p.state, p.photo_url
FROM public.profiles p
WHERE p.directory_enabled = true
UNION ALL
SELECT d.id::text AS entry_id,
       'admin'::text AS source,
       d.first_name, d.last_name, d.whatsapp, d.bar_association,
       d.job_title, d.specialty, d.city, d.state, d.photo_url
FROM public.directory_lawyers d
WHERE d.published = true;

GRANT SELECT ON public.lawyers_directory TO anon, authenticated;
GRANT ALL ON public.lawyers_directory TO service_role;