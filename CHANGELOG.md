# CHANGELOG — Teacher Classroom Suite

Todos los cambios notables están documentados aquí.
Formato: [Keep a Changelog](https://keepachangelog.com/es/) · Versioning: [SemVer](https://semver.org/)

---

## [2.5.0] — 2026-08-04 · Auditoría Profunda & Performance

### 🔴 Corregido (Crítico)

- **`calculateDetailedFinal` — Pesos proporcionales** — Reescrita para distribuir
  los pesos solo entre los pilares que tienen datos reales. Ya no sesga la nota
  final hacia abajo cuando un pilar está vacío (comportamiento correcto para
  períodos parciales y alumnos nuevos).

- **`addGrade` — Race condition eliminada** — Actualización optimista local
  instantánea + escritura asíncrona a Firestore. Nueva función `addGradesBatch`
  que consolida N notas en un único WriteBatch de Firestore (máx 490/lote),
  eliminando el throttling en modo lista con 30+ estudiantes.

- **`updateSingleDetailedGrade` — Deep copy seguro** — Copia profunda de todos
  los arrays antes de mutarlos. Manejo correcto del campo `aut` (escalar, no
  array). Asegura longitud suficiente del array antes de escribir en `targetSlot`.

### 🟠 Corregido (Alto)

- **Export CSV** — `v || ""` → `v != null ? v : ""`. La nota `0.0` ya no se
  exporta como celda vacía.

- **Import CSV — Clamp de rango** — `parseVal` aplica `Math.max(0, Math.min(5, n))`.
  Ninguna nota fuera del rango institucional 0.0–5.0 puede llegar a Firestore.

- **Modo individual — Validación** — `parseFloat(indivScore) || 0` reemplazado
  por validación explícita con mensajes de error claros al docente.

### 🟡 Mejorado (UX & Rendimiento)

- **Batch en modo lista** — `ActivityGrader` usa `addGradesBatch`: 30 notas = 1
  operación Firestore en lugar de 30 escrituras secuenciales.

- **Toast informativo** — Muestra conteo exacto y nombre de actividad:
  *"27 notas guardadas · TALLER 3 · SBH Col.2"*

- **Teclado fluido** — `Enter` / `Tab` avanza al siguiente estudiante en lista.

- **Slot libre automático** — Auto-selección del primer slot disponible al crear
  actividad nueva. Indicadores ✓/⚠ visibles en cada columna del menú.

- **Banner de advertencia** — Alerta cuando el slot seleccionado ya tiene notas,
  con diálogo de confirmación antes de sobreescribir.

- **Resumen import preciso** — Usa los datos frescos del batch preparado en lugar
  del snapshot de Firestore aún desactualizado.

- **localStorage debounce** — Escrituras diferidas 400ms. Evita micro-freezes en
  dispositivos lentos (USB externo). Solo escribe si no hay más cambios en vuelo.

### ♻️ Refactorizado

- `addGradesBatch` expuesto en `AppContextType` y en el valor del provider.
- `calculateDetailedFinal` con tipo de retorno estricto `number`.
- Separación clara entre optimistic update local y commit a Firestore.

---

## [1.2.0] — 2026-08-03 · Sincronización & Correcciones de Arranque

### Agregado
- Script `scratch/run_dev.ps1` para resolver problemas de PATH en USB externo.
- Auto-bypass en `RoleGuard.tsx` para carga offline ultrarrápida (< 1.2s).
- Soporte de `recharts` para gráficos analíticos predictivos.

### Corregido
- `turbopack.root` en `next.config.ts` para resolver error de compilación.
- `safetyTimeout` en `AppContext.tsx` optimizado: 10s → 1.2s.
- `ActivityGrader` — Detección de slot ocupado con indicadores visuales ✓/⚠.
- Recuperación de versión desde producción (Vercel) tras pérdida local.

---

## [1.1.0] — 2026-07-15 · Planilla Institucional & Offline

### Agregado
- Soporte completo offline con caché persistente en `localStorage`.
- `GradebookManager` con exportación/importación CSV.
- Sistema de pilares institucionales IETABA (SB/SBH/SR/CV/AUT).
- Modal de Plan de Nivelación para estudiantes con nota < 3.0.
- Sistema de currículo con árbol de temas por período.

---

## [1.0.0] — 2026-06-01 · Lanzamiento Inicial

- Sistema de gestión de aula con Firebase Firestore + Auth.
- Autenticación Google y correo electrónico.
- Dashboard de docentes, agenda inteligente y módulo de currículo.
- Gobernanza de datos por rol (Docente / Coordinador / Rector / SuperAdmin).
