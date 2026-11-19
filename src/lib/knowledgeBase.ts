export interface KnowledgeArticle {
  id: string;
  category:
    | "calificaciones"
    | "asistencia"
    | "periodos"
    | "reportes"
    | "estudiantes"
    | "offline"
    | "convivencia"
    | "curriculo"
    | "horario"
    | "institucional"
    | "seguridad"
    | "sapred"
    | "directorio";
  title: string;
  summary: string;
  keywords: string[];
  steps?: string[];
  tips?: string;
  relatedRoute?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export const KNOWLEDGE_ARTICLES: KnowledgeArticle[] = [
  // ── 1. COCKPIT DIRECTOR DE GRUPO ───────────────────────────────────────────
  {
    id: "cockpit-director-grupo",
    category: "estudiantes",
    title: "¿Cómo funciona el Cockpit 360° para Directores de Grupo y Sentinel Pedagógico?",
    summary:
      "Panel integral para directores de grupo (`DOCENTE_DIRECTOR`, `RECTOR`, `COORDINADOR`) con Matriz de Calor Multimateria, Sentinel de Riesgo Académico (alerta si reprueba ≥3 materias), CRM de Acudientes con WhatsApp en 1 clic, Primeros Puestos oficiales y Actas.",
    keywords: [
      "director de grupo",
      "direccion de grupo",
      "cockpit",
      "tutor",
      "multimateria",
      "todas las materias",
      "matriz de calor",
      "crm",
      "acudientes",
      "whatsapp",
      "padres",
      "citacion",
      "sabana grupal",
      "tasa de promocion",
    ],
    steps: [
      "Ingresa a Estudiantes (/estudiantes) y selecciona la pestaña '👑 Cockpit Director de Grupo (360°)'.",
      "Elige tu Grado, Curso y el Período a analizar en la cabecera.",
      "Consulta los KPIs Bento: Tasa de Promoción grupal, Promedio General, Sentinel de Riesgo Crítico y alertas de Convivencia.",
      "Revisa la Matriz de Calor Multimateria para detectar de inmediato asignaturas reprobadas (< 3.0) o sin calificar, junto con el Puesto de período y Puesto Final.",
      "En el 'CRM de Acudientes', envía citaciones o felicitaciones a WhatsApp en 1 toque con mensaje institucional pre-redactado.",
      "Imprime el Acta Institucional de Compromiso (4 firmas) o exporta el consolidado grupal.",
    ],
    tips: "El Sentinel clasifica automáticamente al grupo en: 🟢 Óptimo (0 reprobadas), 🟡 Atención (1–2 reprobadas) y 🔴 Riesgo Crítico (≥3 materias reprobadas).",
    relatedRoute: "/estudiantes",
  },

  // ── 2. MOTOR ACADÉMICO SIEEE & CALIFICACIONES ──────────────────────────────
  {
    id: "pesos-sieee",
    category: "calificaciones",
    title: "¿Cómo se calculan las notas, pilares evaluados y nota anual en el SIEEE?",
    summary:
      "El motor oficial SIEEE de IETABA pondera 5 saberes: Saber (30%), Saber-Hacer (40%), Ser (20%), Convivencia (5%) y Autoevaluación (5%). Normaliza automáticamente sobre los pilares calificados, preserva el 0.0 real y permite recuperar con REC.",
    keywords: [
      "porcentajes",
      "pesos",
      "sieee",
      "saber",
      "saber hacer",
      "ser",
      "convivencia",
      "autoevaluacion",
      "formula",
      "definitiva",
      "ponderacion",
      "normaliza",
      "pilares",
    ],
    steps: [
      "Saber (SB · 30%): Evaluaciones teóricas y sustentaciones conceptuales (hasta 8 casillas SB1..SB8).",
      "Saber-Hacer (SBH · 40%): Talleres prácticos, guías y proyectos agroambientales (hasta 8 casillas SBH1..SBH8).",
      "Ser (SR · 20%): Actitud, identidad cultural Awá y trabajo en equipo (hasta 5 casillas SR1..SR5).",
      "Convivencia (CV · 5%): Cumplimiento del pacto de aula (hasta 3 casillas CV1..CV3).",
      "Autoevaluación (AUT · 5%): Valoración reflexiva única del estudiante (1 casilla AUT).",
      "Normalización en curso: si solo has calificado SB (4.0) y SBH (4.0), el motor divide entre la suma de los pesos activos (70%) dando 4.00 real (no 2.8).",
      "Cierre anual: Nota Final Anual = (P1 + P2 + P3) / 3. El umbral mínimo aprobatorio en IETABA es 3.0.",
    ],
    tips: "Las notas en cero (0.0) registradas explícitamente se conservan como evaluadas y nunca se tratan como casillas vacías.",
    relatedRoute: "/clase-en-vivo",
  },
  {
    id: "titulo-actividad-obligatorio",
    category: "calificaciones",
    title: "¿Por qué el sistema exige un nombre obligatorio para cada actividad?",
    summary:
      "Por directriz del SIEEE y transparencia pedagógica, toda columna evaluada debe tener un título descriptivo para el historial de actividades, las bitácoras y los dossiers a acudientes.",
    keywords: [
      "nombre",
      "titulo",
      "actividad",
      "obligatorio",
      "validar",
      "calificar",
      "crear columna",
    ],
    steps: [
      "En Clase en Vivo → Calificador de Actividades, selecciona el pilar (SB, SBH, SR, CV, AUT o REC) y la casilla.",
      "Digita un título descriptivo claro (ej. 'Taller de Siembra y Abonos Orgánicos').",
      "Si intentas guardar sin título, la app resaltará el campo para garantizar trazabilidad antes de persistir.",
    ],
    tips: "Evita títulos genéricos como 'Nota 1'; un buen nombre facilita la retroalimentación con padres en el Dossier 360°.",
    relatedRoute: "/clase-en-vivo",
  },
  {
    id: "recuperacion-periodo",
    category: "calificaciones",
    title: "¿Cómo se registran las recuperaciones (REC) y cómo afectan la definitiva?",
    summary:
      "Cada período incluye la casilla especial REC (Recuperación / Nivelación). Cuando el estudiante presenta su nivelación, el motor SIEEE reemplaza la nota parcial por la calificación de REC.",
    keywords: [
      "recuperar",
      "recuperacion",
      "rec",
      "nivelacion",
      "plan de mejoramiento",
      "reprobado",
      "bajo",
    ],
    steps: [
      "Abre Clase en Vivo (/clase-en-vivo) en modo Calificador de Actividades o Planilla / Gradebook, o edita la celda REC en /reportes/calificaciones.",
      "Registra la calificación obtenida en el plan de nivelación (0.0 a 5.0).",
      "El motor oficial SIEEE reemplaza la nota parcial del período con el valor de REC (respetando la escala de 1.0 a 5.0 y la aprobación ≥ 3.0).",
      "Puedes imprimir el Plan Estratégico de Nivelación firmado desde el perfil del estudiante o el Sentinel IA.",
    ],
    tips: "Al exportar a SAPRED, la columna REC no se incluye en el libro .xls porque SAPRED solo recibe hasta AUT.",
    relatedRoute: "/clase-en-vivo",
  },
  {
    id: "escala-valorativa",
    category: "calificaciones",
    title: "¿Cuál es la escala valorativa oficial y los desempeños en IETABA?",
    summary:
      "La escala institucional va de 1.0 a 5.0 (admite 0.0 registrado) clasificada en los 4 niveles de desempeño del Decreto 1290 / MEN.",
    keywords: [
      "escala",
      "desempeno",
      "superior",
      "alto",
      "basico",
      "bajo",
      "rango",
      "aprobacion",
      "nota minima",
    ],
    steps: [
      "🟢 Desempeño Superior: 4.6 a 5.0 (Excelente dominio e iniciativa).",
      "🔵 Desempeño Alto: 4.0 a 4.5 (Alcance satisfactorio de logros).",
      "🟡 Desempeño Básico: 3.0 a 3.9 (Alcance de competencias mínimas aprobatorias).",
      "🔴 Desempeño Bajo: 1.0 a 2.9 (Reprobación; requiere Plan de Nivelación y registro en REC).",
    ],
    tips: "La nota mínima aprobatoria en IETABA es 3.0. Puedes probar distintas combinaciones en el Simulador SIEEE de /ayuda.",
    relatedRoute: "/ayuda",
  },
  {
    id: "primeros-puestos-acumulado",
    category: "calificaciones",
    title: "¿Cómo se calculan los Primeros Puestos (P1/P2/P3/Final) y el Acumulado?",
    summary:
      "El sistema calcula puestos oficiales por salón bajo ranking de competencia 1-2-2-4 (empates comparten puesto) evaluando período activo, acumulado y cierre anual materia por materia.",
    keywords: [
      "primeros puestos",
      "puesto",
      "ranking",
      "cuadro de honor",
      "empate",
      "desempate",
      "acumulado",
      "nota final anual",
      "tres periodos",
      "3 periodos",
    ],
    steps: [
      "Los 3 períodos pesan exactamente igual (1/3 cada uno). En cierre anual: Def. Anual = (P1 + P2 + P3) / 3.",
      "Si el grupo ya evaluó un período y un estudiante no tiene nota en él, ese período cuenta como 0.0 en su acumulado para evitar distorsiones.",
      "Desempate oficial (orden): 1) Mejor promedio del alcance consultado -> 2) Mayor acumulado anual (o período activo) -> 3) Menor cantidad de inasistencias.",
      "Ranking de competencia 1-2-2-4: si dos estudiantes empatan exactamente tras redondear a 2 decimales, comparten puesto (ej. dos 1° puestos y el siguiente es 3°).",
      "En el Dashboard (/) puedes alternar la tarjeta de Primeros Puestos entre P1, P2, P3 y Final (3P).",
    ],
    tips: "En la proyección de cierre anual también se evalúa asignatura por asignatura para advertir si un alumno tiene buen promedio general pero reprueba una materia.",
    relatedRoute: "/",
  },

  // ── 3. CONECTOR SAPRED 360° & REPORTES ────────────────────────────────────
  {
    id: "sapred-conector-360",
    category: "sapred",
    title: "¿Cómo funciona el Conector SAPRED 360° (.xls Multi-Hoja) y el Orden SAPRED?",
    summary:
      "Integra EduManager directamente con las planillas oficiales .xls (BIFF8) de SAPRED en /reportes/calificaciones, llenando columnas hasta AUT sin alterar el orden ni el formato de SAPRED.",
    keywords: [
      "sapred",
      "xls",
      "conector sapred",
      "multi-hoja",
      "biff8",
      "llenar plantilla",
      "mojibake",
      "orden sapred",
      "falta en sapred",
      "no existe en edumanager",
      "cambio de salon",
      "datos modificados",
    ],
    steps: [
      "Ve a Reportes de Calificaciones (/reportes/calificaciones) y haz clic en 'Conector SAPRED (.xls)'.",
      "Flujo 1 (Llenar Plantilla SAPRED .xls): Sube el archivo .xls descargado de SAPRED (soporta 1 o varias hojas tipo '5-1__TPI', '6-6__FIS', etc.).",
      "El sistema repara codificación Latin1/UTF-8 (tildes/ñ), empareja materias y salones, y audita el 100% de las filas bajo la Regla 'Todo o Nada'.",
      "Si no hay novedades bloqueantes, descarga el libro .xls diligenciado hasta AUT (SB1..8, SBH1..8, SR1..5, CV1..3, AUT, conservando 0.0 real) y guarda automáticamente el orden oficial de SAPRED (sapredOrder).",
      "Flujo 2 (Exportar .XLS Multi-Hoja): Genera libros .xls BIFF8 listos para SAPRED por la materia actual o para todos los cursos/materias de tu horario.",
      "Usa el selector 'Orden: SAPRED' / 'Orden: A-Z' en la sábana de /reportes/calificaciones para visualizar la lista en el mismo orden de SAPRED.",
    ],
    tips: "Si la auditoría detecta FALTA_EN_SAPRED, NO_EXISTE_EN_EDUMANAGER, CAMBIO_DE_SALON, DATOS_MODIFICADOS o CODIGO_DUPLICADO, bloquea la descarga y ofrece 'Descargar Novedades (.xlsx)' con opción de sincronizar nombres.",
    relatedRoute: "/reportes/calificaciones",
  },
  {
    id: "reporte-riesgo-pe",
    category: "reportes",
    title: "¿Cómo usar el Reporte de Estudiantes Perdiendo y Sin Notas (PE)?",
    summary:
      "Emite informes oficiales en HTML/PDF con dos tablas separadas (PERDIENDO vs. PE - Pendiente por Evaluar) y 4 alcances calculados estrictamente sobre las asignaturas de tu horario.",
    keywords: [
      "perdiendo",
      "sin notas",
      "pendiente por evaluar",
      "pe",
      "materia perdida",
      "riesgo academico",
      "reporte de riesgo",
      "asignaturas del docente",
    ],
    steps: [
      "Ingresa a Calificaciones (/reportes/calificaciones) y abre 'Riesgo y Sin Notas (PE)'.",
      "Escoge el alcance: 'Esta Materia (Período)', 'Esta Materia (Final P1-P3)', 'Asig. Docente (Período)' o 'Asig. Docente (Final P1-P3)'.",
      "Tabla 1 (🔴 PERDIENDO / 🟡 MATERIA PERDIDA): lista únicamente estudiantes con calificaciones registradas cuya nota es < 3.00.",
      "Tabla 2 (⚪ PE — Pendiente por Evaluar): agrupa aparte a quienes no tienen ninguna nota registrada aún, evitando confundir ausentes con reprobados.",
    ],
    tips: "En los alcances 'Asig. Docente', el sistema cruza el horario semanal (schedule) para evaluar únicamente las materias que dictas en cada salón.",
    relatedRoute: "/reportes/calificaciones",
  },
  {
    id: "dossier-360-selector",
    category: "reportes",
    title: "¿Cómo generar el Dossier 360°, Dossiers en Lote y archivos ISO 15489?",
    summary:
      "El Dossier Ejecutivo 360° reúne KPIs, curva SVG de evolución a 2 decimales, pilares SIEEE y matriz de asignaturas con modos P1, P2, P3 o Final (3 Períodos), impresión en lote y nombres ISO 15489.",
    keywords: [
      "dossier",
      "dossier 360",
      "final 3 periodos",
      "lote",
      "dossiers lote",
      "pdf",
      "imprimir",
      "periodo 2",
      "periodo 3",
      "iso 15489",
      "guion",
    ],
    steps: [
      "En Estudiantes (/estudiantes) abre la ficha de un estudiante y elige en el selector el alcance: Periodo 1, Periodo 2, Periodo 3 o Final (3 Períodos).",
      "Pulsa 'Dossier 360° (PDF)' para abrir el informe individual listo para imprimir o guardar en PDF.",
      "Para imprimir un curso completo de una sola vez, usa el botón 'Dossiers Lote' en /estudiantes (genera un PDF multipágina con salto de página por estudiante).",
      "Los archivos se titulan bajo el estándar ISO 15489 / ISO 8601: IETABA_<TIPO>_<GRADO-CURSO>_<PERIODO>_<SUJETO>_<YYYYMMDD>.",
    ],
    tips: "Si un período aún no tiene notas cargadas aparecerá limpiamente con '—' (En Curso), con CERO datos inventados.",
    relatedRoute: "/estudiantes",
  },
  {
    id: "sabana-calificaciones-boletines",
    category: "reportes",
    title: "¿Cómo generar Sábanas, Boletines y exportar matrices a Excel (.xlsx)?",
    summary:
      "Consolida notas por salón y período en /reportes/calificaciones, imprime sábanas/boletines sin dependencias externas y exporta matrices completas a Excel nativo (.xlsx) con SheetJS.",
    keywords: [
      "sabana",
      "boletines",
      "reportes",
      "excel",
      "xlsx",
      "exportar",
      "consolidado",
      "imprimir sabana",
    ],
    steps: [
      "Accede a Calificaciones (/reportes/calificaciones) o usa la barra lateral / inferior en Reportes.",
      "Filtra por Asignatura, Grado, Curso y Período (y opcionalmente activa 'Orden: SAPRED').",
      "Usa 'Exportar Excel' para descargar la matriz en formato .xlsx real con ancho de columnas automático generado mediante SheetJS.",
      "Usa los botones de impresión oficial para generar Sábana Auxiliar de Calificaciones o Reporte BI / Riesgo 100% offline.",
    ],
    tips: "También puedes registrar o corregir calificaciones directamente sobre las celdas de la sábana en /reportes/calificaciones.",
    relatedRoute: "/reportes/calificaciones",
  },
  {
    id: "acta-compromiso-4firmas",
    category: "reportes",
    title: "¿Cómo generar el Acta de Compromiso Académico/Convivencial con 4 firmas?",
    summary:
      "Emite documentos formales en PDF desde la Ficha del Estudiante o el Cockpit con antecedentes reales y 4 espacios de firma institucional.",
    keywords: [
      "acta",
      "compromiso",
      "4 firmas",
      "firmas",
      "acudiente",
      "citacion",
      "coordinador",
      "rectoria",
    ],
    steps: [
      "En el perfil del estudiante (/estudiantes) o desde el Cockpit Grupal, haz clic en 'Acta Compromiso (PDF)'.",
      "El sistema compila automáticamente asignaturas en riesgo, promedio e historial del Observador Ley 1620.",
      "Imprime o guarda el PDF con los 4 recuadros de firma: Docente / Director de Grupo, Coordinador Académico, Estudiante y Acudiente / Familia.",
    ],
    tips: "Todos los reportes HTML/PDF funcionan 100% sin conexión a internet y aplican sanitización anti-XSS.",
    relatedRoute: "/estudiantes",
  },
  {
    id: "analitica-bi-sentinel",
    category: "reportes",
    title: "¿Cómo interpretar EduAI Sentinel v4.0 PRO y los gráficos de Analítica BI?",
    summary:
      "Panel predictivo en el Dashboard (/) con barras con gradiente y meta 3.0, curva de evolución, Radar SIEEE de 5 pilares, Dona de desempeño, Extraedad (> Grado + 8 años) y cruce de ausentismo vs. pérdida.",
    keywords: [
      "sentinel",
      "eduai sentinel",
      "analitica",
      "bi",
      "radar",
      "dona",
      "extraedad",
      "ausentismo",
      "tendencia",
      "graficos",
      "estadisticas",
    ],
    steps: [
      "En el Dashboard (/), el bloque EduAI Sentinel v4.0 PRO analiza en vivo tus cursos sin datos simulados.",
      "Explora las tarjetas 'Detección de Abandono y Riesgo', 'Optimización de Rendimiento SIEEE' y 'Tejido Curricular y Gestión de Aula', todas clicables.",
      "En el Centro de Analítica BI consulta Barras con meta aprobatoria 3.0, Curva de evolución, Radar SIEEE (Saber, Hacer, Ser, Convivencia, Autoevaluación) y Dona SIEEE.",
      "Revisa la pestaña de riesgo de 'No asistieron y perdieron' y los indicadores de Extraedad (> Grado + 8 años) en las tarjetas de Gobernanza para citar acudientes en 1 clic.",
    ],
    tips: "Puedes imprimir informes ejecutivos BI completos en PDF incluso en zonas rurales sin internet.",
    relatedRoute: "/",
  },

  // ── 4. DIRECTORIO DE DOCENTES & FORMATOS EXCEL "TODO O NADA" ───────────────
  {
    id: "directorio-docentes-excel",
    category: "directorio",
    title: "¿Cómo cargar la Base de Datos de Docentes (16 columnas) y usar el Directorio?",
    summary:
      "El módulo /directorio y la Consola Admin (/admin → Docentes) permiten descargar la plantilla oficial Excel de 16 columnas, validar bajo regla 'Todo o Nada' e importar el equipo institucional.",
    keywords: [
      "directorio",
      "docentes",
      "bd de docentes",
      "plantilla docentes",
      "plantilla de docentes",
      "cargar docentes",
      "16 columnas",
      "funcionarios",
      "profesores",
      "whatsapp docentes",
    ],
    steps: [
      "Ingresa a Directorio (/directorio) —o Consola Admin (/admin) → pestaña Docentes— y pulsa 'Plantilla Excel' para descargar el formato oficial de 16 columnas con fila(s) guía.",
      "Diligencia las 16 columnas: TIPO DOC., NRO DOCUMENTO (único), PRIMER/SEGUNDO APELLIDO, PRIMER/SEGUNDO NOMBRE, CORREO ELECTRONICO (único), TELEFONO / WHATSAPP, ROL INSTITUCIONAL (RECTOR, COORDINADOR, BIENESTAR, DOCENTE o DOCENTE_DIRECTOR), ES DIRECTOR DE GRUPO (SI/NO), GRADO DIRECTOR, CURSO DIRECTOR, ASIGNATURAS, CURSOS ASIGNADOS, SEDE / AREA y ESTADO (ACTIVO/INACTIVO).",
      "Si el rol es DOCENTE_DIRECTOR o ES DIRECTOR DE GRUPO = SI, debes llenar obligatoriamente GRADO DIRECTOR y CURSO DIRECTOR.",
      "Pulsa 'Importar Docentes' (requiere rol RECTOR, COORDINADOR, DOCENTE_DIRECTOR o SuperAdmin). Si hay al menos 1 error, la carga se bloquea y podrás descargar el Reporte de Novedades .xlsx.",
      "Si la validación pasa en limpio, confirma la importación para guardar en Firestore (/directorio), sincronizar masterData.teachers y actualizar la caché offline localStorage['edu_directorio'].",
    ],
    tips: "Desde las tarjetas del Directorio puedes contactar a cualquier compañero por WhatsApp, llamada o correo en 1 clic, filtrar por rol o exportar el directorio actualizado a .xlsx.",
    relatedRoute: "/directorio",
  },
  {
    id: "formatos-excel-gobernanza",
    category: "seguridad",
    title: "¿Cómo funcionan los 5 Formatos Excel (.xlsx) y la Regla Institucional 'Todo o Nada'?",
    summary:
      "Todas las importaciones masivas (Estudiantes SIMAT, Docentes 16 cols, Notas SIEEE, Horarios y Tejidos Awá) usan Excel .xlsx/.xls/.csv y aplican validación atómica 'Todo o Nada': ante 1 error se bloquea el 100% de la carga.",
    keywords: [
      "todo o nada",
      "novedades",
      "formato excel",
      "plantilla",
      "xlsx",
      "simat",
      "carga masiva",
      "importar",
      "bloqueada",
      "gobernanza",
      "sheetjs",
    ],
    steps: [
      "1. Estudiantes SIMAT (/estudiantes y /admin → Estudiantes): 16 columnas con validación de documento único, grado, curso, fecha de nacimiento, género y parentesco.",
      "2. Docentes y Directivos (/directorio y /admin → Docentes): 16 columnas con validación de documento/correo únicos, rol institucional y dirección de grupo.",
      "3. Planilla de Calificaciones SIEEE (Clase en Vivo → Gradebook): valida códigos pertenecientes al curso, duplicados, rango numérico 0.0–5.0 y soporte completo de REC.",
      "4. Malla Horaria (/configuracion y /horario): valida días hábiles, franjas oficiales, prohíbe asignar clase en descanso (10:30–11:00) y audita colisiones de salón/hora en Firestore.",
      "5. Tejidos de Aprendizaje Awá (/curriculo): exige Higra del Conocimiento, Temas de la Higra, 3 Hilos del Saber, Grado, Materia y Período sin duplicados.",
      "Ante cualquier novedad bloqueante, NO se modifica ningún registro en la BD y se descarga un 'Reporte de Novedades (.xlsx)' con la fila, columna y motivo exacto.",
    ],
    tips: "Descarga siempre primero la 'Plantilla Excel' del módulo correspondiente para conservar los encabezados exactos.",
    relatedRoute: "/admin",
  },

  // ── 5. GESTIÓN DE PERIODOS, CLASE EN VIVO Y OBSERVADOR ─────────────────────
  {
    id: "cierre-periodo-seguro",
    category: "periodos",
    title: "¿Cómo cerrar o avanzar un período académico de manera segura?",
    summary:
      "El cierre de período protege las notas registradas bloqueando ediciones accidentales mediante el Modal de Seguridad Académica con triple verificación (acceso administrativo).",
    keywords: [
      "cerrar periodo",
      "cierre",
      "avanzar",
      "bloquear",
      "candado",
      "gradebook",
      "p1",
      "p2",
      "p3",
      "reabrir",
    ],
    steps: [
      "Ingresa a Clase en Vivo (/clase-en-vivo) → pestaña 'Planilla / Gradebook' (o desde /admin).",
      "Haz clic en 'Cerrar Periodo'.",
      "En el Modal de Seguridad Académica, lee y marca los 3 checkboxes de verificación obligatoria.",
      "Confirma el bloqueo: el período quedará marcado como cerrado y sincronizado en settings/masterData.",
    ],
    tips: "Solo perfiles autorizados (Rector / Coordinador / SuperAdmin) pueden modificar configuraciones maestras globales en producción.",
    relatedRoute: "/clase-en-vivo",
  },
  {
    id: "asistencia-clase-en-vivo",
    category: "asistencia",
    title: "¿Cómo tomar asistencia y usar borrador automático, ruleta y cronómetro?",
    summary:
      "Control de asistencia en 1 toque con guardado de borrador local si cambias de pestaña, Ruleta de Participación, Cronómetro de aula y alertas de inasistencia (>20%).",
    keywords: [
      "asistencia",
      "tomar lista",
      "ruleta",
      "cronometro",
      "presente",
      "ausente",
      "tarde",
      "excusado",
      "borrador",
      "clase en vivo",
    ],
    steps: [
      "En Clase en Vivo (/clase-en-vivo), selecciona la Asignatura, Grado y Curso (o toca directamente un botón de salón o el chip de 'Borradores pendientes').",
      "En la lista de Asistencia, pulsa 'Marcar Todos Presentes' y ajusta las excepciones: Presente (P), Ausente (A), Tarde (T) o Excusado (E).",
      "Si tienes cambios sin guardar, la plataforma conserva un borrador en localStorage (draft_attendance_* / draft_activity_*) para evitar pérdidas.",
      "Usa la Ruleta de Participación para dinamizar la clase y el Cronómetro de Aula para medir tiempos de talleres.",
    ],
    tips: "Al superar el 20% de inasistencias se activa alerta preventiva y botón directo de citación por WhatsApp al acudiente.",
    relatedRoute: "/clase-en-vivo",
  },
  {
    id: "observador-ley-1620",
    category: "convivencia",
    title: "¿Cómo registrar una falta o felicitación en el Observador (Ley 1620)?",
    summary:
      "Documenta felicitaciones y situaciones Tipo I, II o III conforme a la Ley 1620, incluyendo descargos obligatorios del estudiante, compromisos y afectación opcional a Ser/Convivencia.",
    keywords: [
      "observador",
      "convivencia",
      "ley 1620",
      "falta",
      "tipo i",
      "tipo ii",
      "tipo iii",
      "leve",
      "grave",
      "gravisima",
      "felicitacion",
      "descargos",
    ],
    steps: [
      "Abre el perfil del estudiante en /estudiantes o toca un alumno para abrir su Ficha 360° modal.",
      "Entra en la pestaña 'Observador / Convivencia' y pulsa 'Nueva Observación'.",
      "Elige la tipificación: POSITIVA (Felicitación), LEVE (Tipo I), GRAVE (Tipo II) o GRAVISIMA (Tipo III).",
      "Describe objetivamente los hechos, registra los descargos del estudiante y decide si aplica impacto automático en la casilla de Ser (SR) o Convivencia (CV).",
      "Guarda el registro: queda disponible al instante para Actas de Compromiso con 4 firmas.",
    ],
    tips: "Todo registro convivencial respeta el debido proceso institucional y puede enviarse o resumirse en el Acta de Compromiso.",
    relatedRoute: "/estudiantes",
  },

  // ── 6. MODO OFFLINE-FIRST REAL & SEGURIDAD DE ROLES ────────────────────────
  {
    id: "modo-offline-sincronizacion",
    category: "offline",
    title: "¿Cómo funciona el Modo Offline-First (0ms) en zonas rurales sin internet?",
    summary:
      "EduManager utiliza caché persistente IndexedDB multi-pestaña de Firestore junto con respaldo inmediato en localStorage y fallback PWA (/~offline) para trabajar sin señal y sincronizar al reconectar.",
    keywords: [
      "offline",
      "sin internet",
      "sincronizar",
      "indexeddb",
      "localstorage",
      "territorio",
      "rural",
      "pwa",
      "vereda",
      "resguardo",
      "conexion",
    ],
    steps: [
      "Requisito de seguridad inicial: debes iniciar sesión al menos una vez con internet en el dispositivo para que tu perfil y datos autorizados queden cifrados/cacheados en local.",
      "En veredas sin señal, ingresa con tu sesión guardada (si no hay red, /login habilitará 'Ingresar en Modo Local (Sin Internet)' cuando exista caché válida).",
      "Todas las notas, asistencias, observaciones, agenda y directorio se guardan en 0ms en memoria, localStorage e IndexedDB sin congelar la interfaz.",
      "Al recuperar conexión, la barra de estado (OfflineToast) notifica el retorno a línea y Firestore sincroniza la cola pendiente automáticamente.",
    ],
    tips: "Antes de salir a campo sin internet, inicia sesión normalmente una vez con WiFi o datos y espera unos segundos a que carguen tus listados; luego puedes cerrar o usar la app instalada (PWA) en cualquier momento.",
    relatedRoute: "/configuracion",
  },
  {
    id: "seguridad-roles-acceso",
    category: "seguridad",
    title: "¿Cómo funcionan los Roles, la activación de cuentas PENDING y la Seguridad?",
    summary:
      "Toda ruta sensible exige sesión activa mediante RoleGuard y reglas estrictas en Firestore: las cuentas nuevas quedan PENDING hasta ser activadas por Rectoría/SuperAdmin, cumpliendo la Ley 1581.",
    keywords: [
      "seguridad",
      "rol",
      "roles",
      "permisos",
      "pending",
      "pendiente",
      "acceso en proceso",
      "activar usuario",
      "crear usuario",
      "admin",
      "superadmin",
      "docente_director",
      "ley 1581",
      "contraseña",
    ],
    steps: [
      "Roles institucionales: SuperAdmin / RECTOR (gobierno total y Consola Admin), COORDINADOR (administración académica y reportes), BIENESTAR (seguimiento y ficha 360°), DOCENTE_DIRECTOR (docente con Cockpit de Dirección de Grupo) y DOCENTE (aulas asignadas).",
      "Cuentas nuevas: al ingresar por primera vez con Google, tu perfil queda en estado PENDING ('Acceso en Proceso') sin acceso a datos de menores ni escrituras en BD hasta que un administrador lo active en /admin → Usuarios.",
      "Al ingresar por primera vez, debes leer completo el Acuerdo de Tratamiento de Datos (Ley 1581 de 2012) y completar tu perfil + horario semanal en /configuracion.",
      "Creación de usuarios (/admin): las contraseñas exigen mínimo 8 caracteres, una mayúscula y un número; la creación usa una instancia secundaria de Firebase Auth sin cerrar la sesión del administrador.",
      "En equipos compartidos, usa siempre 'Cerrar sesión' para limpiar toda caché local (offline_user, edu_students, edu_directorio, etc.).",
    ],
    tips: "Las reglas de Firestore bloquean lecturas y escrituras desde cuentas PENDING e impiden que un usuario modifique su propio rol o estado.",
    relatedRoute: "/admin",
  },

  // ── 7. CURRÍCULO AWÁ, HORARIO, ESTUDIANTES & IDENTIDAD ────────────────────
  {
    id: "curriculo-tejido-awa",
    category: "curriculo",
    title: "¿Cómo estructurar el Currículo con el Tejido de Aprendizaje Awá?",
    summary:
      "Organiza los planes por período teniendo la Higra del Conocimiento (Tuh Putkamna) como eje central, seguida de Temas de la Higra, Hilos del Saber (Piankammu Mi: SABER/HACER/SER), Sabidurías y PIAR.",
    keywords: [
      "curriculo",
      "malla",
      "tejido",
      "awa",
      "higra",
      "piankammumi",
      "tuhputkamna",
      "panapain",
      "nanpaskas",
      "sat ishkit",
      "piar",
      "copiloto",
      "lecturas",
    ],
    steps: [
      "Ingresa a Currículo (/curriculo) y selecciona Grado y Asignatura para ver los 3 períodos (Periodo 1, Periodo 2, Periodo 3) con contador real X/Y temas.",
      "Cada tema muestra la Higra del Conocimiento como núcleo principal, sus temas/ejes marcables al dictarse y los Hilos del Saber (SABER, HACER, SER) junto con Pañapain (propios), Ñanpaskas (interculturales) y Sat Ishkit Kamtana (Tejiendo Aprendo).",
      "Usa 'Copiloto de Lecciones' para generar planeaciones imprimibles, 'Adaptación PIAR' para flexibilizar contenidos, 'Lecturas del Tejido' para guías de comprensión y 'Radar de Competencias' para verificar el balance pedagógico.",
      "Puedes importar o exportar Tejidos de Aprendizaje desde Excel (.xlsx) siguiendo la Regla 'Todo o Nada'.",
    ],
    tips: "El porcentaje de cumplimiento curricular del período se actualiza al marcar cada tema de la Higra como completado.",
    relatedRoute: "/curriculo",
  },
  {
    id: "horario-agenda-docente",
    category: "horario",
    title: "¿Cómo gestionar mi Horario de Clases en Excel y la Agenda Escolar?",
    summary:
      "Importa tu horario semanal desde plantilla Excel (.xlsx) con detección automática de colisiones de salón/hora en Firestore y organiza tareas o días sin clase en la Agenda.",
    keywords: [
      "horario",
      "agenda",
      "bloques",
      "colision",
      "cruce de salon",
      "lunes",
      "viernes",
      "tareas",
      "kanban",
      "calendario",
    ],
    steps: [
      "En Configuración (/configuracion) o Horario (/horario), descarga la plantilla Excel de malla horaria (30 franjas de lunes a viernes excluyendo el descanso 10:30–11:00).",
      "Al subir el archivo, el sistema valida franjas y verifica contra Firestore (verifyScheduleCollisionsInFirestore) que ningún otro docente tenga asignado ese mismo salón a la misma hora.",
      "En Agenda (/agenda), alterna entre vistas Línea de Tiempo, Kanban o Semanal para gestionar tareas (TASK), avisos sin clase (NO_CLASS) o notas generales (GENERAL).",
    ],
    tips: "Los cursos de tu horario semanal alimentan automáticamente el filtro estricto myStudents para mostrarte solo tus salones reales.",
    relatedRoute: "/horario",
  },
  {
    id: "gestion-estudiantes-filtro",
    category: "estudiantes",
    title: "¿Cómo buscar estudiantes, editar acudientes, estado de matrícula o filtrar?",
    summary:
      "Búsqueda instantánea, filtros por curso o KPI de rendimiento, Ficha 360° interactiva, edición de datos de Acudiente y cambio de Estado de Matrícula.",
    keywords: [
      "estudiantes",
      "buscar",
      "filtro",
      "grado",
      "curso",
      "matricula",
      "acudiente",
      "telefono",
      "editar acudiente",
      "estado matricula",
    ],
    steps: [
      "En Estudiantes (/estudiantes), toca las tarjetas superiores (Promedio Grupal, Activos, En Riesgo, Superior) para filtrar la lista al instante.",
      "Selecciona un estudiante para abrir su Ficha 360° lateral.",
      "Pulsa el botón del estado de matrícula (ej. MATRICULADO / INACTIVO) para actualizarlo en 'StudentStatusModal', o 'Editar Acudiente' para actualizar parentesco, teléfono WhatsApp y correo en 'GuardianModal'.",
      "Para carga masiva de matrícula SIMAT usa 'Plantilla Excel' → 'Importar Excel' en /estudiantes o /admin.",
    ],
    tips: "La búsqueda encuentra estudiantes por apellidos, nombres o número de documento sin importar tildes ni mayúsculas.",
    relatedRoute: "/estudiantes",
  },
  {
    id: "identidad-institucional-ietaba",
    category: "institucional",
    title: "¿Cuál es la identidad institucional y enfoque de IETABA?",
    summary:
      "La Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá (IETABA) adscrita a la UNIPA articula la excelencia académica con la pervivencia cultural Awapit en Katsa Su, Nariño.",
    keywords: [
      "ietaba",
      "mision",
      "vision",
      "awa",
      "unipa",
      "barbacoas",
      "el diviso",
      "narino",
      "katsa su",
      "indigena",
      "bilingue",
      "agroambiental",
    ],
    steps: [
      "Institución: IETABA — Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá.",
      "Territorio: Resguardo Awá Katsa Su · El Diviso · Barbacoas, Nariño, Colombia.",
      "Organización: Adscrita a la UNIPA (Unidad Indígena del Pueblo Awá).",
      "Enfoque educativo: Bilingüe (Awapit – Español), Técnico Agroambiental e Intercultural.",
    ],
    tips: "EduManager Suite está diseñada pensando en la conectividad rural del territorio Katsa Su y los lineamientos propios del SIEEE.",
    relatedRoute: "/ayuda",
  },
];

function getArticlesByIds(...ids: string[]): KnowledgeArticle[] {
  return ids
    .map(id => KNOWLEDGE_ARTICLES.find(a => a.id === id))
    .filter((a): a is KnowledgeArticle => Boolean(a));
}

export const FAQS: FAQItem[] = [
  {
    question: "¿Cómo lleno la plantilla .xls oficial de SAPRED desde EduManager?",
    answer:
      "Ve a Reportes → Calificaciones (/reportes/calificaciones), abre 'Conector SAPRED (.xls)' y sube tu archivo descargado de SAPRED. El sistema repara tildes, audita todos los códigos bajo la regla 'Todo o Nada' y descarga el .xls diligenciado hasta AUT (incluyendo 0.0 reales), guardando además el orden de fila de SAPRED.",
    category: "SAPRED 360°",
    tags: ["sapred", "xls", "plantilla", "aut", "todo o nada"],
  },
  {
    question: "¿Qué plantilla uso para cargar la BD de docentes y el Directorio?",
    answer:
      "En /directorio (botón 'Plantilla Excel') o en /admin → pestaña Docentes ('Descargar Plantilla Excel') obtienes el formato oficial de 16 columnas (TIPO DOC., NRO DOCUMENTO, nombres/apellidos, CORREO ELECTRONICO, TELEFONO / WHATSAPP, ROL INSTITUCIONAL, ES DIRECTOR DE GRUPO, GRADO/CURSO DIRECTOR, ASIGNATURAS, CURSOS ASIGNADOS, SEDE / AREA y ESTADO). Solo usuarios autorizados pueden importarla.",
    category: "Directorio",
    tags: ["directorio", "docentes", "16 columnas", "plantilla", "excel"],
  },
  {
    question: "¿Por qué la plataforma bloquea la carga si una sola fila del Excel tiene error?",
    answer:
      "Por la Regla de Gobernanza Institucional 'Todo o Nada': si existe 1 documento o correo duplicado, una nota fuera de 0.0–5.0, un director de grupo sin grado/curso o una diferencia con SAPRED, se bloquea el 100% de la importación para evitar datos corruptos y se genera un Reporte de Novedades en Excel (.xlsx) indicando fila, columna y motivo.",
    category: "Gobernanza Excel",
    tags: ["todo o nada", "novedades", "bloqueo", "xlsx", "validacion"],
  },
  {
    question: "¿Qué significa 'PE' en el Reporte de Riesgo y qué estudiantes aparecen allí?",
    answer:
      "'PE' significa Pendiente por Evaluar (sin ninguna nota registrada aún). En /reportes/calificaciones → 'Riesgo y Sin Notas (PE)', la Tabla 1 muestra únicamente a los estudiantes que sí tienen notas y van reprobando (< 3.00), mientras la Tabla 2 separa a los 'PE' para no mezclar pendientes con reprobados.",
    category: "Reportes",
    tags: ["pe", "perdiendo", "sin notas", "riesgo", "reporte"],
  },
  {
    question: "¿Por qué antes 4.0 en Saber y 4.0 en Saber Hacer daba 2.8 y ahora da 4.0?",
    answer:
      "El motor oficial SIEEE normaliza sobre la suma de los pesos de los pilares que realmente tienen calificaciones registradas. Cuando hay notas solo en Saber (30%) y Saber-Hacer (40%), la nota parcial se calcula sobre ese 70% activo (= 4.00), evitando castigar al estudiante por pilares que aún no han sido evaluados en el período.",
    category: "SIEEE",
    tags: ["sieee", "normalizacion", "pilares", "formula", "acumulado"],
  },
  {
    question: "¿Cómo se resuelven los empates en los Primeros Puestos?",
    answer:
      "Los Primeros Puestos usan ranking de competencia (1-2-2-4): si hay empate al redondear a 2 decimales, se desempata por mayor promedio acumulado (o período activo) y luego por menor número de inasistencias. Si persiste el empate exacto, los estudiantes comparten el mismo puesto.",
    category: "Calificaciones",
    tags: ["puestos", "empate", "ranking", "cuadro de honor"],
  },
  {
    question: "¿Por qué en el Dossier el Período 3 aparece con guiones (—)?",
    answer:
      "Porque ese período aún no tiene notas registradas para ese grado. Para consultar notas consolidadas anteriores o generar el consolidado completo, usa el selector junto al botón del Dossier y elige 'Periodo 2' o 'Final (3 Períodos)'.",
    category: "Reportes",
    tags: ["dossier", "periodo 3", "final", "guiones", "en curso"],
  },
  {
    question: "¿Cómo recupera un estudiante una nota reprobada?",
    answer:
      "En Clase en Vivo (/clase-en-vivo) o en la Sábana (/reportes/calificaciones), ingresa la nota en la casilla 'REC' (Recuperación). Según la regla SIEEE, el valor registrado en REC reemplaza automáticamente la nota parcial del período.",
    category: "Calificaciones",
    tags: ["recuperacion", "rec", "nivelacion", "reprobado"],
  },
  {
    question: "¿Cómo exporto sábanas, matrículas o el directorio a Excel?",
    answer:
      "Todas las exportaciones del sistema ahora se descargan en libros Excel nativos (.xlsx) generados con SheetJS, y desde /reportes/calificaciones → 'Conector SAPRED (.xls)' también puedes exportar directamente libros multi-hoja .xls (BIFF8) compatibles con SAPRED.",
    category: "Reportes",
    tags: ["exportar", "excel", "xlsx", "xls", "sapred", "sabana"],
  },
  {
    question: "¿Por qué una cuenta nueva ve la pantalla 'Acceso en Proceso' o no puede entrar sin internet?",
    answer:
      "Por seguridad (Ley 1581), las cuentas recién registradas quedan en estado PENDING sin permisos de lectura ni escritura hasta que Rectoría o un SuperAdmin las active en /admin → Usuarios. Además, el botón de Modo Local sin internet solo se habilita si el usuario ya inició sesión previamente en ese dispositivo.",
    category: "Seguridad y Roles",
    tags: ["pending", "acceso en proceso", "seguridad", "offline", "roles", "admin"],
  },
];

// ── MOTOR DE INTELIGENCIA DE BÚSQUEDA Y CONTEXTO 100% (v2.17.0) ────────────────

export function queryKnowledgeBase(userPrompt: string): {
  reply: string;
  suggestedArticles?: KnowledgeArticle[];
  actionLink?: { label: string; url: string };
} {
  const clean = userPrompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 1. Conector SAPRED 360° (.xls Multi-Hoja & Orden SAPRED)
  if (
    clean.includes("sapred") ||
    clean.includes(".xls") ||
    clean.includes("biff8") ||
    clean.includes("mojibake") ||
    clean.includes("falta_en_sapred") ||
    clean.includes("falta en sapred") ||
    clean.includes("llenar plantilla") ||
    clean.includes("orden sapred")
  ) {
    return {
      reply:
        "🔗 **Conector SAPRED 360° (.xls Multi-Hoja):**\n\n• **Flujo 1 — Llenar Plantilla SAPRED (.xls):** Sube tu archivo descargado de SAPRED en `/reportes/calificaciones` → **Conector SAPRED (.xls)**. Repara codificación, empareja por `CODIGO` y llena hasta `AUT` (conservando `0.0` real) bajo regla **Todo o Nada**.\n• **Flujo 2 — Exportar .XLS Multi-Hoja:** Genera archivos BIFF8 listos para SAPRED por la materia actual o por todo tu horario.\n• **Orden Persistente:** Guarda el orden exacto de lista de SAPRED y te permite alternar `Orden: SAPRED` / `Orden: A-Z` en la sábana.",
      suggestedArticles: getArticlesByIds(
        "sapred-conector-360",
        "formatos-excel-gobernanza",
        "sabana-calificaciones-boletines"
      ),
      actionLink: {
        label: "Abrir Calificaciones y Conector SAPRED",
        url: "/reportes/calificaciones",
      },
    };
  }

  // 2. Directorio de Docentes y Plantilla de 16 Columnas
  if (
    clean.includes("directorio") ||
    clean.includes("16 columnas") ||
    clean.includes("bd de docentes") ||
    clean.includes("base de datos de docentes") ||
    clean.includes("cargar docentes") ||
    clean.includes("importar docentes") ||
    clean.includes("plantilla de docentes") ||
    clean.includes("plantilla docente") ||
    clean.includes("plantilla excel de docentes") ||
    clean.includes("funcionarios")
  ) {
    return {
      reply:
        "🏫 **Directorio Institucional y Plantilla de Docentes (16 Columnas):**\n\n1. Descarga la **Plantilla Excel** desde `/directorio` o en `/admin` → pestaña **Docentes** (incluye hoja de ejemplo e instrucciones).\n2. Incluye `TIPO DOC.`, `NRO DOCUMENTO` (único), nombres/apellidos, `CORREO ELECTRONICO` (único), `TELEFONO / WHATSAPP`, `ROL INSTITUCIONAL`, dirección de grupo (`SI/NO`, grado y curso), `ASIGNATURAS`, `CURSOS ASIGNADOS`, `SEDE / AREA` y `ESTADO`.\n3. Valida bajo la regla **Todo o Nada**, guarda en `/directorio/{uid}` en Firestore y respalda en caché local para acceso WhatsApp/teléfono en 1 clic.",
      suggestedArticles: getArticlesByIds(
        "directorio-docentes-excel",
        "formatos-excel-gobernanza",
        "seguridad-roles-acceso"
      ),
      actionLink: { label: "Abrir Directorio Institucional", url: "/directorio" },
    };
  }

  // 3. Regla "Todo o Nada" y Formatos Excel Oficiales (.xlsx)
  if (
    clean.includes("todo o nada") ||
    clean.includes("novedades") ||
    clean.includes("formato excel") ||
    clean.includes("formatos excel") ||
    clean.includes("plantilla") ||
    clean.includes("xlsx") ||
    clean.includes("simat") ||
    clean.includes("carga masiva") ||
    clean.includes("importar")
  ) {
    return {
      reply:
        "🛡️ **Formatos Excel Oficiales (.xlsx) y Regla 'Todo o Nada':**\n\nEduManager audita el **100% del archivo** antes de guardar:\n\n• **5 Plantillas Oficiales:** Estudiantes SIMAT, Directorio Docentes (16 cols), Planilla de Calificaciones SIEEE (con `REC`), Malla Horaria (con chequeo de colisiones) y Tejidos Awá.\n• **Si hay al menos 1 error** (duplicados, campos obligatorios vacíos, notas fuera de `0.0–5.0` o cruces de horario), **se bloquea el 100% de la carga** y descargas el **Reporte de Novedades (.xlsx)** exacto.",
      suggestedArticles: getArticlesByIds(
        "formatos-excel-gobernanza",
        "directorio-docentes-excel",
        "sapred-conector-360"
      ),
      actionLink: { label: "Ir a Consola Maestra Admin", url: "/admin" },
    };
  }

  // 4. Primeros Puestos, Empates y Acumulado Anual (3 Períodos)
  if (
    clean.includes("puesto") ||
    clean.includes("ranking") ||
    clean.includes("cuadro de honor") ||
    clean.includes("empate") ||
    clean.includes("desempate") ||
    clean.includes("acumulado") ||
    clean.includes("nota final anual") ||
    clean.includes("3 periodos") ||
    clean.includes("tres periodos")
  ) {
    return {
      reply:
        "🏆 **Primeros Puestos (P1/P2/P3/Final) y Acumulado Anual:**\n\n• **Pesos anuales iguales (1/3 cada período):** `Nota Final = (P1 + P2 + P3) / 3`. Si un período ya fue evaluado en el grupo y un alumno no tiene nota en él, cuenta como `0.0`.\n• **Ranking de Competencia (1-2-2-4):** Empates reales comparten puesto tras redondear a 2 decimales.\n• **Desempate:** 1) Promedio del alcance -> 2) Acumulado anual -> 3) Menor número de inasistencias.",
      suggestedArticles: getArticlesByIds(
        "primeros-puestos-acumulado",
        "pesos-sieee",
        "dossier-360-selector"
      ),
      actionLink: { label: "Ver Cuadro de Honor en Inicio", url: "/" },
    };
  }

  // 5. Reporte Oficial de Estudiantes Perdiendo y Pendientes (PE)
  if (
    /\bpe\b/.test(clean) ||
    clean.includes("pendiente por evaluar") ||
    clean.includes("perdiendo") ||
    clean.includes("sin notas") ||
    clean.includes("materia perdida") ||
    clean.includes("reporte de riesgo") ||
    clean.includes("riesgo academico")
  ) {
    return {
      reply:
        "📉 **Reporte de Estudiantes Perdiendo y Pendientes (PE):**\n\nEn `/reportes/calificaciones` → **Riesgo y Sin Notas (PE)** obtienes dos tablas separadas:\n\n1. **Tabla 1 (`🔴 PERDIENDO` / `🟡 MATERIA PERDIDA`):** Únicamente alumnos con notas registradas cuyo promedio es `< 3.00`.\n2. **Tabla 2 (`⚪ PE — Pendiente por Evaluar`):** Alumnos sin notas registradas aún (evita mezclar pendientes con reprobados).\n• Soporta alcances por materia o por **asignaturas reales de tu horario** en el período o cierre anual.",
      suggestedArticles: getArticlesByIds(
        "reporte-riesgo-pe",
        "sabana-calificaciones-boletines",
        "recuperacion-periodo"
      ),
      actionLink: {
        label: "Abrir Reporte de Riesgo y PE",
        url: "/reportes/calificaciones",
      },
    };
  }

  // 6. Analítica BI, Radar SIEEE, Extraedad & EduAI Sentinel v4.0 PRO
  if (
    clean.includes("sentinel") ||
    clean.includes("analitica") ||
    /\bbi\b/.test(clean) ||
    clean.includes("radar") ||
    clean.includes("extraedad") ||
    clean.includes("dona") ||
    clean.includes("ausentismo") ||
    clean.includes("estadistica")
  ) {
    return {
      reply:
        "🧠 **EduAI Sentinel v4.0 PRO y Centro de Analítica BI 360°:**\n\n• **Métricas 100% reales en vivo:** Distribución SIEEE (`Superior`, `Alto`, `Básico`, `Bajo`), Radar de 5 pilares (`Saber`, `Hacer`, `Ser`, `Convivencia`, `AUT`), Barras con meta `3.0` y Dona porcentual.\n• **Alertas de Extraedad y Deserción:** Identifica estudiantes con edad `> Grado + 8 años` y el cruce de *No asistieron y perdieron*, con citación a WhatsApp en 1 clic e informes imprimibles 100% offline.",
      suggestedArticles: getArticlesByIds(
        "analitica-bi-sentinel",
        "cockpit-director-grupo",
        "pesos-sieee"
      ),
      actionLink: { label: "Explorar Sentinel en Inicio", url: "/" },
    };
  }

  // 7. Roles, Permisos, Cuentas PENDING, Consola Admin & Ley 1581
  if (
    /\brol\b/.test(clean) ||
    /\broles\b/.test(clean) ||
    clean.includes("permiso") ||
    clean.includes("pending") ||
    clean.includes("pendiente de autoriz") ||
    clean.includes("acceso en proceso") ||
    clean.includes("activar usuario") ||
    clean.includes("activar cuenta") ||
    clean.includes("crear usuario") ||
    clean.includes("docente_director") ||
    clean.includes("ley 1581") ||
    clean.includes("contrasena") ||
    clean.includes("superadmin") ||
    clean.includes("consola") ||
    /\badmin\b/.test(clean)
  ) {
    return {
      reply:
        "🔐 **Roles Institucionales, Activación de Cuentas y Seguridad (Ley 1581):**\n\n• **Roles:** `RECTOR` / `SuperAdmin` (gobierno total y `/admin`), `COORDINADOR`, `BIENESTAR`, `DOCENTE_DIRECTOR` (acceso habilitado al Cockpit de Dirección de Grupo) y `DOCENTE`.\n• **Cuentas `PENDING`:** Todo usuario nuevo queda bloqueado en **Acceso en Proceso** hasta que Rectoría o SuperAdmin lo active en `/admin` → **Usuarios**.\n• **Protección de Datos:** Reglas estrictas en Firestore impiden elevar privilegios, y `Cerrar sesión` limpia toda la caché offline del navegador.",
      suggestedArticles: getArticlesByIds(
        "seguridad-roles-acceso",
        "directorio-docentes-excel",
        "cockpit-director-grupo"
      ),
      actionLink: { label: "Abrir Consola de Administración", url: "/admin" },
    };
  }

  // 8. Cockpit 360° Director de Grupo & CRM Acudientes
  if (
    clean.includes("cockpit") ||
    clean.includes("director de grupo") ||
    clean.includes("direccion de grupo") ||
    clean.includes("matriz de calor") ||
    clean.includes("crm") ||
    clean.includes("acudiente") ||
    clean.includes("whatsapp")
  ) {
    return {
      reply:
        "👑 **Cockpit 360° para Directores de Grupo y CRM de Acudientes:**\n\n1. Ve a **Estudiantes (`/estudiantes`)** → pestaña **Cockpit Director de Grupo (360°)** (habilitada para `DOCENTE_DIRECTOR`, `RECTOR` y `COORDINADOR`).\n2. Revisa la **Matriz de Calor Multimateria**, tasas de promoción y puestos de período/final.\n3. Desde el **CRM de Acudientes**, edita datos del responsable o envía citaciones por **WhatsApp en 1 clic** e imprime el **Acta de Compromiso (4 firmas)**.",
      suggestedArticles: getArticlesByIds(
        "cockpit-director-grupo",
        "gestion-estudiantes-filtro",
        "acta-compromiso-4firmas"
      ),
      actionLink: { label: "Ir al Cockpit de Estudiantes", url: "/estudiantes" },
    };
  }

  // 9. SIEEE / Pesos / Porcentajes / Pilares / Fórmula
  if (
    clean.includes("porcentaje") ||
    clean.includes("peso") ||
    clean.includes("sieee") ||
    clean.includes("calcular") ||
    clean.includes("formula") ||
    clean.includes("ponderacion") ||
    clean.includes("saber") ||
    clean.includes("definitiva")
  ) {
    return {
      reply:
        "📊 **Motor Oficial SIEEE (IETABA):**\n\nLa definitiva de período pondera 5 saberes:\n• **Saber (SB): 30%** (hasta 8 notas)\n• **Saber-Hacer (SBH): 40%** (hasta 8 notas)\n• **Ser (SR): 20%** (hasta 5 notas)\n• **Convivencia (CV): 5%** (hasta 3 notas)\n• **Autoevaluación (AUT): 5%** (1 nota)\n\n📌 **Normalización automática:** si un período está en curso y solo hay notas en algunos pilares, se normaliza sobre los pesos calificados (ej. `4.0` en SB + `4.0` en SBH = `4.00` real). **REC** reemplaza la nota parcial y el mínimo aprobatorio es **3.0**.",
      suggestedArticles: getArticlesByIds(
        "pesos-sieee",
        "recuperacion-periodo",
        "escala-valorativa"
      ),
      actionLink: { label: "Ir al Calificador en Clase en Vivo", url: "/clase-en-vivo" },
    };
  }

  // 10. Dossier 360°, Dossiers Lote & Actas 4 Firmas
  if (
    clean.includes("dossier") ||
    clean.includes("lote") ||
    clean.includes("iso 15489") ||
    clean.includes("periodo 3") ||
    clean.includes("periodo 2") ||
    clean.includes("inventad") ||
    clean.includes("guion") ||
    clean.includes("en curso") ||
    clean.includes("boletin") ||
    clean.includes("sabana") ||
    clean.includes("4 firmas") ||
    clean.includes("acta")
  ) {
    return {
      reply:
        "📑 **Dossier 360°, Lote PDF, Sábanas y Actas (ISO 15489):**\n\n1. **Selector de Período:** Elige `Periodo 1`, `Periodo 2`, `Periodo 3` o **`Final (3 Períodos)`** junto al botón del Dossier en `/estudiantes`.\n2. **Dossiers en Lote:** Pulsa **Dossiers Lote** para imprimir en un solo PDF todos los estudiantes filtrados.\n3. **Sábanas y Excel (.xlsx):** En `/reportes/calificaciones` puedes imprimir sábanas oficiales, descargar Excel `.xlsx` nativo o usar el **Conector SAPRED (.xls)**.\n4. **CERO datos inventados:** Períodos sin calificaciones muestran limpiamente `—`.",
      suggestedArticles: getArticlesByIds(
        "dossier-360-selector",
        "sabana-calificaciones-boletines",
        "acta-compromiso-4firmas"
      ),
      actionLink: { label: "Ir al Módulo de Estudiantes", url: "/estudiantes" },
    };
  }

  // 11. Cierre y Seguridad de Periodos
  if (
    clean.includes("cerrar") ||
    clean.includes("cierre") ||
    clean.includes("avanzar") ||
    clean.includes("bloquear") ||
    clean.includes("candado") ||
    clean.includes("reabrir")
  ) {
    return {
      reply:
        "🔒 **Cierre y Seguridad de Periodos:**\n\nPara bloquear formalmente un período y evitar cambios accidentales:\n\n1. Ingresa a **Clase en Vivo → Planilla / Gradebook** (o a `/admin`).\n2. Haz clic en **Cerrar Periodo**.\n3. Marca los **3 checkboxes** obligatorios del **Modal de Seguridad Académica**.\n4. Confirma el bloqueo para sincronizar el candado en `settings/masterData`.",
      suggestedArticles: getArticlesByIds("cierre-periodo-seguro", "pesos-sieee"),
      actionLink: { label: "Ir a Clase en Vivo / Gradebook", url: "/clase-en-vivo" },
    };
  }

  // 12. Asistencia / Ruleta / Cronómetro / Borradores en Clase en Vivo
  if (
    clean.includes("asistencia") ||
    clean.includes("tomar lista") ||
    clean.includes("ruleta") ||
    clean.includes("cronometro") ||
    clean.includes("presente") ||
    clean.includes("ausente") ||
    clean.includes("tarde") ||
    clean.includes("borrador") ||
    clean.includes("herramienta")
  ) {
    return {
      reply:
        "⏱️ **Clase en Vivo, Asistencia y Borradores Automáticos:**\n\n• **Asistencia en 1 toque:** Pulsa 'Marcar Todos Presentes' y marca solo las excepciones (P/A/T/E).\n• **Borradores Locales Seguros:** Las asistencias y notas no guardadas se respaldan temporalmente como borrador para recuperarlas al instante desde el chip superior.\n• **Herramientas de Aula:** Usa la **Ruleta de Participación** y el **Cronómetro** en vivo. Con >20% de fallas se activa alerta de deserción.",
      suggestedArticles: getArticlesByIds(
        "asistencia-clase-en-vivo",
        "modo-offline-sincronizacion"
      ),
      actionLink: { label: "Abrir Clase en Vivo", url: "/clase-en-vivo" },
    };
  }

  // 13. Observador / Convivencia / Ley 1620
  if (
    clean.includes("observador") ||
    clean.includes("convivencia") ||
    clean.includes("falta") ||
    clean.includes("1620") ||
    clean.includes("descargo") ||
    clean.includes("felicitacion") ||
    clean.includes("compromiso")
  ) {
    return {
      reply:
        "⚖️ **Observador del Estudiante (Ley 1620):**\n\nRegistra en el perfil del estudiante:\n• ✨ **Positiva (Felicitación)** · 🟡 **Tipo I (Leve)** · 🟠 **Tipo II (Grave)** · 🔴 **Tipo III (Gravísima)**.\n• Incluye campo obligatorio para los **descargos del estudiante**, afectación opcional a notas de **Ser (SR)** o **Convivencia (CV)** y exportación en **Acta de Compromiso (4 firmas)**.",
      suggestedArticles: getArticlesByIds(
        "observador-ley-1620",
        "acta-compromiso-4firmas"
      ),
      actionLink: { label: "Ver Perfil de Estudiantes", url: "/estudiantes" },
    };
  }

  // 14. Modo Offline-First (IndexedDB + PWA)
  if (
    clean.includes("offline") ||
    clean.includes("internet") ||
    clean.includes("sin senal") ||
    clean.includes("sin conexion") ||
    clean.includes("sync") ||
    clean.includes("sincroniz") ||
    clean.includes("indexeddb") ||
    clean.includes("vereda") ||
    clean.includes("resguardo")
  ) {
    return {
      reply:
        "📡 **Arquitectura Offline-First (0ms) en Territorio Awá:**\n\n• **Doble Motor Local:** Firestore `persistentLocalCache` (IndexedDB multi-pestaña) + caché inmediata en `localStorage` y fallback PWA `/~offline`.\n• **Seguridad:** Por protección de datos, debes haber iniciado sesión al menos una vez con conexión en el dispositivo para usar el botón **Ingresar en Modo Local (Sin Internet)**.\n• **Sincronización automática:** Al volver la señal, todo trabajo de notas, asistencia o agenda se sincroniza sin pérdida.",
      suggestedArticles: getArticlesByIds(
        "modo-offline-sincronizacion",
        "seguridad-roles-acceso"
      ),
      actionLink: { label: "Ver Configuración y Respaldos", url: "/configuracion" },
    };
  }

  // 15. Currículo / Tejido Awá / Higra / PIAR / Copiloto
  if (
    clean.includes("curriculo") ||
    clean.includes("malla") ||
    clean.includes("tejido") ||
    clean.includes("higra") ||
    clean.includes("piankammu") ||
    clean.includes("tuhputkamna") ||
    clean.includes("panapain") ||
    clean.includes("nanpaskas") ||
    clean.includes("sat ishkit") ||
    clean.includes("piar") ||
    clean.includes("copiloto") ||
    clean.includes("leccion")
  ) {
    return {
      reply:
        "🌿 **Currículo y Tejido de Aprendizaje Awá (v2):**\n\n• **Higra del Conocimiento (`Tuh Putkamna`):** Núcleo central del tema con seguimiento real `X/Y temas` por período.\n• **Hilos del Saber (`Piankammu Mi`):** Dimensiones **SABER**, **HACER** y **SER**, articuladas con **Pañapain** (propios), **Ñanpaskas** (interculturales) y **Sat Ishkit Kamtana**.\n• **Herramientas IA:** Copiloto de Lecciones, Adaptación **PIAR**, Lecturas del Tejido y Radar de Competencias.",
      suggestedArticles: getArticlesByIds(
        "curriculo-tejido-awa",
        "formatos-excel-gobernanza"
      ),
      actionLink: { label: "Ir al Módulo de Currículo", url: "/curriculo" },
    };
  }

  // 16. Recuperaciones / Nivelaciones (REC)
  if (
    clean.includes("recupera") ||
    clean.includes("nivelaci") ||
    /\brec\b/.test(clean) ||
    clean.includes("reprob") ||
    clean.includes("mejoramiento")
  ) {
    return {
      reply:
        "🔄 **Recuperaciones y Nivelaciones (`REC`):**\n\n1. En Clase en Vivo (`/clase-en-vivo`) o en la Sábana (`/reportes/calificaciones`), ubica la casilla **`REC`**.\n2. Registra la calificación obtenida (de `0.0` a `5.0`).\n3. El motor oficial SIEEE reemplaza la nota parcial del período por el valor de **`REC`** y recalcula puestos y acumulados al instante.",
      suggestedArticles: getArticlesByIds("recuperacion-periodo", "pesos-sieee"),
      actionLink: { label: "Ir al Calificador", url: "/clase-en-vivo" },
    };
  }

  // 17. Escala Valorativa / Rangos
  if (
    clean.includes("escala") ||
    clean.includes("desempeno") ||
    clean.includes("superior") ||
    clean.includes("alto") ||
    clean.includes("basico") ||
    clean.includes("bajo") ||
    clean.includes("nota minima") ||
    clean.includes("pasar")
  ) {
    return {
      reply:
        "🎯 **Escala Valorativa Oficial IETABA:**\n\n• 🟢 **Superior (4.6 - 5.0):** Dominio excepcional.\n• 🔵 **Alto (4.0 - 4.5):** Alcance satisfactorio.\n• 🟡 **Básico (3.0 - 3.9):** Mínimo aprobatorio requerido.\n• 🔴 **Bajo (1.0 - 2.9):** Reprobación; requiere nivelación en `REC`.",
      suggestedArticles: getArticlesByIds("escala-valorativa", "pesos-sieee"),
      actionLink: { label: "Abrir Simulador SIEEE en Ayuda", url: "/ayuda" },
    };
  }

  // 18. Horario y Agenda Escolar
  if (
    clean.includes("horario") ||
    clean.includes("agenda") ||
    clean.includes("bloque") ||
    clean.includes("colision") ||
    clean.includes("semana") ||
    clean.includes("tarea") ||
    clean.includes("kanban") ||
    clean.includes("calendario")
  ) {
    return {
      reply:
        "📅 **Horario en Excel (sin Colisiones) y Agenda Escolar:**\n\n• **Horario (`/horario` y `/configuracion`):** Descarga la plantilla Excel de 30 franjas, súbela y el sistema audita en Firestore que no haya cruces de salón/hora con otros docentes.\n• **Agenda (`/agenda`):** Organiza tareas, días `Sin Clase` y bitácoras en vista Línea de Tiempo, Kanban o Semanal.",
      suggestedArticles: getArticlesByIds(
        "horario-agenda-docente",
        "formatos-excel-gobernanza"
      ),
      actionLink: { label: "Ver Horario de Clases", url: "/horario" },
    };
  }

  // 19. Identidad Institucional IETABA / UNIPA / Katsa Su
  if (
    clean.includes("ietaba") ||
    clean.includes("colegio") ||
    clean.includes("escuela") ||
    clean.includes("mision") ||
    clean.includes("unipa") ||
    clean.includes("barbacoas") ||
    clean.includes("el diviso") ||
    clean.includes("katsa") ||
    clean.includes("narino") ||
    clean.includes("institucion")
  ) {
    return {
      reply:
        "🏛️ **Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá (IETABA):**\n\n• **Ubicación:** Resguardo Awá Katsa Su · El Diviso · Barbacoas, Nariño.\n• **Organización:** Adscrita a la UNIPA (Unidad Indígena del Pueblo Awá).\n• **Enfoque:** Educación bilingüe (Awapit – Español), técnica agroambiental e intercultural.",
      suggestedArticles: getArticlesByIds("identidad-institucional-ietaba"),
      actionLink: { label: "Ver Centro de Ayuda Completo", url: "/ayuda" },
    };
  }

  // 20. Estudiantes y Ficha 360°
  if (
    clean.includes("estudiante") ||
    clean.includes("matricula") ||
    clean.includes("ficha") ||
    clean.includes("filtr") ||
    clean.includes("buscar alumno")
  ) {
    return {
      reply:
        "🧑‍🎓 **Gestión de Estudiantes y Ficha 360°:**\n\n• En **Estudiantes (`/estudiantes`)** filtra por grado, curso o tarjetas de rendimiento (`Activos`, `En Riesgo`, `Superior`).\n• Al seleccionar un alumno puedes generar el **Dossier 360°**, editar acudiente, cambiar estado de matrícula o registrar anotaciones del **Observador Ley 1620**.",
      suggestedArticles: getArticlesByIds(
        "gestion-estudiantes-filtro",
        "cockpit-director-grupo",
        "dossier-360-selector"
      ),
      actionLink: { label: "Abrir Estudiantes", url: "/estudiantes" },
    };
  }

  // 21. Búsqueda por palabras clave sobre todos los artículos
  const matchedArticles = KNOWLEDGE_ARTICLES.filter(art => {
    const titleNorm = art.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const summaryNorm = art.summary.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return (
      art.keywords.some(k => clean.includes(k.toLowerCase())) ||
      clean.includes(art.category) ||
      titleNorm.includes(clean) ||
      summaryNorm.includes(clean)
    );
  });

  if (matchedArticles.length > 0) {
    const top = matchedArticles[0];
    return {
      reply: `💡 **${top.title}**\n\n${top.summary}\n\n${top.steps ? "• " + top.steps.join("\n• ") : ""}`,
      suggestedArticles: matchedArticles.slice(0, 3),
      actionLink: top.relatedRoute
        ? { label: "Abrir módulo relacionado", url: top.relatedRoute }
        : undefined,
    };
  }

  // 22. Respuesta guía inicial actualizada (v2.17.0)
  return {
    reply:
      "👋 ¡Hola! Soy **EduAwá**, tu Asistente Pedagógico IETABA (**v2.17.0**) con contexto actualizado de toda la suite. Puedes preguntarme sobre:\n\n1. 🔗 **Conector SAPRED 360°:** Plantillas `.xls` multi-hoja, exportación BIFF8 y `Orden: SAPRED`.\n2. 🏫 **Directorio de Docentes:** Plantilla Excel oficial de 16 columnas e importación masiva.\n3. 🛡️ **Regla 'Todo o Nada' Excel:** Los 5 formatos `.xlsx` oficiales y Reporte de Novedades.\n4. 📊 **SIEEE & Primeros Puestos:** Normalización de pilares, `REC`, acumulado `(P1+P2+P3)/3` y ranking `1-2-2-4`.\n5. 📉 **Riesgo (PE), Dossier 360° y Sentinel BI:** Perdiendo vs. Pendientes (`PE`), Dossiers en Lote y Extraedad.\n6. 🔐 **Roles, Cuentas `PENDING` y Modo Offline Real:** IndexedDB, `DOCENTE_DIRECTOR` y Ley 1581.\n\n¿Qué tema deseas consultar?",
    suggestedArticles: getArticlesByIds(
      "sapred-conector-360",
      "directorio-docentes-excel",
      "pesos-sieee",
      "formatos-excel-gobernanza"
    ),
  };
}
