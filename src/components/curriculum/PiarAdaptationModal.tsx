"use client";

import { useState, useMemo } from "react";
import { X, Sparkles, User, HelpCircle, AlertCircle, Printer, CheckCircle } from "lucide-react";
import { useApp, normalizeGrade } from "@/context/AppContext";

interface PiarAdaptationModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: {
    summary: string;
    lesson: string;
    workshop: string;
    activity: string;
    exam: string;
    grade: string;
    subject: string;
    topic: string;
  } | null;
  onPrint: (adaptedPlan: any, type: string) => void;
}

const ADAPTATION_TYPES = [
  {
    id: "slow",
    label: "Ritmo Lento de Aprendizaje",
    desc: "Simplificación sintáctica, enunciados cortos, apoyo en listas viñetadas y tareas prácticas escalonadas paso a paso.",
  },
  {
    id: "visual",
    label: "Limitación Sensorial Visual",
    desc: "Énfasis en descripciones acústicas detalladas, dinámicas de tacto o manipulación manual, y adaptaciones para macrotipos de letra.",
  },
  {
    id: "hearing",
    label: "Limitación Sensorial Auditiva",
    desc: "Acompañamiento mediante esquemas visuales, mapas de señas tradicionales, y talleres basados en dibujos e ilustraciones claras.",
  },
  {
    id: "bilingual",
    label: "Bilingüismo (Awapit a Español)",
    desc: "Uso de vocabulario bilingüe dual (término Awapit - término Español), analogías territoriales nativas y gramática simplificada.",
  }
];

export default function PiarAdaptationModal({ isOpen, onClose, plan, onPrint }: PiarAdaptationModalProps) {
  const { myStudents, profile } = useApp();
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [adaptationType, setAdaptationType] = useState("slow");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPiar, setGeneratedPiar] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    if (!plan) return [];
    return myStudents.filter(s => s.isActive !== false);
  }, [myStudents, plan]);

  const selectedStudentName = useMemo(() => {
    const student = filteredStudents.find(s => s.id === selectedStudentId);
    if (!student) return "";
    return `${student.primerNombre} ${student.primerApellido}`;
  }, [filteredStudents, selectedStudentId]);

  const handleGenerate = () => {
    if (!plan) return;
    setIsGenerating(true);
    setGeneratedPiar(null);

    // Simulate premium AI generation delay
    setTimeout(() => {
      const typeInfo = ADAPTATION_TYPES.find(t => t.id === adaptationType);
      const studentNameUpper = selectedStudentName ? selectedStudentName.toUpperCase() : "ESTUDIANTE GENERAL";
      
      let adaptedText = `ADAPTACIÓN CURRICULAR PERSONALIZADA (PIAR)
Institución: IETABA (Territorio Awá)
Materia: ${plan.subject} | Grado: ${plan.grade}
Estudiante Asignado: ${studentNameUpper}
Tipo de Adaptación Aplicada: ${typeInfo?.label}
----------------------------------------------------------------------

🎯 OBJETIVO PEDAGÓGICO DE INCLUSIÓN:
Garantizar la apropiación de la temática [ ${plan.topic.toUpperCase()} ] mediante estrategias adaptadas que eliminen las barreras de aprendizaje, respetando la identidad cultural y vinculando el saber al entorno de Katsa Su (La Gran Tierra).

======================================================================
I. DESARROLLO DE CLASE SIMPLIFICADO Y DIDÁCTICO
======================================================================
📖 MARCO CONCEPTUAL ADAPTADO (Para transcribir o leer con apoyo):
`;

      if (adaptationType === "slow") {
        adaptedText += `• ¿Qué estamos aprendiendo hoy?
  Hoy estudiamos sobre cómo se organiza y funciona el tema de "${plan.topic}".
• Idea 1: Todo en la naturaleza tiene un orden y una forma. Los saberes científicos nos ayudan a calcular y entender ese orden de forma sencilla.
• Idea 2: Cuando medimos, diseñamos o planeamos un cultivo, estamos aplicando la teoría directamente en el campo.
• Idea 3: El saber es como un camino de piedras: vamos paso a paso, asegurando cada pisada antes de dar la siguiente.

💡 RETO PRÁCTICO EN AULA (Paso a Paso):
1. Dibuja un círculo en tu cuaderno para representar el territorio del IETABA.
2. Identifica con ayuda del docente un lugar en el mapa del resguardo donde se aplique este tema.
3. Escribe en tu cuaderno una frase corta explicando cómo este saber ayuda a tu vereda.`;
      } else if (adaptationType === "visual") {
        adaptedText += `• GUÍA AERO-DESCRIPTIVA Y TÁCTIL:
  Para esta temática de "${plan.topic}", nos apoyaremos de objetos que el estudiante pueda tocar, sentir y manipular directamente en su mesa de trabajo.
• Estrategia 1 (Cestería y Relieves): Utilizaremos tejidos tradicionales de bejuco o canastos shingras para trazar con los dedos la estructura y dirección de las formas estudiadas.
• Estrategia 2 (Entorno Hídrico): Se realizará una salida de campo guiada al río cercano para escuchar los patrones del agua y asociarlos acústicamente con la frecuencia y estructura del tema de clase.

💡 RETO PRÁCTICO SENSORIAL:
1. Con los ojos cerrados, recorre con tus manos la estructura del canasto tradicional entregado por el docente.
2. Compara el grosor del tejido con los conceptos de la clase.
3. Modela con arcilla o barro del territorio la forma representativa del tema estudiado.`;
      } else if (adaptationType === "hearing") {
        adaptedText += `• GUÍA VISUAL Y GESTUAL:
  Esta planeación de "${plan.topic}" se apoya enteramente en organizadores visuales y esquemas a gran escala en el tablero.
• Recurso 1: Mapa ilustrado a todo color del Resguardo Awá, mostrando flechas amarillas de causalidad y engranajes azules de la materia.
• Recurso 2: Vocabulario gráfico, donde cada término científico se asocia a un dibujo o símbolo tradicional pintado en el salón.

💡 RETO PRÁCTICO ILUSTRADO:
1. Recorta y pega en tu cuaderno 3 imágenes que muestren actividades agrícolas de tu vereda.
2. Dibuja una línea roja sobre la imagen donde sientas que se aplica la ley de ${plan.subject}.
3. Señala al docente con señas tradicionales cómo se relacionan el agua, la tierra y el tema estudiado.`;
      } else {
        // Bilingual
        adaptedText += `• GUÍA BILINGÜE Y DE APRENDIZAJE INTERCULTURAL (AWAPIT - ESPAÑOL):
  Entendemos que el Awapit es nuestra lengua raíz. Para entender mejor "${plan.topic}", utilizaremos términos duales:
• Término 1: **Katsa Su** (La Gran Tierra / Nuestro Territorio). Es el espacio sagrado donde todo ocurre.
• Término 2: **Tuh Putkamna** (Tejido de Saberes). Así llamamos a la unión de las matemáticas, la tecnología y el saber ancestral.
• Término 3: **Panapain** (Aplicar en el Territorio). Llevar lo que estudiamos en hojas al beneficio real de la comunidad.

💡 RETO PRÁCTICO INTERCULTURAL:
1. Escribe en tu cuaderno la palabra de la materia en Español y colócala al lado de su significado tradicional en Awapit.
2. Dialoga con un compañero en Awapit sobre por qué el cultivo y la tecnología deben ir de la mano.
3. Dibuja en tu cuaderno una 'Shingra' y escribe dentro de ella 3 valores tradicionales aprendidos.`;
      }

      adaptedText += `

======================================================================
II. TALLER DE EVALUACIÓN ADAPTADA (PREGUNTAS EN CONTEXTO)
======================================================================
Instrucción: Lee detenidamente las preguntas (o escúchalas con ayuda de tu docente) y responde en tu cuaderno de forma sencilla.

1. 📖 Escribe con tus propias palabras qué aprendiste hoy sobre el tema de "${plan.topic}".
2. 🌱 Explica con un dibujo sencillo cómo tu familia o tu cabildo escolar puede usar este conocimiento en la vida diaria.
3. 🤝 Describe una actividad comunitaria (Minga) donde sientas que este tema ayuda a los compañeros a trabajar en equipo de manera más rápida y limpia.`;

      setGeneratedPiar(adaptedText);
      setIsGenerating(false);
    }, 1200);
  };

  const handlePrintAdapted = () => {
    if (!generatedPiar || !plan) return;
    onPrint({
      ...plan,
      piar: generatedPiar
    }, "piar");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-md bg-on-surface/60 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-6 border border-white/20">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shadow-inner">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Adaptaciones Curriculares (PIAR)</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Módulo de Inclusión y Diversidad Pedagógica</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-all border border-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            {/* Student selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><User size={12}/> Seleccionar Estudiante</label>
              <select 
                value={selectedStudentId} 
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full h-12 bg-white px-4 rounded-xl border border-slate-200 text-[10px] font-black uppercase outline-none focus:border-amber-500 transition-all cursor-pointer"
              >
                <option value="">ESTUDIANTE GENERAL / SIN ASIGNAR</option>
                {filteredStudents.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.primerApellido} {s.primerNombre} ({normalizeGrade(s.grado)}° — {s.curso})
                  </option>
                ))}
              </select>
            </div>

            {/* Adaptation Type Selector */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2"><HelpCircle size={12}/> Tipo de Ajuste curricular</label>
              <div className="grid grid-cols-1 gap-2.5">
                {ADAPTATION_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setAdaptationType(type.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all group ${
                      adaptationType === type.id
                        ? "border-amber-500 bg-amber-50/50 shadow-md"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center transition-all ${adaptationType === type.id ? 'bg-amber-500 ring-2 ring-amber-500/50' : 'bg-slate-200'}`} />
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider">{type.label}</span>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 group-hover:text-slate-500 leading-normal ml-6 pl-0.5">
                      {type.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !plan}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sincronizando Ajustes...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="animate-pulse" />
                  Generar Adaptación PIAR
                </>
              )}
            </button>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" /> Vista Previa del Documento
              </span>
              {generatedPiar && (
                <button
                  onClick={handlePrintAdapted}
                  className="flex items-center gap-2 px-4 py-2 bg-on-surface text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95"
                >
                  <Printer size={12} /> Imprimir PIAR
                </button>
              )}
            </div>

            <div className="w-full bg-slate-900 text-slate-200 rounded-[2rem] p-6 font-mono text-[10px] leading-relaxed overflow-y-auto max-h-[500px] border border-slate-800 shadow-inner custom-scrollbar relative">
              {generatedPiar ? (
                <div className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-slate-300">
                  {generatedPiar}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-30 gap-3">
                  <AlertCircle size={40} className="stroke-1" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Configura los parámetros y haz clic en Generar para ver la adaptación</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
