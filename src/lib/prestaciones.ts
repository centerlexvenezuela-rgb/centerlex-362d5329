// Calculadora de Prestaciones Sociales — LOTTT (Venezuela)
// Implementación pura y testeable según el esquema legal aprobado.

export type MotivoTerminacion =
  | "despido_injustificado"
  | "despido_justificado"
  | "renuncia_voluntaria"
  | "mutuo_acuerdo"
  | "jubilacion"
  | "otro";

export interface PrestacionesSettings {
  dias_por_trimestre: number;        // art. 142 — 15 días
  dias_adicionales_por_anio: number; // 2 días
  tope_dias_adicionales: number;     // 30
  multiplicador_indemnizacion: number; // 2 (art. 92)
  tasa_interes_anual_default: number; // % anual (fallback)
  dias_mes_salario: number;          // 30
}

export interface TasaMensual {
  mes: string;                 // "YYYY-MM"
  tasa_anual_porcentaje: number;
}

export interface PrestacionesInput {
  fecha_inicio: Date;
  fecha_fin: Date;
  salario_mensual_integral: number;
  motivo_terminacion: MotivoTerminacion;
  elige_indemnizacion?: boolean;
  anticipos?: number;
  tasas_interes?: TasaMensual[];
}

export interface FlujoInteres {
  fecha: Date;
  monto: number;
  tipo: "trimestre" | "anual";
  meses: number;
  interes: number;
}

export interface PrestacionesResultado {
  dias_totales: number;
  meses: number;
  trimestres: number;
  anios_completos: number;
  salario_diario: number;
  dias_antiguedad: number;
  dias_adicionales: number;
  total_dias: number;
  capital: number;
  intereses: number;
  total_prestaciones: number;
  indemnizacion_despido: number;
  anticipos: number;
  total_pagar: number;
  flujos: FlujoInteres[];
}

const DAY_MS = 86_400_000;

const addMonths = (d: Date, months: number) => {
  const r = new Date(d.getTime());
  const day = r.getDate();
  r.setMonth(r.getMonth() + months);
  // Manejar overflow (ej. 31 ene + 1 mes)
  if (r.getDate() < day) r.setDate(0);
  return r;
};

const addYears = (d: Date, years: number) => addMonths(d, years * 12);

const monthKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const monthsBetween = (from: Date, to: Date): number => {
  if (to <= from) return 0;
  return (
    (to.getFullYear() - from.getFullYear()) * 12 +
    (to.getMonth() - from.getMonth()) -
    (to.getDate() < from.getDate() ? 1 : 0)
  );
};

export const calcularPrestaciones = (
  input: PrestacionesInput,
  settings: PrestacionesSettings,
): PrestacionesResultado => {
  const {
    fecha_inicio,
    fecha_fin,
    salario_mensual_integral,
    motivo_terminacion,
    elige_indemnizacion = false,
    anticipos = 0,
    tasas_interes = [],
  } = input;

  if (!(fecha_fin > fecha_inicio)) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
  }

  // 1. Tiempo de servicio
  const dias_totales = Math.floor((fecha_fin.getTime() - fecha_inicio.getTime()) / DAY_MS) + 1;
  const meses = Math.ceil(dias_totales / settings.dias_mes_salario);
  const trimestres = Math.ceil(meses / 3);

  let anios_completos = fecha_fin.getFullYear() - fecha_inicio.getFullYear();
  const mesFin = fecha_fin.getMonth();
  const diaFin = fecha_fin.getDate();
  const mesIni = fecha_inicio.getMonth();
  const diaIni = fecha_inicio.getDate();
  if (mesFin < mesIni || (mesFin === mesIni && diaFin < diaIni)) {
    anios_completos -= 1;
  }
  if (anios_completos < 0) anios_completos = 0;

  // 2. Salario diario
  const salario_diario = salario_mensual_integral / settings.dias_mes_salario;

  // 3. Capital
  const dias_antiguedad = settings.dias_por_trimestre * trimestres;
  const dias_adicionales =
    anios_completos > 1
      ? Math.min(
          settings.dias_adicionales_por_anio * (anios_completos - 1),
          settings.tope_dias_adicionales,
        )
      : 0;
  const total_dias = dias_antiguedad + dias_adicionales;
  const capital = total_dias * salario_diario;

  // 4. Flujos que generan intereses
  const flujosBase: { fecha: Date; monto: number; tipo: "trimestre" | "anual" }[] = [];
  for (let i = 1; i < trimestres; i++) {
    flujosBase.push({
      fecha: addMonths(fecha_inicio, 3 * i),
      monto: settings.dias_por_trimestre * salario_diario,
      tipo: "trimestre",
    });
  }
  for (let a = 2; a <= anios_completos; a++) {
    flujosBase.push({
      fecha: addYears(fecha_inicio, a),
      monto: settings.dias_adicionales_por_anio * salario_diario,
      tipo: "anual",
    });
  }

  // 5. Intereses (capitalización compuesta mensual)
  const tasasMap = new Map<string, number>();
  for (const t of tasas_interes) tasasMap.set(t.mes, t.tasa_anual_porcentaje);
  const fallbackMensual = 1 + settings.tasa_interes_anual_default / 100 / 12;

  const flujos: FlujoInteres[] = flujosBase.map((f) => {
    const n = monthsBetween(f.fecha, fecha_fin);
    let vf = f.monto;
    let cursor = new Date(f.fecha.getFullYear(), f.fecha.getMonth() + 1, 1);
    for (let m = 0; m < n; m++) {
      const k = monthKey(cursor);
      const tasaAnual = tasasMap.get(k);
      const factor = tasaAnual != null ? 1 + tasaAnual / 100 / 12 : fallbackMensual;
      vf *= factor;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    }
    return { ...f, meses: n, interes: vf - f.monto };
  });

  const intereses = flujos.reduce((s, f) => s + f.interes, 0);

  // 6. Total prestaciones
  const total_prestaciones = capital + intereses;

  // 7. Indemnización art. 92
  const indemnizacion_despido =
    motivo_terminacion === "despido_injustificado" && elige_indemnizacion
      ? settings.multiplicador_indemnizacion * total_prestaciones
      : 0;

  // 8. Total a pagar (descontando anticipos)
  const total_pagar = total_prestaciones + indemnizacion_despido - (anticipos || 0);

  return {
    dias_totales,
    meses,
    trimestres,
    anios_completos,
    salario_diario,
    dias_antiguedad,
    dias_adicionales,
    total_dias,
    capital,
    intereses,
    total_prestaciones,
    indemnizacion_despido,
    anticipos: anticipos || 0,
    total_pagar,
    flujos,
  };
};

export const formatBs = (n: number) =>
  new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "VES",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export const MOTIVO_LABELS: Record<MotivoTerminacion, string> = {
  despido_injustificado: "Despido injustificado",
  despido_justificado: "Despido justificado",
  renuncia_voluntaria: "Renuncia voluntaria",
  mutuo_acuerdo: "Mutuo acuerdo",
  jubilacion: "Jubilación",
  otro: "Otro",
};
