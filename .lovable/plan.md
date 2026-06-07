## Calculadora de Prestaciones Sociales (LOTTT)

Replicaré la arquitectura del módulo de Honorarios: toggle por abogado desde el panel admin, parámetros editables por el admin, y página de uso para el abogado.

### 1. Base de datos (migración)

**Toggle por abogado**
- `profiles.prestaciones_enabled BOOLEAN NOT NULL DEFAULT false`

**Parámetros globales editables por admin** — nueva tabla `prestaciones_settings` (singleton, 1 fila):
- `dias_por_trimestre` (default 15) — art. 142 LOTTT
- `dias_adicionales_por_año` (default 2)
- `tope_dias_adicionales` (default 30)
- `multiplicador_indemnizacion` (default 2) — art. 92
- `tasa_interes_anual_default` (default 18.00) — fallback si no hay histórico BCV
- `dias_mes_salario` (default 30)

**Histórico de tasas BCV** — tabla `prestaciones_tasas_bcv`:
- `mes` (DATE, primer día del mes, UNIQUE)
- `tasa_anual_porcentaje` NUMERIC(6,3)

Ambas tablas: RLS — lectura para `authenticated`, escritura solo para `admin` (vía `has_role`). GRANTs explícitas.

### 2. Edge function (`admin-users`)
Agregar acción `toggle_prestaciones` análoga a `toggle_fees`.

### 3. Panel de Administración (`AdminPanel.tsx`)
- Nueva columna en la tabla de abogados: **Prestaciones** (icono Scale) con Switch igual que IA/Honorarios.
- Nueva sección `PrestacionesAdminSection` con dos cards:
  - Parámetros de cálculo (form editando la fila singleton).
  - Tasas BCV mensuales (tabla con add/edit/delete + import opcional pegando CSV).

### 4. Hook `useProfile`
Incluir `prestaciones_enabled` en el select y tipo.

### 5. Navegación (`AppLayout`)
Agregar enlace **Prestaciones Sociales** visible solo si `profile.prestaciones_enabled`. Ruta `/prestaciones`.

### 6. Página `src/pages/Prestaciones.tsx`
Formulario mínimo para el abogado:
- Nombre del trabajador (opcional, para el reporte)
- Fecha de inicio (DatePicker)
- Fecha de fin
- Último salario mensual integral (Bs.)
- Motivo de terminación: select (despido injustificado / despido justificado / renuncia voluntaria / mutuo acuerdo / jubilación)
- Si despido injustificado → switch "trabajador elige indemnización"
- Anticipos recibidos (opcional, Bs.)
- Botón **Calcular**

Resultado en card con desglose: días antigüedad, días adicionales, capital, intereses, total prestaciones, indemnización art. 92, anticipos restados, **total a pagar en Bs.** Botón de exportar a PDF (reutilizar `exportDocs.ts`) opcional simple — imprimir.

### 7. Lógica de cálculo (`src/lib/prestaciones.ts`)
Implementación pura, testeable, siguiendo el esquema exacto del usuario:

```text
días_totales = (fecha_fin - fecha_inicio) + 1
meses = ceil(días_totales / 30)
trimestres = ceil(meses / 3)
años_completos = ajuste por mes/día
salario_diario = salario_mensual_integral / 30
días_antigüedad = 15 × trimestres
días_adicionales = años>1 ? min(2×(años-1), 30) : 0
capital = (días_antigüedad + días_adicionales) × salario_diario

flujos:
  trimestres 1..(n-1): fecha_inicio + 3m×i, monto 15×sd
  años 2..años_completos: fecha_inicio + a años, monto 2×sd

intereses: para cada flujo, capitalización compuesta mensual
  usando tasas BCV por mes, fallback a tasa_default
total_prestaciones = capital + intereses
indemnización = (injustificado && elige) ? 2×total_prestaciones : 0
total_pagar = total_prestaciones + indemnización − anticipos
```

Format Bs. con `Intl.NumberFormat('es-VE', { style:'currency', currency:'VES' })`.

### 8. Tests
`src/test/prestaciones.test.ts` con el ejemplo del usuario (2018-03-15 → 2024-07-31, Bs. 3000, tasa 18%) verificando capital = 40.000 y estructura.

### Archivos a crear
- `supabase/migrations/<ts>_prestaciones.sql`
- `src/lib/prestaciones.ts`
- `src/components/PrestacionesAdminSection.tsx`
- `src/pages/Prestaciones.tsx`
- `src/test/prestaciones.test.ts`

### Archivos a modificar
- `supabase/functions/admin-users/index.ts` (acción toggle_prestaciones)
- `src/pages/AdminPanel.tsx` (columna + sección)
- `src/hooks/useProfile.tsx` (campo)
- `src/components/AppLayout.tsx` (nav link)
- `src/App.tsx` (ruta)
- `src/integrations/supabase/types.ts` (se regenera tras migración)

### Confirmación
¿Lo apruebas tal como está? Después de tu OK ejecuto la migración (requiere tu aprobación) y luego escribo todo el código.
