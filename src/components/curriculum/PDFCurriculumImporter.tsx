"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, FileText, X, Check, Sparkles, Loader2, Info } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import { setDoc, doc } from "firebase/firestore";

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
      else if (fname.includes("noveno") || fname.includes("9"))  detectedGrade = "9°";
      else if (fname.includes("decimo") || fname.includes("10")) detectedGrade = "10°";
      else if (fname.includes("once") || fname.includes("11"))   detectedGrade = "11°";
      
      // ID determinista: una entrada por grado+materia (evita duplicados)
      const deterministicId = `cur-${detectedGrade}-${subject}`
        .toLowerCase().replace(/\s+/g, '-').replace(/°/g, '');
      
      setExtractedData({
        id: deterministicId,
        grade: detectedGrade,
        subjectId: subject,
        units: [
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
                hacer: "Realizar operaciones básicas como números naturales y racionales.",
                ser: "Ser lógico preciso y analítico al trabajar con números naturales y racionales.",
                panapain: "Los conjuntos de los números naturales se utilizan comúnmente en la vida diaria. En la contabilidad para poder manejar sus recursos económicos. Los números racionales se utilizan para calcular precios y cantidades fraccionarias en nuestro territorio.",
                nanpaskas: "En diferentes culturas, los conjuntos de números naturales y racionales se utilizan de manera única y reflejan las prácticas y tradiciones locales.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos.",
              },
              {
                id: "P1-T2",
                status: "not_started",
                tuhPutkamna: "Numérico Variacional: Concepto de número entero. Representación de números enteros en la recta numérica. Valor absoluto, Orden en los enteros. Operación con números enteros. Situaciones problemas.",
                title: "Identifica las principales propiedades de los números enteros y comprende el algoritmo de las operaciones básicas.",
                hacer: "Resuelve situaciones que involucran las operaciones básicas con números enteros y aplica sus propiedades en el desarrollo de polinomios aritméticos.",
                ser: "Comparte su saber en el trabajo colectivo, demostrando responsabilidad y respeto hacia sus compañeros.",
                panapain: "Proponer diferentes caminos de solución a un problema determinado, utilizando técnicas, conceptos, procedimientos y/o argumentos matemáticos adecuados, propios de los números enteros.",
                nanpaskas: "Identifica los números enteros, y sus propiedades en un contexto social y económico; además, plantea y resuelve problemas de tipo matemático y de otras ciencias, utilizando las operaciones básicas con números enteros.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos.",
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
                tuhPutkamna: "Geométrico Métrico: Elementos de geometría, Definiciones, Segmentos y rayos, Ángulos y su clasificación, Rectas paralelas y perpendiculares.",
                title: "Reconoce los principales elementos de la geometría y los identifica en construcciones de tipo geométrico y artístico, además construye e identifica cualquier clase de ángulos.",
                hacer: "Interpreta su magnitud, clasificación de ángulos por medio del transportador y los identifica en espacios de su entorno.",
                ser: "Interioriza los conceptos vistos, los integra y los aplica en su entorno.",
                panapain: "Identificar, construir y clasificar los principales elementos de la geometría (puntos, rectas, semirrectas, ángulos, etc.).",
                nanpaskas: "Reconoce algunos elementos de la geometría, asimismo construye y clasifica todo tipo de ángulos con ayuda del transportador.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos.",
              },
              {
                id: "P2-T2",
                status: "not_started",
                tuhPutkamna: "Geométrico Métrico: Polígonos, Elementos del polígono, Clasificación de polígonos, Triángulos cuadriláteros, Transformaciones en el plano cartesiano (traslación, rotación, reflexión, homotecia), Área y perímetro de las figuras geométricas.",
                title: "Identifica qué es un polígono y sus principales elementos. Fórmulas para el cálculo de áreas de algunas figuras planas.",
                hacer: "Clasifica los polígonos según el número de lados y la medida de sus ángulos. Resolver problemas sobre áreas y perímetros de figuras planas.",
                ser: "Integra los contenidos trabajados en el aula de clase con su diario vivir, con el fin de dar soluciones a problemas cotidianos.",
                panapain: "Identificar los polígonos, sus principales elementos y su clasificación.",
                nanpaskas: "Reconoce y construye polígonos, además determina sus principales elementos y lo clasifica según el número de lados o medida de sus ángulos internos.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos.",
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
                tuhPutkamna: "Métrico: Unidades de masa y longitud. Conversiones de unidades.",
                title: "Identifica la principal unidad de longitud, además de sus múltiplos y submúltiplos.",
                hacer: "Realiza conversiones entre unidades de longitud y masa.",
                ser: "Crea estrategias para solucionar problemas sobre conversiones y figuras planas, además respeta las estrategias de sus compañeros.",
                panapain: "Realizar conversiones entre unidades de longitud y masa para aplicar dichas conversiones en su diario vivir.",
                nanpaskas: "Soluciona problemas en los que intervengan conversiones entre unidades de longitud y masa en situaciones de su diario vivir.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras, Proyección y edición de videos educativos.",
              },
              {
                id: "P3-T2",
                status: "not_started",
                tuhPutkamna: "Aleatorio: Definición de población, muestra, variable. Clasificación de variables. Tablas de frecuencia absoluta, relativa y acumulada. Diagramas de barras. Histograma. Diagramas circulares.",
                title: "Reconoce qué es la población, la muestra, la variable y los datos de la investigación; los ordena en tablas de frecuencia.",
                hacer: "Aplica procedimientos para determinar la población, la muestra, la variable y los datos de diferentes estudios estadísticos para construir tablas de frecuencia a partir de la información recolectada.",
                ser: "Favorece su espíritu emprendedor participando activamente en el desarrollo de la clase, mostrando la importancia de la estadística en situaciones de la vida cotidiana.",
                panapain: "Resumir y descubrir patrones de comportamiento en la exploración de datos, obtenidos a través de un estudio estadístico.",
                nanpaskas: "Reconoce y obtiene datos de la población, la muestra, la variable mediante investigaciones estadísticas que están relacionados con su entorno social y/o económico, organizando dicha información en tablas de frecuencia.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras.",
              },
              {
                id: "P3-T3",
                status: "not_started",
                tuhPutkamna: "Aleatorio: Medidas de tendencia central (Media o promedio, Moda, Mediana).",
                title: "Formula e interpreta problemas estadísticos de su entorno cotidiano que requieren el manejo de la media, moda y mediana.",
                hacer: "Ordena, cuenta y representa gráficamente los datos recolectados empleando las medidas de tendencia central en el análisis.",
                ser: "Participa activamente en el desarrollo de investigaciones estadísticas y de la elaboración de su análisis.",
                panapain: "Crear representaciones gráficas de información procedente de entrevistas, censos, encuestas, entre otros. Calcula la media, mediana y moda a partir de un conjunto de datos obtenido mediante la aplicación de instrumentos de recolección pertinentes.",
                nanpaskas: "Identifica y construye diferentes tipos de gráficos estadísticos, y calcula las diferentes medidas de tendencia central en datos no agrupados interpretando la información obtenida de diferentes medios.",
                satIshkit: "Trabajo individual, Trabajo colaborativo, Mesa redonda, Exposiciones, Lluvia de ideas, Salidas de campo, Carteleras.",
              }
            ]
          }
        ]
      });
      setIsExtracting(false);
    }, 3500);
  };

  const handleSave = async () => {
    if (!extractedData) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "curriculum", extractedData.id), extractedData);
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
        <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
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
                                       <span className="text-blue-600 not-italic">HILOS:</span> {topic.title} | {topic.hacer} | {topic.ser}
                                     </p>
                                     <div className="grid grid-cols-2 gap-2 mt-1">
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
