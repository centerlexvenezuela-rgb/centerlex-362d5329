import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Calculator, Printer, RotateCcw, Receipt, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

// ============================================================================
// Cálculo ISLR (SENIAT - Personas Naturales / Jurídicas)
// ============================================================================

type Regimen = "natural" | "juridica";
type TipoContribuyente = "dependencia" | "profesional" | "comercial";
type Desgravamen = "unico" | "detallado";

interface Deducciones {
  sueldos: number;
  alquiler: number;
  intereses: number;
  publicidad: number;
  reparaciones: number;
  otros: number;
}

interface DesgravamenDetallado {
  educacion: number;
  seguros: number;
  medicos: number;
  interesesVivienda: number;
  alquilerVivienda: number;
}

interface IslrInput {
  UT: number;
  regimen: Regimen;
  tipo: TipoContribuyente;
  ingresosBrutos: number;
  ingresosExentos: number;
  deducciones: Deducciones;
  donaciones: number;
  otrosGastos: number;
  desgravamen: Desgravamen;
  desgravamenDetallado: DesgravamenDetallado;
  cargasFamiliares: number;
  retenciones: number;
  anticipos: number;
}

interface IslrResultado {
  ingresosNetos: number;
  totalDeducciones: number;
  rentaBruta: number;
  limiteDonacionesBs: number;
  donacionesAplicadas: number;
  rentaNeta: number;
  desgravamenAplicado: number;
  baseImponible: number;
  baseImponibleUT: number;
  impuestoBrutoUT: number;
  impuestoBruto: number;
  rebajasUT: number;
  rebajasBs: number;
  impuestoConRebajas: number;
  impuestoFinal: number;
  saldoAFavor: number;
  obligadoDeclarar: boolean;
  avisos: string[];
}

const bs = (n: number) =>
  new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

const num = (v: string) => {
  const n = parseFloat((v || "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

function aplicarTarifa(baseUT: number): number {
  if (baseUT <= 0) return 0;
  if (baseUT <= 1000) return baseUT * 0.06;
  if (baseUT <= 1500) return baseUT * 0.09 - 30;
  if (baseUT <= 2000) return baseUT * 0.12 - 75;
  if (baseUT <= 2500) return baseUT * 0.16 - 155;
  if (baseUT <= 3000) return baseUT * 0.20 - 255;
  if (baseUT <= 4000) return baseUT * 0.24 - 375;
  if (baseUT <= 6000) return baseUT * 0.29 - 575;
  return baseUT * 0.34 - 875;
}

function calcularLimiteDonacionesUT(rentaBrutaUT: number): number {
  if (rentaBrutaUT <= 10000) return rentaBrutaUT * 0.10;
  return 10000 * 0.10 + (rentaBrutaUT - 10000) * 0.08;
}

function calcularIslr(input: IslrInput): IslrResultado {
  const avisos: string[] = [];
  const UT = input.UT;
  const ingresosNetos = Math.max(0, input.ingresosBrutos - input.ingresosExentos);

  const dedSum =
    input.deducciones.sueldos +
    input.deducciones.alquiler +
    input.deducciones.intereses +
    input.deducciones.publicidad +
    input.deducciones.reparaciones +
    input.deducciones.otros +
    input.otrosGastos;

  let totalDeducciones = dedSum;
  if (totalDeducciones > ingresosNetos) {
    avisos.push("Las deducciones exceden el 100% de la renta bruta. Se ajustan al máximo permitido.");
    totalDeducciones = ingresosNetos;
  }

  const rentaBruta = Math.max(0, ingresosNetos - totalDeducciones);
  const rentaBrutaUT = UT > 0 ? rentaBruta / UT : 0;

  const limiteDonUT = calcularLimiteDonacionesUT(rentaBrutaUT);
  const limiteDonBs = limiteDonUT * UT;
  const donacionesAplicadas = Math.min(input.donaciones, limiteDonBs);
  if (input.donaciones > limiteDonBs && input.donaciones > 0) {
    avisos.push(`Las donaciones exceden el límite legal (${bs(limiteDonBs)}). Se aplicó el máximo.`);
  }

  const rentaNeta = Math.max(0, rentaBruta - donacionesAplicadas);

  let desgravamenAplicado = 0;
  if (input.regimen === "natural") {
    if (input.desgravamen === "unico") {
      desgravamenAplicado = 774 * UT;
    } else {
      const d = input.desgravamenDetallado;
      const intVivMax = 1000 * UT;
      const alqVivMax = 800 * UT;
      const intVivienda = Math.min(d.interesesVivienda, intVivMax);
      const alqVivienda = Math.min(d.alquilerVivienda, alqVivMax);
      if (d.interesesVivienda > intVivMax)
        avisos.push(`Intereses de vivienda topados a 1.000 UT (${bs(intVivMax)}).`);
      if (d.alquilerVivienda > alqVivMax)
        avisos.push(`Alquiler de vivienda topado a 800 UT (${bs(alqVivMax)}).`);
      desgravamenAplicado = d.educacion + d.seguros + d.medicos + intVivienda + alqVivienda;
    }
  }

  const baseImponible = Math.max(0, rentaNeta - desgravamenAplicado);
  const baseImponibleUT = UT > 0 ? baseImponible / UT : 0;

  const impuestoBrutoUT = aplicarTarifa(baseImponibleUT);
  const impuestoBruto = Math.max(0, impuestoBrutoUT * UT);

  const rebajasUT = input.regimen === "natural" ? (1 + input.cargasFamiliares) * 10 : 0;
  const rebajasBs = rebajasUT * UT;

  const impuestoConRebajas = Math.max(0, impuestoBruto - rebajasBs);
  const bruto = impuestoConRebajas - input.retenciones - input.anticipos;
  const impuestoFinal = bruto > 0 ? bruto : 0;
  const saldoAFavor = bruto < 0 ? Math.abs(bruto) : 0;

  const ingresosBrutosUT = UT > 0 ? input.ingresosBrutos / UT : 0;
  const rentaNetaUT = UT > 0 ? rentaNeta / UT : 0;
  const obligadoDeclarar =
    input.regimen === "juridica"
      ? true
      : ingresosBrutosUT > 1500 || rentaNetaUT > 1000;

  return {
    ingresosNetos,
    totalDeducciones,
    rentaBruta,
    limiteDonacionesBs: limiteDonBs,
    donacionesAplicadas,
    rentaNeta,
    desgravamenAplicado,
    baseImponible,
    baseImponibleUT,
    impuestoBrutoUT,
    impuestoBruto,
    rebajasUT,
    rebajasBs,
    impuestoConRebajas,
    impuestoFinal,
    saldoAFavor,
    obligadoDeclarar,
    avisos,
  };
}

// ============================================================================
// Componente
// ============================================================================

const Islr = () => {
  const { profile, loading: profileLoading } = useProfile();

  const yearNow = new Date().getFullYear();
  const [anio, setAnio] = useState<string>(String(yearNow));
  const [regimen, setRegimen] = useState<Regimen>("natural");
  const [tipo, setTipo] = useState<TipoContribuyente>("dependencia");
  const [ut, setUt] = useState<string>("");

  const [ingresosBrutos, setIngresosBrutos] = useState("");
  const [ingresosExentos, setIngresosExentos] = useState("");

  const [dSueldos, setDSueldos] = useState("");
  const [dAlquiler, setDAlquiler] = useState("");
  const [dIntereses, setDIntereses] = useState("");
  const [dPublicidad, setDPublicidad] = useState("");
  const [dReparaciones, setDReparaciones] = useState("");
  const [dOtros, setDOtros] = useState("");
  const [dOtrosGastos, setDOtrosGastos] = useState("");
  const [donaciones, setDonaciones] = useState("");

  const [desgravamen, setDesgravamen] = useState<Desgravamen>("unico");
  const [dgEducacion, setDgEducacion] = useState("");
  const [dgSeguros, setDgSeguros] = useState("");
  const [dgMedicos, setDgMedicos] = useState("");
  const [dgIntVivienda, setDgIntVivienda] = useState("");
  const [dgAlqVivienda, setDgAlqVivienda] = useState("");

  const [cargas, setCargas] = useState("0");

  const [retenciones, setRetenciones] = useState("");
  const [anticipos, setAnticipos] = useState("");

  const [resultado, setResultado] = useState<IslrResultado | null>(null);

  const puedeCalcular = useMemo(() => num(ut) > 0 && num(ingresosBrutos) > 0, [ut, ingresosBrutos]);

  if (profileLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }
  if (!profile?.islr_enabled) return <Navigate to="/app" replace />;

  const limpiar = () => {
    setAnio(String(yearNow));
    setRegimen("natural");
    setTipo("dependencia");
    setUt("");
    setIngresosBrutos("");
    setIngresosExentos("");
    setDSueldos(""); setDAlquiler(""); setDIntereses(""); setDPublicidad("");
    setDReparaciones(""); setDOtros(""); setDOtrosGastos("");
    setDonaciones("");
    setDesgravamen("unico");
    setDgEducacion(""); setDgSeguros(""); setDgMedicos("");
    setDgIntVivienda(""); setDgAlqVivienda("");
    setCargas("0");
    setRetenciones(""); setAnticipos("");
    setResultado(null);
  };

  const onCalcular = () => {
    const UT = num(ut);
    if (UT <= 0) return toast.error("Indique el valor de la Unidad Tributaria (UT).");
    const anioN = parseInt(anio, 10);
    if (!anioN || anioN < 2000 || anioN > 2100) return toast.error("Año fiscal no válido.");
    const ib = num(ingresosBrutos);
    if (ib < 0) return toast.error("Los ingresos no pueden ser negativos.");
    const cargasN = Math.min(5, Math.max(0, parseInt(cargas, 10) || 0));

    const r = calcularIslr({
      UT,
      regimen,
      tipo,
      ingresosBrutos: ib,
      ingresosExentos: num(ingresosExentos),
      deducciones: {
        sueldos: num(dSueldos),
        alquiler: num(dAlquiler),
        intereses: num(dIntereses),
        publicidad: num(dPublicidad),
        reparaciones: num(dReparaciones),
        otros: num(dOtros),
      },
      donaciones: num(donaciones),
      otrosGastos: num(dOtrosGastos),
      desgravamen,
      desgravamenDetallado: {
        educacion: num(dgEducacion),
        seguros: num(dgSeguros),
        medicos: num(dgMedicos),
        interesesVivienda: num(dgIntVivienda),
        alquilerVivienda: num(dgAlqVivienda),
      },
      cargasFamiliares: cargasN,
      retenciones: num(retenciones),
      anticipos: num(anticipos),
    });
    setResultado(r);
    toast.success("Cálculo realizado");
  };

  const esNatural = regimen === "natural";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl flex items-center gap-2">
            <Receipt className="h-7 w-7 text-accent" /> Calculadora ISLR (Venezuela)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Estimación referencial del Impuesto Sobre la Renta según lineamientos del SENIAT.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={limpiar}>
            <RotateCcw className="h-4 w-4 mr-2" /> Limpiar
          </Button>
          <Button onClick={() => window.print()} variant="outline" disabled={!resultado}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Aviso legal</AlertTitle>
        <AlertDescription>
          Este cálculo es referencial. La declaración definitiva debe ser verificada por un
          contador público autorizado. Los valores (UT, desgravámenes y tarifas) se ajustan
          conforme a la Gaceta Oficial vigente para el año fiscal correspondiente.
        </AlertDescription>
      </Alert>

      {/* Datos generales */}
      <Card className="p-6 shadow-elegant space-y-4">
        <h2 className="font-serif text-xl">1. Datos generales</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Año fiscal</Label>
            <Input type="number" value={anio} onChange={(e) => setAnio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Régimen</Label>
            <Select value={regimen} onValueChange={(v) => setRegimen(v as Regimen)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="natural">Persona Natural</SelectItem>
                <SelectItem value="juridica">Persona Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tipo de contribuyente</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoContribuyente)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="dependencia">Bajo relación de dependencia</SelectItem>
                <SelectItem value="profesional">Profesional liberal</SelectItem>
                <SelectItem value="comercial">Actividad comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Valor de la UT (Bs.)</Label>
            <Input
              type="number"
              step="0.01"
              value={ut}
              onChange={(e) => setUt(e.target.value)}
              placeholder="Ej: 9.00"
            />
            <p className="text-xs text-muted-foreground">Editable según Gaceta Oficial vigente.</p>
          </div>
        </div>
      </Card>

      {/* Ingresos */}
      <Card className="p-6 shadow-elegant space-y-4">
        <h2 className="font-serif text-xl">2. Ingresos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Ingresos brutos anuales (Bs.)</Label>
            <Input type="number" step="0.01" value={ingresosBrutos} onChange={(e) => setIngresosBrutos(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Ingresos exentos (Bs.)</Label>
            <Input type="number" step="0.01" value={ingresosExentos} onChange={(e) => setIngresosExentos(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Deducciones - solo si tiene sentido */}
      {(regimen === "juridica" || tipo !== "dependencia") && (
        <Card className="p-6 shadow-elegant space-y-4">
          <h2 className="font-serif text-xl">3. Deducciones de la renta bruta</h2>
          <p className="text-sm text-muted-foreground">Gastos normales y necesarios para producir la renta.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5"><Label>Sueldos y salarios</Label>
              <Input type="number" step="0.01" value={dSueldos} onChange={(e) => setDSueldos(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Alquiler de locales</Label>
              <Input type="number" step="0.01" value={dAlquiler} onChange={(e) => setDAlquiler(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Intereses de préstamos</Label>
              <Input type="number" step="0.01" value={dIntereses} onChange={(e) => setDIntereses(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Publicidad y marketing</Label>
              <Input type="number" step="0.01" value={dPublicidad} onChange={(e) => setDPublicidad(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Reparaciones y mantenimiento</Label>
              <Input type="number" step="0.01" value={dReparaciones} onChange={(e) => setDReparaciones(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Otros gastos operativos</Label>
              <Input type="number" step="0.01" value={dOtros} onChange={(e) => setDOtros(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Otros gastos deducibles</Label>
              <Input type="number" step="0.01" value={dOtrosGastos} onChange={(e) => setDOtrosGastos(e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Donaciones (Bs.)</Label>
              <Input type="number" step="0.01" value={donaciones} onChange={(e) => setDonaciones(e.target.value)} />
              <p className="text-xs text-muted-foreground">Límite: 10% hasta 10.000 UT y 8% sobre el excedente.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Desgravámenes - solo personas naturales */}
      {esNatural && (
        <Card className="p-6 shadow-elegant space-y-4">
          <h2 className="font-serif text-xl">4. Desgravámenes</h2>
          <RadioGroup value={desgravamen} onValueChange={(v) => setDesgravamen(v as Desgravamen)} className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="unico" id="dg-unico" />
              <span>Desgravamen único (774 UT)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <RadioGroupItem value="detallado" id="dg-detallado" />
              <span>Desgravamen detallado (con comprobantes)</span>
            </label>
          </RadioGroup>

          {desgravamen === "detallado" && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              <div className="space-y-1.5"><Label>Educación (hijos y cónyuge)</Label>
                <Input type="number" step="0.01" value={dgEducacion} onChange={(e) => setDgEducacion(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Primas de seguros HCM</Label>
                <Input type="number" step="0.01" value={dgSeguros} onChange={(e) => setDgSeguros(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Gastos médicos y odontológicos</Label>
                <Input type="number" step="0.01" value={dgMedicos} onChange={(e) => setDgMedicos(e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Intereses préstamo de vivienda</Label>
                <Input type="number" step="0.01" value={dgIntVivienda} onChange={(e) => setDgIntVivienda(e.target.value)} />
                <p className="text-xs text-muted-foreground">Máx. 1.000 UT.</p>
              </div>
              <div className="space-y-1.5">
                <Label>Alquiler vivienda principal</Label>
                <Input type="number" step="0.01" value={dgAlqVivienda} onChange={(e) => setDgAlqVivienda(e.target.value)} />
                <p className="text-xs text-muted-foreground">Máx. 800 UT.</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Rebajas familiares */}
      {esNatural && (
        <Card className="p-6 shadow-elegant space-y-4">
          <h2 className="font-serif text-xl">5. Rebajas familiares</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Número de cargas familiares (máx. 5)</Label>
              <Input
                type="number"
                min={0}
                max={5}
                value={cargas}
                onChange={(e) => setCargas(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se aplica automáticamente la rebaja personal (10 UT) más 10 UT por cada carga.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Retenciones y anticipos */}
      <Card className="p-6 shadow-elegant space-y-4">
        <h2 className="font-serif text-xl">6. Retenciones y anticipos</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Retenciones de ISLR (Bs.)</Label>
            <Input type="number" step="0.01" value={retenciones} onChange={(e) => setRetenciones(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Anticipos pagados (Bs.)</Label>
            <Input type="number" step="0.01" value={anticipos} onChange={(e) => setAnticipos(e.target.value)} /></div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onCalcular} disabled={!puedeCalcular} size="lg">
          <Calculator className="h-4 w-4 mr-2" /> Calcular ISLR
        </Button>
      </div>

      {/* Resultado */}
      {resultado && (
        <Card className="p-6 shadow-elegant space-y-4">
          <h2 className="font-serif text-2xl">Resultado del cálculo</h2>

          {resultado.obligadoDeclarar && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Obligado a declarar</AlertTitle>
              <AlertDescription>
                Los ingresos brutos o el enriquecimiento neto superan los umbrales establecidos
                por el SENIAT (1.500 UT / 1.000 UT). Debe presentar declaración de ISLR.
              </AlertDescription>
            </Alert>
          )}

          {resultado.avisos.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Notas del cálculo</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-1">
                  {resultado.avisos.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2 text-sm">
            <Row label="Ingresos netos" value={bs(resultado.ingresosNetos)} />
            <Row label="Total deducciones" value={bs(resultado.totalDeducciones)} />
            <Row label="Renta bruta" value={bs(resultado.rentaBruta)} />
            <Row
              label="Donaciones aplicadas"
              value={`${bs(resultado.donacionesAplicadas)} (límite ${bs(resultado.limiteDonacionesBs)})`}
            />
            <Row label="Renta neta" value={bs(resultado.rentaNeta)} />
            {esNatural && (
              <Row label="Desgravamen aplicado" value={bs(resultado.desgravamenAplicado)} />
            )}
            <Separator className="my-2" />
            <Row
              label="Base imponible"
              value={`${bs(resultado.baseImponible)} · ${resultado.baseImponibleUT.toFixed(2)} UT`}
            />
            <Row
              label="Impuesto bruto (tarifa 1)"
              value={`${bs(resultado.impuestoBruto)} · ${resultado.impuestoBrutoUT.toFixed(2)} UT`}
            />
            {esNatural && (
              <Row
                label="Rebajas familiares"
                value={`${bs(resultado.rebajasBs)} · ${resultado.rebajasUT} UT`}
              />
            )}
            <Row label="Impuesto después de rebajas" value={bs(resultado.impuestoConRebajas)} />
            <Separator className="my-2" />
            {resultado.impuestoFinal > 0 ? (
              <div className="flex items-center justify-between p-4 rounded-md bg-accent/10 border border-accent/30">
                <span className="font-semibold">Impuesto final a pagar</span>
                <span className="font-serif text-2xl text-accent">{bs(resultado.impuestoFinal)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                <span className="font-semibold">Saldo a favor</span>
                <span className="font-serif text-2xl text-emerald-600">{bs(resultado.saldoAFavor)}</span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium text-right">{value}</span>
  </div>
);

export default Islr;
