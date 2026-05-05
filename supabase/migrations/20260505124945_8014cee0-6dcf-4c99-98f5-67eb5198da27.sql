
-- Permiso por abogado
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fees_enabled boolean NOT NULL DEFAULT false;

-- Categorías
CREATE TABLE public.fee_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can read fee categories"
  ON public.fee_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage fee categories insert"
  ON public.fee_categories FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage fee categories update"
  ON public.fee_categories FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage fee categories delete"
  ON public.fee_categories FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER fee_categories_updated_at
  BEFORE UPDATE ON public.fee_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Servicios
CREATE TABLE public.fee_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  amount_usd numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_fee_items_category ON public.fee_items(category_id);

ALTER TABLE public.fee_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can read fee items"
  ON public.fee_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage fee items insert"
  ON public.fee_items FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage fee items update"
  ON public.fee_items FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage fee items delete"
  ON public.fee_items FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER fee_items_updated_at
  BEFORE UPDATE ON public.fee_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Rangos porcentuales
CREATE TABLE public.fee_percentage_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  min_amount_usd numeric(12,2) NOT NULL,
  max_amount_usd numeric(12,2),
  percentage numeric(5,2) NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fee_percentage_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone authenticated can read fee tiers"
  ON public.fee_percentage_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage fee tiers insert"
  ON public.fee_percentage_tiers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage fee tiers update"
  ON public.fee_percentage_tiers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage fee tiers delete"
  ON public.fee_percentage_tiers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER fee_tiers_updated_at
  BEFORE UPDATE ON public.fee_percentage_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Datos iniciales: rangos porcentuales del reglamento vigente
INSERT INTO public.fee_percentage_tiers (min_amount_usd, max_amount_usd, percentage, description, display_order) VALUES
  (1, 1000, 10, 'Operaciones desde 1$ hasta 1.000$', 1),
  (1001, 10000, 11, 'Operaciones desde 1.001$ hasta 10.000$', 2),
  (10001, 20000, 12, 'Operaciones desde 10.001$ hasta 20.000$', 3),
  (20001, 30000, 13, 'Operaciones desde 20.001$ hasta 30.000$', 4),
  (30001, 40000, 14, 'Operaciones desde 30.001$ hasta 40.000$', 5),
  (40001, NULL, 15, 'Operaciones desde 40.001$ en adelante', 6);
