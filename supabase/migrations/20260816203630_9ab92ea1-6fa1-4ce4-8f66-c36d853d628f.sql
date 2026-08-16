ALTER VIEW public.lawyers_directory SET (security_invoker = true);

GRANT SELECT (user_id, first_name, last_name, whatsapp, bar_association, city, state, photo_url, directory_enabled, account_active)
ON public.profiles TO anon, authenticated;

CREATE POLICY "Public can view approved directory profiles"
ON public.profiles FOR SELECT TO anon, authenticated
USING (directory_enabled = true AND account_active = true);

GRANT SELECT ON public.directory_lawyers TO anon;

CREATE POLICY "Public can view published directory lawyers"
ON public.directory_lawyers FOR SELECT TO anon, authenticated
USING (published = true);