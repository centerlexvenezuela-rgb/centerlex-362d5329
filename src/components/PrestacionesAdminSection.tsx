import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Save, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Settings {
  id: string;
  dias_por_trimestre: number;
  dias_adicionales_por_anio: number;
  tope_dias_adicionales: number;
  multiplicador_indemnizacion: number;
  tasa_interes_anual_default: number;
  dias_mes_salario: number;
}

interface Tasa {
  id: string;
  mes: string; // YYYY-MM-DD
  tasa_anual_porcentaje: number;
}

export const PrestacionesAdminSection = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [tasas, setTasas] = useState<Tasa[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTasa, setNewTasa] = useState({ mes: "", tasa: "" });

  const load = async () => {
    setLoading(true);
    const [s, t] = await Promise.all([
      supabase.from("prestaciones_settings").select("*").limit(1).maybeSingle(),
      supabase.from("prestaciones_tasas_bcv").select("*").order("mes", { ascending: false }),
    ]);
    setSettings((s.data as any) ?? null);
    setTasas((t.data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("prestaciones_settings")
      .update({
        dias_por_trimestre: settings.dias_por_trimestre,
        dias_adicionales_por_anio: settings.dias_adicionales_por_anio,
        tope_dias_adicionales: settings.tope_dias_adicionales,
        multiplicador_indemnizacion: settings.multiplicador_indemnizacion,
        tasa_interes_anual_default: settings.tasa_interes_anual_default,
        dias_mes_salario: settings.dias_mes_salario,
      })
      .eq("id", settings.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Parámetros guardados");
  };

  const addTasa = async () => {
    if (!newTasa.mes || !newTasa.tasa) return toast.error("Mes y tasa requeridos");
    const mesISO = `${newTasa.mes}-01`;
    const tasaNum = parseFloat(newTasa.tasa.replace(",", "."));
    if (isNaN(tasaNum)) return toast.error("Tasa inválida");
    const { error } = await supabase.from("prestaciones_tasas_bcv").insert({
      mes: mesISO,
      tasa_anual_porcentaje: tasaNum,
    });
    if (error) return toast.error(error.message);
    toast.success("Tasa agregada");
    setNewTasa({ mes: "", tasa: "" });
    load();
  };

  const deleteTasa = async (id: string) => {
    const { error } = await supabase.from("prestaciones_tasas_bcv").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Tasa eliminada");
    load();
  };

  if (loading || !settings) {
    return (
      <Card className="p-6 shadow-elegant">
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      </Card>
    );
  }

  const set = (patch: Partial<Settings>) =>
    setSettings((s) => (s ? { ...s, ...patch } : s));

  return (
    <Card className="p-6 shadow-elegant">
      <div className="flex items-center gap-2 mb-4">
        <Scale className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-xl">Parámetros de Prestaciones Sociales (LOTTT)</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Días por trimestre (art. 142)</Label>
          <Input
            type="number"
            value={settings.dias_por_trimestre}
            onChange={(e) => set({ dias_por_trimestre: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Días adicionales por año</Label>
          <Input
            type="number"
            value={settings.dias_adicionales_por_anio}
            onChange={(e) => set({ dias_adicionales_por_anio: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tope de días adicionales</Label>
          <Input
            type="number"
            value={settings.tope_dias_adicionales}
            onChange={(e) => set({ tope_dias_adicionales: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Multiplicador indemnización (art. 92)</Label>
          <Input
            type="number"
            step="0.01"
            value={settings.multiplicador_indemnizacion}
            onChange={(e) => set({ multiplicador_indemnizacion: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Tasa interés anual por defecto (%)</Label>
          <Input
            type="number"
            step="0.001"
            value={settings.tasa_interes_anual_default}
            onChange={(e) => set({ tasa_interes_anual_default: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Días por mes (salario diario)</Label>
          <Input
            type="number"
            value={settings.dias_mes_salario}
            onChange={(e) => set({ dias_mes_salario: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      <Button onClick={saveSettings} disabled={saving} className="mt-4 bg-primary hover:bg-primary-glow">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Guardar parámetros</>}
      </Button>

      <div className="mt-8">
        <h3 className="font-serif text-lg mb-3">Tasas BCV mensuales</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Promedio activa-pasiva publicado por el BCV. Si no hay tasa para un mes, se aplica la tasa por defecto.
        </p>

        <div className="grid gap-2 md:grid-cols-[200px_200px_auto] items-end p-3 rounded border bg-muted/30 mb-4">
          <div>
            <Label className="text-xs">Mes</Label>
            <Input
              type="month"
              value={newTasa.mes}
              onChange={(e) => setNewTasa({ ...newTasa, mes: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs">Tasa anual (%)</Label>
            <Input
              type="number"
              step="0.001"
              value={newTasa.tasa}
              onChange={(e) => setNewTasa({ ...newTasa, tasa: e.target.value })}
              placeholder="18.5"
            />
          </div>
          <Button onClick={addTasa} className="bg-primary hover:bg-primary-glow">
            <Plus className="h-4 w-4 mr-1" /> Agregar
          </Button>
        </div>

        {tasas.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no hay tasas registradas. Se usará la tasa por defecto.
          </p>
        ) : (
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3">Mes</th>
                  <th className="py-2 pr-3">Tasa anual</th>
                  <th className="py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tasas.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 pr-3">
                      {new Date(t.mes).toLocaleDateString("es-VE", { year: "numeric", month: "long" })}
                    </td>
                    <td className="py-2 pr-3">{Number(t.tasa_anual_porcentaje).toFixed(3)}%</td>
                    <td className="py-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => deleteTasa(t.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
};
