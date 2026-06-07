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

describe("calcularPrestaciones (ejemplo de la guía LOTTT)", () => {
  it("calcula capital y estructura para 15/03/2018 → 31/07/2024, Bs. 3000", () => {
    const r = calcularPrestaciones(
      {
        fecha_inicio: new Date(2018, 2, 15),
        fecha_fin: new Date(2024, 6, 31),
        salario_mensual_integral: 3000,
        motivo_terminacion: "despido_injustificado",
        elige_indemnizacion: true,
      },
      DEFAULT_SETTINGS,
    );

    expect(r.trimestres).toBe(26);
    expect(r.anios_completos).toBe(6);
    expect(r.dias_antiguedad).toBe(390);
    expect(r.dias_adicionales).toBe(10);
    expect(r.total_dias).toBe(400);
    expect(r.salario_diario).toBe(100);
    expect(r.capital).toBe(40000);
    expect(r.intereses).toBeGreaterThan(0);
    expect(r.indemnizacion_despido).toBeCloseTo(2 * r.total_prestaciones, 5);
    expect(r.total_pagar).toBeCloseTo(r.total_prestaciones * 3, 5);
  });

  it("indemnización 0 si renuncia voluntaria", () => {
    const r = calcularPrestaciones(
      {
        fecha_inicio: new Date(2020, 0, 1),
        fecha_fin: new Date(2023, 0, 1),
        salario_mensual_integral: 1500,
        motivo_terminacion: "renuncia_voluntaria",
      },
      DEFAULT_SETTINGS,
    );
    expect(r.indemnizacion_despido).toBe(0);
    expect(r.total_pagar).toBe(r.total_prestaciones);
  });

  it("tope de días adicionales en 30", () => {
    const r = calcularPrestaciones(
      {
        fecha_inicio: new Date(2000, 0, 1),
        fecha_fin: new Date(2025, 0, 1),
        salario_mensual_integral: 3000,
        motivo_terminacion: "despido_justificado",
      },
      DEFAULT_SETTINGS,
    );
    expect(r.dias_adicionales).toBe(30);
  });
});
