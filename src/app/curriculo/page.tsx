"use client";
import { normalizeGrade } from "@/lib/constants";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import UnitProgress from "@/components/curriculum/UnitProgress";
import UnitSidebar from "@/components/curriculum/UnitSidebar";
import TopicTree from "@/components/curriculum/TopicTree";
import CSVImporter from "@/components/curriculum/CSVImporter";
import PDFCurriculumImporter from "@/components/curriculum/PDFCurriculumImporter";
import { normalizeTopicForDisplay, computeCurriculumCoverage } from "@/lib/tejidoTemplate";
import { Plus, Sparkles, FileText, Presentation, BookOpen, UploadCloud, CheckSquare } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import RoleGuard from "@/components/shared/RoleGuard";
import { Loader2, Download, CheckCircle2, ChevronDown, MessageSquare, Printer, RefreshCw, History, Calendar } from "lucide-react";
import { printPedagogicalPlan } from "@/lib/printService";
import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Premium Competency & Inclusivity Modules
import RadarCompetencias from "@/components/curriculum/RadarCompetencias";
import PiarAdaptationModal from "@/components/curriculum/PiarAdaptationModal";
import LecturasTejido from "@/components/curriculum/LecturasTejido";
import DidacticLoader from "@/components/layout/DidacticLoader";

export default function CurriculumPage() {
  const { masterData, profile, curriculum, user } = useApp();

  // ── Derivar grados y materias disponibles ────────────────────────────────
  const availableGrades = useMemo(() => {
    const isAdmin = profile.role === "RECTOR" || profile.role === "COORDINADOR";
    if (isAdmin) return masterData.grades || [];
    if (profile.teachingGrades?.length) return profile.teachingGrades;
    const fromSchedule = [...new Set(profile.weeklySchedule?.map(b => b.grade).filter(Boolean) || [])];
    return fromSchedule.length ? fromSchedule : masterData.grades || [];
  }, [profile, masterData]);

  const availableSubjects = useMemo(() => {
    const isAdmin = profile.role === "RECTOR" || profile.role === "COORDINADOR";
    if (isAdmin) return masterData.subjects || [];
    if (profile.teachingSubjectsList?.length) return profile.teachingSubjectsList;
    const fromSchedule = [...new Set(profile.weeklySchedule?.map(b => b.subject).filter(Boolean) || [])];
    return fromSchedule.length ? fromSchedule : masterData.subjects || [];
  }, [profile, masterData]);

  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedAiTopicId, setSelectedAiTopicId] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [generations, setGenerations] = useState<any[]>([]);
  const [curriculumTab, setCurriculumTab] = useState<"planner" | "readings">("planner");
  const [isPiarOpen, setIsPiarOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    id?: string;
    summary: string;
    lesson: string;
    workshop: string;
    activity: string;
    exam: string;
    teacherGuide?: string;
    createdAt?: any;
  } | null>(null);

  useEffect(() => {
    if (availableGrades.length && !selectedGrade) {
      setSelectedGrade(availableGrades[0]);
    }
    if (availableSubjects.length && !selectedSubject) {
      setSelectedSubject(availableSubjects[0]);
    }
  }, [availableGrades, availableSubjects, selectedGrade, selectedSubject]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedGrade || !selectedSubject) return;
      try {
        const q = query(
          collection(db, "pedagogical_plans"),
          where("grade", "==", selectedGrade),
          where("subject", "==", selectedSubject)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        docs.sort((a: any, b: any) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        });
        setGenerations(docs);
      } catch (e) {
        console.warn("Error consultando historial de planes:", e);
      }
    };
    fetchHistory();
  }, [selectedGrade, selectedSubject]);

  const [uploadingModule, setUploadingModule] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCurriculum = useMemo(() => {
    if (!curriculum.length || !selectedGrade || !selectedSubject) return null;

    const normStr = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    const targetSubject = normStr(selectedSubject);
    const targetGradeNum = selectedGrade.replace(/[^\d]/g, "");

    const candidates = curriculum.filter(c => {
      const cGradeNum = c.grade.replace(/[^\d]/g, "");
      return targetGradeNum && cGradeNum === targetGradeNum;
    });

    if (candidates.length === 0) return null;

    const exact = candidates.find(c => normStr(c.subjectId) === targetSubject);
    if (exact) return exact;

    const startsWith = candidates.find(c => normStr(c.subjectId).startsWith(targetSubject));
    if (startsWith) return startsWith;

    const reverse = candidates.find(c => targetSubject.startsWith(normStr(c.subjectId)));
    if (reverse) return reverse;

    return null;
  }, [curriculum, selectedGrade, selectedSubject]);

  const allNormalizedTopics = useMemo(() => {
    if (!activeCurriculum) return [];
    return [...activeCurriculum.units]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .flatMap((u, idx) =>
        u.topics.map(t => ({
          raw: t,
          unitId: u.id,
          unitOrder: u.order || idx + 1,
          unitTitle: u.title,
          norm: normalizeTopicForDisplay(t),
        }))
      );
  }, [activeCurriculum]);

  const activeEntry = useMemo(() => {
    if (!allNormalizedTopics.length) return null;
    if (selectedAiTopicId) {
      const found = allNormalizedTopics.find(x => x.raw.id === selectedAiTopicId);
      if (found) return found;
    }
    return (
      allNormalizedTopics.find(x => x.raw.status === "active") ||
      allNormalizedTopics.find(x => x.raw.status !== "covered") ||
      allNormalizedTopics[0]
    );
  }, [allNormalizedTopics, selectedAiTopicId]);

  const coverage = useMemo(() => computeCurriculumCoverage(activeCurriculum), [activeCurriculum]);

  if (!mounted)
    return (
      <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    setTimeout(async () => {
      const targetEntry = activeEntry;
      const normT = targetEntry?.norm || normalizeTopicForDisplay(null);
      const unitTitle = targetEntry?.unitTitle || "MAZA T+T – PRIMER PERIODO";

      const higraName = normT.higra || `Higra de ${selectedSubject}`;
      const ejesList = normT.ejes.length > 0 ? normT.ejes : [higraName];
      const saberText = normT.saber || `Comprender los conceptos fundamentales de ${higraName}.`;
      const hacerText = normT.hacer || `Resolver situaciones prácticas sobre ${ejesList.join(", ")}.`;
      const serText = normT.ser || `Participar con responsabilidad, pensamiento crítico y respeto comunitario.`;
      const panapainText =
        normT.panapain ||
        `Articular ${higraName} con las prácticas cotidianas, contabilidad familiar y saberes del territorio Awá (Katsa Su).`;
      const nanpaskasText =
        normT.nanpaskas ||
        `Integrar los saberes científicos e interculturales de ${selectedSubject} respetando la identidad cultural comunitaria.`;
      const satIshkitText =
        normT.satIshkit ||
        "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras.";
      const recursosSugeridosText =
        normT.katkinAizpa ||
        `Guías impresas de la Higra "${higraName}", material concreto del entorno Awá, carteleras, pizarra y recursos audiovisuales.`;

      const contextPrefix = feedback ? `🎯 ENFOQUE DE FORTALECIMIENTO PEDAGÓGICO: ${feedback.toUpperCase()}\n\n` : "";
      const coverageSummary = coverage.periods
        .map(p => `• Periodo ${p.order} (${p.title}): ${p.completedEjes}/${p.totalEjes} temas cumplidos (${p.percentage}%)`)
        .join("\n");

      const estructuraHigraBlock = `🌿 ESTRUCTURA INSTITUCIONAL DEL TEJIDO (PUYUAIZPA PUTKIT KAMNA)
----------------------------------------------------------------------
• Periodo Académico: ${unitTitle}${normT.semanas ? ` (${normT.semanas} semanas)` : ""}
• HIGRA DEL CONOCIMIENTO (Tuh Putkamna — Base de la Clase):
  ${higraName}${normT.higraDetalle ? ` — ${normT.higraDetalle}` : ""}
• TEMAS DE LA HIGRA A CUBRIR EN EL PERIODO (${normT.completedEjes.length}/${ejesList.length} cumplidos):
${ejesList.map((e, i) => `  ${i + 1}. ${e} [${normT.completedEjes.includes(e) ? "CUMPLIDO" : "POR CUBRIR"}]`).join("\n")}

🧵 HILOS DEL SABER (Piankammu Mi — Se desprenden de la Higra):
  - HILO SABER (Cognitivo): ${saberText}
  - HILO HACER (Procedimental): ${hacerText}
  - HILO SER (Actitudinal y Comunitario): ${serText}

🌎 COMPETENCIAS Y SABIDURÍAS (Pianaizpa):
  - Pañapain (Sabiduría Propia): ${panapainText}
  - Ñanpaskas Piankamna (Sabiduría Intercultural): ${nanpaskasText}

🛠️ METODOLOGÍA TEJIENDO APRENDO (Sat Ishkit Kamtana) Y RECURSOS SUGERIDOS:
  - Estrategias: ${satIshkitText}
  - Recursos y Ayudas Pedagógicas: ${recursosSugeridosText}
----------------------------------------------------------------------`;

      const sLower = selectedSubject.toLowerCase();
      let topicDefinition = `La Higra del Conocimiento "${higraName}" en ${selectedSubject} articula el desarrollo de los temas (${ejesList.join(", ")}) a través del Hilo SABER (${saberText}), llevándolos a la práctica mediante el Hilo HACER (${hacerText}) y fortaleciendo la convivencia desde el Hilo SER (${serText}).`;
      const example1Text = `Enunciado: Aplicación en nuestra comunidad Awá de la Higra "${higraName}" enfocada en el tema "${ejesList[0]}".
PASO A PASO DE RESOLUCIÓN (ARTICULACIÓN SABER - HACER - SER):
- Paso 1 (Hilo SABER): Identificamos los conceptos y propiedades clave (${saberText}).
- Paso 2 (Sabiduría Propia - Pañapain): Conectamos con la realidad del territorio: ${panapainText}
- Paso 3 (Hilo HACER): Ejecutamos el procedimiento práctico: ${hacerText}
- Conclusión (Hilo SER): Valoramos el aprendizaje colectivo: ${serText}`;

      if (sLower.includes("matemáticas") || sLower.includes("matematicas")) {
        topicDefinition = `La Higra "${higraName}" desarrolla el pensamiento numérico, variacional, geométrico y métrico abordando rigurosamente los temas: ${ejesList.join(", ")}. Parte del Hilo SABER (${saberText}) hacia la resolución algorítmica y analítica del Hilo HACER (${hacerText}).`;
      } else if (sLower.includes("tecnología") || sLower.includes("informatica") || sLower.includes("tecnologia")) {
        topicDefinition = `La Higra "${higraName}" comprende el análisis y apropiación de artefactos, procesos y herramientas tecnológicas (${ejesList.join(", ")}), articulando el Hilo SABER (${saberText}) con la práctica técnica del Hilo HACER (${hacerText}) sin perder la identidad cultural Awá.`;
      }

      const lessonStr = `${contextPrefix}📅 GUÍA CURRICULAR DE CLASE PREPARADA SOBRE LA HIGRA DEL CONOCIMIENTO
======================================================================
• Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
• Grado: ${selectedGrade} | Asignatura: ${selectedSubject}
• Eje Integrador: Armonización territorial con Katsa Su (La Gran Tierra)
======================================================================
${estructuraHigraBlock}

📊 CONTROL DE CUMPLIMIENTO DE LA HIGRA EN TODOS LOS PERIODOS:
${coverageSummary}

======================================================================
I. FASE DE EXPLORACIÓN Y SABIDURÍA PROPIA — PAÑAPAIN (Sesión 1)
======================================================================
🎯 PROPÓSITO PEDAGÓGICO (HILO SER Y SABIDURÍA PROPIA):
Activar los saberes propios (${panapainText}) alrededor de la Higra "${higraName}", fomentando el Hilo SER: ${serText}

🗣️ MINGA DE CONOCIMIENTOS (TEJIENDO APRENDO: ${satIshkitText.split(/[,\n]/).slice(0, 3).join(", ")}):
El docente introduce la Higra del Conocimiento [ ${higraName} ] y socializa con los estudiantes los temas que se cumplirán en el periodo: ${ejesList.join(" · ")}.

💬 Preguntas Orientadoras para el Cuaderno:
1. Desde nuestra sabiduría propia (Pañapain), ¿cómo utilizamos "${ejesList[0]}" en las actividades de nuestras familias y del resguardo?
2. ¿Cómo se relacionan los temas (${ejesList.join(", ")}) con los saberes de otras culturas (Ñanpaskas)?

======================================================================
II. FASE DE ESTRUCTURACIÓN SOBRE LA HIGRA — HILO SABER (Sesiones 2 y 3)
======================================================================
📖 FUNDAMENTACIÓN CONCEPTUAL (HILO SABER):
• Meta Cognitiva: ${saberText}
• Desarrollo Teórico de la Higra:
${topicDefinition}

• DESGLOSE SECUENCIAL DE TODOS LOS TEMAS DE LA HIGRA:
${ejesList.map((eje, idx) => `  ${idx + 1}. **${eje}**: Explicación conceptual, propiedades fundamentales y representación aplicada a contextos del territorio y estándares universales (Ñanpaskas: ${nanpaskasText}).`).join("\n")}

💡 EJEMPLOS MODELO RESUELTOS PASO A PASO:
• EJEMPLO 1 (Apropiación del Hilo SABER y HACER):
${example1Text}

• EJEMPLO 2 (Caso Intercultural y Agroambiental en el IETABA):
Enunciado: En un proyecto escolar del IETABA se requiere aplicar "${ejesList[1] || ejesList[0]}" utilizando la metodología Tejiendo Aprendo (${satIshkitText}).
RESOLUCIÓN PASO A PASO:
- Paso 1 (Diagnóstico): Recolección de datos o elementos del entorno utilizando los recursos sugeridos (${recursosSugeridosText}).
- Paso 2 (Desarrollo Hilo HACER): ${hacerText}
- Paso 3 (Socialización Hilo SER): Presentación en mesa redonda o cartelera demostrando: ${serText}

======================================================================
III. FASE DE TRANSFERENCIA — HILO HACER Y TEJIENDO APRENDO (Sesiones 4 y 5)
======================================================================
✍️ PRÁCTICA GUIADA Y COLABORATIVA:
Aplicando las estrategias de Tejiendo Aprendo (${satIshkitText}) y apoyados en los recursos sugeridos (${recursosSugeridosText}), los estudiantes resuelven ejercicios prácticos por cada uno de los ${ejesList.length} temas de la Higra "${higraName}", garantizando el cumplimiento cabal del periodo.`;

      const workshopStr = `${contextPrefix}📝 TALLER INTEGRAL POR TEMAS DE LA HIGRA Y LOS TRES HILOS (SABER · HACER · SER)
----------------------------------------------------------------------
Institución: IETABA (Territorio Awá) | Materia: ${selectedSubject} | Grado: ${selectedGrade}
Periodo: ${unitTitle}
Higra del Conocimiento (Tuh Putkamna): ${higraName}
Temas de la Higra evaluados: ${ejesList.join(" · ")}
======================================================================

--- [ SECCIÓN 1: HILO SABER — APROPIACIÓN CONCEPTUAL DE LA HIGRA ] ---
Meta del Hilo SABER: ${saberText}

1. 📖 [Conceptualización de la Higra]: Explica con tus propias palabras los conceptos fundamentales de la Higra "${higraName}" y elabora un esquema que conecte sus temas: ${ejesList.join(", ")}.
2. 🔍 [Comprensión del Tema 1 — "${ejesList[0]}"]: Describe las propiedades o características principales de "${ejesList[0]}" y da un ejemplo concreto explicado en clase.
3. 📊 [Cuadro Comparativo Intercultural — Ñanpaskas]: Teniendo en cuenta la sabiduría intercultural (${nanpaskasText}), compara cómo se aplica "${ejesList[1] || ejesList[0]}" en nuestra comunidad Awá y en otros contextos culturales o científicos.

--- [ SECCIÓN 2: HILO HACER — APLICACIÓN PROCEDIMENTAL Y RESOLUCIÓN ] ---
Meta del Hilo HACER: ${hacerText}

4. ✍️ [Ejercicio Práctico — "${ejesList[0]}"]: Resuelve paso a paso un ejercicio práctico de "${ejesList[0]}" aplicando el procedimiento trabajado en el Hilo HACER (${hacerText}).
5. 📐 [Desarrollo de "${ejesList[1] || ejesList[0]}"]: Plantea y desarrolla un problema completo sobre "${ejesList[1] || ejesList[0]}" verificando cada paso de tu respuesta.
6. 🌾 [Situación Problema en el Territorio — Pañapain]: Basado en nuestra sabiduría propia (${panapainText}), resuelve una situación problema real de la comunidad o parcela escolar aplicando "${ejesList[ejesList.length - 1]}".
7. 🛠️ [Práctica Tejiendo Aprendo — Sat Ishkit]: Utilizando la estrategia de "${satIshkitText.split(/[,\n]/)[0] || "Trabajo colaborativo"}", diseña una cartelera, tabla o representación gráfica que sintetice la solución de los temas: ${ejesList.join(", ")}.

--- [ SECCIÓN 3: HILO SER Y SÍNTESIS INTERCULTURAL ] ---
Meta del Hilo SER: ${serText}

8. 🤝 [Reflexión del Hilo SER]: ¿Cómo practicaste durante este taller la meta actitudinal "${serText}" junto a tus compañeros de equipo?
9. 🌱 [Aplicación Comunitaria en Katsa Su]: Propón una iniciativa para tu vereda o cabildo escolar donde los temas de la Higra "${higraName}" ayuden al cuidado del territorio o al manejo responsable de los recursos.
10. 📝 [Síntesis Integral de la Higra]: Redacta una conclusión explicando por qué es importante cumplir todos los temas de la Higra "${higraName}" (${ejesList.join(", ")}) para fortalecer tanto el saber propio (Pañapain) como el intercultural (Ñanpaskas).`;

      const teacherGuideStr = `${contextPrefix}🎓 GUÍA DOCENTE: CONTROL DE LA HIGRA, RECURSOS Y SOLUCIONARIO
======================================================================
Institución: IETABA | Grado: ${selectedGrade} | Materia: ${selectedSubject}
Periodo: ${unitTitle}
Higra del Conocimiento (Tuh Putkamna): ${higraName}
======================================================================

🎯 MATRIZ DE ALINEACIÓN CURRICULAR DE LA CLASE:
• Higra del Conocimiento: ${higraName}
• Temas de la Higra (${ejesList.length}): ${ejesList.map((e, i) => `${i + 1}) ${e}`).join(" | ")}
• Hilo SABER: ${saberText}
• Hilo HACER: ${hacerText}
• Hilo SER: ${serText}
• Sabiduría Propia (Pañapain): ${panapainText}
• Sabiduría Intercultural (Ñanpaskas): ${nanpaskasText}
• Metodología Tejiendo Aprendo (Sat Ishkit): ${satIshkitText}
• Recursos Sugeridos (Katkin Aizpa): ${recursosSugeridosText}

📋 VERIFICACIÓN DE CUMPLIMIENTO EN TODOS LOS PERIODOS:
${coverageSummary}
• Recomendación IA de Cobertura: ${
        coverage.overallPercentage === 100
          ? "¡Felicitaciones! Todos los temas de la Higra en los 3 periodos están cubiertos al 100%."
          : `Para cumplir a cabalidad el tejido anual, asegúrate de marcar cada uno de los ${ejesList.length} temas de "${higraName}" a medida que se desarrollan en las sesiones.`
      }

======================================================================
🔑 CRITERIOS DE EVALUACIÓN Y SOLUCIONARIO POR HILOS DEL SABER
======================================================================
• Preguntas 1 a 3 (Evaluación del Hilo SABER — 35%):
  Se verifica que el estudiante domine: "${saberText}", identificando con claridad los temas (${ejesList.join(", ")}) y su relación intercultural (${nanpaskasText}).
• Preguntas 4 a 7 (Evaluación del Hilo HACER — 40%):
  Se califica el desarrollo procedimental: "${hacerText}", la exactitud en la resolución de situaciones problema y la articulación con Pañapain (${panapainText}).
• Preguntas 8 a 10 (Evaluación del Hilo SER y Convivencia — 25%):
  Se valora la vivencia de: "${serText}" durante el trabajo colaborativo de Tejiendo Aprendo (${satIshkitText}).`;

      const activityStr = `${contextPrefix}🎲 ACTIVIDAD DIDÁCTICA TEJIENDO APRENDO (SAT ISHKIT KAMTANA)
======================================================================
Higra del Conocimiento: ${higraName}
Temas Integrados: ${ejesList.join(" · ")}
Estrategias Oficiales del Tejido: ${satIshkitText}
======================================================================

🎯 OBJETIVO DE LA ACTIVIDAD (ARTICULACIÓN HACER + SER):
• Hilo HACER: ${hacerText}
• Hilo SER: ${serText}

🛠️ RECURSOS SUGERIDOS (KATKIN AIZPA SAINA):
• ${recursosSugeridosText}
• Tarjetas de trabajo por cada tema de la Higra (${ejesList.join(", ")}).
• Elementos del contexto comunitario Awá para ejemplificación práctica.

🚀 PASO A PASO DE LA EXPERIENCIA EN AULA:
1. Apertura en Círculo de Palabra (10 min): Contextualización desde la Sabiduría Propia (Pañapain): "${panapainText}".
2. Estaciones por Temas de la Higra (25 min): El curso se organiza en equipos colaborativos. Cada estación aborda uno de los temas de la Higra (${ejesList.map((e, i) => `Estación ${i + 1}: ${e}`).join(" | ")}) aplicando el Hilo SABER y el Hilo HACER.
3. Socialización y Mesa Redonda (15 min): Siguiendo la metodología Tejiendo Aprendo (${satIshkitText}), cada grupo expone su solución en cartelera o plenaria.
4. Valoración del Hilo SER (10 min): Coevaluación comunitaria reconociendo el respeto, la precisión y la colaboración (${serText}).`;

      const examStr = `${contextPrefix}🏆 EVALUACIÓN POR COMPETENCIAS Y HILOS DEL SABER (SABER · HACER · SER)
======================================================================
Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
Asignatura: ${selectedSubject} | Grado: ${selectedGrade} | Periodo: ${unitTitle}
Higra del Conocimiento (Tuh Putkamna): ${higraName}
Temas Evaluados: ${ejesList.join(" · ")}
Estudiante: ___________________________ | Fecha: __________________
======================================================================

📝 PARTE I: EVALUACIÓN DEL HILO SABER Y SABIDURÍAS (SELECCIÓN MÚLTIPLE)
Meta evaluada: ${saberText}

1. [HILO SABER — Tema: ${ejesList[0]}]: De acuerdo con la Higra del Conocimiento "${higraName}", el estudio de "${ejesList[0]}" nos permite principalmente:
   a) ${saberText}
   b) Desconocer las propiedades fundamentales y resolver al azar sin análisis previo.
   c) Omitir la relación entre los conceptos de ${selectedSubject} y la vida cotidiana.
   d) Sustituir el razonamiento lógico por respuestas sin justificación.

2. [SABIDURÍA PROPIA — PAÑAPAIN]: En el contexto de nuestra comunidad Awá y el territorio Katsa Su, los temas (${ejesList.join(", ")}) cobran sentido propio porque:
   a) ${panapainText}
   b) Solo tienen validez fuera del resguardo y no se aplican en la vida diaria.
   c) Impiden el trabajo colaborativo en las mingas y proyectos familiares.
   d) Reemplazan por completo los saberes de nuestros mayores.

3. [HILO HACER — Tema: ${ejesList[1] || ejesList[0]}]: Al enfrentar una situación problema relacionada con "${ejesList[1] || ejesList[0]}", el procedimiento correcto según el Hilo HACER consiste en:
   a) ${hacerText}
   b) Copiar un resultado sin verificar los datos ni aplicar las propiedades correspondientes.
   c) Evitar el uso de representaciones, esquemas o algoritmos de solución.
   d) Dejar el problema incompleto sin comprobar su coherencia.

4. [HILO SER Y SABIDURÍA INTERCULTURAL — ÑANPASKAS]: Durante el trabajo en equipo de Tejiendo Aprendo (${satIshkitText.split(/[,\n]/)[0]}), un estudiante demuestra el Hilo SER y la visión intercultural cuando:
   a) ${serText} (${nanpaskasText})
   b) Trabaja de manera individual rechazando los aportes de sus compañeros.
   c) Desconoce el valor de las prácticas culturales propias y de otras culturas.
   d) Incumple los acuerdos del grupo durante la socialización.

📝 PARTE II: RESOLUCIÓN ABIERTA SOBRE LOS TEMAS DE LA HIGRA (HILO HACER Y SER)
5. [APLICACIÓN INTEGRAL DE LA HIGRA]: Elige dos temas de la Higra "${higraName}" (${ejesList.join(" / ")}) y resuelve en tu hoja un caso práctico aplicado a nuestra comunidad o colegio, explicando:
   • ¿Qué concepto del Hilo SABER utilizaste?
   • ¿Qué pasos del Hilo HACER realizaste para resolverlo?
   • ¿Cómo aporta esta solución al Buen Vivir y cuidado de Katsa Su (Hilo SER y Pañapain)?`;

      const newPlan = {
        summary: `Planeación sobre la Higra: ${higraName} (${selectedSubject} ${selectedGrade})`,
        lesson: lessonStr,
        workshop: workshopStr,
        activity: activityStr,
        exam: examStr,
        teacherGuide: teacherGuideStr,
        grade: selectedGrade,
        subject: selectedSubject,
        topic: `${higraName} (${ejesList.join(", ")})`,
        higra: higraName,
        ejes: ejesList,
        saber: saberText,
        hacer: hacerText,
        ser: serText,
        teacherId: user?.uid || "anonymous",
        createdAt: serverTimestamp(),
      };

      try {
        const docRef = await addDoc(collection(db, "pedagogical_plans"), newPlan);
        setAnalysisResult({ id: docRef.id, ...newPlan });
        setGenerations(prev => [{ id: docRef.id, ...newPlan, createdAt: Timestamp.now() }, ...prev]);
        setIsAnalyzing(false);
      } catch (err) {
        console.error("Error saving plan:", err);
        setAnalysisResult({ id: `local-${Date.now()}`, ...newPlan });
        setIsAnalyzing(false);
      }
    }, 1500);
  };

  const handleResetCurriculum = async () => {
    if (!selectedGrade || !selectedSubject) return;
    const confirm = window.confirm(
      `¿Estás seguro de que deseas regenerar el tejido de aprendizaje para ${selectedSubject} (${selectedGrade})? Se actualizará con la jerarquía oficial: Periodo → Higra del Conocimiento → Hilos del Saber (Saber, Hacer y Ser).`
    );
    if (!confirm) return;

    setIsResetting(true);
    try {
      const normGrade = normalizeGrade(selectedGrade);
      const normSubject = selectedSubject.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
      const deterministicId = `cur-${normGrade}-${normSubject}`.replace(/\s+/g, "-").replace(/°/g, "").toLowerCase();

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
                id: "P1-H1",
                status: "covered",
                semanas: "10",
                title: "Naturaleza y Evolución de la Tecnología",
                tuhPutkamna: "Naturaleza y Evolución de la Tecnología: Artefactos y procesos tecnológicos ancestrales y modernos en el territorio.",
                ejes: [
                  "Evolución de la herramienta",
                  "Técnica vs Tecnología",
                  "Artefactos tradicionales y modernos del territorio"
                ],
                completedEjes: [
                  "Evolución de la herramienta",
                  "Técnica vs Tecnología",
                  "Artefactos tradicionales y modernos del territorio"
                ],
                saber: "Identificar y clasificar herramientas tradicionales de uso comunitario frente a tecnologías mecánicas y digitales.",
                hacer: "Analizar y demostrar el funcionamiento de herramientas agrícolas y de comunicación utilizadas en el resguardo Awá.",
                ser: "Valorar el ingenio de los saberes ancestrales combinados con las herramientas tecnológicas actuales.",
                hijosSaber: "SABER: Identificar y clasificar herramientas tradicionales de uso comunitario frente a tecnologías mecánicas y digitales.\nHACER: Analizar y demostrar el funcionamiento de herramientas agrícolas y de comunicación utilizadas en el resguardo Awá.\nSER: Valorar el ingenio de los saberes ancestrales combinados con las herramientas tecnológicas actuales.",
                panapain: "El uso adecuado de herramientas permite optimizar el trabajo en las mingas y parcelas familiares respetando los ciclos de la tierra.",
                nanpaskas: "Comparar cómo diferentes culturas integran los avances técnicos sin perder su identidad cultural y comunitaria.",
                satIshkit: "Trabajo colaborativo, Talleres prácticos, Entrevistas a mayores, Demostración de artefactos, Lluvia de ideas."
              }
            ]
          },
          {
            id: "unit-periodo-2",
            title: "PAS T+T – SEGUNDO PERIODO",
            order: 2,
            topics: [
              {
                id: "P2-H1",
                status: "active",
                semanas: "10",
                title: "Apropiación y Uso de la Tecnología: Hojas de Cálculo (Excel)",
                tuhPutkamna: "Apropiación y Uso de la Tecnología: Manejo responsable de la información y organización de datos en Microsoft Excel.",
                ejes: [
                  "Celdas, filas, columnas y rangos",
                  "Fórmulas básicas (SUMA, PROMEDIO)",
                  "Funciones lógicas simples y tablas de datos"
                ],
                completedEjes: ["Celdas, filas, columnas y rangos"],
                saber: "Reconocer la interfaz de las hojas de cálculo, la estructura de celdas y la sintaxis de fórmulas y funciones básicas.",
                hacer: "Elaborar tablas y aplicar fórmulas básicas en Excel para organizar datos escolares y productivos de la comunidad.",
                ser: "Hacer un uso ético, ordenado y colaborativo de los computadores en el aula de sistemas.",
                hijosSaber: "SABER: Reconocer la interfaz de las hojas de cálculo, la estructura de celdas y la sintaxis de fórmulas.\nHACER: Elaborar tablas y aplicar fórmulas básicas en Excel.\nSER: Hacer un uso ético, ordenado y colaborativo de los computadores.",
                panapain: "Aprovechar las hojas de cálculo para organizar la producción y contabilidad de cultivos familiares en el territorio.",
                nanpaskas: "Uso ético y estructurado de las herramientas ofimáticas en el ámbito escolar y comunitario.",
                satIshkit: "Talleres prácticos de Excel, Diseño de tablas de producción local, Trabajo colaborativo."
              }
            ]
          },
          {
            id: "unit-periodo-3",
            title: "KUTÑA T+T – TERCER PERIODO",
            order: 3,
            topics: [
              {
                id: "P3-H1",
                status: "not_started",
                semanas: "10",
                title: "Solución de Problemas con Tecnología",
                tuhPutkamna: "Solución de Problemas con Tecnología: Diseño de sistemas sencillos para el cuidado ambiental y productivo.",
                ejes: [
                  "Diseño tecnológico sustentable",
                  "Aprovechamiento de materiales reciclados",
                  "Prototipado para la huerta y el agro"
                ],
                completedEjes: [],
                saber: "Proponer soluciones técnicas elementales para las huertas escolares y el cuidado ambiental del resguardo.",
                hacer: "Diseñar y construir maquetas o prototipos sustentables utilizando materiales del entorno y reciclados.",
                ser: "Ser consciente del impacto ambiental de los residuos y trabajar solidariamente por el cuidado de Katsa Su.",
                hijosSaber: "SABER: Proponer soluciones técnicas elementales para las huertas escolares.\nHACER: Diseñar y construir maquetas o prototipos sustentables.\nSER: Ser consciente del impacto ambiental y trabajar por el cuidado de Katsa Su.",
                panapain: "La técnica y la tecnología deben estar al servicio de Katsa Su (el gran territorio) para garantizar el Buen Vivir.",
                nanpaskas: "Integrar conocimientos técnicos universales sobre sostenibilidad ambiental con las prácticas ancestrales.",
                satIshkit: "Proyectos de aula, Maquetas sustentables, Exposiciones comunitarias."
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
                id: "P1-H1",
                status: "active",
                semanas: "10",
                title: "Numérico variacional: Conjuntos de números naturales y racionales",
                tuhPutkamna: "Numérico variacional: Operaciones con los números naturales. Operaciones con fraccionarios. Operaciones con números decimales. Situaciones problemas.",
                ejes: [
                  "Operaciones con los números naturales",
                  "Operaciones con fraccionarios",
                  "Operaciones con números decimales",
                  "Situaciones problemas"
                ],
                completedEjes: ["Operaciones con los números naturales"],
                saber: "Conocer las definiciones y propiedades de los conjuntos de números naturales y racionales.",
                hacer: "Realizar operaciones básicas como números naturales y racionales.",
                ser: "Ser lógico, preciso y analítico al trabajar con números naturales y racionales.",
                hijosSaber: "SABER: Conocer las definiciones y propiedades de los conjuntos de números naturales y racionales.\nHACER: Realizar operaciones básicas como números naturales y racionales.\nSER: Ser lógico, preciso y analítico al trabajar con números naturales y racionales.",
                panapain: "Los conjuntos de los números naturales se utilizan comúnmente en la vida diaria, especialmente en la contabilidad para poder manejar sus recursos económicos en su comunidad; los números racionales se utilizan para calcular precios y cantidades fraccionarias en nuestro territorio.",
                nanpaskas: "En diferentes culturas, los conjuntos de números naturales y racionales se utilizan de manera única y reflejan las prácticas y tradiciones locales.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos."
              },
              {
                id: "P1-H2",
                status: "not_started",
                semanas: "10",
                title: "Numérico Variacional: Conjunto de los números enteros",
                tuhPutkamna: "Numérico Variacional: Concepto de número entero. Representación de números enteros en la recta numérica. Valor absoluto. Orden en los enteros. Operación con números enteros. Situaciones problemas.",
                ejes: [
                  "Concepto de número entero",
                  "Representación de números enteros en la recta numérica",
                  "Valor absoluto",
                  "Orden en los enteros",
                  "Operación con números enteros",
                  "Situaciones problemas"
                ],
                completedEjes: [],
                saber: "Identifica las principales propiedades de los números enteros y comprende el algoritmo de las operaciones básicas.",
                hacer: "Resuelve situaciones que involucran las operaciones básicas con números enteros y aplica sus propiedades en el desarrollo de polinomios aritméticos.",
                ser: "Comparte su saber en el trabajo colectivo, demostrando responsabilidad y respeto hacia sus compañeros.",
                hijosSaber: "SABER: Identifica las principales propiedades de los números enteros y comprende el algoritmo de las operaciones básicas.\nHACER: Resuelve situaciones que involucran las operaciones básicas con números enteros y aplica sus propiedades en el desarrollo de polinomios aritméticos.\nSER: Comparte su saber en el trabajo colectivo, demostrando responsabilidad y respeto hacia sus compañeros.",
                panapain: "Proponer diferentes caminos de solución a un problema determinado, utilizando técnicas, conceptos, procedimientos y/o argumentos matemáticos propios de los números enteros.",
                nanpaskas: "Identifica los números enteros y sus propiedades en un contexto social y económico; además, plantea y resuelve problemas de tipo matemático y de otras ciencias, utilizando las operaciones básicas con números enteros.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos."
              }
            ]
          },
          {
            id: "unit-periodo-2",
            title: "PAS T+T – SEGUNDO PERIODO",
            order: 2,
            topics: [
              {
                id: "P2-H1",
                status: "not_started",
                semanas: "10",
                title: "Geométrico Métrico: Elementos de geometría, ángulos y polígonos",
                tuhPutkamna: "Geométrico Métrico: Elementos de geometría, Definiciones, Segmentos, Ángulos y Polígonos en el diseño de artesanías.",
                ejes: [
                  "Definición de punto, recta, plano y segmentos",
                  "Medición y construcción de ángulos",
                  "Clasificación de polígonos",
                  "Geometría aplicada a tejidos y construcciones propias"
                ],
                completedEjes: [],
                saber: "Reconoce los principales elementos de la geometría y los identifica en construcciones y tejidos propios.",
                hacer: "Construye y clasifica polígonos y ángulos relacionándolos con los patrones del canasto y la shingra Awá.",
                ser: "Interioriza y valora la belleza geométrica de las creaciones tradicionales de su comunidad.",
                hijosSaber: "SABER: Reconoce los principales elementos de la geometría y los identifica en construcciones y tejidos propios.\nHACER: Construye y clasifica polígonos y ángulos.\nSER: Interioriza y valora la belleza geométrica de las creaciones tradicionales.",
                panapain: "La geometría está viva en la arquitectura tradicional de las casas y en el trazado de las chagras comunitarias.",
                nanpaskas: "Reconoce la universalidad de las formas geométricas combinadas con la particularidad artística local.",
                satIshkit: "Talleres de tejido y geometría en espiral, Uso de regla y transportador, Carteleras."
              }
            ]
          },
          {
            id: "unit-periodo-3",
            title: "KUTÑA T+T – TERCER PERIODO",
            order: 3,
            topics: [
              {
                id: "P3-H1",
                status: "not_started",
                semanas: "10",
                title: "Métrico y Aleatorio: Unidades de medida y estadística descriptiva",
                tuhPutkamna: "Métrico y Aleatorio: Unidades de medida propias y convencionales. Recolección de datos y estadística descriptiva.",
                ejes: [
                  "Sistemas y conversión de unidades de medida",
                  "Recolección de datos y tablas de frecuencias",
                  "Diagramas de barras y análisis estadístico"
                ],
                completedEjes: [],
                saber: "Aplica conversiones de unidades y comprende la organización de datos estadísticos de encuestas sobre producción agrícola local.",
                hacer: "Elabora tablas de frecuencias y diagramas de barras sobre cultivos y recursos del resguardo.",
                ser: "Muestra rigor, honestidad y trabajo solidario en la recolección y análisis de información comunitaria.",
                hijosSaber: "SABER: Aplica conversiones de unidades y organiza datos estadísticos.\nHACER: Elabora tablas de frecuencias y diagramas de barras.\nSER: Muestra rigor, honestidad y trabajo solidario.",
                panapain: "Las estadísticas propias ayudan a planificar la soberanía alimentaria familiar.",
                nanpaskas: "Interpreta información estadística de medios de comunicación contrastándola con la realidad territorial.",
                satIshkit: "Censos escolares, Gráficos en papel milimetrado, Exposiciones."
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
                id: "P1-H1",
                status: "active",
                semanas: "10",
                title: `Fundamentos y Contexto de ${selectedSubject}`,
                tuhPutkamna: `Fundamentos y Contexto de ${selectedSubject}: Apropiación de conceptos clave orientados a la realidad del territorio.`,
                ejes: [
                  `Conceptos esenciales de ${selectedSubject}`,
                  `Aplicación de ${selectedSubject} en el territorio Awá`,
                  "Resolución de problemas contextualizados"
                ],
                completedEjes: [],
                saber: `Identificar los principios teóricos y prácticos fundamentales de ${selectedSubject} en la vida diaria.`,
                hacer: `Aplicar procedimientos y análisis de ${selectedSubject} en situaciones reales de la comunidad escolar.`,
                ser: "Participar con respeto, responsabilidad y espíritu colaborativo en las actividades del aula.",
                hijosSaber: `SABER: Identificar los principios teóricos y prácticos de ${selectedSubject}.\nHACER: Aplicar procedimientos en situaciones reales.\nSER: Participar con respeto y responsabilidad.`,
                panapain: "Articular los contenidos con las vivencias cotidianas de las familias Awá.",
                nanpaskas: "Contrastar enfoques globales con la visión armónica del territorio.",
                satIshkit: "Trabajo colaborativo, mesas de diálogo, exposiciones y carteleras."
              }
            ]
          }
        ];
      }

      const curriculumData = {
        id: deterministicId,
        grade: selectedGrade,
        subjectId: selectedSubject,
        units,
      };

      await setDoc(doc(db, "curriculum", deterministicId), curriculumData);
      alert("¡Tejido de aprendizaje regenerado con la estructura oficial (Higra → Temas → Saber, Hacer y Ser)!");
    } catch (err) {
      console.error("Error al resetear currículo:", err);
      alert("Ocurrió un error al intentar resetear el currículo.");
    } finally {
      setIsResetting(false);
    }
  };

  const handlePrintModule = (plan: any, type: any) => {
    printPedagogicalPlan(
      {
        ...plan,
        grade: plan.grade || selectedGrade,
        subject: plan.subject || selectedSubject,
      },
      profile.name || "Docente IETABA",
      type
    );
  };

  const handleUploadToDrive = async (plan: any, moduleId: string) => {
    setUploadingModule(moduleId);
    await new Promise(resolve => setTimeout(resolve, 1200));

    const titles: Record<string, string> = {
      full: "Planeación Pedagógica Integral",
      lesson: "I. Desarrollo de Clase sobre la Higra",
      workshop: "II. Taller de Aplicación (Saber, Hacer, Ser)",
      activity: "III. Actividad Tejiendo Aprendo",
      exam: "IV. Evaluación por Hilos del Saber",
      teacherGuide: "V. Guía Docente y Cumplimiento de la Higra",
    };

    alert(
      `¡Documento [${titles[moduleId] || moduleId}] guardado exitosamente en tu carpeta 'IETABA_Guias_Academicas'!\n\nHigra: ${
        plan?.higra || activeEntry?.norm.higra || selectedSubject
      }`
    );
    setUploadingModule(null);
  };

  const handleDownload = async (name: string) => {
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      const normT = activeEntry?.norm || normalizeTopicForDisplay(null);
      const unitTitle = activeEntry?.unitTitle || "MAZA T+T – PRIMER PERIODO";

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor(20, 83, 45);

      const isSupportMaterial = name.includes("Material_Apoyo");
      const isCoverageReport = name.includes("Control_Cumplimiento");

      const writeWrappedLines = (lines: { text: string; bold?: boolean; color?: [number, number, number] }[], startY: number) => {
        let y = startY;
        for (const item of lines) {
          if (y > 272) {
            pdf.addPage();
            y = 20;
          }
          pdf.setFont("helvetica", item.bold ? "bold" : "normal");
          pdf.setFontSize(item.bold ? 9.5 : 8.8);
          const [r, g, b] = item.color || (item.bold ? [20, 83, 45] : [15, 23, 42]);
          pdf.setTextColor(r, g, b);
          const wrapped = pdf.splitTextToSize(item.text, 170);
          pdf.text(wrapped, 20, y);
          y += wrapped.length * 4.8 + 1.5;
        }
      };

      if (isCoverageReport) {
        pdf.text("CONTROL DE CUMPLIMIENTO DE LA HIGRA POR PERIODOS", 20, 22);
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text("Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá - IETABA", 20, 28);
        pdf.setDrawColor(20, 83, 45);
        pdf.line(20, 31, 190, 31);

        const lines: { text: string; bold?: boolean; color?: [number, number, number] }[] = [
          { text: `Asignatura: ${selectedSubject}   |   Grado: ${selectedGrade}   |   Cumplimiento Total: ${coverage.completedEjes}/${coverage.totalEjes} temas (${coverage.overallPercentage}%)`, bold: true },
        ];

        coverage.periods.forEach(p => {
          lines.push({
            text: `PERIODO ${p.order}: ${p.title} — Avance: ${p.completedEjes}/${p.totalEjes} temas (${p.percentage}%)`,
            bold: true,
          });
          const unitObj = activeCurriculum?.units.find(u => u.id === p.unitId);
          unitObj?.topics.forEach(t => {
            const nt = normalizeTopicForDisplay(t);
            lines.push({
              text: `• Higra (${nt.id}): ${nt.higra}`,
              bold: true,
              color: [30, 58, 138],
            });
            nt.ejes.forEach(eje => {
              const done = t.status === "covered" || nt.completedEjes.includes(eje);
              lines.push({
                text: `   [${done ? "CUMPLIDO" : "PENDIENTE"}] Tema: ${eje}`,
              });
            });
            lines.push({ text: `   - Hilo SABER: ${nt.saber}` });
            lines.push({ text: `   - Hilo HACER: ${nt.hacer}` });
            lines.push({ text: `   - Hilo SER: ${nt.ser}` });
          });
        });

        writeWrappedLines(lines, 38);
      } else if (isSupportMaterial) {
        pdf.text("MATERIAL DE APOYO Y PROFUNDIZACIÓN DE LA HIGRA", 20, 22);
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text("Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá - IETABA", 20, 28);
        pdf.setDrawColor(20, 83, 45);
        pdf.line(20, 31, 190, 31);

        const lines: { text: string; bold?: boolean; color?: [number, number, number] }[] = [
          { text: `Asignatura: ${selectedSubject}   |   Grado: ${selectedGrade}   |   Periodo: ${unitTitle}`, bold: true },
          { text: `1. HIGRA DEL CONOCIMIENTO (TUH PUTKAMNA — BASE DE LA CLASE):`, bold: true },
          { text: `${normT.higra}${normT.higraDetalle ? ` — ${normT.higraDetalle}` : ""}` },
          { text: `Temas de la Higra a desarrollar en el periodo:` },
          ...normT.ejes.map((e, i) => ({ text: `   ${i + 1}. ${e}` })),
          { text: `2. HILOS DEL SABER (PIANKAMMU MI — SE DESPRENDEN DE LA HIGRA):`, bold: true },
          { text: `• HILO SABER (Cognitivo): ${normT.saber}` },
          { text: `• HILO HACER (Procedimental): ${normT.hacer}` },
          { text: `• HILO SER (Actitudinal y Comunitario): ${normT.ser}` },
          { text: `3. COMPETENCIAS Y SABIDURÍAS (PIANAIZPA):`, bold: true },
          { text: `• Pañapain (Sabiduría Propia): ${normT.panapain || "Articulación con el territorio Katsa Su."}` },
          { text: `• Ñanpaskas Piankamna (Sabiduría Intercultural): ${normT.nanpaskas || "Diálogo de saberes universales."}` },
          { text: `4. METODOLOGÍA TEJIENDO APRENDO (SAT ISHKIT KAMTANA) Y RECURSOS:`, bold: true },
          { text: `• Estrategias Didácticas: ${normT.satIshkit || "Trabajo individual y colaborativo, mesa redonda, exposiciones, carteleras."}` },
          { text: `• Recursos y Ayudas Sugeridas: ${normT.katkinAizpa || "Guías de la Higra, material concreto del entorno, cuaderno de trabajo y recursos audiovisuales."}` },
        ];

        writeWrappedLines(lines, 38);
      } else {
        pdf.text("GUÍA DE PRESENTACIÓN DE CLASE SOBRE LA HIGRA", 20, 22);
        pdf.setFontSize(8.5);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text("Estructura Secuencial para Proyección y Diálogo en Aula — IETABA", 20, 28);
        pdf.setDrawColor(20, 83, 45);
        pdf.line(20, 31, 190, 31);

        const lines: { text: string; bold?: boolean; color?: [number, number, number] }[] = [
          { text: `Asignatura: ${selectedSubject}   |   Grado: ${selectedGrade}   |   Higra: ${normT.higra}`, bold: true },
          { text: `DIAPOSITIVA 1: APERTURA DE LA HIGRA DEL CONOCIMIENTO (TUH PUTKAMNA)`, bold: true },
          { text: `• Higra: ${normT.higra}` },
          { text: `• Temas de la Higra: ${normT.ejes.join(" · ")}` },
          { text: `DIAPOSITIVA 2: SABIDURÍA PROPIA (PAÑAPAIN) Y EXPLORACIÓN`, bold: true },
          { text: `• Diálogo comunitario: ${normT.panapain || "Conexión con las prácticas cotidianas del territorio Awá."}` },
          { text: `DIAPOSITIVA 3: ESTRUCTURACIÓN — HILO SABER Y SABIDURÍA INTERCULTURAL`, bold: true },
          { text: `• Hilo SABER: ${normT.saber}` },
          { text: `• Ñanpaskas Piankamna: ${normT.nanpaskas || "Estándares interculturales de la asignatura."}` },
          { text: `DIAPOSITIVA 4: PRÁCTICA — HILO HACER Y TEJIENDO APRENDO (SAT ISHKIT)`, bold: true },
          { text: `• Hilo HACER: ${normT.hacer}` },
          { text: `• Metodología activa: ${normT.satIshkit || "Trabajo colaborativo y resolución de problemas."}` },
          { text: `DIAPOSITIVA 5: CIERRE FORMATIVO — HILO SER`, bold: true },
          { text: `• Hilo SER: ${normT.ser}` },
        ];

        writeWrappedLines(lines, 38);
      }

      pdf.save(name);
    } catch (err) {
      console.error("Error al generar el archivo de descarga:", err);
      alert("Hubo un error al generar el archivo para su descarga.");
    }
  };

  const isLoading = !selectedGrade || !selectedSubject;

  return (
    <RoleGuard allowedRoles={["COORDINADOR", "DOCENTE", "RECTOR"]}>
      <div className="flex flex-col min-h-screen">
        <TopAppBar />

        <main className="pt-20 px-4 md:px-6 max-w-[1440px] mx-auto w-full space-y-6 md:space-y-8 pb-24 md:pb-8">
          {/* Global Filters & Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-xl border border-outline-variant/30">
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight uppercase">
                Tejidos Temáticos (Puyuaizpa Putkit Kamna)
              </h1>

              {isLoading ? (
                <div className="flex items-center gap-3 text-slate-400">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-xs font-bold uppercase tracking-widest">Cargando perfil docente...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3 items-end">
                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1 pl-1">
                      Grado
                    </label>
                    <div className="relative">
                      <select
                        value={selectedGrade}
                        onChange={e => {
                          setSelectedGrade(e.target.value);
                          setSelectedAiTopicId("");
                          setAnalysisResult(null);
                        }}
                        className="appearance-none bg-primary/10 border-2 border-primary/30 text-primary rounded-2xl pl-5 pr-12 py-3.5 font-black text-sm uppercase tracking-widest focus:ring-2 ring-primary focus:outline-none cursor-pointer min-w-[160px] hover:bg-primary/20 transition-all"
                      >
                        {availableGrades.map(g => (
                          <option key={g} value={g}>
                            Grado {g}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1 pl-1">
                      Materia
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSubject}
                        onChange={e => {
                          setSelectedSubject(e.target.value);
                          setSelectedAiTopicId("");
                          setAnalysisResult(null);
                        }}
                        className="appearance-none bg-secondary/10 border-2 border-secondary/30 text-secondary rounded-2xl pl-5 pr-12 py-3.5 font-black text-sm uppercase tracking-widest focus:ring-2 ring-secondary focus:outline-none cursor-pointer min-w-[220px] hover:bg-secondary/20 transition-all"
                      >
                        {availableSubjects.map(s => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                    </div>
                  </div>

                  {activeCurriculum ? (
                    <div className="flex items-center gap-2 px-4 py-3.5 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 rounded-2xl">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Tejido Cargado · {coverage.completedEjes}/{coverage.totalEjes} temas ({coverage.overallPercentage}%)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-3.5 bg-amber-50 border-2 border-amber-200 text-amber-700 rounded-2xl">
                      <UploadCloud size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sin Tejido — Carga el formato</span>
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

          {isLoading ? (
            <div className="flex items-center justify-center py-20 w-full">
              <DidacticLoader />
            </div>
          ) : activeCurriculum ? (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6">
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/50 shadow-sm w-full md:w-auto">
                  <button
                    onClick={() => setCurriculumTab("planner")}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      curriculumTab === "planner" ? "bg-on-surface text-white shadow-md" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Planeador Curricular
                  </button>
                  <button
                    onClick={() => setCurriculumTab("readings")}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      curriculumTab === "readings" ? "bg-on-surface text-white shadow-md" : "text-slate-500 hover:text-slate-800"
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
                <LecturasTejido grade={selectedGrade} subject={selectedSubject} onPrint={handlePrintModule} />
              ) : (
                <>
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
                        {/* TARJETA DE RECURSOS SUGERIDOS ALINEADOS A LA HIGRA Y SUS HILOS */}
                        <div className="bg-white border border-outline-variant/30 rounded-[2rem] p-8 shadow-xl flex flex-col justify-between space-y-5">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                Recursos Sugeridos · {selectedSubject} {selectedGrade}
                              </h4>
                              {activeEntry && (
                                <p className="text-xs font-black text-on-surface mt-1">
                                  Higra activa: <span className="text-primary">{activeEntry.norm.higra}</span>
                                </p>
                              )}
                            </div>

                            {activeEntry && (
                              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-[11px]">
                                <div>
                                  <span className="text-[9px] font-black uppercase text-emerald-700 tracking-wider block">
                                    Metodología Tejiendo Aprendo (Sat Ishkit):
                                  </span>
                                  <p className="text-slate-700 font-medium leading-snug">
                                    {activeEntry.norm.satIshkit ||
                                      "Trabajo individual y colaborativo, mesa redonda, exposiciones, lluvia de ideas y carteleras."}
                                  </p>
                                </div>
                                {activeEntry.norm.katkinAizpa && (
                                  <div>
                                    <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider block">
                                      Ayudas Pedagógicas (Katkin Aizpa):
                                    </span>
                                    <p className="text-slate-700 font-medium leading-snug">{activeEntry.norm.katkinAizpa}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="space-y-2.5">
                              <div
                                onClick={() =>
                                  handleDownload(`Material_Apoyo_${selectedSubject.substring(0, 3)}_${selectedGrade}.pdf`)
                                }
                                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/20 group"
                              >
                                <div className="w-10 h-10 bg-error/10 text-error rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                  <FileText size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black uppercase tracking-tight truncate">
                                    Material_Apoyo_{selectedSubject.substring(0, 3)}_{selectedGrade}.pdf
                                  </p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">
                                    Guía con Higra + Hilos Saber, Hacer y Ser
                                  </p>
                                </div>
                                <Download size={14} className="text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                              </div>

                              <div
                                onClick={() => handleDownload(`Guia_Presentacion_${selectedGrade}.pdf`)}
                                className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-primary/5 rounded-xl cursor-pointer transition-all border border-transparent hover:border-primary/20 group"
                              >
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                  <Presentation size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black uppercase tracking-tight truncate">
                                    Guia_Presentacion_{selectedGrade}.pdf
                                  </p>
                                  <p className="text-[8px] font-bold text-slate-400 uppercase">
                                    Diapositivas de la Higra y Sabidurías
                                  </p>
                                </div>
                                <Download size={14} className="text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                              </div>

                              <div
                                onClick={() =>
                                  handleDownload(
                                    `Control_Cumplimiento_Higra_${selectedSubject.substring(0, 3)}_${selectedGrade}.pdf`
                                  )
                                }
                                className="flex items-center gap-3 p-3 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-xl cursor-pointer transition-all border border-emerald-200/70 group"
                              >
                                <div className="w-10 h-10 bg-emerald-600/15 text-emerald-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                  <CheckSquare size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-black text-emerald-950 uppercase tracking-tight truncate">
                                    Control_Cumplimiento_Higra_{selectedGrade}.pdf
                                  </p>
                                  <p className="text-[8px] font-bold text-emerald-700 uppercase">
                                    Reporte de temas cumplidos en los 3 periodos ({coverage.overallPercentage}%)
                                  </p>
                                </div>
                                <Download size={14} className="text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ASISTENTE CURRICULAR IA BASADO EN LA HIGRA Y SUS 3 HILOS */}
                        <div className="bg-primary text-white border border-outline-variant rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group min-h-[300px] flex flex-col justify-center">
                          <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles size={20} className="text-yellow-300 animate-pulse" />
                              <h4 className="text-xs font-black uppercase tracking-[0.2em] opacity-90">
                                Asistente Curricular IA · Basado en la Higra
                              </h4>
                            </div>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => setShowHistory(false)}
                                  className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${
                                    !showHistory ? "border-yellow-300 text-white" : "border-transparent text-white/50"
                                  }`}
                                >
                                  Diseño Actual
                                </button>
                                <button
                                  onClick={() => setShowHistory(true)}
                                  className={`text-[10px] font-black uppercase tracking-widest pb-1 border-b-2 transition-all ${
                                    showHistory ? "border-yellow-300 text-white" : "border-transparent text-white/50"
                                  } flex items-center gap-2`}
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
                                    <div
                                      key={gen.id}
                                      className="bg-white/10 p-4 rounded-2xl border border-white/5 hover:bg-white/20 transition-all group"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          <Calendar size={12} className="text-yellow-300" />
                                          <span className="text-[9px] font-black uppercase text-white/90">
                                            {gen.createdAt?.toDate?.()?.toLocaleDateString() || "Reciente"}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handlePrintModule(gen, "full")}
                                          className="p-2 bg-white/10 hover:bg-white text-primary rounded-xl transition-all"
                                        >
                                          <Printer size={12} />
                                        </button>
                                      </div>
                                      <p className="text-[10px] font-bold opacity-80 leading-tight">
                                        {gen.topic || "Higra General"} - v{generations.length - i}
                                      </p>
                                      <button
                                        onClick={() => {
                                          setAnalysisResult(gen);
                                          setShowHistory(false);
                                        }}
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
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      Planeación Generada sobre la Higra
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => setAnalysisResult(null)}
                                    className="text-[8px] font-black uppercase opacity-60 hover:opacity-100 flex items-center gap-1"
                                  >
                                    <RefreshCw size={10} /> Nueva
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                  {[
                                    { id: "lesson", label: "Desarrollo sobre la Higra", content: analysisResult.lesson, icon: <BookOpen size={14} /> },
                                    { id: "workshop", label: "Taller (Saber · Hacer · Ser)", content: analysisResult.workshop, icon: <FileText size={14} /> },
                                    { id: "activity", label: "Actividad Tejiendo Aprendo", content: analysisResult.activity, icon: <Sparkles size={14} /> },
                                    { id: "exam", label: "Evaluación por Hilos", content: analysisResult.exam, icon: <CheckCircle2 size={14} /> },
                                    {
                                      id: "teacherGuide",
                                      label: "Guía Docente y Cobertura",
                                      content: analysisResult.teacherGuide || "Guía exclusiva para el docente con respuestas del taller.",
                                      icon: <Presentation size={14} />,
                                    },
                                  ].map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 hover:bg-white/20 transition-all group/item relative"
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 text-white/90">
                                          {item.icon}
                                          <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleUploadToDrive(analysisResult, item.id as any)}
                                            disabled={uploadingModule === item.id}
                                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/50 hover:text-yellow-300 disabled:opacity-50"
                                            title="Guardar en Google Drive"
                                          >
                                            {uploadingModule === item.id ? (
                                              <Loader2 size={12} className="animate-spin text-yellow-300" />
                                            ) : (
                                              <UploadCloud size={12} />
                                            )}
                                          </button>
                                          <button
                                            onClick={() => handlePrintModule(analysisResult, item.id as any)}
                                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white/50 hover:text-white"
                                            title="Imprimir este módulo"
                                          >
                                            <Printer size={12} />
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-[11px] font-bold leading-tight line-clamp-2 opacity-80 group-hover/item:line-clamp-none transition-all">
                                        {item.content}
                                      </p>
                                    </div>
                                  ))}
                                </div>

                                <div className="pt-2">
                                  <div className="flex items-center gap-2 mb-2 px-1">
                                    <MessageSquare size={12} className="text-yellow-300" />
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                                      ¿Fortalecer algún punto de la Higra o de sus Hilos?
                                    </span>
                                  </div>
                                  <textarea
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="Ej: Profundizar en el Hilo HACER con ejemplos de la vereda..."
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
                                  onClick={() => handlePrintModule(analysisResult, "full")}
                                  className="w-full py-4 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center justify-center gap-3"
                                >
                                  <Download size={16} />
                                  Descargar Planeación Completa
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="text-xl md:text-2xl font-black mb-2 leading-tight uppercase italic tracking-tighter">
                                  Preparar Clase sobre la Higra ({selectedSubject} {selectedGrade})
                                </p>
                                <p className="text-[10px] font-bold opacity-80 mb-4 uppercase tracking-widest leading-relaxed">
                                  Diseño clases secuenciales, talleres, actividades Tejiendo Aprendo y evaluaciones tomando la Higra del Conocimiento, sus temas, sus Hilos (Saber, Hacer, Ser) y los recursos sugeridos.
                                </p>

                                {/* Selector de Higra para preparar con IA */}
                                {allNormalizedTopics.length > 0 && (
                                  <div className="mb-4">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-yellow-300 block mb-1">
                                      Higra del Conocimiento a preparar:
                                    </label>
                                    <select
                                      value={activeEntry?.raw.id || ""}
                                      onChange={e => setSelectedAiTopicId(e.target.value)}
                                      className="w-full bg-white/15 border border-white/25 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase text-white focus:outline-none cursor-pointer"
                                    >
                                      {allNormalizedTopics.map(item => (
                                        <option key={item.raw.id} value={item.raw.id} className="text-slate-900 font-bold">
                                          P{item.unitOrder} ({item.raw.id}) · {item.norm.higra} ({item.norm.completedEjes.length}/{item.norm.ejes.length} temas)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                {activeEntry && (
                                  <div className="mb-4 p-3 rounded-xl bg-white/10 border border-white/15 text-[10px] space-y-1">
                                    <p className="font-black text-yellow-200 uppercase">
                                      Temas de la Higra ({activeEntry.norm.ejes.length}):{" "}
                                      <span className="font-medium text-white">{activeEntry.norm.ejes.join(" · ")}</span>
                                    </p>
                                    <p className="text-white/90 line-clamp-1">
                                      <strong>SABER:</strong> {activeEntry.norm.saber}
                                    </p>
                                    <p className="text-white/90 line-clamp-1">
                                      <strong>HACER:</strong> {activeEntry.norm.hacer}
                                    </p>
                                    <p className="text-white/90 line-clamp-1">
                                      <strong>SER:</strong> {activeEntry.norm.ser}
                                    </p>
                                  </div>
                                )}

                                <div className="mb-5">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <MessageSquare size={12} className="text-yellow-300" />
                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-80">
                                      Enfoque específico (opcional):
                                    </span>
                                  </div>
                                  <input
                                    type="text"
                                    value={feedback}
                                    onChange={e => setFeedback(e.target.value)}
                                    placeholder="Ej: Fortalecer resolución de problemas en la chagra..."
                                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-[10px] text-white placeholder:text-white/30 focus:outline-none"
                                  />
                                </div>

                                <button
                                  onClick={handleStartAnalysis}
                                  disabled={isAnalyzing}
                                  className="w-full px-8 py-4 bg-white text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-60"
                                >
                                  {isAnalyzing ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin" />
                                      Tejiendo Planeación sobre la Higra...
                                    </>
                                  ) : (
                                    "Generar Planeación sobre esta Higra"
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                          <Sparkles
                            size={160}
                            className="absolute -bottom-10 -right-10 text-white/10 group-hover:scale-110 transition-transform duration-700 rotate-12 pointer-events-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
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
                    Aún no has cargado la malla curricular institucional para este grado y materia. Usa los botones de arriba para subir el formato estandarizado o el PDF con los periodos académicos.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <PDFCurriculumImporter grade={selectedGrade} subject={selectedSubject} />
                  <CSVImporter grade={selectedGrade} subject={selectedSubject} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">
                  Estructura oficial: Periodo (MAZA · PAS · KUTÑA T+T) → Higra del Conocimiento → Hilos del Saber (Saber, Hacer, Ser)
                </p>
              </div>
            </div>
          )}

          <PiarAdaptationModal
            isOpen={isPiarOpen}
            onClose={() => setIsPiarOpen(false)}
            plan={analysisResult as any}
            onPrint={handlePrintModule}
            grade={selectedGrade}
            subject={selectedSubject}
          />
        </main>

        <BottomNavBar />
      </div>
    </RoleGuard>
  );
}
