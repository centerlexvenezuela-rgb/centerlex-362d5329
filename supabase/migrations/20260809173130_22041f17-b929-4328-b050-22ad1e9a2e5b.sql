-- Allow lawyers to manage their own directory photo inside branding/lawyer-photos/{user_id}/
CREATE POLICY "Lawyers upload own directory photo"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1] = 'lawyer-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Lawyers update own directory photo"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1] = 'lawyer-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Lawyers delete own directory photo"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'branding'
  AND (storage.foldername(name))[1] = 'lawyer-photos'
  AND (storage.foldername(name))[2] = auth.uid()::text
);