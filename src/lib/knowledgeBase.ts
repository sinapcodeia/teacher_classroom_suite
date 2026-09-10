export interface KnowledgeArticle {
  id: string;
  category: "calificaciones" | "asistencia" | "periodos" | "reportes" | "estudiantes" | "offline" | "convivencia" | "curriculo" | "horario" | "institucional" | "seguridad";
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
  {
    id: "cockpit-director-grupo",
    category: "estudiantes",
    title: "¿Cómo funciona el Cockpit 360° para Directores de Grupo y Sentinel Pedagógico?",
    summary: "Panel de control integral para directores de grupo con Matriz de Calor Multimateria, Sentinel de Riesgo Académico (alerta si reprueba ≥3 materias), CRM de Acudientes con WhatsApp en 1-clic y exportación de Sábanas.",
    keywords: ["director de grupo", "direccion de grupo", "cockpit", "tutor", "homeroom", "multimateria", "todas las materias", "matriz de calor", "sentinel", "riesgo", "acudientes", "whatsapp", "padres", "citacion", "sabana", "promedio grupal", "tasa de promocion"],
    steps: [
      "Ingrese a 'Estudiantes' (/estudiantes) y pulse la pestaña '👑 Cockpit Director de Grupo (360°)'.",
      "Seleccione su Grado y Curso en la cabecera superior.",
      "Consulte los KPIs Bento: Tasa de Promoción grupal, Promedio General, Sentinel de Riesgo Crítico y Convivencia.",
      "Revise la Matriz de Calor Multimateria para identificar al instante qué asignaturas tienen calificaciones reprobadas (<3.0) o pendientes.",
      "Acceda al 'CRM de Acudientes': Envíe notificaciones y citaciones directas a WhatsApp en 1 toque con plantilla institucional.",
      "Genere e imprima el Acta Institucional Oficial con 4 firmas o exporte la Sábana Grupal en CSV."
    ],
    tips: "El Sentinel clasifica automáticamente a los estudiantes en: 🟢 Óptimo (0 reprobadas), 🟡 Atención (1-2 reprobadas) y 🔴 Riesgo Crítico (≥3 materias reprobadas).",
    relatedRoute: "/estudiantes"
  },

  // ── 1. SIEEE & CALIFICACIONES ──────────────────────────────────────────────
  {
    id: "pesos-sieee",
    category: "calificaciones",
    title: "¿Cómo se calculan las notas y qué porcentaje tiene cada Saber (SIEEE)?",
    summary: "El SIEEE institucional de IETABA pondera 5 dimensiones formativas: Saber (30%), Saber-Hacer (40%), Ser (20%), Convivencia (5%) y Autoevaluación (5%).",
    keywords: ["porcentajes", "pesos", "sieee", "saber", "hacer", "ser", "convivencia", "autoevaluacion", "formula", "definitiva", "ponderacion", "promedio"],
    steps: [
      "Saber (SB - 30%): Evaluaciones teóricas, exámenes y sustentaciones conceptuales (hasta 8 columnas).",
      "Saber-Hacer (SBH - 40%): Talleres prácticos, guías de campo y proyectos agroambientales (hasta 8 columnas).",
      "Ser (SR - 20%): Participación, actitud, identidad cultural Awá y trabajo en equipo (hasta 5 columnas).",
      "Convivencia (CV - 5%): Cumplimiento del pacto de aula y normas escolares (hasta 3 columnas).",
      "Autoevaluación (AUT - 5%): Valoración reflexiva propia del estudiante (1 nota única)."
    ],
    tips: "La definitiva se calcula en tiempo real promediando cada dimensión y aplicando su porcentaje. Umbral mínimo aprobatorio: 3.0.",
    relatedRoute: "/clase-en-vivo"
  },
  {
    id: "titulo-actividad-obligatorio",
    category: "calificaciones",
    title: "¿Por qué el sistema exige un nombre obligatorio para cada actividad?",
    summary: "Por directriz del SIEEE y transparencia pedagógica, toda columna de notas debe tener un nombre descriptivo para los boletines y reportes a padres de familia.",
    keywords: ["nombre", "titulo", "actividad", "obligatorio", "validar", "calificar", "crear columna"],
    steps: [
      "Al pulsar '+' para crear una columna en SB, SBH, SR o CV, digite el nombre de la actividad (ej. 'Taller de Siembra y Abonos Orgánicos').",
      "Si el campo está vacío, el sistema le recordará asignar un título antes de guardar las notas.",
      "Esto asegura que en los boletines y dossiers los acudientes sepan con exactitud qué se evaluó."
    ],
    tips: "Evite nombres genéricos como 'Nota 1' o 'Taller'. Use descripciones formativas claras.",
    relatedRoute: "/clase-en-vivo"
  },
  {
    id: "recuperacion-periodo",
    category: "calificaciones",
    title: "¿Cómo se registran las recuperaciones (Nivelaciones) y cómo afectan la definitiva?",
    summary: "En el calificador por saberes, cada periodo cuenta con un slot especial 'REC' para registrar notas de nivelación.",
    keywords: ["recuperar", "recuperacion", "rec", "nivelacion", "plan de mejoramiento", "reprobado", "bajo"],
    steps: [
      "Abra el Calificador en Clase en Vivo.",
      "Ubique al estudiante con nota reprobada (< 3.0) y haga clic en la casilla 'REC'.",
      "Digite la nota obtenida en la sustentación del plan de mejoramiento.",
      "Si la nota es aprobatoria (3.0 o superior), el sistema recalcula automáticamente la definitiva del periodo según la norma SIEEE."
    ],
    tips: "Las actividades de nivelación deben registrarse con soporte en el acta de comisiones.",
    relatedRoute: "/clase-en-vivo"
  },
  {
    id: "escala-valorativa",
    category: "calificaciones",
    title: "¿Cuál es la escala valorativa oficial y los desempeños en IETABA?",
    summary: "La escala institucional va de 1.0 a 5.0 clasificada en 4 niveles de desempeño oficial del MEN.",
    keywords: ["escala", "desempeño", "superior", "alto", "basico", "bajo", "rango", "aprobacion"],
    steps: [
      "🟢 Desempeño Superior: 4.6 a 5.0 (Excelente dominio de competencias)",
      "🔵 Desempeño Alto: 4.0 a 4.5 (Buen dominio con logros destacados)",
      "🟡 Desempeño Básico: 3.0 a 3.9 (Cumplimiento de los estándares mínimos aprobatorios)",
      "🔴 Desempeño Bajo: 1.0 a 2.9 (No alcanza los logros mínimos, requiere nivelación obligatoria)"
    ],
    tips: "La nota mínima para aprobar cualquier asignatura o periodo es 3.0.",
    relatedRoute: "/reportes/calificaciones"
  },

  // ── 2. DOSSIER 360° & REPORTES ─────────────────────────────────────────────
  {
    id: "dossier-360-selector",
    category: "reportes",
    title: "¿Cómo generar el Dossier 360° en PDF y cómo elegir el periodo?",
    summary: "El Dossier Ejecutivo incluye KPIs de rendimiento, gráfica de evolución, sabidurías y matriz de asignaturas con selector de periodo y CERO datos inventados.",
    keywords: ["dossier", "pdf", "imprimir", "periodo 2", "periodo 3", "acudiente", "informe", "curva", "bento", "kpi"],
    steps: [
      "Abra el perfil del estudiante en el módulo Estudiantes.",
      "Junto al botón 'Dossier 360° (PDF)', verá un desplegable para seleccionar 'Periodo 1', 'Periodo 2' o 'Periodo 3'.",
      "Si el Periodo 3 está en curso y desea ver las notas consolidadas anteriores, seleccione 'Periodo 2'.",
      "Haga clic en 'Dossier 360° (PDF)' para abrir la vista ejecutiva de impresión."
    ],
    tips: "El Dossier muestra datos 100% reales. Si un periodo no tiene calificaciones, aparecerá limpiamente con '—' (En Curso) sin notas ficticias.",
    relatedRoute: "/estudiantes"
  },
  {
    id: "acta-compromiso-4firmas",
    category: "reportes",
    title: "¿Cómo generar el Acta de Compromiso Académico/Convivencial con 4 firmas?",
    summary: "Genera un documento legal en PDF para citación a padres y acuerdos pedagógicos institucionales.",
    keywords: ["acta", "compromiso", "firmas", "acudiente", "citacion", "reunion", "coordinador", "rectoria"],
    steps: [
      "En el perfil del estudiante (`/estudiantes`), haga clic en 'Acta Compromiso (PDF)'.",
      "El sistema redacta automáticamente los antecedentes académicos y convivenciales del alumno.",
      "Imprima o guarde el PDF listo con los 4 recuadros de firma: Docente/Director de Grupo, Coordinador Académico, Estudiante y Padre/Madre de Familia."
    ],
    tips: "Este documento tiene validez institucional para comisiones de evaluación y promoción.",
    relatedRoute: "/estudiantes"
  },
  {
    id: "sabana-calificaciones-boletines",
    category: "reportes",
    title: "¿Cómo generar la Sábana General y los Boletines por Grado?",
    summary: "Visualice el rendimiento global de todo el curso o descargue boletines individuales listos para entrega de notas.",
    keywords: ["sabana", "boletines", "reportes", "imprimir boletin", "consolidado", "todos los estudiantes"],
    steps: [
      "Diríjase a la sección de Reportes (`/reportes` o `/reportes/calificaciones`).",
      "Seleccione el Grado, Grupo y Periodo que desea consolidar.",
      "Haga clic en 'Descargar Sábana' para una vista de matriz completa o 'Imprimir Boletines' para el paquete consolidado."
    ],
    tips: "Puede exportar las matrices a formato CSV o Excel para respaldos externos.",
    relatedRoute: "/reportes"
  },

  // ── 3. GESTIÓN DE PERIODOS & SEGURIDAD ─────────────────────────────────────
  {
    id: "cierre-periodo-seguro",
    category: "periodos",
    title: "¿Cómo cerrar o avanzar un periodo de manera segura?",
    summary: "El cierre de periodo bloquea las notas para evitar alteraciones accidentales y activa el nuevo periodo con el Modal de Seguridad Académica.",
    keywords: ["cerrar", "periodo", "avanzar", "bloquear", "seguridad", "gradebook", "p1", "p2", "p3", "candado"],
    steps: [
      "Diríjase a la sección de Calificaciones / Gradebook en Clase en Vivo.",
      "Haga clic en el botón 'Cerrar Periodo'.",
      "Aparecerá el Modal de Seguridad Académica. Lea y marque los 3 checkboxes de verificación obligatoria.",
      "Haga clic en 'Confirmar y Bloquear Periodo'. Los datos se sincronizarán en todos sus dispositivos."
    ],
    tips: "Si necesita reabrir un periodo para una corrección justificada, el sistema solicitará confirmación administrativa.",
    relatedRoute: "/clase-en-vivo"
  },

  // ── 4. CLASE EN VIVO & ASISTENCIA ──────────────────────────────────────────
  {
    id: "asistencia-clase-en-vivo",
    category: "asistencia",
    title: "¿Cómo tomar asistencia y usar las herramientas dinámicas de aula?",
    summary: "Control de asistencia en 1 toque, ruleta de participación aleatoria y cronómetro pedagógico.",
    keywords: ["asistencia", "tomar lista", "ruleta", "cronometro", "presente", "ausente", "tarde", "excusado", "herramientas"],
    steps: [
      "En Clase en Vivo (`/clase-en-vivo`), pulse 'Marcar Todos Presentes' para agilizar la sesión.",
      "Modifique las excepciones en 1 toque: 🟢 Presente (P), 🔴 Ausente (A), 🟡 Tarde (T), 🔵 Excusado (E).",
      "Utilice la **Ruleta de Participación** para seleccionar estudiantes al azar y fomentar la participación equitativa.",
      "Active el **Cronómetro de Aula** para ejercicios y talleres con tiempo limitado."
    ],
    tips: "El sistema alerta automáticamente a los estudiantes que superen el 20% de inasistencias por riesgo de pérdida de asignatura.",
    relatedRoute: "/clase-en-vivo"
  },

  // ── 5. OBSERVADOR DEL ESTUDIANTE (LEY 1620) ────────────────────────────────
  {
    id: "observador-ley-1620",
    category: "convivencia",
    title: "¿Cómo registrar una falta o felicitación en el Observador (Ley 1620)?",
    summary: "Permite registrar faltas leves, graves, gravísimas o felicitaciones con descargos del estudiante y compromisos pedagógicos.",
    keywords: ["observador", "convivencia", "ley 1620", "falta", "leve", "grave", "gravisima", "felicitacion", "descargos", "manual de convivencia"],
    steps: [
      "En el perfil del estudiante (`/estudiantes`), ingrese a la pestaña 'Observador'.",
      "Haga clic en 'Nuevo Registro Convivencial'.",
      "Seleccione la tipificación: ✨ Felicitación, 🟡 Tipo I (Leve), 🟠 Tipo II (Grave) o 🔴 Tipo III (Gravísima).",
      "Escriba la descripción objetiva de los hechos, registre los **descargos del estudiante** y las acciones formativas acordadas.",
      "Guarde el registro. Este alimentará automáticamente la hoja de vida institucional."
    ],
    tips: "Todo registro convivencial garantiza el debido proceso y permite la impresión de actas legales.",
    relatedRoute: "/estudiantes"
  },

  // ── 6. MODO OFFLINE & SINCRONIZACIÓN ──────────────────────────────────────
  {
    id: "modo-offline-sincronizacion",
    category: "offline",
    title: "¿Cómo funciona el modo offline en zonas rurales sin internet?",
    summary: "EduManager Suite guarda todo localmente de forma instantánea y se sincroniza con la nube automáticamente al detectar conexión.",
    keywords: ["offline", "sin internet", "sincronizar", "nube", "guardar", "territorio", "rural", "pwa", "resguardo", "conexion"],
    steps: [
      "Puede calificar, tomar asistencia y redactar observaciones en cualquier vereda o territorio sin señal.",
      "El sistema almacena los datos de forma segura en la memoria local de su equipo o tablet.",
      "Cuando vuelva a tener conexión WiFi o datos móviles, la app detectará el estado ONLINE y sincronizará en segundo plano con la base de datos Firestore."
    ],
    tips: "No se pierde ningún dato si se apaga el equipo o se interrumpe el fluido eléctrico.",
    relatedRoute: "/configuracion"
  },

  // ── 7. CURRÍCULO & TEJIDO DE APRENDIZAJE AWÁ ──────────────────────────────
  {
    id: "curriculo-tejido-awa",
    category: "curriculo",
    title: "¿Cómo estructurar el Currículo con el Tejido de Aprendizaje Awá?",
    summary: "Organice los planes de estudio integrando la cosmovisión Awá: piankammuMi, tuhPutkamna, panapain, nanpaskas y adaptaciones PIAR.",
    keywords: ["curriculo", "malla", "tejido", "awa", "piankammumi", "tuhputkamna", "panapain", "nanpaskas", "piar", "copiloto", "unidades"],
    steps: [
      "Ingrese a Currículo (`/curriculo`).",
      "Seleccione el Grado y Asignatura para ver los 3 periodos y núcleos temáticos (piankammuMi).",
      "Utilice el **Copiloto de Lecciones** para generar secuencias didácticas contextualizadas al territorio.",
      "Use el botón **Adaptación PIAR** para flexibilizar contenidos para estudiantes con necesidades educativas especiales.",
      "Consulte el **Radar de Competencias** para evaluar el equilibrio entre saberes ancestrales y competencias nacionales."
    ],
    tips: "Puede importar mallas curriculares institucionales desde archivos CSV o PDF.",
    relatedRoute: "/curriculo"
  },

  // ── 8. HORARIO & AGENDA ESCOLAR ───────────────────────────────────────────
  {
    id: "horario-agenda-docente",
    category: "horario",
    title: "¿Cómo gestionar mi Horario de Clases y la Agenda Escolar?",
    summary: "Consulte sus bloques de clase semanales, registre tareas programadas, días cívicos o alertas institucionales.",
    keywords: ["horario", "agenda", "bloques", "lunes", "martes", "miercoles", "jueves", "viernes", "tareas", "calendario"],
    steps: [
      "En Horario (`/horario`), visualice su distribución semanal por horas, materias y salones.",
      "En Agenda (`/agenda`), registre compromisos académicos clasificados por 'Tarea', 'Sin Clase' o 'Nota General'.",
      "El Asistente de Inicio de Clase en Vivo le notificará automáticamente los eventos del día."
    ],
    tips: "La agenda se sincroniza con el panel de inicio del docente para no olvidar ninguna entrega.",
    relatedRoute: "/horario"
  },

  // ── 9. INSTITUCIONAL & IDENTIDAD IETABA ───────────────────────────────────
  {
    id: "identidad-institucional-ietaba",
    category: "institucional",
    title: "¿Cuál es la misión y contexto territorial de la I.E.I.T.A.B.?",
    summary: "La Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá (IETABA) forma líderes para la pervivencia cultural y ambiental del pueblo Awá en Barbacoas, Nariño.",
    keywords: ["ietaba", "mision", "vision", "awa", "unipa", "barbacoas", "narino", "rectoria", "indigena", "bilingue", "agroambiental"],
    steps: [
      "Institución: I.E.I.T.A.B. (Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá).",
      "Ubicación: Territorio Ancestral Awá, Municipio de Barbacoas, Nariño, Colombia.",
      "Organización Indígena: Adscrita a la UNIPA (Unidad Indígena del Pueblo Awá).",
      "Enfoque: Educación intercultural bilingüe (Awapit - Español) y técnica agroambiental."
    ],
    tips: "EduManager Suite respeta y promueve la identidad del pueblo Awá (Gente de la Montaña).",
    relatedRoute: "/ayuda"
  },

  // ── 10. ESTUDIANTES & MATRÍCULA ───────────────────────────────────────────
  {
    id: "gestion-estudiantes-filtro",
    category: "estudiantes",
    title: "¿Cómo buscar estudiantes, filtrar por curso o consultar acudientes?",
    summary: "Búsqueda predictiva instantánea, filtros por grado/curso, visualización de acudientes y diagnóstico pedagógico IA.",
    keywords: ["estudiantes", "buscar", "filtro", "grado", "curso", "matricula", "acudiente", "telefono", "diagnostico"],
    steps: [
      "En Estudiantes (`/estudiantes`), use el selector de cursos (ej. 'Grado 7°') o elija 'Todas las Materias'.",
      "Escriba en el buscador cualquier nombre, apellido o número de documento.",
      "Haga clic en el estudiante para abrir su Ficha 360° con diagnóstico pedagógico, datos de contacto del acudiente y desglose académico."
    ],
    tips: "Haga clic en el número de teléfono del acudiente para iniciar una llamada directa desde su celular o tablet.",
    relatedRoute: "/estudiantes"
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "¿Por qué en el Dossier el Periodo 3 aparece con guiones (—)?",
    answer: "Porque el Periodo 3 está actualmente en curso y aún no se han registrado calificaciones para ese grado. Para consultar las notas consolidadas anteriores, use el selector junto al botón del Dossier y elija 'Periodo 2'.",
    category: "Reportes",
    tags: ["dossier", "periodo 3", "guiones", "en curso", "notas inventadas"]
  },
  {
    question: "¿Cómo recupera un estudiante una nota reprobada?",
    answer: "En el Calificador por Saberes de Clase en Vivo, ingrese la nota obtenida en el slot 'REC' (Recuperación). Si la nota es aprobatoria (3.0 o superior), el sistema actualizará automáticamente la definitiva del periodo.",
    category: "Calificaciones",
    tags: ["recuperacion", "rec", "nivelacion", "reprobado", "plan de mejoramiento"]
  },
  {
    question: "¿Qué escala valorativa usa el colegio IETABA?",
    answer: "La escala va de 1.0 a 5.0: Superior (4.6 - 5.0), Alto (4.0 - 4.5), Básico (3.0 - 3.9) y Bajo (1.0 - 2.9). El umbral mínimo de aprobación es 3.0.",
    category: "SIEEE",
    tags: ["escala", "desempeño", "superior", "alto", "basico", "bajo", "formula"]
  },
  {
    question: "¿Cómo generar el Acta de Compromiso con 4 firmas?",
    answer: "En el perfil del estudiante (`/estudiantes`), haga clic en 'Acta Compromiso (PDF)'. Se generará un documento formal con firmas para Docente, Coordinador, Estudiante y Acudiente.",
    category: "Convivencia",
    tags: ["acta", "compromiso", "firmas", "acudiente", "reunion", "ley 1620"]
  },
  {
    question: "¿Puedo usar la aplicación desde el celular o tablet sin internet?",
    answer: "Sí, la plataforma es una PWA (Progressive Web App) con arquitectura Local-First. Todo se guarda localmente al instante y se sincroniza con la nube tan pronto detecte internet.",
    category: "Tecnología",
    tags: ["celular", "tablet", "pwa", "movil", "offline", "sin internet", "sincronizacion"]
  },
  {
    question: "¿Cómo exportar o respaldar las notas en Excel o CSV?",
    answer: "En el módulo de Reportes (`/reportes`), seleccione el grado y periodo deseado, y haga clic en 'Exportar CSV' o 'Descargar Sábana'. Obtendrá una copia estructurada de todas las notas.",
    category: "Reportes",
    tags: ["exportar", "csv", "excel", "descargar", "respaldo", "sabana"]
  },
  {
    question: "¿Qué significa el indicador 'REC' en la tabla de calificaciones?",
    answer: "Corresponde al slot de 'Recuperación'. Permite ingresar la calificación de las nivelaciones de periodo. Si es mayor o igual a 3.0, actualiza la definitiva institucional.",
    category: "Calificaciones",
    tags: ["rec", "slot", "recuperacion", "columna"]
  },
  {
    question: "¿Qué es piankammuMi en el módulo de Currículo?",
    answer: "En la cosmovisión Awá, piankammuMi significa 'Hilos del Saber' (Núcleo Temático Principal). Representa el eje conceptual que articula las unidades de aprendizaje con la vida comunitaria.",
    category: "Currículo Awá",
    tags: ["piankammumi", "hilos del saber", "curriculo", "awa", "cosmovision"]
  },
  {
    question: "¿Cómo funciona la Ruleta de Participación en Clase en Vivo?",
    answer: "En el módulo Clase en Vivo, abra la herramienta 'Ruleta de Participación'. El sistema seleccionará de forma aleatoria y animada a un estudiante del grupo para motivar la participación equitativa.",
    category: "Clase en Vivo",
    tags: ["ruleta", "participacion", "aleatorio", "clase en vivo", "dinamica"]
  },
  {
    question: "¿Qué pasa si cierro la ventana por error mientras califico?",
    answer: "No te preocupes. EduManager Suite guarda cada cambio en tiempo real en la memoria local de tu navegador. Al volver a abrir la página, tus notas estarán intactas.",
    category: "Seguridad",
    tags: ["guardar", "autoguardado", "cerrar ventana", "perdida de datos"]
  }
];

// ── MOTOR DE INTELIGENCIA DE BÚSQUEDA Y CONTEXTO 100% ─────────────────────────

export function queryKnowledgeBase(userPrompt: string): {
  reply: string;
  suggestedArticles?: KnowledgeArticle[];
  actionLink?: { label: string; url: string };
} {
  const clean = userPrompt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. SIEEE / Pesos / Porcentajes / Sabidurías
  if (
    clean.includes("porcentaje") || clean.includes("peso") || clean.includes("sieee") || 
    clean.includes("calcular") || clean.includes("formula") || clean.includes("ponderacion") ||
    clean.includes("saber") || clean.includes("saber hacer") || clean.includes("definitiva")
  ) {
    return {
      reply: "📊 **Ponderación Oficial del SIEEE (IETABA):**\n\nLa nota definitiva se calcula mediante 5 sabidurías formativas:\n\n• **Saber (SB): 30%** (Exámenes teóricos y sustentaciones - hasta 8 notas)\n• **Saber-Hacer (SBH): 40%** (Talleres prácticos y proyectos agroambientales - hasta 8 notas)\n• **Ser (SR): 20%** (Actitud, identidad cultural Awá y trabajo en equipo - hasta 5 notas)\n• **Convivencia (CV): 5%** (Cumplimiento del pacto de aula - hasta 3 notas)\n• **Autoevaluación (AUT): 5%** (Valoración reflexiva del alumno - 1 nota única)\n\n📌 **Regla Institucional:** El umbral mínimo aprobatorio es **3.0** sobre 5.0.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[0], KNOWLEDGE_ARTICLES[1], KNOWLEDGE_ARTICLES[2]],
      actionLink: { label: "Ir al Calificador en Clase en Vivo", url: "/clase-en-vivo" }
    };
  }

  // 2. Dossier 360° / Periodo 3 / Datos en Curso / Informes
  if (
    clean.includes("dossier") || clean.includes("periodo 3") || clean.includes("periodo 2") || 
    clean.includes("inventad") || clean.includes("guion") || clean.includes("en curso") || 
    clean.includes("kpi") || clean.includes("grafica") || clean.includes("bento")
  ) {
    return {
      reply: "📑 **Dossier 360° y Veracidad Pedagógica:**\n\nEl sistema opera con **CERO datos inventados**:\n\n1. **Selector de Periodo:** Junto al botón 'Dossier 360° (PDF)' en el perfil del estudiante, puedes elegir entre **Periodo 1, Periodo 2 o Periodo 3**.\n2. **Periodos en curso:** Si eliges un periodo aún no calificado (como Periodo 3), verás limpiamente **'—' (En Curso)** sin notas falsas.\n3. **Informes consolidados:** Para entregar informes a padres de familia con notas completas, selecciona **'Periodo 2'**.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[4], KNOWLEDGE_ARTICLES[5]],
      actionLink: { label: "Ir al Módulo de Estudiantes", url: "/estudiantes" }
    };
  }

  // 3. Cierre y Seguridad de Periodos
  if (
    clean.includes("cerrar") || clean.includes("cierre") || clean.includes("avanzar") || 
    clean.includes("bloquear") || clean.includes("seguridad") || clean.includes("candado") ||
    clean.includes("modal") || clean.includes("reabrir")
  ) {
    return {
      reply: "🔒 **Cierre y Seguridad de Periodos:**\n\nPara cerrar formalmente un periodo y proteger las notas contra cambios accidentales:\n\n1. Ingresa a **Clase en Vivo → Calificaciones / Gradebook**.\n2. Haz clic en el botón **'Cerrar Periodo'**.\n3. Se abrirá el **Modal de Seguridad Académica**. Marca los 3 checkboxes de verificación obligatoria.\n4. Confirma el bloqueo. El candado se activará en todos tus dispositivos sincronizados.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[7]],
      actionLink: { label: "Ir a Calificaciones / Gradebook", url: "/clase-en-vivo" }
    };
  }

  // 4. Asistencia / Ruleta / Cronómetro / Clase en Vivo
  if (
    clean.includes("asistencia") || clean.includes("lista") || clean.includes("ruleta") || 
    clean.includes("cronometro") || clean.includes("presente") || clean.includes("ausente") || 
    clean.includes("tarde") || clean.includes("falla") || clean.includes("herramienta")
  ) {
    return {
      reply: "⏱️ **Gestión de Clase en Vivo y Asistencia:**\n\n• **Asistencia en 1 Toque:** Usa 'Marcar Todos Presentes' y cambia solo las excepciones (🟢 Presente, 🔴 Ausente, 🟡 Tarde, 🔵 Excusado).\n• **Ruleta de Participación:** Dinamiza tu clase seleccionando estudiantes al azar con animación interactiva.\n• **Cronómetro de Aula:** Proyecta temporizadores para ejercicios y talleres de grupo.\n• **Alertas de Inasistencia:** El sistema detecta estudiantes con más del 20% de fallas para prevención de deserción.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[8]],
      actionLink: { label: "Abrir Clase en Vivo", url: "/clase-en-vivo" }
    };
  }

  // 5. Observador / Convivencia / Ley 1620 / Faltas / Descargos
  if (
    clean.includes("observador") || clean.includes("convivencia") || clean.includes("falta") || 
    clean.includes("1620") || clean.includes("descargo") || clean.includes("sancion") || 
    clean.includes("felicitacion") || clean.includes("compromiso")
  ) {
    return {
      reply: "⚖️ **Observador del Estudiante (Ley 1620):**\n\nPermite documentar el proceso formativo y disciplinario:\n\n• ✨ **Felicitación:** Reconocimiento al mérito, liderazgo o ayuda comunitaria.\n• 🟡 **Tipo I (Leve):** Incumplimientos menores al pacto de aula.\n• 🟠 **Tipo II (Grave):** Afectación reiterada a la convivencia escolar.\n• 🔴 **Tipo III (Gravísima):** Faltas críticas o vulneración de derechos.\n\n📌 Incluye campo obligatorio para los **descargos del estudiante** y generación de **Actas con 4 Firmas**.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[9], KNOWLEDGE_ARTICLES[5]],
      actionLink: { label: "Ver Perfil de Estudiantes", url: "/estudiantes" }
    };
  }

  // 6. Modo Offline / Sin Internet / Sincronización
  if (
    clean.includes("offline") || clean.includes("internet") || clean.includes("sin senal") || 
    clean.includes("guardar") || clean.includes("sync") || clean.includes("sincroniz") || 
    clean.includes("nube") || clean.includes("vereda") || clean.includes("resguardo")
  ) {
    return {
      reply: "📡 **Arquitectura Local-First (Modo Offline):**\n\n• Diseñado especialmente para veredas y territorios sin conectividad en Nariño.\n• Puedes calificar, tomar asistencia y hacer anotaciones sin necesidad de internet.\n• Todos los datos se almacenan localmente en tu equipo de manera segura.\n• Al detectar conexión WiFi o datos móviles, la app sincroniza todo en segundo plano con la base de datos Firestore.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[10]],
      actionLink: { label: "Ver Estado en Configuración", url: "/configuracion" }
    };
  }

  // 7. Currículo / Tejido Awá / PIAR / Copiloto
  if (
    clean.includes("curriculo") || clean.includes("malla") || clean.includes("tejido") || 
    clean.includes("awa") || clean.includes("piankammu") || clean.includes("piar") || 
    clean.includes("copiloto") || clean.includes("radar") || clean.includes("leccion")
  ) {
    return {
      reply: "🌿 **Currículo y Tejido de Aprendizaje Awá:**\n\n• **piankammuMi (Hilos del Saber):** Núcleos temáticos articulados con la vida comunitaria.\n• **tuhPutkamna:** Higra del Conocimiento y sabidurías ancestrales.\n• **Copiloto de Lecciones:** Asistente IA para planear secuencias didácticas contextualizadas.\n• **Adaptación PIAR:** Flexibilización curricular para estudiantes con necesidades educativas especiales.\n• **Radar de Competencias:** Diagnóstico visual de equilibrio pedagógico.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[11]],
      actionLink: { label: "Ir al Módulo de Currículo", url: "/curriculo" }
    };
  }

  // 8. Recuperaciones / Nivelaciones
  if (
    clean.includes("recupera") || clean.includes("nivelaci") || clean.includes("rec") || 
    clean.includes("reprob") || clean.includes("mejoramiento")
  ) {
    return {
      reply: "🔄 **Recuperaciones y Nivelaciones de Periodo:**\n\n1. En el Calificador por Saberes (`/clase-en-vivo`), ubica la columna **'REC'**.\n2. Digita la nota obtenida por el estudiante en la sustentación de su plan de mejoramiento.\n3. Si la nota es **3.0 o superior**, el sistema actualizará automáticamente la definitiva del periodo según la directriz del SIEEE.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[2]],
      actionLink: { label: "Ir al Calificador", url: "/clase-en-vivo" }
    };
  }

  // 9. Escala Valorativa / Rangos / Superior / Alto / Básico / Bajo
  if (
    clean.includes("escala") || clean.includes("desempeno") || clean.includes("superior") || 
    clean.includes("alto") || clean.includes("basico") || clean.includes("bajo") || 
    clean.includes("nota minima") || clean.includes("pasar")
  ) {
    return {
      reply: "🎯 **Escala Valorativa Oficial IETABA:**\n\n• 🟢 **Superior (4.6 - 5.0):** Desempeño excepcional y liderazgo.\n• 🔵 **Alto (4.0 - 4.5):** Alcance satisfactorio de todos los logros.\n• 🟡 **Básico (3.0 - 3.9):** Alcance de competencias mínimas requeridas.\n• 🔴 **Bajo (1.0 - 2.9):** Reprobación. Requiere plan de mejoramiento obligatorio (REC).",
      suggestedArticles: [KNOWLEDGE_ARTICLES[3], KNOWLEDGE_ARTICLES[0]],
      actionLink: { label: "Ver Reportes de Calificaciones", url: "/reportes/calificaciones" }
    };
  }

  // 10. Horario y Agenda
  if (
    clean.includes("horario") || clean.includes("agenda") || clean.includes("bloque") || 
    clean.includes("semana") || clean.includes("tarea") || clean.includes("calendario")
  ) {
    return {
      reply: "📅 **Horario y Agenda Escolar:**\n\n• **Horario Semanal (`/horario`):** Visualiza tus bloques de clase ordenados de Lunes a Viernes por horas, asignaturas y cursos.\n• **Agenda Docente (`/agenda`):** Programa tareas, recordatorios de entrega y eventos institucionales con alertas automáticas al iniciar clase.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[8]],
      actionLink: { label: "Ver Horario de Clases", url: "/horario" }
    };
  }

  // 11. Institucional / Colegio / UNIPA / Ubicación
  if (
    clean.includes("ietaba") || clean.includes("colegio") || clean.includes("escuela") || 
    clean.includes("mision") || clean.includes("unipa") || clean.includes("barbacoas") || 
    clean.includes("narino") || clean.includes("rector") || clean.includes("institucion")
  ) {
    return {
      reply: "🏛️ **Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá (IETABA):**\n\n• **Ubicación:** Territorio Ancestral Indígena Awá, Barbacoas, Nariño, Colombia.\n• **Organización:** Adscrita a la UNIPA (Unidad Indígena del Pueblo Awá).\n• **Propósito:** Formación integral comunitaria, pervivencia del idioma Awapit, respeto por la Katsa Su (Gran Casa) y excelencia académica bilingüe e intercultural.",
      suggestedArticles: [KNOWLEDGE_ARTICLES[9]],
      actionLink: { label: "Ver Centro de Ayuda Institucional", url: "/ayuda" }
    };
  }

  // 12. Búsqueda semántica por palabras clave en todos los artículos
  const matchedArticles = KNOWLEDGE_ARTICLES.filter(art => {
    return art.keywords.some(k => clean.includes(k.toLowerCase())) ||
           clean.includes(art.category) ||
           art.title.toLowerCase().includes(clean);
  });

  if (matchedArticles.length > 0) {
    const top = matchedArticles[0];
    return {
      reply: `💡 **${top.title}**\n\n${top.summary}\n\n${top.steps ? "• " + top.steps.join("\n• ") : ""}`,
      suggestedArticles: matchedArticles.slice(0, 3),
      actionLink: top.relatedRoute ? { label: "Abrir módulo relacionado", url: top.relatedRoute } : undefined
    };
  }

  // Fallback conversacional completo
  return {
    reply: "👋 ¡Hola! Soy **EduAwá**, tu Asistente de Inteligencia Pedagógica IETABA con **Contexto 100%** de la plataforma. Puedo responderte con exactitud sobre:\n\n1. 📊 **SIEEE y Saberes:** Pesos (SB 30%, SBH 40%, SR 20%, CV 5%, AUT 5%) y fórmulas.\n2. 📑 **Dossier 360° y Reportes:** Selector de periodos, actas con 4 firmas y sábanas.\n3. 🔒 **Cierre de Periodos:** Modal de seguridad y candados de notas.\n4. ⏱️ **Clase en Vivo:** Asistencia en 1 toque, ruleta aleatoria y cronómetro.\n5. ⚖️ **Observador:** Registro según Ley 1620 y descargos del estudiante.\n6. 🌿 **Currículo Awá:** piankammuMi, adaptación PIAR y Copiloto de Lecciones.\n7. 📡 **Modo Offline:** Trabajo en veredas y sincronización automática.\n\n¿Qué tema deseas consultar?",
    suggestedArticles: KNOWLEDGE_ARTICLES.slice(0, 4)
  };
}
