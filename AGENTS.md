<!-- BEGIN:nextjs-agent-rules -->
# Reglas de Next.js

Esta versión incluye cambios significativos: las API, convenciones y la estructura de archivos pueden diferir. Consulta la guía correspondiente en `node_modules/next/dist/docs/` antes de escribir código. Presta atención a los avisos de desaprobación (deprecation notices).
<!-- END:nextjs-agent-rules -->

## Idioma
- Toda la interacción, comentarios e instrucciones se deben realizar exclusivamente en **español**.

## Ubicación de Proyectos (Reglas de Directorios)
- **Proyectos Educativos**: `C:\USB\PROGRAMAS\COLEGIO\`
- **Otros Proyectos**: `C:\USB\PROGRAMAS\`

---

## Estado del Proyecto — v1.3.0 (2026-08-04)

### Arranque
- El servidor de desarrollo se lanza SIEMPRE con: `scratch/run_dev.ps1`
- Razón: el sistema corre desde USB externo con PATH restringido.

### Arquitectura Central
- **`AppContext.tsx`** es la única fuente de verdad. Gestiona Firestore (`onSnapshot`) y localStorage.
- **`calculateDetailedFinal`** — Usa pesos proporcionales (v1.3.0). Solo los pilares con datos contribuyen al promedio. **NO revertir a pesos fijos sin consenso.**
- **`addGradesBatch`** — Para guardar N notas en modo lista. Usar SIEMPRE en lugar de N llamadas a `addGrade`.
- **`updateSingleDetailedGrade`** — Para actualizar la Planilla Oficial (detailedGrades). Hace deep copy seguro.

### Pesos Institucionales IETABA
| Pilar | Código | Peso | Slots |
|-------|--------|------|-------|
| Saber | `sb`  | 30%  | 8     |
| Saber-Hacer | `sbh` | 40% | 8   |
| Ser   | `sr`  | 20%  | 5     |
| Convivencia | `cv` | 5% | 3    |
| Autoevaluacion | `aut` | 5% | 1 (escalar) |

### Reglas de Validación de Notas
- Rango válido: **0.0 – 5.0** (clamp estricto en import CSV y validación en UI)
- Export CSV: usar `v != null ? v : ""` (nunca `v || ""` — confunde nota 0 con vacío)

### localStorage (Offline)
- Escrituras con debounce de 400ms para evitar micro-freezes en USB.
- Claves: `edu_students`, `edu_agendaNotes`, `edu_curriculum`, `edu_masterData`, `edu_subjects`, `offline_user`, `offline_profile`.

### Período Activo
- La excepción FÍSICA 6° siempre usa `p1`, independiente del período activo global.
