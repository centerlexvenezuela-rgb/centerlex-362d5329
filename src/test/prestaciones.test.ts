import { describe, it, expect } from "vitest";
import { calcularPrestaciones, type PrestacionesSettings } from "@/lib/prestaciones";

const DEFAULT_SETTINGS: PrestacionesSettings = {
  dias_por_trimestre: 15,
  dias_adicionales_por_anio: 2,
  tope_dias_adicionales: 30,
  multiplicador_indemnizacion: 2,
  tasa_interes_anual_default: 18,
  dias_mes_salario: 30,
};

describe("calcularPrestaciones (LOTTT art. 142, sistema dual)", () => {
  it("aplica regla de oro y calcula ambos sistemas", () => {
    const r = calcularPrestaciones(
      {
        fecha_inicio: new Date(2020, 0, 1),
        fecha_fin: new Date(2025, 11, 31),
        salarios: [{ desde: "2020-01-01", salario_base: 3000, otros_bonos: 0 }],
        dias_utilidades: 30,
        dias_bono_vacacional_base: 15,
        incremento_bono_vacacional_anual: 1,
        motivo_terminacion: "despido_injustificado",
        elige_indemnizacion: true,
      },
      DEFAULT_SETTINGS,
    );

    // 5 años 11 meses (aún no llega al 6to año exacto)
    expect(r.anios_completos).toBe(5);
    // literal b = (5-1)*2 = 8 días
    expect(r.acumulativo.dias_adicionales).toBe(8);
    // retroactivo: 5 años + fracción (11 meses ≥ 6) = 6 años × 30 días
    expect(r.retroactivo.anios_computados).toBe(6);
    expect(r.retroactivo.dias_literal_c).toBe(180);
    // sistema favorable definido
    expect(["acumulativo", "retroactivo"]).toContain(r.sistema_favorable);
    // indemnización = monto favorable (doblete)
    expect(r.indemnizacion_despido).toBeCloseTo(r.monto_favorable, 5);
    expect(r.total_pagar).toBeCloseTo(r.monto_favorable * 2, 5);
  });

  it("indemnización 0 en renuncia voluntaria", () => {
    const r = calcularPrestaciones(
      {
        fecha_inicio: new Date(2020, 0, 1),
        fecha_fin: new Date(2023, 0, 1),
        salarios: [{ desde: "2020-01-01", salario_base: 1500 }],
        dias_utilidades: 30,
        dias_bono_vacacional_base: 15,
        incremento_bono_vacacional_anual: 1,
        motivo_terminacion: "renuncia_voluntaria",
      },
      DEFAULT_SETTINGS,
    );
    expect(r.indemnizacion_despido).toBe(0);
    expect(r.total_pagar).toBeCloseTo(r.monto_favorable, 5);
  });

  it("tope de días adicionales en 30", () => {
    const r = calcularPrestaciones(
      {
        fecha_inicio: new Date(2000, 0, 1),
        fecha_fin: new Date(2025, 0, 1),
        salarios: [{ desde: "2000-01-01", salario_base: 3000 }],
        dias_utilidades: 30,
        dias_bono_vacacional_base: 15,
        incremento_bono_vacacional_anual: 1,
        motivo_terminacion: "despido_justificado",
      },
      DEFAULT_SETTINGS,
    );
    expect(r.acumulativo.dias_adicionales).toBe(30);
  });

  it("fracción ≥ 6 meses computa como año en el retroactivo", () => {
    const r = calcularPrestaciones(
      {
        fecha_inicio: new Date(2020, 0, 1),
        fecha_fin: new Date(2023, 7, 1), // 3 años 7 meses
        salarios: [{ desde: "2020-01-01", salario_base: 3000 }],
        dias_utilidades: 30,
        dias_bono_vacacional_base: 15,
        incremento_bono_vacacional_anual: 1,
        motivo_terminacion: "otro",
      },
      DEFAULT_SETTINGS,
    );
    expect(r.retroactivo.anios_completos).toBe(3);
    expect(r.retroactivo.computa_fraccion).toBe(true);
    expect(r.retroactivo.anios_computados).toBe(4);
  });
});
