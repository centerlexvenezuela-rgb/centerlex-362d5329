DROP POLICY IF EXISTS "Admins upload branding" ON storage.objects;
DROP POLICY IF EXISTS "Admins update branding" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete branding" ON storage.objects;

CREATE POLICY "Admins upload branding" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update branding" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete branding" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::public.app_role));