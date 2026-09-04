-- 1. Remove duplicate/over-broad public SELECT policies on profiles
DROP POLICY IF EXISTS "Public can read approved directory profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view approved directory profiles" ON public.profiles;

-- 2. Public directory is served through a column-limited definer view
ALTER VIEW public.lawyers_directory SET (security_invoker = false);
REVOKE ALL ON public.lawyers_directory FROM anon, authenticated;
GRANT SELECT ON public.lawyers_directory TO anon, authenticated;

-- 3. Restrict direct execution of the SECURITY DEFINER role helper
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;