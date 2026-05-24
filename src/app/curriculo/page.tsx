"use client";

export const dynamic = 'force-dynamic';

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import UnitProgress from "@/components/curriculum/UnitProgress";
import UnitSidebar from "@/components/curriculum/UnitSidebar";
import TopicTree from "@/components/curriculum/TopicTree";
import CSVImporter from "@/components/curriculum/CSVImporter";
import PDFCurriculumImporter from "@/components/curriculum/PDFCurriculumImporter";
import { Plus, Sparkles, FileText, Presentation, BookOpen, UploadCloud } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import RoleGuard from "@/components/shared/RoleGuard";
import { Loader2, Download, CheckCircle2, ChevronDown, MessageSquare, Printer, RefreshCw, History, Calendar } from "lucide-react";
import { printPedagogicalPlan } from "@/lib/printService";
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Premium Competency & Inclusivity Modules
import RadarCompetencias from "@/components/curriculum/RadarCompetencias";
import PiarAdaptationModal from "@/components/curriculum/PiarAdaptationModal";
import LecturasTejido from "@/components/curriculum/LecturasTejido";

export default function CurriculumPage() {
  const { masterData, profile, curriculum, user } = useApp();
  
  // ── Derivar grados y materias disponibles ────────────────────────────────
  // Primero intentamos las listas del perfil, si están vacías usamos el horario
  const availableGrades = useMemo(() => {
    const isAdmin = profile.role === "RECTOR" || profile.role === "COORDINADOR";
    if (isAdmin) return masterData.grades || [];
    
    // Si el docente tiene grados asignados úsalos
    if (profile.teachingGrades?.length) return profile.teachingGrades;
    
    // Fallback: extraer grados únicos del horario semanal
    const fromSchedule = [...new Set(profile.weeklySchedule?.map(b => b.grade).filter(Boolean) || [])];
    return fromSchedule.length ? fromSchedule : masterData.grades || [];
  }, [profile, masterData]);

  const availableSubjects = useMemo(() => {
    const isAdmin = profile.role === "RECTOR" || profile.role === "COORDINADOR";
    if (isAdmin) return masterData.subjects || [];
    
    if (profile.teachingSubjectsList?.length) return profile.teachingSubjectsList;
    
    // Fallback: extraer materias únicas del horario semanal
    const fromSchedule = [...new Set(profile.weeklySchedule?.map(b => b.subject).filter(Boolean) || [])];
    return fromSchedule.length ? fromSchedule : masterData.subjects || [];
  }, [profile, masterData]);

  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [generations, setGenerations] = useState<any[]>([]);
  const [curriculumTab, setCurriculumTab] = useState<"planner" | "readings">("planner");
  const [isPiarOpen, setIsPiarOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    id?: string,
    summary: string,
    lesson: string,
    workshop: string,
    activity: string,
    exam: string,
    teacherGuide?: string,
    createdAt?: any
  } | null>(null);

  // Inicializar/actualizar selectores cuando carguen los datos del perfil
  useEffect(() => {
    if (availableGrades.length && !selectedGrade) {
      setSelectedGrade(availableGrades[0]);
    }
    if (availableSubjects.length && !selectedSubject) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableGrades, availableSubjects]);

  // Cargar historial de generaciones cuando cambie el grado o materia
  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedGrade || !selectedSubject) return;
      const q = query(
        collection(db, "pedagogical_plans"),
        where("grade", "==", selectedGrade),
        where("subject", "==", selectedSubject)
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      docs.sort((a: any, b: any) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      });
      setGenerations(docs);
    };
    fetchHistory();
  }, [selectedGrade, selectedSubject]);

  const [isResetting, setIsResetting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCurriculum = useMemo(() => {
    if (!curriculum.length || !selectedGrade || !selectedSubject) return null;
    
    const normStr = (s: string) => s
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    
    const targetSubject = normStr(selectedSubject);
    const targetGradeNum = selectedGrade.replace(/[^\d]/g, "");
    
    const candidates = curriculum.filter(c => {
      const cGradeNum = c.grade.replace(/[^\d]/g, "");
      return targetGradeNum && cGradeNum === targetGradeNum;
    });

    if (candidates.length === 0) return null;

    // Prioridad 1: Exacta
    const exact = candidates.find(c => normStr(c.subjectId) === targetSubject);
    if (exact) return exact;

    // Prioridad 2: Empieza con
    const startsWith = candidates.find(c => normStr(c.subjectId).startsWith(targetSubject));
    if (startsWith) return startsWith;

    // Prioridad 3: Inversa
    const reverse = candidates.find(c => targetSubject.startsWith(normStr(c.subjectId)));
    if (reverse) return reverse;

    return null;
  }, [curriculum, selectedGrade, selectedSubject]);

  if (!mounted) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null); 
    
    setTimeout(async () => {
      const activeTopic = activeCurriculum 
        ? activeCurriculum.units.flatMap(u => u.topics).find(t => t.status === "active") 
        : null;
      
      const topicName = activeTopic?.title || "Contenido Curricular";
      const topicHijos = activeTopic?.hijosSaber || "";
      const topicHigra = activeTopic?.tuhPutkamna || "Pensamiento Matemático";

      const contextPrefix = feedback ? `🎯 ENFOQUE DE FORTALECIMIENTO PEDAGÓGICO: ${feedback.toUpperCase()}\n\n` : "";
      const hilosContext = topicHijos ? `\n📖 HILOS/HIJOS DEL SABER A CUBRIR:\n${topicHijos}\n` : "";

      // --- MOTOR DE GENERACIÓN DINÁMICA BASADO EN LA MATERIA ---
      const tLower = topicName.toLowerCase();
      const sLower = selectedSubject.toLowerCase();
      
      let topicDefinition = `El tema comprende el estudio sistemático de los fundamentos teóricos y prácticos de ${selectedSubject}. Consiste en abstraer conceptos, identificar aplicaciones en el entorno natural y social, y desarrollar un pensamiento crítico sobre el territorio.`;
      let example1Text = `Enunciado: Situación de análisis en nuestra comunidad Awá relacionada con ${topicName}.
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Contextualización): Identificamos el problema desde la perspectiva de ${selectedSubject}.
- Paso 2 (Aplicación de Saberes): Vinculamos el conocimiento ancestral con la teoría contemporánea.
- Paso 3 (Desarrollo): Realizamos el análisis o procedimiento pertinente.
- Conclusión: Comprendemos el impacto de este saber en el plan de vida de la comunidad.`;

      if (sLower.includes("matemáticas") || sLower.includes("matematicas")) {
        topicDefinition = "El tema comprende el estudio sistemático de las relaciones cuantitativas y lógicas, aplicando algoritmos de resolución con precisión para analizar nuestro entorno.";
        example1Text = `Enunciado: Si en una huerta escolar del IETABA se siembran plantas, calculemos el total usando operaciones aritméticas básicas.
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Identificación): Extraemos las variables numéricas.
- Paso 2 (Sustitución): Planteamos la operación.
- Paso 3 (Jerarquía): Resolvemos con precisión.
- Conclusión: Obtenemos un resultado cuantitativo aplicable a la comunidad.`;
      } else if (sLower.includes("tecnología") || sLower.includes("informatica") || sLower.includes("tecnologia")) {
        topicDefinition = "Este tema abarca el uso responsable de las herramientas tecnológicas y los sistemas de información, buscando potenciar la comunicación comunitaria sin perder nuestra identidad.";
        example1Text = `Enunciado: ¿Cómo podemos utilizar las herramientas digitales para documentar y proteger las tradiciones de los mayores en la reserva?
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Análisis): Identificar las herramientas de grabación o software disponibles.
- Paso 2 (Diseño): Estructurar un proyecto de registro digital.
- Paso 3 (Implementación): Poner en marcha la capacitación de los jóvenes.
- Conclusión: La tecnología se convierte en aliada de nuestra cosmovisión.`;
      }

      const lessonStr = `${contextPrefix}📅 GUÍA CURRICULAR EXHAUSTIVA DE CLASE (PARA DICTADO Y ESTUDIO)
======================================================================
• Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
• Duración Académica: Trimestre Reglado (3 Meses)
• Intensidad Horaria Semanal: 5 Horas de Clase (60 horas totales por periodo)
• Eje Integrador: Armonización territorial con Katsa Su (La Gran Tierra)
======================================================================
${hilosContext}

📖 CONTENIDO CONCEPTUAL CLAVE: [ ${topicName.toUpperCase()} ]
Pedagogía de Base: Modelo Tradicional Awá "Tejiendo Saberes" integrado con Ciencias Universales contemporáneas.

======================================================================
I. FASE DE EXPLORACIÓN Y DIÁLOGOS COMUNITARIOS (Sesión 1)
======================================================================
🎯 PROPÓSITO PEDAGÓGICO:
Conectar los conocimientos ancestrales del estudiante con el estudio científico formal de ${selectedSubject}.

🗣️ MINGA DE CONOCIMIENTOS (DIÁLOGO CON EL ENTORNO):
El docente invita a la clase a sentarse en un círculo tradicional. Se utiliza un objeto simbólico de la comunidad (un canasto o tejido propio) para regular los turnos de habla. El docente expone la relación de la temática [ ${topicName} ] con el territorio.

💬 Preguntas Clave para el Dictado en Cuadernos:
1. Desde los saberes de nuestros mayores, ¿cómo se manifiesta la regularidad y estructura de ${topicName} en los ciclos naturales del bosque y las fuentes hídricas?
2. ¿De qué manera la falta de control técnico o el desconocimiento de las herramientas de ${selectedSubject} puede debilitar la autonomía agroambiental de nuestro resguardo?

======================================================================
II. FASE DE ESTRUCTURACIÓN: CONCEPTUALIZACIÓN TEÓRICA EXHAUSTIVA (Sesiones 2 y 3)
======================================================================
📖 DESARROLLO TEÓRICO RIGUROSO (Apto para dictar y copiar textualmente):

• MARCO TEÓRICO CENTRAL:
${topicDefinition}

• CONCEPTOS AUXILIARES Y VOCABULARIO CLAVE:
1. **Tejido de Aprendizaje (Tuh Putkamna)**: Corresponde a la interrelación armónica entre la teoría matemática, tecnológica u agroambiental y las vivencias de la comunidad en la reserva.
2. **Aplicación en el Territorio (Panapain)**: La metodología mediante la cual los conceptos abstractos y teóricos se traducen en beneficio inmediato para el cabildo, la vereda y la conservación ambiental.
3. **Saberes Universales (Nanpaskas)**: Los conocimientos científicos y metodologías académicas estándar que el estudiante debe dominar para interactuar exitosamente con el entorno global.

💡 EJEMPLOS DE APLICACIÓN TOTALMENTE RESUELTOS PASO A PASO:

• EJEMPLO MODELO 1: APLICACIÓN PROCEDIMENTAL INTERNA
${example1Text}

• EJEMPLO MODELO 2: CASO AGROAMBIENTAL CONTEXTUALIZADO
Enunciado: En el predio escolar del IETABA, se desea diseñar una infraestructura o plan de cálculo basado en ${topicName} para optimizar el riego y distribución de abono orgánico en la parcela escolar. ¿Cómo debe proceder la comunidad docente y estudiantil?
RESOLUCIÓN COMPLETA PASO A PASO:
- Paso 1 (Evaluación Territorial): Identificamos las dimensiones geográficas de la parcela y la disponibilidad de recursos naturales locales.
- Paso 2 (Abstracción Técnica): Modelamos matemáticamente o a nivel de flujo tecnológico los parámetros utilizando las leyes de ${selectedSubject}.
- Paso 3 (Socialización Cooperativa): Se definen las cuadrillas de trabajo de los alumnos para ejecutar el monitoreo y mantenimiento técnico.
- Conclusión Pedagógica: La aplicación exitosa de este conocimiento protege a Katsa Su (La Gran Tierra) y consolida la autosostenibilidad.

======================================================================
III. FASE DE TRANSFERENCIA: APLICACIÓN PRÁCTICA EN EL AULA (Sesiones 4 y 5)
======================================================================
✍️ TRABAJO INDEPENDIENTE / COOPERATIVO:
Los estudiantes realizarán simulaciones prácticas y talleres grupales basados en problemáticas reales. Utilizarán carteles, papelógrafos, y representaciones de mapas territoriales para plasmar sus soluciones aplicando los conceptos aprendidos, preparándose de forma rigurosa para el Taller Evaluativo Integral.`;

      const workshopStr = `${contextPrefix}📝 TALLER INTEGRAL DE APLICACIÓN DIDÁCTICA Y PRÁCTICA (MÍNIMO 10 PREGUNTAS)
----------------------------------------------------------------------
Institución: IETABA (Territorio Awá)
Materia: ${selectedSubject} | Grado: ${selectedGrade}
Eje Temático: ${topicName}
======================================================================

--- [ HOJA 1: APROPIACIÓN CONCEPTUAL Y COMPRENSIÓN VISUAL ] ---

📌 INSTRUCCIÓN GENERAL: Resuelve cada pregunta en tu cuaderno de forma clara y ordenada. Presenta los diagramas y respuestas completamente argumentados.

----------------------------------------------------------------------
🎨 ANÁLISIS COMPRENSIVO BASADO EN LA SIGUIENTE INFOGRAFÍA:
----------------------------------------------------------------------
🖼️ [INFOGRAFÍA COLORIDA: "EL TEJIDO DE SABERES Y EL CUIDADO DEL MEDIO AMBIENTE"]
Esta infografía muestra la relación entre los Saberes Ancestrales (representados en un tejido verde circular) y el Conocimiento Académico de ${selectedSubject} (representado como un engranaje azul central). El flujo de flechas amarillas demuestra cómo la teoría apoya la toma de decisiones ecológicas en Katsa Su (La Madre Tierra).

1. 📖 [Pregunta 1 - Vocabulario]: Define con tus propias palabras el concepto central de "${topicName}" e identifica dos términos técnicos clave de la materia explicados en la infografía.
2. 📊 [Pregunta 2 - Análisis de Infografía]: Observa la relación entre el tejido ancestral y el engranaje de ${selectedSubject} en la infografía anterior. Explica por qué el trabajo interdisciplinar ayuda a la comunidad.
3. 🗺️ [Pregunta 3 - Observación Territorial]: Dibuja un mapa conceptual de tu vereda e identifica tres áreas específicas donde la temática de [ ${topicName} ] se aplique para mejorar la producción agropecuaria o el cuidado del agua.

----------------------------------------------------------------------
📐 SECCIÓN A: DESARROLLO ANALÍTICO Y PROCEDIMIENTOS
----------------------------------------------------------------------
🗺️ [MAPA CONCEPTUAL COLORIDO: "ESTRUCTURA Y SISTEMAS DE ${selectedSubject.toUpperCase()}"]
Este mapa conceptual describe el árbol de procesos, ramificando las variables fundamentales y mostrando los caminos lógicos para la resolución de problemas teóricos en la asignatura.

4. ✍️ [Pregunta 4 - Resolución de Caso Teórico]: Utilizando el mapa conceptual como guía, resuelve el siguiente ejercicio procedimental: Aplica la estructura de ${selectedSubject} para calcular o planificar un escenario hipotético donde se necesiten administrar recursos escolares. Muestra todo tu procedimiento.
5. 🔍 [Pregunta 5 - Comparativa Crítica]: Establece en un cuadro comparativo tres similitudes y tres diferencias entre la manera en que los mayores de la reserva analizan el tema de [ ${topicName} ] y la metodología científica occidental.

--- [ HOJA 2: APLICACIÓN PRÁCTICA Y PRODUCCIÓN INTERCULTURAL ] ---

----------------------------------------------------------------------
🌱 SECCIÓN B: RESOLUCIÓN DE CASOS AGROAMBIENTALES Y COMUNITARIOS
----------------------------------------------------------------------
📈 [DIAGRAMA DE FLUJO: "MONITOREO DE RECURSOS EN LA PARCELA DE LA RESERVA"]
Un flujograma didáctico y a color que detalla las fases de toma de datos: Fase 1 (Toma de datos en campo) -> Fase 2 (Procesamiento analítico en aula con ${selectedSubject}) -> Fase 3 (Presentación del plan al cabildo para aprobación).

6. 🌾 [Pregunta 6 - Caso Práctico - El Proyecto del Cabildo]: El cabildo escolar del IETABA requiere ejecutar una iniciativa agroambiental basada en la temática [ ${topicName} ]. Analiza el diagrama de flujo anterior y describe qué decisiones debería tomar el equipo si los datos de la Fase 1 presentan un error o anomalía.
7. 📈 [Pregunta 7 - Análisis de Tendencias]: Imagina que el proyecto de la parcela sufre un retraso debido a factores climáticos extremos. ¿De qué manera la precisión teórica de ${selectedSubject} puede ayudar al docente y a los estudiantes a reestructurar el cronograma y los insumos de forma exacta?
8. 🎨 [Pregunta 8 - Diseño y Propuesta]: Dibuja un afiche o diagrama ilustrado (en media página de tu cuaderno) que promueva el uso de [ ${topicName} ] para concienciar a los jóvenes del IETABA sobre la importancia de la educación técnica.

----------------------------------------------------------------------
✍️ SECCIÓN C: ARGUMENTACIÓN CRÍTICA Y SÍNTESIS PEDAGÓGICA
----------------------------------------------------------------------
9. 🧠 [Pregunta 9 - Pensamiento Crítico]: Lee el siguiente argumento: "Los saberes de las ciencias exactas y tecnológicas son ajenos al plan de vida Awá y no deberían ser dictados de forma obligatoria en la reserva". Sustenta tu posición personal, argumentando a favor o en contra con un mínimo de dos párrafos sólidos.
10. 📝 [Pregunta 10 - Ensayo de Síntesis Intercultural]: Redacta un ensayo estructurado (Introducción, Desarrollo y Conclusión - mínimo 300 palabras) que responda a la pregunta rectora:
"¿Cómo el dominio técnico e intercultural de ${selectedSubject} nos empodera como guardianes del territorio y líderes de nuestra comunidad?"`;

      const teacherGuideStr = `${contextPrefix}🎓 GUÍA EXCLUSIVA PARA EL DOCENTE (PLANIFICACIÓN Y SOLUCIONARIO DEL TALLER)
======================================================================
Institución: IETABA (Territorio Awá)
Grado: ${selectedGrade} | Materia: ${selectedSubject}
Guía de Orientación Pedagógica para el Tema: ${topicName}
======================================================================

🎯 OBJETIVOS PEDAGÓGICOS CENTRALES:
1. Lograr que el 90% de los estudiantes comprendan los fundamentos teóricos de ${topicName}.
2. Promover la articulación del conocimiento científico occidental (Nanpaskas) con la identidad Awá (Tuh Putkamna).

⏱️ CRONOGRAMA DE TIEMPOS SUGERIDO (5 Horas a la Semana):
• Sesión 1 (1h) - Exploración y Minga de Saberes previos.
• Sesiones 2 y 3 (2h) - Dictado de teoría fundamental, explicación y resolución de ejemplos prácticos en el tablero.
• Sesión 4 (1h) - Trabajo cooperativo y resolución guiada de las primeras 5 preguntas del Taller Integral.
• Sesión 5 (1h) - Resolución de preguntas prácticas y argumentativas del Taller y retroalimentación grupal.

======================================================================
🔑 SOLUCIONARIO EXHAUSTIVO DEL TALLER INTEGRAL (PARA EL DOCENTE)
======================================================================

💡 Pregunta 1: Criterio de Respuesta Correcta: El estudiante debe citar la definición exacta dada en la guía y asociarla a términos técnicos como el "Tejido de Aprendizaje" o la "Metodología Analítica".

💡 Pregunta 2: Criterio de Respuesta Correcta: El alumno debe explicar la complementariedad entre los saberes ancestrales (protección ambiental) y la rigurosidad de ${selectedSubject} (medición, cálculo o diseño digital) para optimizar recursos.

💡 Pregunta 3: Criterio de Respuesta Correcta: Se califica la creatividad del mapa conceptual de la vereda. Debe identificar al menos 3 áreas (ej. huerta, acueducto veredal, registro del cabildo) donde se aplique el tema.

💡 Pregunta 4: Solución Técnica Esperada: El estudiante debe seguir los 3 pasos de resolución matemática o tecnológica planteados en el Ejemplo Modelo 1, logrando un procedimiento claro y fundamentado paso a paso.

💡 Pregunta 5: Solución Esperada: Cuadro comparativo completo. Tres similitudes (ambos buscan organizar, entender patrones y cuidar recursos) y tres diferencias (uso de tradición oral vs. fórmulas escritas; validación comunitaria vs. experimental académica).

💡 Pregunta 6: Criterio de Respuesta Correcta: En caso de error en la Fase 1, el estudiante debe proponer el retorno al campo a verificar los parámetros geográficos, de acuerdo con las flechas de retroalimentación del flujograma.

💡 Pregunta 7: Criterio de Respuesta Correcta: El alumno debe justificar que las ciencias exactas permiten recalcular y reprogramar insumos de forma precisa, evitando el desperdicio.

💡 Pregunta 8: Criterio de Calificación: Se evalúa el afiche a color, el mensaje didáctico de concientización y la creatividad al integrar elementos culturales Awá con tecnología/matemática.

💡 Pregunta 9: Criterio de Calificación: Ensayo argumentativo. El estudiante debe defender una postura madura, reconociendo que las ciencias universales son herramientas necesarias para la gobernanza interna del resguardo.

💡 Pregunta 10: Rúbrica de Ensayo de Síntesis (300 palabras):
- Excelente (4.5 - 5.0): Integra de forma brillante la cosmovisión Awá, el dominio de la materia y el liderazgo comunitario, con excelente ortografía y conectores lógicos.
- Aceptable (3.0 - 4.4): Presenta ideas claras sobre la interculturalidad pero la estructura formal del ensayo es incompleta.
- Insuficiente (0.0 - 2.9): No cumple con la extensión mínima o no demuestra comprensión de la articulación territorial de la materia.`;

      const activityStr = `${contextPrefix}🎲 DINÁMICA LÚDICA Y DIDÁCTICA: "LA MINGA DE SABERES EN ${selectedSubject.toUpperCase()}"
Eje Didáctico: Aprendizaje Cooperativo (Gamificación Territorial)
${hilosContext}
Duración: 1 Hora de Clase Dinámica

🎯 OBJETIVO PEDAGÓGICO:
Consolidar la apropiación del conocimiento de ${topicName}, fortaleciendo el pensamiento analítico y la comunicación asertiva entre los estudiantes, transformando la teoría en una vivencia lúdica comunitaria.

🛠️ RECURSOS Y MATERIALES NECESARIOS:
- 20 Tarjetas de Retos sobre ${selectedSubject} impresas o dibujadas.
- Pizarra del aula y marcadores.
- Material natural del entorno (hojas, semillas) para representación simbólica.

🚀 INSTRUCCIONES Y REGLAS DE EJECUCIÓN PASO A PASO:
1. Conformación de las Cuadrillas (Equipos): El grupo se divide en 4 "Cuadrillas Agroambientales". Cada cuadrilla elige a un Sabedor (quien lidera las respuestas) y un Vocero (quien expone).
2. Dinámica de Participación: El docente extrae al azar una Tarjeta de Reto sobre [ ${topicName} ].
3. Resolución Contrarreloj: El equipo tiene 2 minutos para debatir y formular una respuesta o solución fundamentada. El Vocero debe exponerla al grupo.
4. Sistema de Puntuación: 
   - Respuesta argumentada y precisa: +10 Puntos Comunitarios.
   - Respuesta correcta pero incompleta: +5 Puntos.
   - Si hay error, otro equipo puede complementar (Rebote Solidario).
5. Cierre Pedagógico: Al finalizar, el docente retroalimenta y conecta los resultados del juego con la conservación de nuestra identidad.`;

      const examStr = `${contextPrefix}🏆 EVALUACIÓN SUMATIVA POR COMPETENCIAS (PRUEBA SABER DE COMPROBACIÓN ACADÉMICA)
======================================================================
Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
Asignatura: ${selectedSubject} | Grado: ${selectedGrade}
Diseño Curricular: Conexión Científica y Territorial Awá
Estudiante: ___________________________ | Fecha: __________________
${hilosContext}

======================================================================
📝 PARTE A: PREGUNTAS DE SELECCIÓN MÚLTIPLE CON ÚNICA RESPUESTA (ICFES)
======================================================================
Responde las preguntas 1 a 4 seleccionando la opción correcta y rellenando el óvalo en tu hoja de respuestas.

1. [COMPETENCIA INTERPRETATIVA]: Al analizar el tema de [ ${topicName} ] en las prácticas agroambientales del IETABA, se observa que la modelación y el análisis riguroso permiten:
   a) Aumentar la dependencia de químicos importados perjudiciales para la tierra.
   b) Tomar de manera precisa y estructurada decisiones sobre los recursos del resguardo, cuidando a Katsa Su.
   c) Eliminar por completo el diálogo y las mingas comunitarias en favor de cálculos fríos.
   d) Ignorar las opiniones de los mayores sobre el cuidado del agua en la vereda.

2. [COMPETENCIA ARGUMENTATIVA]: Si una vereda del resguardo presenta dificultades para organizar sus datos o recursos analíticos, la aplicación de los principios fundamentales de ${selectedSubject} sería clave porque:
   a) Proporciona un marco lógico estructurado para medir, proyectar y corregir problemas de forma eficiente.
   b) Demuestra que los métodos occidentales son superiores y deben sustituir la tradición oral.
   c) Limita el tiempo de los comuneros al exigir reportes escritos excesivamente largos.
   d) Obliga a contratar expertos externos sin permitir que la comunidad participe en la solución.

3. [COMPETENCIA PROPOSITIVA]: Para optimizar el diseño y la resistencia de una shingra o canasto tradicional de carga aplicando razonamiento cuantitativo y físico, el artesano debe:
   a) Tejer sin planificación geométrica esperando un resultado al azar.
   b) Estudiar la progresión de los anillos y la tensión dinámica de la fibra vegetal para distribuir el peso uniformemente.
   c) Reducir el grosor de las fibras verticales para ahorrar material sin importar el peso a soportar.
   d) Comprar mochilas industriales importadas para sustituir el trabajo manual.

4. [COMPETENCIA SOCIAL Y COMUNITARIA]: El concepto de 'tejido' en el Plan de Vida de la nación Awá simboliza la interconexión ecológica y social. Si un proyecto de ${selectedSubject} en el IETABA busca ser exitoso, debe:
   a) Ser ejecutado de forma aislada por un solo estudiante sin retroalimentación del grupo.
   b) Tejerse en conjunto mediante 'Mingas de Saberes', integrando a estudiantes, docentes y sabedores locales.
   c) Limitarse a copiar de internet sin aplicarlo en las necesidades del resguardo.
   d) Evitar relacionar la teoría con las necesidades reales del resguardo indígena.

======================================================================
📝 PARTE B: ANÁLISIS DE CASO Y RESOLUCIÓN ABIERTA
======================================================================
5. [COMPETENCIA EXPLICATIVA]: Un estudiante del IETABA propone la creación de un sistema de monitoreo en la huerta escolar basado en la temática de "${topicName}". Escribe un texto explicativo (mínimo dos párrafos) donde describas qué conceptos de la asignatura aplicarías y de qué manera esto ayuda a proteger Katsa Su y beneficia al resguardo.`;

      const newPlan = {
        summary: `Planeación Integral: ${selectedSubject} (${selectedGrade})`,
        lesson: lessonStr,
        workshop: workshopStr,
        activity: activityStr,
        exam: examStr,
        teacherGuide: teacherGuideStr,
        grade: selectedGrade,
        subject: selectedSubject,
        topic: topicName,
        teacherId: user?.uid || "anonymous",
        createdAt: serverTimestamp()
      };

      try {
        const docRef = await addDoc(collection(db, "pedagogical_plans"), newPlan);
        setAnalysisResult({ id: docRef.id, ...newPlan });
        setGenerations(prev => [{ id: docRef.id, ...newPlan, createdAt: Timestamp.now() }, ...prev]);
        setIsAnalyzing(false);
      } catch (err) {
        console.error("Error saving plan:", err);
        setIsAnalyzing(false);
      }
    }, 3500);
  };

  const handleResetCurriculum = async () => {
    if (!selectedGrade || !selectedSubject) return;
    const confirm = window.confirm(`¿Estás seguro de que deseas regenerar el tejido de aprendizaje para ${selectedSubject} (${selectedGrade})? Se sobreescribirá con la plantilla oficial Awá.`);
    if (!confirm) return;

    setIsResetting(true);
    try {
      const normGrade = normalizeGrade(selectedGrade);
      const normSubject = selectedSubject.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      const deterministicId = `cur-${normGrade}-${normSubject}`.replace(/\s+/g, '-').replace(/°/g, '').toLowerCase();

      const subLower = normSubject.toLowerCase();
      let units: any[] = [];

      if (subLower.includes("tecnolog") || subLower.includes("informática") || subLower.includes("informatica") || subLower.includes("sistemas")) {
        units = [
          {
            id: "unit-periodo-1",
            title: "MAZA T+T – PRIMER PERIODO",
            order: 1,
            topics: [
              {
                id: "P1-T1",
                status: "covered",
                tuhPutkamna: "Naturaleza y Evolución de la Tecnología: Artefactos y procesos tecnológicos ancestrales y modernos en el territorio.",
                title: "Identificar y clasificar herramientas tradicionales de uso comunitario frente a tecnologías mecánicas y digitales.",
                hijosSaber: "1. Evolución de la herramienta. 2. Técnica vs Tecnología. 3. Artefactos del territorio.",
                panapain: "El uso adecuado de herramientas permite optimizar el trabajo en las mingas y parcelas familiares respetando los ciclos de la tierra.",
                nanpaskas: "Comparar cómo diferentes culturas integran los avances técnicos sin perder su identidad cultural y comunitaria.",
                satIshkit: "Trabajo colaborativo, Talleres prácticos, Entrevistas a mayores."
              }
            ]
          },
          {
            id: "unit-periodo-2",
            title: "PAS T+T – SEGUNDO PERIODO",
            order: 2,
            topics: [
              {
                id: "P2-T1",
                status: "active",
                tuhPutkamna: "Apropiación y Uso de la Tecnología: Manejo responsable de la información, redes y medios de comunicación de Microsoft Excel.",
                title: "Manejo de herramientas ofimáticas e Introducción a Excel.",
                hijosSaber: "1. Celdas, filas y columnas. 2. Fórmulas básicas (SUMA, PROMEDIO). 3. Funciones lógicas simples.",
                panapain: "Aprovechar las hojas de cálculo para organizar la producción de cultivos familiares.",
                nanpaskas: "Uso ético y estructurado de los computadores en el ámbito escolar y profesional.",
                satIshkit: "Talleres prácticos de Excel, diseño de tablas de producción local."
              }
            ]
          },
          {
            id: "unit-periodo-3",
            title: "KUTÑA T+T – TERCER PERIODO",
            order: 3,
            topics: [
              {
                id: "P3-T1",
                status: "not_started",
                tuhPutkamna: "Solución de Problemas con Tecnología: Diseño de sistemas sencillos para el cuidado ambiental y productivo.",
                title: "Proponer soluciones técnicas elementales para las huertas escolares del resguardo.",
                hijosSaber: "1. Diseño sustentable. 2. Materiales reciclados. 3. Prototipado para el agro.",
                panapain: "La técnica y la tecnología deben estar al servicio de Katsa Su (el gran territorio) para garantizar el Buen Vivir.",
                nanpaskas: "Integrar conocimientos técnicos universales sobre sostenibilidad ambiental.",
                satIshkit: "Proyectos de aula, maquetas sustentables."
              }
            ]
          }
        ];
      } else if (subLower.includes("matemáticas") || subLower.includes("matematicas")) {
        units = [
          {
            id: "unit-periodo-1",
            title: "MAZA T+T – PRIMER PERIODO",
            order: 1,
            topics: [
              {
                id: "P1-T1",
                status: "active",
                tuhPutkamna: "Numérico variacional: Operaciones con números naturales, fraccionarios, decimales. Situaciones problemas.",
                title: "Conocer definiciones y propiedades de los conjuntos de números naturales y racionales.",
                hijosSaber: "1. Operaciones aritméticas elementales. 2. Operaciones con fracciones. 3. Números decimales.",
                panapain: "Los conjuntos de los números naturales se utilizan en la contabilidad familiar para poder manejar sus recursos económicos.",
                nanpaskas: "En diferentes culturas, los conjuntos de números naturales reflejan las prácticas y tradiciones de trueque.",
                satIshkit: "Trabajo individual y colaborativo, lluvia de ideas."
              },
              {
                id: "P1-T2",
                status: "not_started",
                tuhPutkamna: "Numérico Variacional: Concepto de número entero. Representación en la recta numérica. Operaciones y problemas.",
                title: "Identifica las principales propiedades de los números enteros y comprende el algoritmo de las operaciones básicas.",
                hijosSaber: "1. Recta numérica y números negativos. 2. Suma y resta de enteros. 3. Multiplicación de enteros.",
                panapain: "Proponer caminos de solución a un problema determinado en el contexto del comercio y trueque local.",
                nanpaskas: "Identificar los números enteros y sus propiedades en un contexto social y económico amplio.",
                satIshkit: "Mesa redonda, exposiciones temáticas."
              }
            ]
          },
          {
            id: "unit-periodo-2",
            title: "PAS T+T – SEGUNDO PERIODO",
            order: 2,
            topics: [
              {
                id: "P2-T1",
                status: "not_started",
                tuhPutkamna: "Geométrico Métrico: Elementos de geometría, Definiciones, Segmentos, Ángulos y Polígonos en el diseño de artesanías.",
                title: "Reconoce los principales elementos de la geometría y los identifica en construcciones y tejidos propios.",
                hijosSaber: "1. Definición de punto, recta y plano. 2. Medición y dibujo de ángulos. 3. Clasificación de polígonos.",
                panapain: "La geometría está viva en la arquitectura tradicional de las casas y en el trazado de las chagras comunitarias.",
                nanpaskas: "Reconoce la universalidad de las formas geométricas combinadas con la particularidad artística local.",
                satIshkit: "Talleres de tejido y geometría en espiral."
              }
            ]
          },
          {
            id: "unit-periodo-3",
            title: "KUTÑA T+T – TERCER PERIODO",
            order: 3,
            topics: [
              {
                id: "P3-T1",
                status: "not_started",
                tuhPutkamna: "Métrico y Aleatorio: Unidades de medida propias y convencionales. Recolección de datos y estadística descriptiva.",
                title: "Aplica conversiones de unidades y organiza datos estadísticos de encuestas sobre producción agrícola local.",
                hijosSaber: "1. Sistemas de medidas. 2. Tablas de frecuencias. 3. Diagramas de barras.",
                panapain: "Las estadísticas propias ayudan a planificar la soberanía alimentaria familiar.",
                nanpaskas: "Interpreta información estadística de medios de comunicación contrastándola con la realidad territorial.",
                satIshkit: "Censos escolares, gráficos en papel milimetrado."
              }
            ]
          }
        ];
      } else {
        units = [
          {
            id: "unit-periodo-1",
            title: "MAZA T+T – PRIMER PERIODO",
            order: 1,
            topics: [
              {
                id: "P1-T1",
                status: "active",
                tuhPutkamna: `Fundamentos y Contexto de ${selectedSubject}: Apropiación de conceptos clave orientados a la realidad del territorio.`,
                title: `Identificar los principios teóricos y prácticos fundamentales de ${selectedSubject} en la vida diaria.`,
                hijosSaber: "Conceptos clave del primer periodo Awá.",
                panapain: "Articular los contenidos con las vivencias cotidianas de las familias Awá.",
                nanpaskas: "Contrastar enfoques globales con la visión armónica del territorio.",
                satIshkit: "Trabajo colaborativo, mesas de diálogo."
              }
            ]
          }
        ];
      }

      const curriculumData = {
        id: deterministicId,
        grade: selectedGrade,
        subjectId: selectedSubject,
        units
      };

      await setDoc(doc(db, "curriculum", deterministicId), curriculumData);
      alert("¡Tejido de aprendizaje regenerado con éxito con la plantilla oficial!");
    } catch (err) {
      console.error("Error al resetear currículo:", err);
      alert("Ocurrió un error al intentar resetear el currículo.");
    } finally {
      setIsResetting(false);
    }
  };

  const handlePrintModule = (plan: any, type: any) => {
    printPedagogicalPlan({
      ...plan,
      grade: plan.grade || selectedGrade,
      subject: plan.subject || selectedSubject
    }, profile.name || "Docente IETABA", type);
  };

  const handleDownload = async (name: string) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      
      // Configuración inicial
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(20, 83, 45); // Verde oscuro elegante
      
      const isSupportMaterial = name.includes("Material_Apoyo");
      
      if (isSupportMaterial) {
        doc.text("MATERIAL DE APOYO DIDÁCTICO Y PROFUNDIZACIÓN", 20, 25);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá - IETABA", 20, 31);
        
        doc.setDrawColor(20, 83, 45);
        doc.setLineWidth(0.5);
        doc.line(20, 34, 190, 34);
        
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(`Asignatura: ${selectedSubject}   |   Grado: ${selectedGrade}`, 20, 42);
        
        const content = [
          "",
          "1. FUNDAMENTACIÓN PEDAGÓGICA (MODELO TEJIENDO SABERES):",
          "Este material complementario tiene como propósito articular los saberes universales con el",
          "pensamiento propio de la comunidad Awá (Higra), promoviendo la soberanía alimentaria,",
          "el cuidado de la Madre Tierra (Katsa Su) y el fortalecimiento matemático y científico.",
          "",
          "2. ESTRATEGIAS DE INTEGRACIÓN AGROAMBIENTAL EN EL AULA:",
          "• Implementar mediciones directas en las huertas escolares y viveros forestales.",
          "• Fomentar el trabajo cooperativo mediante 'Mingas de Pensamiento' para resolver problemas.",
          "• Relacionar las variables teóricas con elementos tangibles del entorno veredal.",
          "",
          "3. PAUTAS PARA EL TRABAJO AUTÓNOMO DEL ESTUDIANTE:",
          "Se sugiere que el docente guíe la lectura de los conceptos fundamentales antes de iniciar",
          "la fase de estructuración, permitiendo que los estudiantes formulen hipótesis basadas en la",
          "observación tradicional de sus familias y mayores.",
          "",
          "4. REFERENCIAS Y BIBLIOGRAFÍA SUGERIDA:",
          "• Lineamientos Curriculares Comunitarios - Plan de Vida Awá.",
          "• Estándares Básicos de Competencias adaptados a la interculturalidad.",
          "• Módulos Pedagógicos IETABA - Edición de Fortalecimiento Técnico."
        ];
        
        let y = 48;
        content.forEach(line => {
          if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(20, 83, 45);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
          }
          doc.text(line, 20, y);
          y += 6;
        });
        
      } else {
        doc.text("GUÍA DE PRESENTACIÓN INTERACTIVA (DIAPOSITIVAS)", 20, 25);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Estructura Secuencial para Proyección y Diálogo en Aula — IETABA", 20, 31);
        
        doc.setDrawColor(20, 83, 45);
        doc.setLineWidth(0.5);
        doc.line(20, 34, 190, 34);
        
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text(`Módulo: ${selectedSubject}   |   Nivel: ${selectedGrade}`, 20, 42);
        
        const slides = [
          "",
          "DIAPOSITIVA 1: PORTADA Y BIENVENIDA",
          "• Título: Minga de Pensamiento y Construcción del Saber.",
          "• Dinámica: Saludo tradicional y contextualización del tema curricular.",
          "",
          "DIAPOSITIVA 2: SABERES PREVIOS DESDE EL TERRITORIO",
          "• Pregunta Central: ¿Cómo aplican nuestras familias este conocimiento en el día a día?",
          "• Objetivo: Conectar la memoria biocultural con los objetivos del periodo.",
          "",
          "DIAPOSITIVA 3: DESARROLLO TEÓRICO RIGUROSO",
          "• Contenido: Definiciones precisas, diagramas conceptuales y axiomas clave.",
          "• Enfoque: Claridad absoluta, paso a paso lógico y uso de unidades correctas.",
          "",
          "DIAPOSITIVA 4: EJEMPLO PRÁCTICO AGROAMBIENTAL",
          "• Caso de Estudio: Aplicación directa en proyectos productivos del IETABA.",
          "• Demostración: Resolución en pizarra involucrando activamente a los estudiantes.",
          "",
          "DIAPOSITIVA 5: CONCLUSIONES Y EVALUACIÓN COOPERATIVA",
          "• Cierre: Síntesis de los aprendizajes y asignación de roles para el taller comunitario."
        ];
        
        let y = 48;
        slides.forEach(line => {
          if (line.startsWith("DIAPOSITIVA")) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setTextColor(20, 83, 45);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
          }
          doc.text(line, 20, y);
          y += 6;
        });
      }
      
      // Guardar el documento generado
      doc.save(name);
    } catch (err) {
      console.error("Error al generar el archivo de descarga:", err);
      alert("Hubo un error al generar el archivo para su descarga.");
    }
  };

  // Cargando datos iniciales
  const isLoading = !selectedGrade || !selectedSubject;

  return (
    <RoleGuard allowedRoles={["COORDINADOR", "DOCENTE", "RECTOR"]}>
      <div className="flex flex-col min-h-screen">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-[1440px] mx-auto w-full space-y-8 pb-24 md:pb-8">
        {/* Global Filters & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-outline-variant/30">
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase italic">Tejidos Temáticos</h1>
            
            {isLoading ? (
              <div className="flex items-center gap-3 text-slate-400">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Cargando perfil docente...</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 items-end">
                {/* Selector de Grado */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1 pl-1">Grado</label>
                  <div className="relative">
                    <select 
                      value={selectedGrade} 
                      onChange={(e) => { setSelectedGrade(e.target.value); setAnalysisResult(null); }}
                      className="appearance-none bg-primary/10 border-2 border-primary/30 text-primary rounded-2xl pl-5 pr-12 py-3.5 font-black text-sm uppercase tracking-widest focus:ring-2 ring-primary focus:outline-none cursor-pointer min-w-[160px] hover:bg-primary/20 transition-all"
                    >
                      {availableGrades.map(g => <option key={g} value={g}>Grado {g}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                  </div>
                </div>

                {/* Selector de Materia */}
                <div>
                  <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1 pl-1">Materia</label>
                  <div className="relative">
                    <select 
                      value={selectedSubject} 
                      onChange={(e) => { setSelectedSubject(e.target.value); setAnalysisResult(null); }}
                      className="appearance-none bg-secondary/10 border-2 border-secondary/30 text-secondary rounded-2xl pl-5 pr-12 py-3.5 font-black text-sm uppercase tracking-widest focus:ring-2 ring-secondary focus:outline-none cursor-pointer min-w-[220px] hover:bg-secondary/20 transition-all"
                    >
                      {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                  </div>
                </div>

                {/* Indicador de estado del tejido */}
                {activeCurriculum ? (
                  <div className="flex items-center gap-2 px-4 py-3.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-2xl">
                    <CheckCircle2 size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tejido Cargado</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3.5 bg-amber-50 border-2 border-amber-200 text-amber-700 rounded-2xl">
                    <UploadCloud size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sin Tejido — Carga el PDF</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 w-full md:w-auto mt-4 md:mt-0">
            {!isLoading && <PDFCurriculumImporter grade={selectedGrade} subject={selectedSubject} />}
            <CSVImporter grade={selectedGrade} subject={selectedSubject} />
            <button 
              onClick={handleResetCurriculum}
              disabled={isResetting}
              className="flex-1 md:flex-none justify-center items-center gap-2 px-4 md:px-6 py-3 md:py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest hover:shadow-2xl transition-all flex disabled:opacity-50"
            >
              {isResetting ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              Restaurar Tejido IA
            </button>
            <button className="flex-1 md:flex-none justify-center items-center gap-2 px-4 md:px-8 py-3 md:py-4 bg-on-surface text-white rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black uppercase tracking-widest hover:shadow-2xl transition-all flex">
              <Plus size={16} />
              Nuevo Tema
            </button>
          </div>
        </div>

        {/* Contenido condicional: solo si hay datos y existe tejido */}
        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <Loader2 size={48} className="animate-spin text-primary mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Sincronizando perfil institucional...</p>
            </div>
          </div>
        ) : activeCurriculum ? (
          <>
            {/* Sub-barra de navegación Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/50 shadow-sm w-full md:w-auto">
                <button
                  onClick={() => setCurriculumTab("planner")}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    curriculumTab === "planner"
                      ? "bg-on-surface text-white shadow-md"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Planeador Curricular
                </button>
                <button
                  onClick={() => setCurriculumTab("readings")}
                  className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    curriculumTab === "readings"
                      ? "bg-on-surface text-white shadow-md"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Lecturas del Tejido
                </button>
              </div>

              <button
                onClick={() => setIsPiarOpen(true)}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles size={14} className="animate-pulse text-yellow-200" />
                Adaptación PIAR de Clase
              </button>
            </div>

            {curriculumTab === "readings" ? (
              <LecturasTejido 
                grade={selectedGrade} 
                subject={selectedSubject} 
                onPrint={handlePrintModule} 
              />
            ) : (
              <>
                {/* Radar de Competencias Institucional */}
                <div className="mb-8">
                  <RadarCompetencias plan={analysisResult} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-8">
                <UnitProgress grade={selectedGrade} subject={selectedSubject} />
                <UnitSidebar grade={selectedGrade} subject={selectedSubject} />
              </div>

              <div className="lg:col-span-8 space-y-8">
                <TopicTree grade={selectedGrade} subject={selectedSubject} />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-outline-variant/30 rounded-[2rem] p-8 shadow-xl">
                    <h4 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em]">Recursos Sugeridos: {selectedSubject} {selectedGrade}</h4>
                    <div className="space-y-3">
                      <div 
                        onClick={() => handleDownload(`Material_Apoyo_${selectedSubject.substring(0,3)}_${selectedGrade}.pdf`)}
                        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/20 group"
                      >
                        <div className="w-10 h-10 bg-error/10 text-error rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                           <FileText size={20} />
                        </div>
                        <div className="flex-1">
                           <p className="text-xs font-black uppercase tracking-tight">Material_Apoyo_{selectedSubject.substring(0,3)}_{selectedGrade}.pdf</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">Guía de Profundización</p>
                        </div>
                        <Download size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                      <div 
                        onClick={() => handleDownload(`Guia_Presentacion_${selectedGrade}.pdf`)}
                        className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/20 group"
                      >
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                           <Presentation size={20} />
                        </div>
                        <div className="flex-1">
                           <p className="text-xs font-black uppercase tracking-tight">Guia_Presentacion_{selectedGrade}.pdf</p>
                           <p className="text-[8px] font-bold text-slate-400 uppercase">Guía de Diapositivas</p>
                        </div>
                        <Download size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary text-white border border-outline-variant rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group cursor-pointer min-h-[300px] flex flex-col justify-center">
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                        <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-90">Asistente Curricular IA</h4>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setShowHistory(false)}
                              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${!showHistory ? 'border-yellow-300 text-white' : 'border-transparent text-white/50'}`}
                            >
                              Diseño Actual
                            </button>
                            <button 
                              onClick={() => setShowHistory(true)}
                              className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${showHistory ? 'border-yellow-300 text-white' : 'border-transparent text-white/50'} flex items-center gap-2`}
                            >
                              Historial <span className="bg-white/20 px-1.5 rounded-full text-[8px]">{generations.length}</span>
                            </button>
                         </div>
                      </div>

                      {showHistory ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                           {generations.length === 0 ? (
                             <div className="text-center py-10 opacity-50">
                               <History size={32} className="mx-auto mb-2 opacity-20" />
                               <p className="text-[10px] font-bold uppercase">No hay versiones previas</p>
                             </div>
                           ) : (
                             generations.map((gen, i) => (
                               <div key={gen.id} className="bg-white/10 p-4 rounded-2xl border border-white/5 hover:bg-white/20 transition-all group">
                                  <div className="flex items-center justify-between mb-2">
                                     <div className="flex items-center gap-2">
                                        <Calendar size={12} className="text-yellow-300" />
                                        <span className="text-[9px] font-black uppercase text-white/90">
                                          {gen.createdAt?.toDate?.()?.toLocaleDateString() || 'Reciente'}
                                        </span>
                                     </div>
                                     <button 
                                       onClick={() => handlePrintModule(gen, 'full')}
                                       className="p-2 bg-white/10 hover:bg-white text-primary rounded-xl transition-all"
                                     >
                                        <Printer size={12} />
                                     </button>
                                  </div>
                                  <p className="text-[10px] font-bold opacity-80 leading-tight">
                                    {gen.topic || 'Tema General'} - v{generations.length - i}
                                  </p>
                                  <button 
                                    onClick={() => { setAnalysisResult(gen); setShowHistory(false); }}
                                    className="mt-3 text-[8px] font-black uppercase tracking-widest text-yellow-300 hover:underline"
                                  >
                                    Cargar en Editor
                                  </button>
                               </div>
                             ))
                           )}
                        </div>
                      ) : analysisResult ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4 w-full">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-yellow-300">
                                <CheckCircle2 size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Planeación Generada</span>
                             </div>
                             <button onClick={() => setAnalysisResult(null)} className="text-[8px] font-black uppercase opacity-60 hover:opacity-100 flex items-center gap-1">
                               <RefreshCw size={10}/> Nueva
                             </button>
                           </div>

                           <div className="grid grid-cols-1 gap-2">
                              {[
                                { id: 'lesson', label: "Desarrollo", content: analysisResult.lesson, icon: <BookOpen size={14}/> },
                                { id: 'workshop', label: "Taller", content: analysisResult.workshop, icon: <FileText size={14}/> },
                                { id: 'activity', label: "Actividad", content: analysisResult.activity, icon: <Sparkles size={14}/> },
                                { id: 'exam', label: "Examen", content: analysisResult.exam, icon: <CheckCircle2 size={14}/> },
                                { id: 'teacherGuide', label: "Guía Docente", content: analysisResult.teacherGuide || "Guía exclusiva para el docente con respuestas del taller.", icon: <Presentation size={14}/> }
                              ].map((item, idx) => (
                                <div key={idx} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group/item relative">
                                   <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-2 text-white/90">
                                        {item.icon}
                                        <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                      </div>
                                      <button 
                                        onClick={() => handlePrintModule(analysisResult, item.id as any)}
                                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/50 hover:text-white"
                                        title="Imprimir este módulo"
                                      >
                                        <Printer size={12} />
                                      </button>
                                   </div>
                                   <p className="text-[11px] font-bold leading-tight line-clamp-2 opacity-80 group-hover/item:line-clamp-none transition-all">
                                     {item.content}
                                   </p>
                                </div>
                              ))}
                           </div>

                           {/* Feedback Loop Area */}
                           <div className="pt-2">
                             <div className="flex items-center gap-2 mb-2 px-1">
                               <MessageSquare size={12} className="text-yellow-300" />
                               <span className="text-[8px] font-black uppercase tracking-widest opacity-80">¿Fortalecer algún punto?</span>
                             </div>
                             <textarea 
                               value={feedback}
                               onChange={(e) => setFeedback(e.target.value)}
                               placeholder="Ej: Incluir más ejemplos de campo..."
                               className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-medium text-white placeholder:text-white/30 focus:outline-none focus:ring-1 ring-yellow-300/50 min-h-[60px]"
                             />
                             {feedback && (
                               <button 
                                 onClick={handleStartAnalysis}
                                 className="mt-2 w-full py-2 bg-yellow-300 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                               >
                                 <RefreshCw size={12} /> Regenerar con sugerencias
                               </button>
                             )}
                           </div>

                           <button 
                             onClick={() => handlePrintModule(analysisResult, 'full')}
                             className="w-full py-4 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
                           >
                              <Download size={16} />
                              Descargar Planeación Completa
                           </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-2xl font-black mb-2 leading-tight uppercase italic tracking-tighter">
                            ¿Optimizar {selectedSubject} para {selectedGrade}?
                          </p>
                          <p className="text-[10px] font-bold opacity-70 mb-6 uppercase tracking-widest leading-loose">
                            Soy tu pedagogo experto. Genero clases secuenciales, talleres didácticos y evaluaciones alineadas a la Higra.
                          </p>
                          
                          <div className="mb-6">
                             <div className="flex items-center gap-2 mb-2">
                               <MessageSquare size={12} className="text-yellow-300" />
                               <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Enfoque específico (opcional):</span>
                             </div>
                             <input 
                               type="text" 
                               value={feedback}
                               onChange={(e) => setFeedback(e.target.value)}
                               placeholder="Ej: Psicología infantil, Normativa MEN..."
                               className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-white/30 focus:outline-none"
                             />
                          </div>

                          <button 
                            onClick={handleStartAnalysis}
                            disabled={isAnalyzing}
                            className="px-8 py-4 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 shadow-xl shadow-black/20 flex items-center justify-center gap-3 min-w-[200px] disabled:opacity-60"
                          >
                            {isAnalyzing ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Diseñando Planeación...
                              </>
                            ) : (
                              "Iniciar Diseño Pedagógico"
                            )}
                          </button>
                        </>
                      )}
                    </div>
                    <Sparkles size={160} className="absolute -bottom-10 -right-10 text-white/10 group-hover:scale-110 transition-transform duration-700 rotate-12" />
                  </div>
                </div>
              </div>
            </div>
          </>)}
          </>
        ) : (
          /* Estado vacío: no existe tejido para esta combinación */
          <div className="bg-white border-2 border-dashed border-outline-variant rounded-[3rem] p-24 text-center">
            <div className="max-w-lg mx-auto space-y-6">
              <div className="w-24 h-24 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto">
                <BookOpen size={48} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-3">
                  Sin Tejido para {selectedSubject} — {selectedGrade}
                </h2>
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest leading-relaxed opacity-60">
                  Aún no has cargado la malla curricular institucional para este grado y materia. 
                  Usa el botón de arriba para subir el PDF con los periodos académicos.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <PDFCurriculumImporter grade={selectedGrade} subject={selectedSubject} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                El sistema extraerá automáticamente los 3 periodos: MAZA T+T · PAS T+T · KUTÑA T+T
              </p>
            </div>
          </div>
        )}

        <PiarAdaptationModal
          isOpen={isPiarOpen}
          onClose={() => setIsPiarOpen(false)}
          plan={analysisResult as any}
          onPrint={handlePrintModule}
        />
      </main>

      <BottomNavBar />
    </div>
    </RoleGuard>
  );
}
