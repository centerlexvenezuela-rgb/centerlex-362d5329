# Directorio de Abogados

Crear un directorio público de abogados con búsqueda, filtro por estado de Venezuela y ordenamiento por cercanía geográfica. Los datos se gestionan desde el panel de administración con campos nuevos en el perfil y aprobación manual del administrador.

## 1. Base de datos (migración)

Agregar columnas a `profiles`:
- `whatsapp` (text, opcional)
- `bar_association` (text, opcional) — colegio de abogados
- `city` (text, opcional)
- `state` (text, opcional) — uno de los 24 estados de Venezuela + Distrito Capital
- `photo_url` (text, opcional)
- `directory_enabled` (boolean, default false) — aprobación del admin

Crear bucket público `lawyer-photos` para las fotos.

Política RLS adicional en `profiles`: permitir `SELECT` a `anon` y `authenticated` SOLO de los campos públicos (a través de una vista `public.lawyers_directory`) cuando `directory_enabled = true`. La vista expondrá únicamente: first_name, last_name, whatsapp, email, bar_association, city, state, photo_url.

## 2. Panel de administración

### Formulario de creación de abogado (`AdminPanel.tsx`)
Añadir campos opcionales: WhatsApp, Colegio de Abogados, Ciudad, Estado (select con estados de Venezuela), foto (upload al bucket).

### Edición de abogado existente
Nuevo botón "Editar" por fila que abre un diálogo con los mismos campos opcionales + cambio de foto.

### Tabla de abogados
Nueva columna "Directorio" con `Switch` (igual que Honorarios/Prestaciones) que llama a una acción `toggle_directory` en la edge function `admin-users`.

### Edge function `admin-users`
- Extender `create` y agregar acción `update_profile` para guardar los nuevos campos.
- Agregar acción `toggle_directory`.
- Devolver los nuevos campos en `list`.

## 3. Página pública del directorio

Nueva ruta `/directorio` (pública, sin auth) en `src/pages/Directory.tsx`:
- Header con título y CTA.
- Buscador por nombre.
- Filtro select por estado de Venezuela.
- Botón "Usar mi ubicación" → `navigator.geolocation` → geocoding inverso (Google Maps connector si está disponible, o mapeo aproximado lat/lng → estado) para autoseleccionar el estado más cercano y ordenar los resultados.
- Grid de tarjetas con foto, nombre, colegio, ciudad/estado, botones WhatsApp (wa.me/) y correo (mailto:).
- SEO: title, meta description, H1, alt text en fotos.

Consulta: `supabase.from('lawyers_directory').select('*')` (vista pública).

## 4. Landing page

Agregar sección/CTA con título "Encuentra un abogado en Venezuela" + descripción + botón "Ver Directorio de Abogados" → `/directorio`. Incluir enlace en navegación principal de la landing.

## 5. Estados de Venezuela

Constante compartida `src/lib/venezuela.ts` con los 24 estados + Distrito Capital y centroides aproximados (lat/lng) para el cálculo de cercanía.

## Detalles técnicos

- **Foto**: subida desde el admin al bucket `lawyer-photos`, ruta `{user_id}/avatar.{ext}`, URL pública guardada en `profiles.photo_url`. Tamaño máximo 5MB, formatos JPG/PNG/WebP.
- **Geolocalización**: si el usuario otorga permiso, calcular distancia haversine entre su lat/lng y el centroide de cada estado; auto-seleccionar el más cercano. Sin permiso → mostrar todos.
- **WhatsApp**: normalizar a formato internacional (ej. `584141234567`) al guardar; el botón abre `https://wa.me/{whatsapp}`.
- **Vista pública** `lawyers_directory`: `SECURITY INVOKER` con filtro `WHERE directory_enabled = true`, GRANT SELECT a `anon` y `authenticated`. Evita exponer toda la tabla `profiles`.

## Archivos a crear/modificar

**Crear**: migración SQL, `src/pages/Directory.tsx`, `src/lib/venezuela.ts`, `src/components/EditLawyerDialog.tsx`.

**Modificar**: `AdminPanel.tsx`, `Landing.tsx`, `App.tsx` (ruta), `useProfile.tsx`, `supabase/functions/admin-users/index.ts`, `types.ts`.

¿Apruebas el plan para proceder con la implementación?
