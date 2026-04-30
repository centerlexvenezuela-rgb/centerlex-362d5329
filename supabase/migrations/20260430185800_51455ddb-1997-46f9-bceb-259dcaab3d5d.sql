-- Settings table (singleton pattern: one row)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_title text NOT NULL DEFAULT 'Lex Office',
  app_subtitle text NOT NULL DEFAULT 'Servicios Jurídicos',
  meta_description text NOT NULL DEFAULT 'Plataforma de administración para oficinas de servicios jurídicos.',
  meta_author text NOT NULL DEFAULT 'Lex Office',
  og_title text,
  logo_url text,
  favicon_url text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone (even unauthenticated) can read settings — needed to render branding on /auth, /admin/login
CREATE POLICY "anyone can read settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "admins can insert settings" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "admins can update settings" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Seed single row
INSERT INTO public.app_settings (app_title) VALUES ('Lex Office')
ON CONFLICT DO NOTHING;

-- Public bucket for branding assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read branding" ON storage.objects
  FOR SELECT USING (bucket_id = 'branding');

CREATE POLICY "Admins upload branding" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update branding" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete branding" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'branding' AND public.has_role(auth.uid(), 'admin'::app_role));