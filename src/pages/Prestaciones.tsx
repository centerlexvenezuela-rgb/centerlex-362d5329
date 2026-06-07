import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Scale, Loader2, Calculator, Printer } from "lucide-react";
import {
  calcularPrestaciones,
  formatBs,
  MOTIVO_LABELS,
  type MotivoTerminacion,
  type PrestacionesResultado,
  type PrestacionesSettings,
  type TasaMensual,
} from "@/lib/prestaciones";
import { toast } from "sonner";

const Prestaciones = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [settings, setSettings] = useState<PrestacionesSettings | null>(null);
  const [tasas, setTasas] = useState<TasaMensual[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [trabajador, setTrabajador] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [salario, setSalario] = useState("");
  const [motivo, setMotivo] = useState<MotivoTerminacion>("despido_injustificado");
  const [eligeIndemnizacion, setEligeIndemnizacion] = useState(true);
  const [anticipos, setAnticipos] = useState("");
  const [resultado, setResultado] = useState<PrestacionesResultado | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [s, t] = await Promise.all([
        supabase.from("prestaciones_settings").select("*").limit(1).maybeSingle(),
        supabase.from("prestaciones_tasas_bcv").select("mes, tasa_anual_porcentaje"),
      ]);
      if (s.data) {
        setSettings({
          dias_por_trimestre: s.data.dias_por_trimestre,
          dias_adicionales_por_anio: s.data.dias_adicionales_por_anio,
          tope_dias_adicionales: s.data.tope_dias_adicionales,
          multiplicador_indemnizacion: Number(s.data.multiplicador_indemnizacion),
          tasa_interes_anual_default: Number(s.data.tasa_interes_anual_default),
          dias_mes_salario: s.data.dias_mes_salario,
        });
      }
      setTasas(
        (t.data ?? []).map((r: any) => ({
          mes: String(r.mes).slice(0, 7),
          tasa_anual_porcentaje: Number(r.tasa_anual_porcentaje),
        })),
      );
      setLoading(false);
    };
    load();
  }, []);

  if (profileLoading || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }
  if (!profile?.prestaciones_enabled) return <Navigate to="/app" replace />;
  if (!settings) {
    return <Card className="p-6">No se pudieron cargar los parámetros.</Card>;
  }

  const onCalcular = () => {
    try {
      if (!fechaInicio || !fechaFin) return toast.error("Indique las fechas");
      const s = parseFloat(salario.replace(",", "."));
      if (!s || s <= 0) return toast.error("Salario inválido");
      const a = anticipos ? parseFloat(anticipos.replace(",", ".")) : 0;
      const r = calcularPrestaciones(
        {
          fecha_inicio: new Date(fechaInicio + "T00:00:00"),
          fecha_fin: new Date(fechaFin + "T00:00:00"),
          salario_mensual_integral: s,
          motivo_terminacion: motivo,
          elige_indemnizacion: eligeIndemnizacion,
          anticipos: a,
          tasas_interes: tasas,
        },
        settings,
      );
      setResultado(r);
    } catch (e: any) {
      toast.error(e.message ?? "Error en el cálculo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="h-7 w-7 text-accent" />
          <h1 className="font-serif text-3xl">Calculadora de Prestaciones Sociales</h1>
        </div>
        <p className="text-muted-foreground">
          Cálculo conforme a la Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT), artículos 142, 143 y 92.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6 shadow-card space-y-4 print:hidden">
          <h2 className="font-serif text-lg flex items-center gap-2">
            <Calculator className="h-5 w-5 text-accent" /> Datos del trabajador
          </h2>

          <div className="space-y-2">
            <Label>Nombre del trabajador (opcional)</Label>
            <Input value={trabajador} onChange={(e) => setTrabajador(e.target.value)} placeholder="Juan Pérez" />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fecha de inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha de terminación</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Último salario mensual integral (Bs.)</Label>
            <Input
              type="number"
              step="0.01"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              placeholder="Ej: 3000.00"
            />
            <p className="text-xs text-muted-foreground">
              Incluya sueldo base + alícuotas de utilidades, bono vacacional y demás percepciones salariales.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Motivo de terminación</Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoTerminacion)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(MOTIVO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {motivo === "despido_injustificado" && (
            <div className="flex items-center justify-between rounded border p-3 bg-muted/30">
              <div>
                <p className="text-sm font-medium">El trabajador elige indemnización (art. 92)</p>
                <p className="text-xs text-muted-foreground">Se duplican las prestaciones sociales.</p>
              </div>
              <Switch checked={eligeIndemnizacion} onCheckedChange={setEligeIndemnizacion} />
            </div>
          )}

          <div className="space-y-2">
            <Label>Anticipos recibidos (Bs., opcional)</Label>
            <Input
              type="number"
              step="0.01"
              value={anticipos}
              onChange={(e) => setAnticipos(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <Button onClick={onCalcular} className="w-full bg-primary hover:bg-primary-glow" size="lg">
            <Calculator className="h-4 w-4 mr-2" /> Calcular
          </Button>
        </Card>

        <Card className="p-6 shadow-card">
          {!resultado ? (
            <div className="h-full flex items-center justify-center text-center text-muted-foreground py-16">
              <div>
                <Scale className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Complete los datos y presione <strong>Calcular</strong> para ver el resultado.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Total a pagar</p>
                  <p className="font-serif text-4xl text-accent">{formatBs(resultado.total_pagar)}</p>
                  {trabajador && <p className="text-sm text-muted-foreground mt-1">Trabajador: {trabajador}</p>}
                </div>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="print:hidden">
                  <Printer className="h-4 w-4 mr-1" /> Imprimir
                </Button>
              </div>

              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">Tiempo de servicio</h3>
                <Row label="Días totales" value={String(resultado.dias_totales)} />
                <Row label="Meses" value={String(resultado.meses)} />
                <Row label="Trimestres" value={String(resultado.trimestres)} />
                <Row label="Años completos" value={String(resultado.anios_completos)} />
              </div>

              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">Capital de antigüedad (art. 142)</h3>
                <Row label="Salario diario integral" value={formatBs(resultado.salario_diario)} />
                <Row label={`Días de antigüedad (${settings.dias_por_trimestre} × ${resultado.trimestres})`} value={String(resultado.dias_antiguedad)} />
                <Row label="Días adicionales" value={String(resultado.dias_adicionales)} />
                <Row label="Total días" value={String(resultado.total_dias)} />
                <Row label="Capital" value={formatBs(resultado.capital)} bold />
              </div>

              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">Intereses (art. 143)</h3>
                <Row label={`Flujos considerados`} value={String(resultado.flujos.length)} />
                <Row label="Intereses acumulados" value={formatBs(resultado.intereses)} bold />
              </div>

              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">Resumen</h3>
                <Row label="Total prestaciones (capital + intereses)" value={formatBs(resultado.total_prestaciones)} />
                <Row label="Indemnización por despido (art. 92)" value={formatBs(resultado.indemnizacion_despido)} />
                {resultado.anticipos > 0 && (
                  <Row label="(−) Anticipos" value={formatBs(resultado.anticipos)} />
                )}
                <div className="border-t pt-2 mt-2">
                  <Row label="TOTAL A PAGAR" value={formatBs(resultado.total_pagar)} bold />
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div className="flex items-baseline justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className={bold ? "font-serif text-base text-foreground font-semibold" : "text-foreground"}>{value}</span>
  </div>
);

export default Prestaciones;
