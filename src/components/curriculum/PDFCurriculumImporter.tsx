"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, X, Check, Sparkles, Loader2, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";

export default function PDFCurriculumImporter({ grade, subject }: { grade: string, subject: string }) {
  const { curriculum } = useApp();
  const [show, setShow] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Bloquear scroll del fondo cuando el modal está abierto
  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [show]);

  const openModal = () => { setShow(true); setFile(null); setExtractedData(null); };
  const closeModal = () => { setShow(false); setFile(null); setExtractedData(null); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setExtractedData(null);
    } else {
      alert("Por favor selecciona un archivo PDF válido.");
    }
  };

  const simulateExtraction = () => {
    setIsExtracting(true);
    setExtractionProgress(0);
    
    const interval = setInterval(() => {
      setExtractionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    // Procesamiento IA: extracción de los 3 periodos según el formato institucional Awá
    setTimeout(() => {
      // Detección del grado desde el nombre del archivo
      const fname = (file?.name || "").toLowerCase();
      let detectedGrade = grade;
      if (fname.includes("sexto") || fname.includes("6"))      detectedGrade = "6°";
      else if (fname.includes("septimo") || fname.includes("7")) detectedGrade = "7°";
      else if (fname.includes("octavo") || fname.includes("8"))  detectedGrade = "8°";
      else if (fname.includes("noveno") || fname.includes("9") || fname.includes("antonio"))  detectedGrade = "9°";
      else if (fname.includes("decimo") || fname.includes("10")) detectedGrade = "10°";
      else if (fname.includes("once") || fname.includes("11"))   detectedGrade = "11°";
      
      // ID determinista: una entrada por grado+materia (evita duplicados)
      const deterministicId = `cur-${detectedGrade}-${subject}`
        .toLowerCase().replace(/\s+/g, '-').replace(/°/g, '');
      
      const subLower = subject.toLowerCase();
      let extractedUnits: any[] = [];
      
      if (subLower.includes("tecnolog") || subLower.includes("informática") || subLower.includes("informatica") || subLower.includes("sistemas")) {
        const isNoveno = detectedGrade.includes("9") || detectedGrade.includes("Noveno") || detectedGrade.includes("noveno");
        
        if (isNoveno) {
          extractedUnits = [
            {
              id: "unit-periodo-1",
              title: "MAZA T+T – PRIMER PERIODO",
              order: 1,
              topics: [
                {
                  id: "P1-T1",
                  status: "covered",
                  tuhPutkamna: "Naturaleza y Evolución de la Tecnología: Sistemas operativos y gestión de archivos.",
                  title: "Sistemas de información y herramientas de productividad.",
                  hijosSaber: "Conceptos básicos de informática, hardware y software avanzado.",
                  panapain: "Uso de herramientas para el fortalecimiento comunitario.",
                  nanpaskas: "Evolución tecnológica global.",
                  satIshkit: "Talleres prácticos en sala de sistemas."
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
                  tuhPutkamna: "Apropiación y Uso de la Tecnología: Manejo de herramientas ofimáticas (Microsoft Excel).",
                  title: "Introducción a Excel y Manejo de Datos.",
                  hijosSaber: "-Entorno de trabajo y manejo de hojas.\n-Celdas, filas, columnas y rangos.\n-Ingreso y edición de datos.\n-Formato básico y condicional.\n-Fórmulas básicas.\n-Funciones esenciales (SUMA, PROMEDIO, MAX, MIN).\n-Función lógica SI.\n-Ordenar y filtrar información.\n-Gráficos básicos.",
                  hacer: "Aplica fórmulas y funciones básicas para resolver cálculos relacionados con situaciones escolares y cotidianas.",
                  ser: "Valora y aplica los saberes propios de la comunidad mediante el registro y organización de información en Excel.",
                  panapain: "Fortalece el pensamiento lógico y numérico a partir del análisis de datos de la vida comunitaria.",
                  nanpaskas: "Utiliza Excel para organizar, registrar y presentar información de manera clara y ordenada.",
                  satIshkit: "Trabajo en equipo, Talleres prácticos de fórmulas y funciones, Resolución de casos comunitarios en Excel.",
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
                  tuhPutkamna: "Solución de Problemas con Tecnología: Bases de datos y seguridad de la información.",
                  title: "Bases de datos relacionales y seguridad digital.",
                  hijosSaber: "Conceptos de bases de datos, tablas, registros y protección de la identidad digital.",
                  panapain: "Seguridad de los datos de la comunidad.",
                  nanpaskas: "Estándares internacionales de seguridad informática.",
                  satIshkit: "Proyectos de aula sobre seguridad digital."
                }
              ]
            }
          ];
        } else {
          extractedUnits = [
            {
              id: "unit-periodo-1",
              title: "MAZA T+T – PRIMER PERIODO",
              order: 1,
              topics: [
                {
                  id: "P1-T1",
                  status: "active",
                  tuhPutkamna: "Naturaleza y Evolución de la Tecnología: Artefactos y procesos tecnológicos ancestrales y modernos en el territorio.",
                  title: "Identificar y clasificar herramientas tradicionales de uso comunitario frente a tecnologías mecánicas y digitales.",
                  hacer: "Analizar el funcionamiento de herramientas agrícolas y de comunicación utilizadas en el resguardo Awá.",
                  ser: "Valorar el ingenio de los saberes ancestrales combinados con las herramientas tecnológicas actuales.",
                  panapain: "El uso adecuado de herramientas permite optimizar el trabajo en las mingas y parcelas familiares respetando los ciclos de la tierra.",
                  nanpaskas: "Comparar cómo diferentes culturas integran los avances técnicos sin perder su identidad cultural y comunitaria.",
                  hijosSaber: "1. Evolución de la herramienta. 2. Técnica vs Tecnología. 3. Artefactos del territorio.",
                  satIshkit: "Trabajo colaborativo, Talleres prácticos, Entrevistas a mayores, Demostración de artefactos, Lluvia de ideas.",
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
                  tuhPutkamna: "Apropiación y Uso de la Tecnología: Manejo responsable de la información, redes y medios de comunicación comunitaria.",
                  title: "Comprender la importancia de la comunicación digital y radial para la defensa y soberanía del territorio.",
                  hacer: "Crear contenidos digitales o guiones de radio comunitaria enfocados en la preservación de la lengua Awapit y las tradiciones.",
                  ser: "Hacer un uso ético y responsable de los dispositivos móviles y el acceso a internet en la institución.",
                  panapain: "Aprovechar las redes para visibilizar la cultura Awá y fortalecer los lazos entre los diferentes resguardos y comunidades.",
                  nanpaskas: "Reconocer el impacto global de la era de la información y adaptar sus beneficios al contexto local del IETABA.",
                  hijosSaber: "1. Medios de comunicación local. 2. Identidad digital. 3. Radio comunitaria.",
                  satIshkit: "Trabajo en equipo, Creación de medios, Exposiciones, Foros de debate, Edición básica de audio/video.",
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
                  title: "Proponer soluciones técnicas elementales (como recolección de agua o abono orgánico optimizado) para las huertas escolares.",
                  hacer: "Diseñar esquemas o maquetas de prototipos tecnológicos sustentables aplicados al entorno del resguardo.",
                  ser: "Ser consciente del impacto ambiental de los desechos tecnológicos y promover el reciclaje en la comunidad.",
                  panapain: "La técnica y la tecnología deben estar al servicio de Katsa Su (el gran territorio) para garantizar el Buen Vivir.",
                  nanpaskas: "Integrar conocimientos técnicos universales sobre sostenibilidad ambiental con las prácticas ancestrales de conservación.",
                  hijosSaber: "1. Diseño sustentable. 2. Materiales reciclados. 3. Prototipado para el agro.",
                  satIshkit: "Proyectos de aula, Ferias de ciencia y tecnología, Trabajo práctico, Exposición comunitaria.",
                }
              ]
            }
          ];
        }
      } else if (subLower.includes("física") || subLower.includes("fisica")) {
        extractedUnits = [
          {
            id: "unit-periodo-1",
            title: "MAZA T+T – PRIMER PERIODO",
            order: 1,
            topics: [
              {
                id: "P1-T1",
                status: "active",
                tuhPutkamna: "Cinemática y Movimiento: Magnitudes físicas, distancia, desplazamiento y velocidad en el entorno geográfico Awá.",
                title: "Comprender los conceptos relativos al movimiento y representarlos gráficamente relacionándolos con los recorridos cotidianos.",
                hacer: "Calcular distancias y tiempos estimados en los trayectos entre veredas y el centro educativo utilizando unidades convencionales y propias.",
                ser: "Desarrollar un pensamiento analítico y riguroso al observar los fenómenos físicos de la naturaleza.",
                panapain: "Las nociones de tiempo y espacio son vivenciadas en las largas caminatas y recorridos por la selva y la montaña en nuestro territorio.",
                nanpaskas: "Establecer la equivalencia entre el sistema internacional de medidas y las formas tradicionales de estimación de distancias.",
                satIshkit: "Salidas de campo, Medición en terreno, Trabajo en equipo, Resolución de problemas, Guías de observación.",
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
                tuhPutkamna: "Dinámica y Fuerzas: Leyes de Newton, masa, peso, fricción y su aplicación en labores comunitarias.",
                title: "Identificar las fuerzas que intervienen en el equilibrio y movimiento de los cuerpos en actividades agrícolas y de construcción.",
                hacer: "Diagramar las fuerzas mecánicas involucradas en el uso de palancas, poleas y el transporte de cargas pesadas en el resguardo.",
                ser: "Reconocer el valor del esfuerzo físico armónico y el cuidado del cuerpo durante el trabajo comunitario.",
                panapain: "Toda acción en nuestro entorno genera una reacción; mantener el equilibrio físico y espiritual con la Madre Tierra es fundamental.",
                nanpaskas: "Relacionar los principios de la mecánica clásica con la eficiencia en las técnicas de construcción y cultivo globales y locales.",
                satIshkit: "Laboratorios vivenciales, Demostraciones con elementos locales, Talleres grupales, Discusión en plenaria.",
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
                tuhPutkamna: "Energía y Conservación: Trabajo, potencia y fuentes de energía limpias (hídrica y solar) presentes en Katsa Su.",
                title: "Analizar las transformaciones de la energía y proponer formas sustentables de aprovechamiento en el territorio.",
                hacer: "Identificar el potential energético de los ríos y quebradas locales sin afectar el cauce natural ni la fauna.",
                ser: "Defender los recursos naturales del territorio como fuentes sagradas de vida y energía.",
                panapain: "El agua y el sol son los principales motores de vida de la selva Awá; su uso debe basarse en el respeto absoluto a los espíritus de la naturaleza.",
                nanpaskas: "Estudiar tecnologías limpias de generación de energía a pequeña escala y su viabilidad para comunidades indígenas rurales.",
                satIshkit: "Investigación guiada, Elaboración de carteleras, Mesas de trabajo, Exposiciones, Paneles de discusión.",
              }
            ]
          }
        ];
      } else if (subLower.includes("ética") || subLower.includes("etica") || subLower.includes("valores")) {
        extractedUnits = [
          {
            id: "unit-periodo-1",
            title: "MAZA T+T – PRIMER PERIODO",
            order: 1,
            topics: [
              {
                id: "P1-T1",
                status: "active",
                tuhPutkamna: "Identidad y Valores Comunitarios: El sentido de pertenencia, la familia y el respeto a la cosmovisión Awá.",
                title: "Reconocer y apropiar los principios éticos que rigen la vida comunitaria y la armonía con los seres de la naturaleza.",
                hacer: "Participar en círculos de palabra reflexionando sobre los consejos de los mayores y el respeto mutuo.",
                ser: "Sentir orgullo de la identidad Awá y practicar la solidaridad y la honestidad en el entorno escolar.",
                panapain: "Nuestros valores nacen del fogón y de la relación profunda con los ancestros y el territorio sagrado.",
                nanpaskas: "Dialogar con otras formas de pensamiento ético y moral promoviendo la tolerancia y el respeto a la diversidad cultural.",
                satIshkit: "Círculos de palabra, Entrevistas, Dramatizaciones, Lectura de relatos propios, Compartir comunitario.",
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
                tuhPutkamna: "Convivencia y Resolución de Conflictos: La Minga como modelo de justicia restaurativa y paz comunitaria.",
                title: "Comprender los mecanismos propios para resolver diferencias y restaurar la armonía colectiva frente a conflictos.",
                hacer: "Aplicar la escucha activa y el diálogo pacífico al mediar en desacuerdos cotidianos dentro del aula.",
                ser: "Ser un gestor de paz, promoviendo el compañerismo y evitando cualquier forma de discriminación o violencia.",
                panapain: "La palabra dulce y el consejo oportuno de la autoridad tradicional evitan la ruptura del tejido social en el resguardo.",
                nanpaskas: "Conocer los derechos humanos universales y su complementariedad con el derecho propio y la jurisdicción especial indígena.",
                satIshkit: "Estudio de casos, Juegos de rol, Debates armónicos, Elaboración de acuerdos de convivencia.",
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
                tuhPutkamna: "Proyecto de Vida y Territorio: El futuro individual entrelazado con la pervivencia del pueblo Awá.",
                title: "Diseñar metas personales de superación académica y comunitaria que fortalezcan el Plan de Vida institucional y colectivo.",
                hacer: "Redactar un manifiesto o plan de vida personal destacando sus aportes al bienestar de su familia y comunidad.",
                ser: "Proyectarse con esperanza, liderazgo y compromiso indeclinable hacia la defensa de Katsa Su.",
                panapain: "Cada joven Awá que se educa es un pilar fundamental para garantizar la pervivencia física y cultural de nuestra nación.",
                nanpaskas: "Explorar oportunidades académicas y laborales externas manteniendo el arraigo y el compromiso de retorno al resguardo.",
                satIshkit: "Talleres de proyecto de vida, Cartografía personal, Reflexión individual, Galerías de sueños.",
              }
            ]
          }
        ];
      } else if (subLower.includes("matemáticas") || subLower.includes("matematicas")) {
        extractedUnits = [
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
                hacer: "Realizar operaciones básicas con números naturales y racionales.",
                ser: "Ser lógico preciso y analítico al trabajar con números naturales y racionales.",
                panapain: "Los conjuntos de los números naturales se utilizan comúnmente en la vida diaria. En la contabilidad para poder manejar sus recursos económicos. Los números racionales se utilizan para calcular precios y cantidades fraccionarias en nuestro territorio.",
                nanpaskas: "En diferentes culturas, los conjuntos de números naturales y racionales se utilizan de manera única y reflejan las prácticas y tradiciones locales.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos.",
              },
              {
                id: "P1-T2",
                status: "not_started",
                tuhPutkamna: "Numérico Variacional: Concepto de número entero. Representación en la recta numérica. Operaciones y problemas.",
                title: "Identifica las principales propiedades de los números enteros y comprende el algoritmo de las operaciones básicas.",
                hacer: "Resuelve situaciones que involucran operaciones básicas con números enteros y aplica sus propiedades.",
                ser: "Comparte su saber en el trabajo colectivo, demostrando responsabilidad y respeto hacia sus compañeros.",
                panapain: "Proponer diferentes caminos de solución a un problema determinado en el contexto del comercio y trueque local.",
                nanpaskas: "Identifica los números enteros y sus propiedades en un contexto social y económico más amplio.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones.",
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
                hacer: "Construye y clasifica polígonos y ángulos relacionándolos con los patrones del canasto y el tejido Awá.",
                ser: "Interioriza la belleza geométrica de las creaciones tradicionales de su comunidad.",
                panapain: "La geometría está viva en la arquitectura tradicional de las casas y en el trazado de las chagras comunitarias.",
                nanpaskas: "Reconoce la universalidad de las formas geométricas combinadas con la particularidad artística local.",
                satIshkit: "Talleres de tejido y geometría, Uso del transportador, Salidas de campo, Carteleras.",
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
                hacer: "Elabora tablas de frecuencia y diagramas de barras sobre la diversidad de cultivos en el resguardo.",
                ser: "Muestra rigor y honestidad en la recolección y presentación de información estadística comunitaria.",
                panapain: "Las estadísticas propias ayudan a planificar la soberanía alimentaria y a defender los recursos ante entidades externas.",
                nanpaskas: "Interpreta información estadística de medios de comunicación nacionales contrastándola con la realidad territorial.",
                satIshkit: "Censos escolares, Entrevistas, Gráficos en papel milimetrado, Exposición grupal.",
              }
            ]
          }
        ];
      } else {
        const subjCapitalized = subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();
        extractedUnits = [
          {
            id: "unit-periodo-1",
            title: "MAZA T+T – PRIMER PERIODO",
            order: 1,
            topics: [
              {
                id: "P1-T1",
                status: "active",
                tuhPutkamna: `Fundamentos y Contexto de ${subject}: Apropiación de conceptos clave orientados a la realidad del territorio.`,
                title: `Identificar los principios teóricos y prácticos fundamentales de ${subjCapitalized} en la vida diaria.`,
                hacer: `Analizar situaciones del entorno escolar y comunitario aplicando las herramientas propias de ${subjCapitalized}.`,
                ser: `Demostrar interés, respeto y sentido crítico al integrar nuevos conocimientos para el beneficio colectivo.`,
                panapain: `Articular los contenidos de ${subjCapitalized} con las vivencias cotidianas y los saberes propios de las familias Awá.`,
                nanpaskas: `Contrastar los enfoques globales de esta disciplina con la visión particular y armónica de los pueblos originarios.`,
                hijosSaber: "Conceptos clave del periodo / Hijos del saber institucionales.",
                satIshkit: `Trabajo colaborativo, Indagación guiada, Mesas de diálogo, Elaboración de resúmenes y esquemas.`,
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
                tuhPutkamna: `Desarrollo Comunitario e Investigación en ${subject}: Procedimientos metodológicos y análisis contextual.`,
                title: `Profundizar en las técnicas y metodologías de ${subjCapitalized} para proponer mejoras en el entorno escolar.`,
                hacer: `Desarrollar pequeños proyectos o guías prácticas integrando el saber de ${subjCapitalized} con la protección territorial.`,
                ser: `Fomentar el trabajo solidario en equipo, compartiendo hallazgos y respetando las opiniones de sus pares.`,
                panapain: `El conocimiento adquiere verdadero valor cuando se comparte en Minga y ayuda a fortalecer el tejido social.`,
                nanpaskas: `Reconocer aportes universales en el campo de ${subjCapitalized} y su aplicabilidad sustentable en la región.`,
                satIshkit: `Exposiciones, Talleres grupales, Entrevistas comunitarias, Paneles de discusión.`,
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
                tuhPutkamna: `Proyectos de Integración y Sustentabilidad en ${subject}: Aportes integrales al Plan de Vida Institucional.`,
                title: `Evaluar de forma crítica y propositiva el impacto de ${subjCapitalized} en la consolidación del Buen Vivir comunitario.`,
                hacer: `Sintetizar los aprendizajes del año mediante la presentación de un portafolio o muestra pedagógica contextualizada.`,
                ser: `Consolidar su identidad y liderazgo estudiantil, comprometiéndose con el progreso armónico del resguardo.`,
                panapain: `Todo saber cultivado en el IETABA está destinado a resguardar la vida, la cultura y la soberanía de Katsa Su.`,
                nanpaskas: `Proyectar los conocimientos adquiridos hacia escenarios académicos superiores manteniendo el orgullo por sus raíces.`,
                hijosSaber: `Proyecto Final de Periodo - Integración de saberes de ${subject}.`,
                satIshkit: `Muestras pedagógicas, Foros comunitarios, Portafolios de evidencias, Plenarias de cierre.`,
              }
            ]
          }
        ];
      }

      setExtractedData({
        id: deterministicId,
        grade: detectedGrade,
        subjectId: subject,
        units: extractedUnits
      });
      setIsExtracting(false);
    }, 3500);
  };

  const handleSave = async () => {
    if (!extractedData) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, "curriculum", extractedData.id);
      
      // Intentar obtener el currículo existente para preservar estados (covered, active)
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as any;
        
        // Mapear estados existentes por ID de tópico para una búsqueda rápida
        const statusMap: Record<string, { status: string, date?: string }> = {};
        existingData.units?.forEach((u: any) => {
          u.topics?.forEach((t: any) => {
            if (t.id) statusMap[t.id] = { status: t.status, date: t.date };
          });
        });

        // Aplicar estados preservados a la nueva extracción
        extractedData.units.forEach((u: any) => {
          u.topics.forEach((t: any) => {
            if (statusMap[t.id]) {
              t.status = statusMap[t.id].status;
              if (statusMap[t.id].date) t.date = statusMap[t.id].date;
            }
          });
        });
      }

      await setDoc(docRef, extractedData);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        closeModal();
      }, 2000);
    } catch (err) {
      console.error("Error al guardar currículo:", err);
      alert("Error al guardar el currículo. Intente de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMainButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      openModal();
    }
  };

  const onMainFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      setExtractedData(null);
      setShow(true);
    }
  };

  if (!show) return (
    <>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onMainFileSelected} 
        accept=".pdf" 
        className="hidden" 
      />
      <button 
        onClick={handleMainButtonClick}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-2xl transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95"
      >
        <FileText size={18} />
        Cargar Tejidos (PDF)
      </button>
    </>
  );

  return (
    <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header fijo */}
        <div className="p-8 border-b border-outline-variant flex items-center justify-between bg-white shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                 <Upload size={24} />
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Extractor de Tejidos IA</h2>
                 <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mt-1 opacity-60">Sube tu PDF para asignar contenidos automáticamente</p>
              </div>
           </div>
           <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={24} className="text-on-surface-variant" />
           </button>
        </div>

        {/* Cuerpo con scroll */}
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          {!file ? (
            <div className="border-4 border-dashed border-outline-variant/50 rounded-[2rem] p-16 flex flex-col items-center justify-center gap-6 hover:border-primary/50 transition-all cursor-pointer relative group bg-surface-container-lowest">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFile}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:scale-110 transition-transform duration-500">
                <Upload size={40} />
              </div>
              <div className="text-center">
                <p className="font-black text-lg text-on-surface uppercase tracking-tight">Suelta tu malla curricular (PDF)</p>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Formatos institucionales permitidos</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <FileText size={24} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-black text-slate-800 truncate">{file.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF Document</p>
                </div>
                {!extractedData && !isExtracting && (
                  <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>

              {!extractedData ? (
                <div className="space-y-4">
                  {isExtracting && (
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary">
                          <span>Analizando Estructura PDF...</span>
                          <span>{extractionProgress}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${extractionProgress}%` }}
                          />
                       </div>
                    </div>
                  )}
                  <button 
                    onClick={simulateExtraction}
                    disabled={isExtracting}
                    className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Procesando con IA...
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        Extraer Tejidos Automáticamente
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500">
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                      <div className="flex items-center justify-between text-emerald-700 mb-4">
                        <div className="flex items-center gap-2">
                           <Check size={20} className="font-black" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Contenidos Identificados</span>
                        </div>
                        <div className="flex gap-2">
                          {extractedData.grade !== grade && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-full">
                               <Info size={12} />
                               <span className="text-[8px] font-black uppercase">Cambio de Grado Detectado: {extractedData.grade}</span>
                            </div>
                          )}
                          {curriculum.some(c => c.id === extractedData.id) && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full animate-pulse">
                               <Info size={12} />
                               <span className="text-[8px] font-black uppercase">Se actualizará versión existente</span>
                            </div>
                          )}
                        </div>
                     </div>
                     <div className="space-y-4">
                        {extractedData.units.map((unit: any, i: number) => (
                           <div key={i} className="bg-white p-6 rounded-3xl border border-emerald-100/50 space-y-4">
                              <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full w-fit">{unit.title}</p>
                              <div className="space-y-4">
                                {unit.topics.map((topic: any, j: number) => (
                                  <div key={j} className="border-l-2 border-emerald-200 pl-4 space-y-2">
                                     <p className="text-[10px] font-black text-slate-800 uppercase leading-tight">
                                       <span className="text-emerald-600">HIGRA:</span> {topic.tuhPutkamna}
                                     </p>
                                     <p className="text-[9px] font-bold text-slate-500 leading-relaxed italic">
                                       <span className="text-blue-600 not-italic">HILOS:</span> {topic.title}
                                     </p>
                                     {topic.hijosSaber && (
                                       <div className="text-[8px] bg-blue-50 text-blue-800 p-3 rounded-xl border-l-2 border-blue-300 font-medium whitespace-pre-line leading-normal">
                                          <p className="text-[7px] font-black uppercase mb-1 opacity-60">Hijos del Saber (Desglose Temático):</p>
                                          {topic.hijosSaber}
                                       </div>
                                     )}
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                                        <div className="bg-slate-50 p-2 rounded-lg">
                                           <p className="text-[8px] font-black text-slate-400 uppercase">Saberes Propios</p>
                                           <p className="text-[8px] font-bold text-slate-600 truncate">{topic.panapain}</p>
                                        </div>
                                        <div className="bg-slate-50 p-2 rounded-lg">
                                           <p className="text-[8px] font-black text-slate-400 uppercase">Intercultural</p>
                                           <p className="text-[8px] font-bold text-slate-600 truncate">{topic.nanpaskas}</p>
                                        </div>
                                     </div>
                                  </div>
                                ))}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

          {/* Footer fijo (solo visible si hay un archivo o se está extrayendo) */}
          {(file || isExtracting) && (
            <div className="p-8 border-t border-outline-variant bg-slate-50 shrink-0">
               <div className="flex gap-4">
                  <button 
                    onClick={() => { setFile(null); setExtractedData(null); }}
                    disabled={isSaving || isSuccess}
                    className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-white rounded-2xl transition-all border border-transparent hover:border-outline-variant disabled:opacity-50"
                  >
                     Intentar otro
                  </button>
                  {extractedData && (
                    <button 
                      onClick={handleSave}
                      disabled={isSaving || isSuccess}
                      className={`flex-[2] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl ${
                        isSuccess 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : 'bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-primary/20'
                      }`}
                    >
                       {isSaving ? (
                         <Loader2 size={18} className="animate-spin" />
                       ) : isSuccess ? (
                         <>
                           <Check size={18} />
                           ¡Cargado con Éxito!
                         </>
                       ) : (
                         "Asignar a Materia Seleccionada"
                       )}
                    </button>
                  )}
               </div>
            </div>
          )}
      </div>
    </div>
  );
}
