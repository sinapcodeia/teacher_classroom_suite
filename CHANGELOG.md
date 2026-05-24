# 📄 Registro de Cambios y Gobernanza (CHANGELOG.md)

Este documento es el registro oficial de versiones, gobernanza y planes de contingencia (Rollback) de la suite de gestión pedagógica **IETABA Teacher Classroom Suite**. Sigue las directrices estrictas de versionamiento semántico (**SemVer 2.0.0**) y las mejores prácticas de gobernanza de software utilizadas por startups globales de alto crecimiento.

---

## 🏛️ Protocolo de Gobernanza y Despliegue

Antes de que cualquier cambio sea promovido a la rama principal (`main`) y desplegado en producción (**Vercel**), se debe cumplir el siguiente protocolo obligatorio de validación:

### 1. Validación Previa al Commit/Push (Pre-flight Validation)
El desarrollador o agente de IA **DEBE** ejecutar el script de validación automatizada en el entorno local:
```powershell
.\validate-release.ps1
```
Este script actúa como una compuerta estricta (Gatekeeper) y realiza las siguientes tareas de validación:
- **Chequeo de Tipos de TypeScript**: Ejecuta `npx tsc --noEmit` para garantizar la integridad estructural del código.
- **Chequeo de Linter**: Ejecuta `npm run lint` para validar la calidad sintáctica y guías de estilo.
- **Compilación de Producción (Dry Build)**: Ejecuta `npm run build` para asegurar la correcta generación de páginas estáticas e importaciones webpack.

> [!WARNING]
> Si **cualquiera** de estas tareas falla o arroja advertencias críticas, el script retornará un estado fallido (`Exit Code: 1`) y el push/despliegue quedará **estrictamente prohibido**.

### 2. Plan de Respaldo e Instant Rollback (Plan de Contingencia)
Si un despliegue en producción falla o presenta comportamiento inestable, se debe aplicar el siguiente plan de reversión inmediata (Rollback) en menos de 30 segundos:

#### Opción A: Reversión desde Vercel (Instantánea y recomendada)
1. Ingresa al panel de control de Vercel de la institución.
2. Navega a **Deployments** (Despliegues).
3. Ubica el último despliegue estable (debidamente etiquetado con la versión anterior, ej: `v1.1.0`).
4. Haz clic en los tres puntos (`...`) junto al despliegue estable y selecciona **Instant Rollback** (Reversión Inmediata).
5. Confirma la acción. Vercel redirigirá el tráfico DNS al instante sin requerir una compilación adicional.

#### Opción B: Reversión desde Git (Consistencia del Repositorio)
Si se requiere revertir el código base al último punto estable etiquetado en el repositorio de Git:
```bash
# 1. Obtener la lista de etiquetas de versiones estables
git tag -l

# 2. Revertir temporalmente el espacio de trabajo local al tag de la versión estable anterior
git checkout tags/v1.1.0 -b hotfix-rollback-v1.1.0

# 3. Revertir el último commit inestable en la rama main
git checkout main
git revert HEAD --no-edit

# 4. Empujar la reversión a producción
git push origin main
```

---

## 📅 Historial Cronológico de Versiones

### [v1.2.0] — 2026-05-24
#### 🌟 NUEVAS CARACTERÍSTICAS
- **Rueda de Competencias Curriculares (SVG)**: Gráfico dinámico interactivo en `src/components/curriculum/RadarCompetencias.tsx` que mide el balance de competencias ancestrales, agroambientales y saberes universales mediante análisis de palabras clave en tiempo real.
- **Módulo de Adaptaciones Inclusivas (PIAR)**: Modal en `src/components/curriculum/PiarAdaptationModal.tsx` con soporte adaptado de clase y evaluación para 4 grupos críticos de aprendizaje: *Ritmo Lento*, *Auditivo*, *Visual* y *Bilingüe Awapit-Español*.
- **Transcriptor de Lecturas del Tejido**: Tab dinámico en `src/components/curriculum/LecturasTejido.tsx` que genera lecturas interculturales de más de 2 páginas con cajas de glosario y 5 preguntas para transcribir y resolver en el cuaderno escolar.
- **Nivelaciones Directas en Planilla**: Botón **`🚑 Nivelar`** integrado directamente en la celda de la nota definitiva del libro de calificaciones (`GradebookManager.tsx`) para estudiantes con promedio inferior a `3.0`.
- **Strategic Recovery Plan Modal**: Modal `RecoveryPlanModal.tsx` que genera, edita e imprime planes estratégicos de recuperación con su solucionario y rúbrica para el alumno.

#### ⚡ MEJORAS Y OPTIMIZACIÓN
- **Impresión en Dos Columnas (Paper-Budget Optimization)**: Optimización en `src/lib/printService.ts` que formatea automáticamente los talleres de estudiantes y lecturas de tejido en dos columnas compactas para ahorrar papel y tinta, imprimiendo la **Guía del Docente de forma separada**.
- **Validación de Compilación**: Modificación de las asignaciones de firmas TypeScript en `page.tsx` para permitir compilaciones limpias con `Exit code: 0`.

---

### [v1.1.0] — 2026-05-19
#### 🌟 NUEVAS CARACTERÍSTICAS
- **Planilla de Notas Multi-Actividades**: Ampliación del libro de calificaciones para soportar múltiples actividades calificables simultáneas en los ejes conceptuales (Saber, Hacer, Ser, Compartir).
- **Asistencia Offline**: Sistema de almacenamiento local para control de asistencia presencial en zonas de nula conectividad en Katsa Su.
- **Historial de Incidentes y Anotaciones**: Bitácora histórica por curso para registrar alertas pedagógicas, estudiantes en tránsito y novedades de aula.

---

### [v1.0.0] — 2026-05-07
#### 🌟 NUEVAS CARACTERÍSTICAS
- **Lanzamiento de Suite de Currículo e Horarios**: Integración del generador automático de currículos Awá ("Maza T+T", "Pas T+T", "Kutña T+T") y del horario escolar inteligente para el docente.
- **Módulo AI Curriculum Generator**: Primer generador de clases, talleres y guías docentes contextualizados al territorio escolar.
- **Autenticación Institucional**: Login seguro para docentes y administradores del IETABA.
