"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import UnitProgress from "@/components/curriculum/UnitProgress";
import UnitSidebar from "@/components/curriculum/UnitSidebar";
import TopicTree from "@/components/curriculum/TopicTree";
import CSVImporter from "@/components/curriculum/CSVImporter";
import PDFCurriculumImporter from "@/components/curriculum/PDFCurriculumImporter";
import { Plus, Sparkles, FileText, Presentation, BookOpen, UploadCloud } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import RoleGuard from "@/components/shared/RoleGuard";
import { Loader2, Download, CheckCircle2, ChevronDown, MessageSquare, Printer, RefreshCw, History, Calendar } from "lucide-react";
import { printPedagogicalPlan } from "@/lib/printService";
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  const [analysisResult, setAnalysisResult] = useState<{
    id?: string,
    summary: string,
    lesson: string,
    workshop: string,
    activity: string,
    exam: string,
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

  // ── Verificar si existe tejido para la combinación actual ────────────────
  const activeCurriculum = useMemo(() => {
    if (!selectedGrade || !selectedSubject) return null;
    const normStr = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const gradeNum = selectedGrade.replace(/[^\d]/g, "");
    const targetSubject = normStr(selectedSubject);
    
    return curriculum.find(c => {
      const cGradeNum = c.grade.replace(/[^\d]/g, "");
      const cSubject = normStr(c.subjectId);
      const matchGrade = gradeNum && cGradeNum === gradeNum;
      const matchSubject = targetSubject && (cSubject.includes(targetSubject) || targetSubject.includes(cSubject));
      return matchGrade && matchSubject;
    }) ?? null;
  }, [curriculum, selectedGrade, selectedSubject]);

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

      const lessonStr = `${contextPrefix}📅 PARÁMETROS CURRICULARES DEL PERIODO
• Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
• Duración Académica: 3 Meses (Trimestre Reglado)
• Intensidad Horaria: 1 hora diaria de Lunes a Viernes (Total: 5 horas semanales / 60 horas por periodo)
• Modelo Pedagógico: Tejiendo Saberes (Awá) — Enfoque Crítico, Activo y Comunitario

${hilosContext}

======================================================================
I. FASE DE EXPLORACIÓN: CONTEXTUALIZACIÓN Y SABERES PREVIOS (Sesión 1)
======================================================================
🎯 Objetivo de la Fase: Despertar el interés del estudiante vinculando su realidad territorial, familiar y cultural en el IETABA con las estructuras de pensamiento de ${selectedSubject}.

🗣️ Actividad de Motivación Inicial: "La Minga del Conocimiento"
Iniciamos la semana de clase organizando el aula en un círculo tradicional. El docente introduce el tema [ ${topicName} ] (${topicHigra}) mediante un diálogo participativo sobre cómo nuestras autoridades indígenas abordan este aspecto de la vida.
• Pregunta Generadora 1: Desde la visión de nuestra comunidad, ¿cómo se relaciona este tema con las prácticas agroambientales diarias?
• Pregunta Generadora 2: ¿Por qué el dominio de los conceptos de ${selectedSubject} es fundamental para defender la soberanía de nuestra reserva indígena?

======================================================================
II. FASE DE ESTRUCTURACIÓN: CONCEPTUALIZACIÓN EXHAUSTIVA Y ANÁLISIS (Sesiones 2 y 3)
======================================================================
📖 Desarrollo Teórico de Alto Rigor (Para Dictar y Consignar en el Cuaderno):
CONCEPTO FUNDAMENTAL: ${topicDefinition}

Para dominar este concepto, el estudiante debe interiorizar las siguientes pautas:
1. Identificación de Contexto: Separar claramente los elementos teóricos de su aplicación práctica.
2. Estructura Lógica: Entender la causalidad y relación de los elementos estudiados.
3. Consistencia Territorial: Todo saber debe tener coherencia y utilidad para el cuidado de Katsa Su (la Gran Tierra).

💡 Ejemplos Resueltos y Explicados al Detalle:

• EJEMPLO MODELO 1: APLICACIÓN CONCEPTUAL
${example1Text}

• EJEMPLO MODELO 2: CONTEXTUALIZACIÓN AGROAMBIENTAL TERRITORIAL
Enunciado: Una familia Awá desea aplicar los saberes de ${selectedSubject} en la administración de un cultivo tradicional. ¿Qué pasos deben seguir para asegurar que su acción esté alineada con el Plan de Vida institucional?
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Diagnóstico): Evaluar el estado actual de la parcela.
- Paso 2 (Aplicación Teórica): Utilizar las metodologías propias de la materia para optimizar el recurso.
- Paso 3 (Cierre Comunitario): Compartir el conocimiento con el cabildo escolar.
- Conclusión Didáctica: Este ejercicio conecta la teoría académica con la vida cotidiana y el tejido social.

======================================================================
III. FASE DE TRANSFERENCIA: APLICACIÓN PRÁCTICA EN AULA (Sesiones 4 y 5)
======================================================================
✍️ Taller Guiado en Clase:
Los estudiantes se organizan en mesas de trabajo cooperativo. El docente entrega una guía donde cada grupo debe mapear un problema real de su vereda aplicando los saberes de ${selectedSubject}.
Cada equipo plasmará su propuesta en un papelógrafo, utilizando diagramas claros y sustentando sus ideas ante el grupo.`;

      const workshopStr = `${contextPrefix}📝 TALLER DE APLICACIÓN DIDÁCTICA INTENSIVA
Institución: IETABA — Territorio Awá
Grado: ${selectedGrade} | Materia: ${selectedSubject}
Tema: ${topicName}
${hilosContext}
Tiempo Estimado de Resolución: 2 Horas de Trabajo Autónomo/Grupal

======================================================================
SECCIÓN A: DESARROLLO ANALÍTICO Y PROCEDIMIENTOS (40%)
======================================================================
Instrucción: Desarrolla en tu cuaderno las siguientes actividades paso a paso, justificando cada respuesta a partir de los apuntes de la clase.
1. 📖 Describe con tus propias palabras cómo el concepto de ${topicName} puede observarse en la naturaleza o en la organización comunitaria de tu vereda.
2. ✍️ Aplica la metodología de ${selectedSubject} para estructurar una solución a un problema simulado en el aula.
3. 📊 Compara las prácticas ancestrales con los conocimientos occidentales sobre este tema y establece dos similitudes y dos diferencias.

======================================================================
SECCIÓN B: RESOLUCIÓN DE CASOS AGROAMBIENTALES Y COMUNITARIOS (40%)
======================================================================
Lee con detenimiento la siguiente situación contextualizada en nuestra comunidad y responde:

🌱 Caso Práctico: "Proyecto Integrador en la Reserva"
El cabildo escolar del IETABA debe ejecutar un proyecto formativo utilizando las bases de ${selectedSubject}. 
• Reto 1: Identifica los elementos principales necesarios para llevar a cabo la iniciativa.
• Reto 2: ¿De qué manera la temática de ${topicName} influye directamente en el éxito de este proyecto?
• Reto 3: Formula una recomendación técnica fundamentada en la materia para mejorar las prácticas actuales.

======================================================================
SECCIÓN C: PRODUCCIÓN ARGUMENTATIVA E INTERCULTURALIDAD (20%)
======================================================================
✍️ Redacta un ensayo corto (mínimo 3 párrafos bien estructurados) donde respondas a la siguiente reflexión:
"¿De qué manera el aprendizaje de ${selectedSubject} nos permite cuidar a la Madre Tierra (Katsa Su) y fortalecer los planes de vida de la nación Awá?"`;

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

      const examStr = `${contextPrefix}🏆 EVALUACIÓN SUMATIVA POR COMPETENCIAS (RÚBRICA DE EXCELENCIA)
Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
Asignatura: ${selectedSubject} | Grado: ${selectedGrade}
Estructura: Prueba de Calidad Académica alineada a Saberes Propios
${hilosContext}

======================================================================
BLOQUE I: COMPETENCIA INTERPRETATIVA
======================================================================
Instrucción: Lee detenidamente cada planteamiento y selecciona la respuesta más adecuada según lo aprendido en clase sobre ${topicName}.

1. Al analizar los principios fundamentales de ${selectedSubject} en nuestro contexto territorial, es correcto afirmar que:
   a) Su aplicación está desconectada de la realidad ambiental y solo tiene valor teórico.
   b) Permite comprender dinámicas, resolver problemas y organizar información vital para la comunidad.
   c) Promueve el abandono de los saberes ancestrales en favor de metodologías ajenas.
   d) Únicamente es útil para la aprobación del área académica sin impacto práctico.

2. Cuando aplicamos el concepto principal de ${topicName} en un escenario práctico del IETABA, la ventaja primordial es que:
   a) Facilita la toma de decisiones informadas para proyectos de sostenibilidad y convivencia.
   b) Limita la creatividad de los estudiantes al imponer fórmulas rígidas.
   c) Sustituye el diálogo comunitario por reportes técnicos complejos.
   d) Evita que la comunidad participe en la evaluación de sus propios recursos.

======================================================================
BLOQUE II: COMPETENCIA ARGUMENTATIVA
======================================================================
3. ✍️ Un estudiante afirma que "el aprendizaje riguroso de ${selectedSubject} no aporta herramientas significativas para la preservación de Katsa Su (La Gran Tierra)". 
   Demuestra si esta afirmación es VERDADERA o FALSA elaborando un argumento sustentado en los conceptos vistos sobre ${topicName}.

======================================================================
BLOQUE III: COMPETENCIA PROPOSITIVA (Resolución de Casos)
======================================================================
4. 🚀 Diseña una propuesta de intervención estructurada para el siguiente reto institucional:
   "El cabildo escolar IETABA requiere optimizar una de sus áreas de trabajo comunitario apoyándose en los principios de ${selectedSubject}. Redacta cómo estructurarías el plan de acción, incluyendo el diagnóstico, los conceptos clave a utilizar y los beneficios esperados para la comunidad estudiantil."`;

      const newPlan = {
        summary: `Planeación Integral: ${selectedSubject} (${selectedGrade})`,
        lesson: lessonStr,
        workshop: workshopStr,
        activity: activityStr,
        exam: examStr,
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

  const handlePrintModule = (plan: any, type: 'full' | 'lesson' | 'workshop' | 'activity' | 'exam') => {
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

          <div className="flex items-center gap-3">
            {!isLoading && <PDFCurriculumImporter grade={selectedGrade} subject={selectedSubject} />}
            <CSVImporter />
            <button className="flex items-center gap-2 px-8 py-3 bg-on-surface text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-2xl transition-all">
              <Plus size={18} />
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
                                { id: 'exam', label: "Examen", content: analysisResult.exam, icon: <CheckCircle2 size={14}/> }
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
      </main>

      <BottomNavBar />
    </div>
    </RoleGuard>
  );
}
