"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, AlertTriangle, Printer, CheckCircle, GraduationCap } from "lucide-react";
import { printRecoveryPlan } from "@/lib/printService";
import { useApp } from "@/context/AppContext";

interface RecoveryPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    primerNombre: string;
    primerApellido: string;
    segundoApellido?: string;
    nroDocumento: string;
    avgGrade?: number;
    finalScore?: number;
    grado: string;
    curso: string;
  } | null;
  subject: string;
}

export default function RecoveryPlanModal({ isOpen, onClose, student, subject }: RecoveryPlanModalProps) {
  const { profile } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlanText, setGeneratedPlanText] = useState<string | null>(null);

  const studentName = student ? `${student.primerNombre} ${student.primerApellido} ${student.segundoApellido || ""}`.trim() : "";
  const average = student?.finalScore || student?.avgGrade || 0;

  useEffect(() => {
    if (isOpen && student) {
      setIsGenerating(true);
      setGeneratedPlanText(null);

      // Simulate premium AI generation delay for the recovery plan
      setTimeout(() => {
        const text = `ESTRATEGIA PEDAGÓGICA DE APOYO Y PLAN DE NIVELACIÓN
----------------------------------------------------------------------
Institución: IETABA (Resguardo Indígena Awá)
Asignatura: ${subject.toUpperCase()}
Docente: ${profile.name.toUpperCase()}
Estudiante: ${studentName.toUpperCase()}
Materia del Periodo: Nivelación por Desempeño Bajo (Nota Parcial: ${average.toFixed(2)})

======================================================================
1. COMPROMISOS Y ACTIVIDADES DE NIVELACIÓN COMPROMETIDAS
======================================================================
Para superar los vacíos conceptuales y lograr la aprobación de la materia, el estudiante se compromete a realizar a mano y de forma íntegra las siguientes actividades:

✍️ ACTIVIDAD I: APORTES TEÓRICOS Y APUNTES DE CUADERNO (Valor: 30%)
El estudiante debe ponerse al día con todas las clases dictadas durante el periodo actual. Presentará un resumen manuscrito en su cuaderno sobre los marcos conceptuales fundamentales y los diagramas explicados en el pizarrón.

📐 ACTIVIDAD II: RESOLUCIÓN DE TALLER COMPLEMENTARIO (Valor: 40%)
El alumno resolverá de forma individual un taller práctico que consta de los siguientes 5 ejercicios de afianzamiento analítico y agroambiental:
1. Diseña un flujograma conceptual que organice el paso a paso de resolución del tema central de la asignatura.
2. Elabora un escrito detallado de una página donde describas cómo la precisión analítica de ${subject} beneficia directamente las decisiones agroambientales de tu comunidad.
3. Resuelve con procedimiento exhaustivo los dos ejemplos resueltos en clase y propón una variante para cada uno.
4. Elabora un glosario con al menos 8 términos técnicos de la materia y tradúcelos al lenguaje práctico del territorio.
5. Desarrolla un cartel o afiche a color que promueva la importancia del aprendizaje técnico e intercultural entre tus compañeros.

🗣️ ACTIVIDAD III: SUSTENTACIÓN ORAL E INTERCULTURAL (Valor: 30%)
El estudiante presentará una sustentación oral ante el docente en el aula de clase. Deberá explicar el paso a paso de sus ejercicios resueltos y responder a las preguntas conceptuales de forma presencial.

======================================================================
2. CRONOGRAMA DE ENTREGA Y COMPROMISO FAMILIAR
======================================================================
• Fecha de Entrega Máxima: Definida en coordinación académica.
• Lugar de Presentación: Predio del IETABA en hora de asesoría grupal.
• Rol de la Familia: El acudiente se compromete a supervisar el desarrollo diario de los talleres en casa y asegurar la asistencia puntual del estudiante en los días de nivelación.`;

        setGeneratedPlanText(text);
        setIsGenerating(false);
      }, 1000);
    }
  }, [isOpen, student, subject, profile.name]);

  const handlePrint = () => {
    if (!generatedPlanText || !student) return;
    printRecoveryPlan({
      studentName,
      documentId: student.nroDocumento,
      subject,
      grade: student.grado,
      course: student.curso,
      average,
      planText: generatedPlanText
    }, profile.name);
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-md bg-on-surface/60 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 border border-slate-100 flex flex-col gap-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center shadow-inner">
              <AlertTriangle size={24} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Plan de Nivelación Personalizado</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Ficha de Recuperación Pedagógica</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-full transition-all border border-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold">
          <div className="space-y-1">
            <p className="text-slate-400 uppercase tracking-wider text-[8px] font-black">Estudiante</p>
            <p className="text-slate-800 uppercase font-black">{studentName}</p>
            <p className="text-slate-400 uppercase tracking-widest text-[8px] font-bold">Documento: {student.nroDocumento}</p>
          </div>
          <div className="space-y-1">
            <p className="text-slate-400 uppercase tracking-wider text-[8px] font-black">Asignatura</p>
            <p className="text-slate-800 uppercase font-black">{subject} ({student.grado}° — {student.curso})</p>
            <p className="text-slate-400 uppercase tracking-widest text-[8px] font-bold">
              Promedio: <span className="text-rose-600 font-black">{average.toFixed(2)} / 5.0</span>
            </p>
          </div>
        </div>

        {/* Generate / Preview area */}
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <GraduationCap size={14} className="text-primary" /> Estructura del Taller de Recuperación
            </span>
            {generatedPlanText && (
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-md active:scale-95 shadow-rose-100"
              >
                <Printer size={12} /> Imprimir Plan
              </button>
            )}
          </div>

          <div className="w-full bg-slate-900 text-slate-200 rounded-[2.0rem] p-6 font-mono text-[9.5px] leading-relaxed overflow-y-auto max-h-[300px] border border-slate-800 shadow-inner custom-scrollbar relative">
            {isGenerating ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 bg-slate-900/90">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500 animate-pulse">Sincronizando notas en rojo...</p>
              </div>
            ) : generatedPlanText ? (
              <div className="whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-slate-300">
                {generatedPlanText}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-30 gap-3">
                <AlertTriangle size={40} className="stroke-1 text-slate-400" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cargando expediente del estudiante...</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
