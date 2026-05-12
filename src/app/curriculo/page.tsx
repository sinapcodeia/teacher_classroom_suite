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
      const topicHigra = activeTopic?.tuhPutkamna || "Pensamiento Matemático";

      const contextPrefix = feedback ? `🎯 ENFOQUE DE FORTALECIMIENTO PEDAGÓGICO: ${feedback.toUpperCase()}\n\n` : "";

      // --- MOTOR DE GENERACIÓN DE CONCEPTOS MATEMÁTICOS REALES ---
      let topicDefinition = "El tema comprende el estudio sistemático de las relaciones cuantitativas, espaciales y lógicas. Consiste en abstraer propiedades reales, identificar patrones y aplicar algoritmos de resolución con precisión absoluta.";
      let example1Text = `Enunciado: Si en una huerta escolar del IETABA se siembran plantas mediante la relación P = 4x + 12, y tenemos x = 8 surcos, ¿cuál es el total de plantas?
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Extracción): Variable independiente x = 8.
- Paso 2 (Sustitución): P = 4(8) + 12.
- Paso 3 (Jerarquía): Multiplicación primero (4×8 = 32). Luego suma (32+12 = 44).
- Conclusión: Se plantan exactamente 44 individuos vegetales.`;

      const tLower = topicName.toLowerCase();
      
      if (tLower.includes("ángulo") || tLower.includes("angulo")) {
        topicDefinition = "Geométricamente, un ángulo es la porción o amplitud del plano comprendida entre dos semirrectas (lados) que comparten un origen común llamado vértice. Se mide en grados (°) con un transportador y se clasifica en agudo (<90°), recto (90°), obtuso (>90°) y llano (180°).";
        example1Text = `Enunciado: Si trazamos una bisectriz exacta en un ángulo recto que mide 90°, ¿cuánto medirá cada nuevo ángulo formado?
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Datos Base): El ángulo recto mide exactamente 90°.
- Paso 2 (Concepto Clave): La bisectriz es la semirrecta interior que divide el ángulo original en dos partes métricamente idénticas.
- Paso 3 (Operación Aritmética): Dividimos 90° ÷ 2 = 45°.
- Conclusión Didáctica: Resultan dos ángulos agudos simétricos de 45° cada uno.`;
      } else if (tLower.includes("línea") || tLower.includes("linea") || tLower.includes("recta")) {
        topicDefinition = "Una línea (o recta) es una sucesión continua e infinita de puntos extendidos en una sola dimensión, sin curvas ni ángulos. Un fragmento delimitado se denomina 'segmento'. Las rectas en el plano pueden ser paralelas (jamás se cruzan, mantienen distancia constante) o perpendiculares (se cruzan formando exactamente 90°).";
        example1Text = `Enunciado: El sendero de nuestra reserva natural está enmarcado por dos líneas de árboles sembradas de forma estrictamente paralela, separadas por 4 metros. ¿Se cruzarán en algún punto a los 100 metros de distancia?
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Concepto Geométrico): Dos rectas son paralelas si su pendiente es idéntica, es decir, la distancia que las separa nunca aumenta ni disminuye.
- Paso 2 (Análisis del Espacio): Si están separadas por 4 metros desde el inicio, y son estrictamente paralelas.
- Conclusión Didáctica: Es matemáticamente imposible que se crucen; mantendrán la misma separación de 4 metros en el kilómetro 0 y en el kilómetro infinito.`;
      } else if (tLower.includes("polígono") || tLower.includes("figura") || tLower.includes("área")) {
        topicDefinition = "Un polígono es una figura geométrica bidimensional completamente cerrada, delimitada por tres o más segmentos rectos consecutivos (lados). Su 'perímetro' es la suma del contorno externo, y su 'área' representa la superficie cubierta en su interior, evaluada comúnmente en unidades cuadradas (cm², m², hectáreas).";
        example1Text = `Enunciado: Necesitamos calcular la superficie total de una casa comunal rectangular que tiene 15 metros de largo y 8 metros de ancho para estimar el material del piso.
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Identificación de Fórmula): Área del rectángulo = Base × Altura (o Largo × Ancho).
- Paso 2 (Sustitución de Variables): A = 15 m × 8 m.
- Paso 3 (Operación Numérica y Dimensional): 15 × 8 = 120. (m × m = m²).
- Conclusión Didáctica: El área techada es de 120 metros cuadrados (m²).`;
      } else if (tLower.includes("población") || tLower.includes("muestra") || tLower.includes("estadística") || tLower.includes("media") || tLower.includes("moda")) {
        topicDefinition = "La estadística es el modelado y análisis de datos. La 'población' es el conjunto total del universo a investigar (ej. todos los Awá). La 'muestra' es un subgrupo representativo extraído para inferir resultados. Variables como la Moda (valor que más se repite), Media (promedio absoluto) y Mediana (valor central) son medidas de tendencia central.";
        example1Text = `Enunciado: Una familia registró el número de peces capturados cada día durante la semana: Lunes(5), Martes(3), Miércoles(5), Jueves(8), Viernes(4). Calcula la Moda y la Media.
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Cálculo de la Moda): Observamos los valores ordenados: {3, 4, 5, 5, 8}. El número que más se repite es el 5. Por ende, la Moda (Mo) = 5 peces.
- Paso 2 (Planteamiento del Promedio/Media): Se suman todos los datos y se dividen entre los días. (3+4+5+5+8) ÷ 5.
- Paso 3 (Operación de la Media): 25 ÷ 5 = 5.
- Conclusión Didáctica: El promedio estadístico (Media) y el valor más frecuente (Moda) coinciden ambos en 5 peces diarios.`;
      } else if (tLower.includes("fraccion") || tLower.includes("racional")) {
        topicDefinition = "Una fracción (número racional) representa matemáticamente las partes de un todo. Está compuesta por un Numerador (indica cuántas partes tomamos) y un Denominador (indica en cuántas partes iguales se ha dividido la unidad). Son clave para repartir recursos o evaluar porcentajes de terrenos.";
        example1Text = `Enunciado: Si la cosecha comunitaria produjo 120 libras de cacao, y se ha destinado 3/4 de la producción para la venta al cabildo, ¿cuántas libras se van a vender?
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Fórmula Operativa): Fracción de un número = (Cantidad Total ÷ Denominador) × Numerador.
- Paso 2 (División / Partición de la Unidad): Dividimos 120 lbs entre 4 partes iguales (120 ÷ 4 = 30 lbs por cada cuarto).
- Paso 3 (Multiplicación / Extracción): Tomamos 3 de esas partes (30 lbs × 3 = 90 lbs).
- Conclusión Didáctica: Se venderán exactamente 90 libras de cacao, lo cual representa el 75% del volumen total cosechado.`;
      }

      const lessonStr = `${contextPrefix}📅 PARÁMETROS CURRICULARES DEL PERIODO
• Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
• Duración Académica: 3 Meses (Trimestre Reglado)
• Intensidad Horaria: 1 hora diaria de Lunes a Viernes (Total: 5 horas semanales / 60 horas por periodo)
• Modelo Pedagógico: Tejiendo Saberes (Awá) — Enfoque Crítico, Activo y Comunitario

======================================================================
I. FASE DE EXPLORACIÓN: CONTEXTUALIZACIÓN Y SABERES PREVIOS (Sesión 1)
======================================================================
🎯 Objetivo de la Fase: Despertar el interés del estudiante vinculando su realidad territorial, familiar y cultural en el IETABA con las estructuras del pensamiento lógico-matemático.

🗣️ Actividad de Motivación Inicial: "La Minga del Pensamiento Numérico"
Iniciamos la semana de clase organizando el aula en un círculo tradicional. El docente introduce el tema [ ${topicName} ] (${topicHigra}) mediante un diálogo participativo sobre cómo nuestras autoridades indígenas y mayores realizan conteos, mediciones de parcelas agroambientales y estimaciones de tiempo para la siembra y cosecha.
• Pregunta Generadora 1: Cuando acompañamos a nuestros padres a medir un terreno para cultivo, ¿qué estrategias o instrumentos no convencionales (varas, pasos, brazadas) utilizamos y cómo se relacionan con las medidas exactas?
• Pregunta Generadora 2: ¿Por qué el dominio de las matemáticas y la contabilidad comunitaria es fundamental para defender la soberanía y administrar los recursos de nuestra reserva indígena?

======================================================================
II. FASE DE ESTRUCTURACIÓN: CONCEPTUALIZACIÓN EXHAUSTIVA Y ALGORITMOS (Sesiones 2 y 3)
======================================================================
📖 Desarrollo Teórico de Alto Rigor (Para Dictar y Consignar en el Cuaderno):
CONCEPTO FUNDAMENTAL: ${topicDefinition}

Para dominar este concepto, el estudiante debe interiorizar y seguir estrictamente los siguientes axiomas universales:
1. Identificación de Variables: Separar claramente los valores conocidos (constantes numéricas) de los valores desconocidos (incógnitas espaciales).
2. Estructura Lógica de Operaciones: Recordar que la matemática exige precisión. Primero signos de agrupación, luego jerarquías avanzadas, seguido de multiplicaciones/divisiones, y finalmente sumas/restas.
3. Consistencia Dimensional: Toda magnitud (grados, metros, porcentajes, promedios) debe conservar su unidad al dictar el resultado final.

💡 Ejemplos Científicos Resueltos y Explicados al Detalle:

• EJEMPLO MODELO 1: APLICACIÓN CONCEPTUAL PURA
${example1Text}

• EJEMPLO MODELO 2: CONTEXTUALIZACIÓN AGROAMBIENTAL TERRITORIAL
Enunciado: Una familia Awá desea cercar una zona de reserva forestal rectangular que mide 120 metros de largo por 45 metros de ancho. Si el metro de alambre liso tiene un costo de $2,500 y se requieren pasar 3 hilos de alambre, calcule el presupuesto total necesario.
PASO A PASO DE RESOLUCIÓN:
- Paso 1 (Cálculo del Perímetro): El perímetro L de un rectángulo es L = 2(largo) + 2(ancho).
  L = 2(120 m) + 2(45 m) = 240 m + 90 m = 330 metros lineales por cada vuelta.
- Paso 2 (Cálculo del Alambre Total): Como son 3 hilos, multiplicamos el perímetro por 3.
  Total Alambre = 330 m × 3 = 990 metros lineales.
- Paso 3 (Cálculo del Costo Financiero): Multiplicamos la longitud total por el precio unitario.
  Costo Total = 990 m × $2,500 = $2,475,000.
- Conclusión Didáctica: Este ejercicio conecta la geometría plana con la economía familiar, enseñando a los estudiantes a planificar y presupuestar proyectos reales en su comunidad.

======================================================================
III. FASE DE TRANSFERENCIA: APLICACIÓN PRÁCTICA EN AULA (Sesiones 4 y 5)
======================================================================
✍️ Taller Guiado en Clase:
Los estudiantes se organizan en mesas de trabajo cooperativo. El docente entrega una guía de ejercicios donde cada grupo debe mapear un problema real de su vereda (ej. distribución del agua, cálculo de insumos orgánicos) aplicando las fórmulas analizadas.
Cada equipo plasmará su procedimiento en un papelógrafo, utilizando diagramas limpios, reglas y colores distintivos, preparando una breve sustentación oral para el final de la semana.`;

      const workshopStr = `${contextPrefix}📝 TALLER DE APLICACIÓN DIDÁCTICA INTENSIVA
Institución: IETABA — Territorio Awá
Grado: ${selectedGrade} | Materia: ${selectedSubject}
Tiempo Estimado de Resolución: 2 Horas de Trabajo Autónomo/Grupal

======================================================================
SECCIÓN A: EJERCITACIÓN MECÁNICA Y DESARROLLO DE ALGORITMOS (40%)
======================================================================
Instrucción: Copia en tu cuaderno cada uno de los siguientes ejercicios, desarrolla el procedimiento completo hacia abajo (paso a paso) y encierra el resultado final en un recuadro con regla.
1. 🧮 Simplifica la siguiente expresión matemática aplicando estrictamente la jerarquía de operaciones estudiada en clase:
   M = [ 5 × (12 + 3) - 4² ] ÷ 2 + 15
2. 📐 Despeja la variable desconocida 'y' en la ecuación lineal fundamental, justificando qué propiedad aplicas en cada salto:
   7y - 21 = 2y + 34
3. 📊 Completa la siguiente tabla de proporcionalidad directa para un cultivo, determinando la constante de proporcionalidad K:
   | Surcos (S)  |  2  |  4  |  6  |  8  |
   | Semillas(P) | 50  | 100 |  ?  |  ?  |

======================================================================
SECCIÓN B: RESOLUCIÓN DE CASOS AGROAMBIENTALES Y COMUNITARIOS (40%)
======================================================================
Lee con detenimiento la siguiente situación contextualizada en nuestra comunidad y responde los retos formulados mostrando operaciones claras:

🌱 Caso Práctico: "Optimización del Vivero Forestal Comunitario"
El cabildo escolar del IETABA ha decidido construir un vivero para reforestar cuencas hídricas. El terreno disponible tiene forma cuadrada con un área total de 400 metros cuadrados.
• Reto 1: Aplica la operación de radicación para determinar la longitud exacta de cada lado del terreno.
• Reto 2: Si por cada metro cuadrado se pueden acomodar exactamente 12 plántulas nativas, ¿cuál será la capacidad máxima de producción del vivero?
• Reto 3: Si el 25% de las plántulas se destinan a la vereda vecina, ¿cuántas plántulas quedan para el uso exclusivo de nuestra institución?

======================================================================
SECCIÓN C: PRODUCCIÓN ARGUMENTATIVA E INTERCULTURALIDAD (20%)
======================================================================
✍️ Redacta un ensayo corto (mínimo 3 párrafos bien estructurados) donde respondas a la siguiente reflexión:
"¿De qué manera el aprendizaje riguroso de las matemáticas y la administración técnica nos permite cuidar a la Madre Tierra (Katsa Su) y fortalecer los planes de vida de la nación Awá?"`;

      const activityStr = `${contextPrefix}🎲 DINÁMICA LÚDICA Y DIDÁCTICA: "LA MINGA MATEMÁTICA DEL IETABA"
Eje Didáctico: Aprendizaje Basado en Juegos (Gamificación Territorial)
Duración: 1 Hora de Clase Dinámica

🎯 OBJETIVO PEDAGÓGICO:
Consolidar el cálculo mental rápido, la resolución de problemas bajo presión y la comunicación asertiva entre los estudiantes, transformando la abstracción matemática en una vivencia lúdica y cooperativa.

🛠️ RECURSOS Y MATERIALES NECESARIOS:
- 20 Tarjetas de Retos Matemáticos impresas o dibujadas en cartulina.
- Un "Dado de las Operaciones" (cuyas caras muestran: +, -, ×, ÷, Duplica, Pasa Turno).
- Pizarra del aula y marcadores de colores.
- Cronómetro.

🚀 INSTRUCCIONES Y REGLAS DE EJECUCIÓN PASO A PASO:
1. Conformación de las Cuadrillas (Equipos): El grupo de clase se divide en 4 "Cuadrillas Agroambientales". Cada cuadrilla elige democráticamente a un Sabedor (quien lidera las respuestas), un Escribano (quien anota en la pizarra) y dos Verificadores.
2. Dinámica del Lanzamiento: Por turnos, un representante de cada cuadrilla pasa al frente y lanza el "Dado de las Operaciones", mientras el docente extrae al azar una Tarjeta de Reto sobre [ ${topicName} ].
3. Resolución Contrarreloj: El equipo tiene exactamente 60 segundos para aplicar la operación del dado al valor o problema de la tarjeta. El Escribano debe plasmar el cálculo completo en la pizarra de forma impecable.
4. Sistema de Puntuación y Veeduría: 
   - Respuesta correcta con procedimiento limpio: +10 Puntos Comunitarios.
   - Respuesta correcta pero desordenada: +5 Puntos.
   - Si el equipo falla, se activa el "Rebote Solidario" para que otro equipo robe los puntos explicando el error.
5. Cierre Pedagógico: Al finalizar el tiempo, la cuadrilla ganadora recibe un reconocimiento simbólico. El docente aprovecha los errores cometidos en la pizarra para explicar nuevamente los conceptos difíciles, asegurando que el juego deje un aprendizaje profundo y permanente.`;

      const examStr = `${contextPrefix}🏆 EVALUACIÓN SUMATIVA POR COMPETENCIAS (RÚBRICA DE EXCELENCIA)
Institución: INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ - IETABA
Asignatura: ${selectedSubject} | Grado: ${selectedGrade}
Estructura: Prueba de Calidad Técnica alineada a Estándares Básicos y Saberes Propios

======================================================================
BLOQUE I: COMPETENCIA INTERPRETATIVA (Selección Múltiple con Única Respuesta)
======================================================================
Instrucción: Lee detenidamente cada planteamiento, realiza el cálculo auxiliar en el margen derecho de la hoja y rellena completamente el óvalo correspondiente a la respuesta correcta.

1. Al modelar matemáticamente el comportamiento de un sistema agroambiental en el territorio, encontramos la expresión algebraica: R = 120 + 5(20 - 8). Aplicando rigurosamente el orden de las operaciones, el valor numérico de R es:
   a) 180 (Resultado de resolver primero el paréntesis y luego multiplicar por 5 antes de sumar).
   b) 1,500 (Resultado erróneo de sumar 120 + 5 y luego multiplicar por el interior).
   c) 60 (Resultado de restar los extremos omitiendo el factor multiplicativo).
   d) 240 (Resultado derivado de una simplificación lineal sin jerarquía).

2. La principal ventaja de representar un conjunto de datos estadísticos o de producción comunitaria mediante un gráfico de barras o circular radica en que:
   a) Oculta las variaciones pequeñas para simplificar el reporte final.
   b) Permite visualizar rápidamente las proporciones, modas y tendencias para tomar decisiones informadas.
   c) Reemplaza por completo la necesidad de realizar operaciones aritméticas de control.
   d) Exige el uso exclusivo de software avanzado, impidiendo su trazo manual.

======================================================================
BLOQUE II: COMPETENCIA ARGUMENTATIVA Y PROCEDIMIENTOS CRÍTICOS
======================================================================
3. ✍️ Un estudiante del IETABA afirma que "al multiplicar dos cantidades, el orden en que colocamos los factores no altera el producto total (Propiedad Conmutativa), pero al dividir recursos o áreas, el orden sí resulta estrictamente determinante". 
   Demuestra si esta afirmación es VERDADERA o FALSA mediante dos ejemplos matemáticos concretos, explicando paso a paso tu razonamiento.

======================================================================
BLOQUE III: COMPETENCIA PROPOSITIVA (Resolución de Problemas de Alta Exigencia)
======================================================================
4. 🚀 Diseña un plan matemático integral para resolver el siguiente reto institucional:
   "El colegio IETABA necesita recolectar agua lluvia para el mantenimiento de sus unidades productivas. Contamos con un techo rectangular de 30 metros por 12 metros. Si una lluvia fuerte deposita un promedio de 15 litros de agua por cada metro cuadrado, calcule el volumen total captado y determine cuántos tanques de 500 litros de capacidad se requieren para almacenar toda el agua recolectada".
   (Nota: Presenta los pasos en orden lógico: Fórmulas aplicadas, Operaciones aritméticas y Respuesta redactada formalmente).`;

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
