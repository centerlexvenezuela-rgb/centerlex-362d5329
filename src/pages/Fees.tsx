import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Search, Loader2, Scale, Info } from "lucide-react";

interface FeeCategory { id: string; name: string; display_order: number; }
interface FeeItem { id: string; category_id: string; name: string; amount_usd: number; notes: string | null; display_order: number; }
interface FeeTier { id: string; min_amount_usd: number; max_amount_usd: number | null; percentage: number; description: string | null; display_order: number; }

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

const Fees = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [categories, setCategories] = useState<FeeCategory[]>([]);
  const [items, setItems] = useState<FeeItem[]>([]);
  const [tiers, setTiers] = useState<FeeTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [opAmount, setOpAmount] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [c, i, t] = await Promise.all([
        supabase.from("fee_categories").select("*").order("display_order"),
        supabase.from("fee_items").select("*").order("display_order"),
        supabase.from("fee_percentage_tiers").select("*").order("display_order"),
      ]);
      setCategories(c.data ?? []);
      setItems(i.data ?? []);
      setTiers(t.data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const normalized = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filtered = useMemo(() => {
    const q = normalized(query.trim());
    if (!q) return items;
    return items.filter((it) => {
      const cat = categories.find((c) => c.id === it.category_id);
      return (
        normalized(it.name).includes(q) ||
        (cat && normalized(cat.name).includes(q)) ||
        (it.notes && normalized(it.notes).includes(q))
      );
    });
  }, [items, categories, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, FeeItem[]>();
    filtered.forEach((it) => {
      const arr = map.get(it.category_id) ?? [];
      arr.push(it);
      map.set(it.category_id, arr);
    });
    return categories
      .map((c) => ({ category: c, items: map.get(c.id) ?? [] }))
      .filter((g) => g.items.length > 0);
  }, [filtered, categories]);

  const calc = useMemo(() => {
    const v = parseFloat(opAmount.replace(",", "."));
    if (!v || v <= 0 || isNaN(v)) return null;
    const tier = tiers.find(
      (t) => v >= Number(t.min_amount_usd) && (t.max_amount_usd === null || v <= Number(t.max_amount_usd)),
    );
    if (!tier) return { value: v, tier: null, fee: 0 };
    const fee = (v * Number(tier.percentage)) / 100;
    return { value: v, tier, fee };
  }, [opAmount, tiers]);

  if (profileLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!profile?.fees_enabled) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-7 w-7 text-accent" />
          <h1 className="font-serif text-3xl">Honorarios Mínimos</h1>
        </div>
        <p className="text-muted-foreground">
          Tarifas mínimas según el Reglamento Interno de la Federación de Colegios de Abogados de Venezuela.
        </p>
      </div>

      <Tabs defaultValue="search">
        <TabsList>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" /> Buscador de trámites
          </TabsTrigger>
          <TabsTrigger value="calc">
            <Scale className="h-4 w-4 mr-2" /> Calculadora porcentual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4 pt-4">
          <Card className="p-4 shadow-card">
            <Label htmlFor="q" className="text-sm">Buscar trámite, gestión o servicio</Label>
            <div className="relative mt-2">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="q"
                placeholder="Ej: divorcio, poder, RIF, registro mercantil…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filtered.length} resultado(s) {query && `para "${query}"`}
            </p>
          </Card>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-accent" />
            </div>
          ) : grouped.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No se encontraron trámites. Intente con otra palabra clave.
            </Card>
          ) : (
            <div className="space-y-4">
              {grouped.map(({ category, items }) => (
                <Card key={category.id} className="p-5 shadow-card">
                  <h3 className="font-serif text-lg mb-3 text-primary">{category.name}</h3>
                  <ul className="divide-y divide-border">
                    {items.map((it) => (
                      <li key={it.id} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{it.name}</p>
                          {it.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{it.notes}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-base font-serif text-accent font-semibold">
                            {formatUSD(Number(it.amount_usd))}
                          </span>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                            desde
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calc" className="space-y-4 pt-4">
          <Card className="p-6 shadow-card">
            <div className="flex items-start gap-2 mb-4">
              <Info className="h-4 w-4 text-accent mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Para documentos de compraventa, opciones, daciones de pago, contratos con
                garantía hipotecaria o fiduciaria y similares (Art. 4 del Reglamento), los
                honorarios se calculan como un porcentaje sobre el valor de la operación.
              </p>
            </div>
            <Label htmlFor="op">Valor de la operación (USD)</Label>
            <Input
              id="op"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej: 25000"
              value={opAmount}
              onChange={(e) => setOpAmount(e.target.value)}
              className="mt-2"
            />

            {calc && calc.tier && (
              <div className="mt-6 p-5 rounded-lg bg-gradient-hero text-primary-foreground">
                <p className="text-xs uppercase tracking-wider opacity-80">Honorario mínimo sugerido</p>
                <p className="font-serif text-4xl mt-1">{formatUSD(calc.fee)}</p>
                <p className="text-sm mt-3 opacity-90">
                  {calc.tier.percentage}% sobre {formatUSD(calc.value)} — {calc.tier.description}
                </p>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3">Tabla de rangos vigentes</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4">Rango</th>
                      <th className="py-2 text-right">Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tiers.map((t) => (
                      <tr key={t.id}>
                        <td className="py-2 pr-4">
                          {formatUSD(Number(t.min_amount_usd))} —{" "}
                          {t.max_amount_usd ? formatUSD(Number(t.max_amount_usd)) : "en adelante"}
                        </td>
                        <td className="py-2 text-right font-semibold text-accent">{t.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Fees;
