
-- 1) Toggle por abogado
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS prestaciones_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2) Parámetros globales (singleton)
CREATE TABLE public.prestaciones_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dias_por_trimestre INTEGER NOT NULL DEFAULT 15,
  dias_adicionales_por_anio INTEGER NOT NULL DEFAULT 2,
  tope_dias_adicionales INTEGER NOT NULL DEFAULT 30,
  multiplicador_indemnizacion NUMERIC(6,3) NOT NULL DEFAULT 2,
  tasa_interes_anual_default NUMERIC(6,3) NOT NULL DEFAULT 18.000,
  dias_mes_salario INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prestaciones_settings TO authenticated;
GRANT ALL ON public.prestaciones_settings TO service_role;

ALTER TABLE public.prestaciones_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read prestaciones settings"
  ON public.prestaciones_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage prestaciones settings"
  ON public.prestaciones_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER prestaciones_settings_set_updated_at
  BEFORE UPDATE ON public.prestaciones_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.prestaciones_settings DEFAULT VALUES;

-- 3) Histórico mensual de tasas BCV
CREATE TABLE public.prestaciones_tasas_bcv (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes DATE NOT NULL UNIQUE,
  tasa_anual_porcentaje NUMERIC(6,3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.prestaciones_tasas_bcv TO authenticated;
GRANT ALL ON public.prestaciones_tasas_bcv TO service_role;

ALTER TABLE public.prestaciones_tasas_bcv ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read tasas bcv"
  ON public.prestaciones_tasas_bcv FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins manage tasas bcv"
  ON public.prestaciones_tasas_bcv FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER prestaciones_tasas_set_updated_at
  BEFORE UPDATE ON public.prestaciones_tasas_bcv
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
