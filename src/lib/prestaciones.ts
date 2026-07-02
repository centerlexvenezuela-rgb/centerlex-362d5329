// Calculadora de Prestaciones Sociales — LOTTT (Venezuela)
// Sistema DUAL obligatorio (Art. 142 LOTTT): calcula acumulativo y retroactivo
// y aplica la Regla de Oro (literal d): el trabajador recibe el MAYOR.

export type MotivoTerminacion =
  | "despido_injustificado"
  | "despido_justificado"
  | "renuncia_voluntaria"
  | "mutuo_acuerdo"
  | "jubilacion"
  | "otro";

export interface PrestacionesSettings {
  dias_por_trimestre: number;          // 15
  dias_adicionales_por_anio: number;   // 2
  tope_dias_adicionales: number;       // 30
  multiplicador_indemnizacion: number; // 2 (art. 92)
  tasa_interes_anual_default: number;  // % anual fallback
  dias_mes_salario: number;            // 30
}

export interface TasaMensual {
  mes: string;                         // "YYYY-MM"
  tasa_anual_porcentaje: number;
}

export interface SalarioPeriodo {
  desde: string;          // "YYYY-MM-DD"
  salario_base: number;   // salario base mensual
  otros_bonos?: number;   // bonos/pagos continuos y permanentes (mensual)
}

export interface PrestacionesInput {
  fecha_inicio: Date;
  fecha_fin: Date;
  salarios: SalarioPeriodo[];             // al menos uno; ordenados por fecha
  dias_utilidades: number;                // 15..120
  dias_bono_vacacional_base: number;      // p.ej. 15
  incremento_bono_vacacional_anual: number; // p.ej. 1
  motivo_terminacion: MotivoTerminacion;
  elige_indemnizacion?: boolean;          // art. 92 (solo despido injustificado)
  anticipos?: number;                     // ya recibidos
  tasas_interes?: TasaMensual[];          // BCV por mes
}

export interface DetalleTrimestre {
  n: number;
  desde: Date;
  hasta: Date;             // último día del trimestre
  anio_servicio: number;
  salario_base: number;
  otros_bonos: number;
  dias_bono_vacacional: number;
  salario_integral_diario: number;
  salario_integral_mensual: number;
  dias: number;            // 15
  aporte: number;          // 15 × sal. integral diario
}

export interface DetalleAcumulativo {
  trimestres: DetalleTrimestre[];
  total_literal_a: number;
  dias_adicionales: number;
  literal_b: number;
  intereses: number;
  total: number;
  ultimo_salario_integral_diario: number;
}

export interface DetalleRetroactivo {
  anios_completos: number;
  fraccion_meses: number;
  computa_fraccion: boolean;
  anios_computados: number;
  dias_literal_c: number;
  ultimo_salario_integral_diario: number;
  literal_c: number;
  dias_adicionales: number;
  literal_b: number;
  total: number;
}

export interface PrestacionesResultado {
  // servicio
  anios_completos: number;
  meses_totales: number;
  dias_totales: number;
  // salario integral (último período)
  ultimo_salario_base: number;
  ultimo_otros_bonos: number;
  ultimo_dias_bono_vacacional: number;
  ultimo_salario_integral_diario: number;
  ultimo_salario_integral_mensual: number;
  // sistemas
  acumulativo: DetalleAcumulativo;
  retroactivo: DetalleRetroactivo;
  sistema_favorable: "acumulativo" | "retroactivo";
  monto_favorable: number;
  // art. 92
  indemnizacion_despido: number;
  // liquidación
  anticipos: number;
  total_pagar: number;
}

// ────────────────────────────────────────────────────────────
// Utilidades de fecha
// ────────────────────────────────────────────────────────────
const DAY_MS = 86_400_000;

const addMonths = (d: Date, months: number) => {
  const r = new Date(d.getTime());
  const day = r.getDate();
  r.setMonth(r.getMonth() + months);
  if (r.getDate() < day) r.setDate(0);
  return r;
};

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

// devuelve años completos y meses fraccionarios
const antiguedadDetallada = (inicio: Date, fin: Date) => {
  let anios = fin.getFullYear() - inicio.getFullYear();
  let meses = fin.getMonth() - inicio.getMonth();
  let dias = fin.getDate() - inicio.getDate();
  if (dias < 0) meses -= 1;
  if (meses < 0) { anios -= 1; meses += 12; }
  return { anios: Math.max(0, anios), meses: Math.max(0, meses) };
};

// Salario vigente en una fecha dada (usa el último período cuya "desde" <= fecha)
const salarioEn = (fecha: Date, salarios: SalarioPeriodo[]): SalarioPeriodo => {
  const ord = [...salarios].sort((a, b) => a.desde.localeCompare(b.desde));
  let vigente = ord[0];
  for (const s of ord) {
    if (new Date(s.desde + "T00:00:00") <= fecha) vigente = s;
  }
  return vigente;
};

// Días de bono vacacional para un año de servicio N (1,2,3,...)
const diasBonoVacacional = (
  anioServicio: number,
  base: number,
  incremento: number,
) => base + Math.max(0, anioServicio - 1) * incremento;

// Cálculo del salario integral en una fecha específica
const salarioIntegralEn = (
  fecha: Date,
  fechaInicio: Date,
  input: PrestacionesInput,
) => {
  const sal = salarioEn(fecha, input.salarios);
  const base = (sal.salario_base || 0) + (sal.otros_bonos || 0);
  const mesesServicio = monthsBetween(fechaInicio, fecha);
  const anioServ = Math.floor(mesesServicio / 12) + 1;
  const diasBV = diasBonoVacacional(
    anioServ,
    input.dias_bono_vacacional_base,
    input.incremento_bono_vacacional_anual,
  );
  const salBaseDiario = base / 30;
  const alicUtil = (base * input.dias_utilidades) / 360;
  const alicBV = (base * diasBV) / 360;
  const integralMensual = base + alicUtil + alicBV;
  const integralDiario = integralMensual / 30;
  return {
    salario_base: sal.salario_base || 0,
    otros_bonos: sal.otros_bonos || 0,
    base_mas_bonos: base,
    dias_bono_vacacional: diasBV,
    anio_servicio: anioServ,
    salario_base_diario: salBaseDiario,
    alicuota_utilidades_mensual: alicUtil,
    alicuota_bono_vacacional_mensual: alicBV,
    salario_integral_mensual: integralMensual,
    salario_integral_diario: integralDiario,
  };
};

// ────────────────────────────────────────────────────────────
// Cálculo principal
// ────────────────────────────────────────────────────────────
export const calcularPrestaciones = (
  input: PrestacionesInput,
  settings: PrestacionesSettings,
): PrestacionesResultado => {
  const { fecha_inicio, fecha_fin, motivo_terminacion } = input;
  if (!(fecha_fin > fecha_inicio)) {
    throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
  }
  if (!input.salarios?.length) {
    throw new Error("Debe indicar al menos un salario.");
  }

  // 1. Antigüedad
  const { anios: anios_completos, meses: meses_fraccion } = antiguedadDetallada(
    fecha_inicio,
    fecha_fin,
  );
  const meses_totales = monthsBetween(fecha_inicio, fecha_fin);
  const dias_totales =
    Math.floor((fecha_fin.getTime() - fecha_inicio.getTime()) / DAY_MS) + 1;

  // 2. Último salario integral (para literal b y sistema retroactivo)
  const ult = salarioIntegralEn(fecha_fin, fecha_inicio, input);

  // 3. Sistema Acumulativo
  //    Literal a: trimestres COMPLETOS × 15 días × salario integral del último mes del trimestre
  const trimestres: DetalleTrimestre[] = [];
  let n = 0;
  while (true) {
    const desdeTrim = addMonths(fecha_inicio, 3 * n);
    const finTrim = addMonths(fecha_inicio, 3 * (n + 1));
    if (finTrim > fecha_fin) break; // solo trimestres completos
    // "último mes del trimestre" → tomamos el día anterior a finTrim
    const ultimoMes = new Date(finTrim.getTime() - DAY_MS);
    const s = salarioIntegralEn(ultimoMes, fecha_inicio, input);
    const dias = settings.dias_por_trimestre;
    const aporte = dias * s.salario_integral_diario;
    trimestres.push({
      n: n + 1,
      desde: desdeTrim,
      hasta: ultimoMes,
      anio_servicio: s.anio_servicio,
      salario_base: s.salario_base,
      otros_bonos: s.otros_bonos,
      dias_bono_vacacional: s.dias_bono_vacacional,
      salario_integral_diario: s.salario_integral_diario,
      salario_integral_mensual: s.salario_integral_mensual,
      dias,
      aporte,
    });
    n++;
  }
  const total_literal_a = trimestres.reduce((s, t) => s + t.aporte, 0);

  // Literal b: (años completos - 1) × 2 días, tope 30, con último salario integral
  const dias_adicionales =
    anios_completos > 1
      ? Math.min(
          settings.dias_adicionales_por_anio * (anios_completos - 1),
          settings.tope_dias_adicionales,
        )
      : 0;
  const literal_b = dias_adicionales * ult.salario_integral_diario;

  // Intereses (Art. 143): capitalización mensual sobre saldo acumulado del literal a.
  // Cada aporte trimestral se agrega el mes en que se cierra el trimestre; luego cada
  // mes siguiente se aplica la tasa BCV (mensual) sobre el saldo.
  const tasasMap = new Map<string, number>();
  for (const t of input.tasas_interes ?? []) {
    tasasMap.set(t.mes, t.tasa_anual_porcentaje);
  }
  const fallbackMensual = settings.tasa_interes_anual_default / 100 / 12;
  const factorMes = (fecha: Date) => {
    const k = monthKey(fecha);
    const anual = tasasMap.get(k);
    return 1 + (anual != null ? anual / 100 / 12 : fallbackMensual);
  };

  // Recorremos mes a mes desde el inicio hasta el fin, capitalizando saldo.
  let saldo = 0;
  let capitalAportado = 0;
  const totalMeses = monthsBetween(fecha_inicio, fecha_fin);
  const aportesPorMes = new Map<string, number>();
  for (const t of trimestres) {
    // aporte se abona el mes de cierre del trimestre
    const k = monthKey(t.hasta);
    aportesPorMes.set(k, (aportesPorMes.get(k) ?? 0) + t.aporte);
  }
  for (let m = 0; m < totalMeses; m++) {
    const cursor = addMonths(fecha_inicio, m + 1);
    const k = monthKey(new Date(cursor.getTime() - DAY_MS));
    const aporte = aportesPorMes.get(k) ?? 0;
    if (aporte > 0) {
      saldo += aporte;
      capitalAportado += aporte;
    }
    saldo *= factorMes(cursor);
  }
  const intereses = Math.max(0, saldo - capitalAportado);

  const acumulativo: DetalleAcumulativo = {
    trimestres,
    total_literal_a,
    dias_adicionales,
    literal_b,
    intereses,
    total: total_literal_a + literal_b + intereses,
    ultimo_salario_integral_diario: ult.salario_integral_diario,
  };

  // 4. Sistema Retroactivo (Literal c + Literal b)
  const computa_fraccion = meses_fraccion >= 6;
  const anios_computados = anios_completos + (computa_fraccion ? 1 : 0);
  const dias_literal_c = anios_computados * 30;
  const literal_c = dias_literal_c * ult.salario_integral_diario;
  const retroactivo: DetalleRetroactivo = {
    anios_completos,
    fraccion_meses: meses_fraccion,
    computa_fraccion,
    anios_computados,
    dias_literal_c,
    ultimo_salario_integral_diario: ult.salario_integral_diario,
    literal_c,
    dias_adicionales,
    literal_b,
    total: literal_c + literal_b,
  };

  // 5. Regla de Oro (literal d)
  const sistema_favorable =
    acumulativo.total >= retroactivo.total ? "acumulativo" : "retroactivo";
  const monto_favorable = Math.max(acumulativo.total, retroactivo.total);

  // 6. Indemnización Art. 92 (doble de las prestaciones sociales)
  const indemnizacion_despido =
    motivo_terminacion === "despido_injustificado" && input.elige_indemnizacion
      ? (settings.multiplicador_indemnizacion - 1) * monto_favorable
      : 0;
  // Nota: "doblete" ⇒ el patrono paga el doble ⇒ monto_favorable + monto_favorable
  // Modelamos indemnización = (multiplicador - 1) × monto_favorable, con
  // multiplicador_indemnizacion = 2 por defecto.

  // 7. Anticipos y total
  const anticipos = input.anticipos ?? 0;
  const total_pagar = monto_favorable + indemnizacion_despido - anticipos;

  return {
    anios_completos,
    meses_totales,
    dias_totales,
    ultimo_salario_base: ult.salario_base,
    ultimo_otros_bonos: ult.otros_bonos,
    ultimo_dias_bono_vacacional: ult.dias_bono_vacacional,
    ultimo_salario_integral_diario: ult.salario_integral_diario,
    ultimo_salario_integral_mensual: ult.salario_integral_mensual,
    acumulativo,
    retroactivo,
    sistema_favorable,
    monto_favorable,
    indemnizacion_despido,
    anticipos,
    total_pagar,
  };
};

// ────────────────────────────────────────────────────────────
// Utilidades UI
// ────────────────────────────────────────────────────────────
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
