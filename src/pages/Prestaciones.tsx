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
import { Scale, Loader2, Calculator, Printer, Plus, Trash2, Trophy, Info } from "lucide-react";
import {
  calcularPrestaciones,
  formatBs,
  MOTIVO_LABELS,
  type MotivoTerminacion,
  type PrestacionesResultado,
  type PrestacionesSettings,
  type SalarioPeriodo,
  type TasaMensual,
} from "@/lib/prestaciones";
import { toast } from "sonner";

const Prestaciones = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [settings, setSettings] = useState<PrestacionesSettings | null>(null);
  const [tasas, setTasas] = useState<TasaMensual[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario
  const [trabajador, setTrabajador] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [salarios, setSalarios] = useState<SalarioPeriodo[]>([
    { desde: "", salario_base: 0, otros_bonos: 0 },
  ]);
  const [diasUtilidades, setDiasUtilidades] = useState("30");
  const [diasBVBase, setDiasBVBase] = useState("15");
  const [incrementoBV, setIncrementoBV] = useState("1");
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

  const addSalario = () =>
    setSalarios((xs) => [...xs, { desde: "", salario_base: 0, otros_bonos: 0 }]);
  const removeSalario = (i: number) =>
    setSalarios((xs) => xs.filter((_, k) => k !== i));
  const setSal = (i: number, patch: Partial<SalarioPeriodo>) =>
    setSalarios((xs) => xs.map((s, k) => (k === i ? { ...s, ...patch } : s)));

  const onCalcular = () => {
    try {
      if (!fechaInicio || !fechaFin) return toast.error("Indique las fechas");
      const sals = salarios
        .filter((s) => s.desde && s.salario_base > 0)
        .map((s) => ({
          desde: s.desde,
          salario_base: Number(s.salario_base),
          otros_bonos: Number(s.otros_bonos ?? 0),
        }));
      if (!sals.length) return toast.error("Agregue al menos un salario válido");

      const a = anticipos ? parseFloat(anticipos.replace(",", ".")) : 0;
      const r = calcularPrestaciones(
        {
          fecha_inicio: new Date(fechaInicio + "T00:00:00"),
          fecha_fin: new Date(fechaFin + "T00:00:00"),
          salarios: sals,
          dias_utilidades: parseInt(diasUtilidades) || 30,
          dias_bono_vacacional_base: parseInt(diasBVBase) || 15,
          incremento_bono_vacacional_anual: parseInt(incrementoBV) || 1,
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
          Sistema dual obligatorio conforme al artículo 142 LOTTT. Calcula acumulativo (a+b+intereses)
          y retroactivo (c+b) y aplica la Regla de Oro (literal d).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario */}
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

          <div className="space-y-3 rounded border p-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Salarios (base + bonos permanentes)</Label>
              <Button variant="outline" size="sm" onClick={addSalario}>
                <Plus className="h-4 w-4 mr-1" /> Período
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Añada un período por cada cambio de salario. Los "otros bonos" deben ser pagos continuos
              y permanentes que forman parte del salario.
            </p>
            {salarios.map((s, i) => (
              <div key={i} className="grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto] items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Desde</Label>
                  <Input
                    type="date"
                    value={s.desde}
                    onChange={(e) => setSal(i, { desde: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Salario base (Bs.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={s.salario_base || ""}
                    onChange={(e) => setSal(i, { salario_base: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Otros bonos (Bs.)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={s.otros_bonos || ""}
                    onChange={(e) => setSal(i, { otros_bonos: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSalario(i)}
                  disabled={salarios.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Días utilidades / año</Label>
              <Input
                type="number"
                min={15}
                max={120}
                value={diasUtilidades}
                onChange={(e) => setDiasUtilidades(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Bono vacacional base</Label>
              <Input
                type="number"
                value={diasBVBase}
                onChange={(e) => setDiasBVBase(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Incremento anual del bono vacacional (días)</Label>
              <Input
                type="number"
                value={incrementoBV}
                onChange={(e) => setIncrementoBV(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground leading-snug">
                Días adicionales de bono vacacional que se suman por cada año de
                antigüedad después del primero (art. 192 LOTTT: mínimo 1 día/año,
                tope 30). Ej.: base 15 + 1 día/año ⇒ 2º año = 16, 3º = 17…
              </p>
            </div>
          </div>

          {/* Tasas BCV editables por el abogado */}
          <div className="space-y-3 rounded border p-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <Label className="text-sm font-semibold">
                  Tasas de interés BCV (art. 143)
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Tasa anual promedio activa-pasiva publicada por el BCV para cada
                  mes del período. Si un mes no está registrado, se aplica la tasa
                  por defecto ({settings.tasa_interes_anual_default}%).
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setTasas((xs) => [{ mes: "", tasa_anual_porcentaje: 0 }, ...xs])
                }
              >
                <Plus className="h-4 w-4 mr-1" /> Tasa mensual
              </Button>
            </div>
            {tasas.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No hay tasas cargadas. Añada al menos una para el período.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2">
                {tasas.map((t, i) => (
                  <div
                    key={i}
                    className="grid gap-2 md:grid-cols-[1fr_1fr_auto] items-end"
                  >
                    <div className="space-y-1">
                      <Label className="text-xs">Mes</Label>
                      <Input
                        type="month"
                        value={t.mes}
                        onChange={(e) =>
                          setTasas((xs) =>
                            xs.map((x, k) =>
                              k === i ? { ...x, mes: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tasa anual (%)</Label>
                      <Input
                        type="number"
                        step="0.001"
                        value={t.tasa_anual_porcentaje || ""}
                        onChange={(e) =>
                          setTasas((xs) =>
                            xs.map((x, k) =>
                              k === i
                                ? {
                                    ...x,
                                    tasa_anual_porcentaje:
                                      parseFloat(e.target.value) || 0,
                                  }
                                : x,
                            ),
                          )
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setTasas((xs) => xs.filter((_, k) => k !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
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
                <p className="text-sm font-medium">Indemnización art. 92 (doblete)</p>
                <p className="text-xs text-muted-foreground">
                  El patrono paga el doble de las prestaciones sociales.
                </p>
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

        {/* Resultado */}
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

              {/* Regla de Oro */}
              <div className="rounded-lg border-2 border-accent/50 bg-accent/5 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-accent" />
                  <h3 className="font-serif text-base">Regla de Oro (art. 142 lit. d)</h3>
                </div>
                <p className="text-sm">
                  Sistema más favorable al trabajador:{" "}
                  <strong className="text-accent uppercase">
                    {resultado.sistema_favorable === "acumulativo"
                      ? "Acumulativo (a + b + intereses)"
                      : "Retroactivo (c + b)"}
                  </strong>
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                  <div className={`rounded border p-2 ${resultado.sistema_favorable === "acumulativo" ? "border-accent bg-accent/10" : ""}`}>
                    <p className="text-xs text-muted-foreground">Acumulativo</p>
                    <p className="font-semibold">{formatBs(resultado.acumulativo.total)}</p>
                  </div>
                  <div className={`rounded border p-2 ${resultado.sistema_favorable === "retroactivo" ? "border-accent bg-accent/10" : ""}`}>
                    <p className="text-xs text-muted-foreground">Retroactivo</p>
                    <p className="font-semibold">{formatBs(resultado.retroactivo.total)}</p>
                  </div>
                </div>
              </div>

              {/* Antigüedad y último salario */}
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">Antigüedad y último salario integral</h3>
                <Row label="Días totales de servicio" value={String(resultado.dias_totales)} />
                <Row label="Años completos" value={String(resultado.anios_completos)} />
                <Row label="Último salario base" value={formatBs(resultado.ultimo_salario_base)} />
                {resultado.ultimo_otros_bonos > 0 && (
                  <Row label="Otros bonos permanentes" value={formatBs(resultado.ultimo_otros_bonos)} />
                )}
                <Row label="Días bono vacacional (último año)" value={String(resultado.ultimo_dias_bono_vacacional)} />
                <Row label="Salario integral diario" value={formatBs(resultado.ultimo_salario_integral_diario)} />
                <Row label="Salario integral mensual" value={formatBs(resultado.ultimo_salario_integral_mensual)} bold />
              </div>

              {/* Sistema Acumulativo */}
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">
                  Sistema Acumulativo (literales a + b + intereses)
                </h3>
                <Row
                  label={`Literal a — ${resultado.acumulativo.trimestres.length} trimestres × ${settings.dias_por_trimestre} días`}
                  value={formatBs(resultado.acumulativo.total_literal_a)}
                />
                <Row
                  label={`Literal b — ${resultado.acumulativo.dias_adicionales} días adicionales`}
                  value={formatBs(resultado.acumulativo.literal_b)}
                />
                <Row
                  label="Intereses (art. 143, capitalización mensual BCV)"
                  value={formatBs(resultado.acumulativo.intereses)}
                />
                <div className="border-t pt-2 mt-2">
                  <Row label="Total Acumulativo" value={formatBs(resultado.acumulativo.total)} bold />
                </div>
                {resultado.acumulativo.trimestres.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-accent">
                      Ver desglose por trimestre
                    </summary>
                    <div className="mt-2 max-h-64 overflow-auto text-xs">
                      <table className="w-full">
                        <thead className="text-left text-muted-foreground">
                          <tr>
                            <th className="pr-2">#</th>
                            <th className="pr-2">Cierra</th>
                            <th className="pr-2">Sal. integral/día</th>
                            <th className="text-right">Aporte</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.acumulativo.trimestres.map((t) => (
                            <tr key={t.n} className="border-t">
                              <td className="pr-2 py-1">{t.n}</td>
                              <td className="pr-2 py-1">{t.hasta.toLocaleDateString("es-VE")}</td>
                              <td className="pr-2 py-1">{formatBs(t.salario_integral_diario)}</td>
                              <td className="text-right py-1">{formatBs(t.aporte)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>

              {/* Sistema Retroactivo */}
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">
                  Sistema Retroactivo (literal c + b)
                </h3>
                <Row label="Años completos" value={String(resultado.retroactivo.anios_completos)} />
                <Row
                  label={`Fracción (${resultado.retroactivo.fraccion_meses} meses)`}
                  value={resultado.retroactivo.computa_fraccion ? "computa (≥6 meses)" : "no computa"}
                />
                <Row label="Años computados" value={String(resultado.retroactivo.anios_computados)} />
                <Row
                  label={`Literal c — ${resultado.retroactivo.dias_literal_c} días × último sal. integral`}
                  value={formatBs(resultado.retroactivo.literal_c)}
                />
                <Row
                  label={`Literal b — ${resultado.retroactivo.dias_adicionales} días adicionales`}
                  value={formatBs(resultado.retroactivo.literal_b)}
                />
                <div className="border-t pt-2 mt-2">
                  <Row label="Total Retroactivo" value={formatBs(resultado.retroactivo.total)} bold />
                </div>
              </div>

              {/* Liquidación */}
              <div className="rounded-lg border p-4 space-y-2 text-sm">
                <h3 className="font-serif text-base mb-2">Liquidación</h3>
                <Row label="Prestaciones (sistema favorable)" value={formatBs(resultado.monto_favorable)} />
                {resultado.indemnizacion_despido > 0 && (
                  <Row
                    label="Indemnización art. 92 (doblete)"
                    value={formatBs(resultado.indemnizacion_despido)}
                  />
                )}
                {resultado.anticipos > 0 && (
                  <Row label="(−) Anticipos" value={formatBs(resultado.anticipos)} />
                )}
                <div className="border-t pt-2 mt-2">
                  <Row label="TOTAL A PAGAR" value={formatBs(resultado.total_pagar)} bold />
                </div>
              </div>

              <div className="rounded border border-muted p-3 text-xs text-muted-foreground flex gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Cálculo estimado conforme al art. 142 LOTTT. Debe ser verificado por un profesional.
                  El pago debe realizarse dentro de los 5 días siguientes a la terminación
                  (art. 142 lit. f); su incumplimiento genera intereses de mora a la tasa activa BCV.
                </span>
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
