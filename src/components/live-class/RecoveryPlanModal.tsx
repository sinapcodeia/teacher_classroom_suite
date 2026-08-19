"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, AlertTriangle, Printer, CheckCircle, GraduationCap, BookOpen, FileText } from "lucide-react";
import { printRecoveryPlan } from "@/lib/printService";
import { useApp } from "@/context/AppContext";
import { normalizeGrade } from "@/lib/constants";

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
  const { profile, curriculum } = useApp();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlanText, setGeneratedPlanText] = useState<string | null>(null);

  const studentName = student ? `${student.primerNombre} ${student.primerApellido} ${student.segundoApellido || ""}`.trim() : "";
  const average = student?.finalScore || student?.avgGrade || 0;

  useEffect(() => {
    if (isOpen && student) {
      setIsGenerating(true);
      setGeneratedPlanText(null);

      // Buscar los contenidos reales de la malla curricular del docente para esta asignatura y grado
      const matchingCurriculum = curriculum.find(c => 
        c.subject.toUpperCase() === subject.toUpperCase() && 
        normalizeGrade(c.grade) === normalizeGrade(student.grado)
      );

      let mallaTopicsText = "";
      if (matchingCurriculum && matchingCurriculum.units && matchingCurriculum.units.length > 0) {
        const topicsList: string[] = [];
        matchingCurriculum.units.forEach(unit => {
          if (unit.topics) {
            unit.topics.forEach(t => {
              if (t.title) {
                const subtopicsStr = t.hijosSaber ? ` (${t.hijosSaber})` : "";
                topicsList.push(`• ${t.title}${subtopicsStr}`);
              }
            });
          }
        });
        if (topicsList.length > 0) {
          mallaTopicsText = `\n📌 NÚCLEOS TEMÁTICOS DE LA MALLA CURRICULAR A REFORZAR:\n${topicsList.slice(0, 6).join("\n")}\n`;
        }
      }

      if (!mallaTopicsText) {
        mallaTopicsText = `\n📌 NÚCLEOS TEMÁTICOS DE LA MALLA CURRICULAR A REFORZAR:\n• Fundamentos conceptuales de ${subject.toUpperCase()}\n• Aplicación práctica y resolución de problemas en el territorio\n• Trabajo analítico y comprensión de guías técnicas\n`;
      }

      setTimeout(() => {
        const text = `ESTRATEGIA PEDAGÓGICA DE APOYO Y PLAN DE NIVELACIÓN (SIEEE)
----------------------------------------------------------------------
INSTITUCIÓN: I.E. TÉCNICA AGROPECUARIA BUENAVISTA - IETABA
ASIGNATURA: ${subject.toUpperCase()} | GRADO: ${normalizeGrade(student.grado)} - CURSO ${student.curso}
DOCENTE: ${profile.name.toUpperCase()}
ESTUDIANTE: ${studentName.toUpperCase()} (DOC: ${student.nroDocumento})
ESTADO ACTUAL: DESEMPEÑO BAJO (PROMEDIO ACUMULADO: ${average.toFixed(2)} / 5.0)

======================================================================
1. OBJETIVO DEL PLAN DE NIVELACIÓN
======================================================================
Garantizar la superación de los vacíos pedagógicos identificados en el desarrollo de la malla curricular, permitiendo al estudiante afianzar los saberes fundamentales y alcanzar el nivel de desempeño BÁSICO (mínimo 3.0) requerido por el SIEEE institucional.
${mallaTopicsText}
======================================================================
2. COMPROMISOS Y ACTIVIDADES DE NIVELACIÓN COMPROMETIDAS (100%)
======================================================================
Para superar la materia, el estudiante deberá realizar a mano y de forma íntegra las siguientes tres actividades:

✍️ ACTIVIDAD I: APORTES TEÓRICOS Y APUNTES DE CUADERNO (Valor: 30%)
• El estudiante deberá ponerse al día con la totalidad de los apuntes y guías trabajadas en clase.
• Entregará un resumen manuscrito de 3 páginas con los conceptos clave, fórmulas y diagramas explicados.

📐 ACTIVIDAD II: TALLER PRÁCTICO DE AFIANZAMIENTO Y MALLA (Valor: 40%)
• Resolver de forma individual el taller impreso de 5 ejercicios analíticos sobre los núcleos temáticos del período.
• Redactar una síntesis de una página donde explique la aplicación de los conocimientos de ${subject} en la vida práctica y en su comunidad.
• Elaborar un glosario de 10 términos técnicos de la asignatura con su definición y ejemplo ilustrado.

🗣️ ACTIVIDAD III: SUSTENTACIÓN ORAL Y EVALUACIÓN PRESENCIAL (Valor: 30%)
• Presentar una sustentación oral ante el docente en el aula de clase.
• Responder satisfactoriamente a 3 preguntas de verificación conceptual sobre el taller entregado.

======================================================================
3. CRONOGRAMA, ACUERDOS Y FIRMAS DE COMPROMISO
======================================================================
• Fecha Límite de Entrega: _________________________________________
• Lugar de Presentación: Aula de clase IETABA en horario de asesoría.
• Compromiso del Acudiente: El acudiente/familia se compromete a acompañar el estudio diario en casa y asegurar la presentación puntual de los trabajos.

----------------------------------     ----------------------------------
Firma del Docente                      Firma del Estudiante

----------------------------------
Firma del Acudiente / Familia`;

        setGeneratedPlanText(text);
        setIsGenerating(false);
      }, 800);
    }
  }, [isOpen, student, subject, profile.name, curriculum]);

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
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-on-surface/60 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl p-6 md:p-8 border border-slate-100 flex flex-col gap-6 max-h-[92vh] overflow-y-auto custom-scrollbar">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black uppercase text-on-surface tracking-tight">
                Plan de Nivelación Pedagógica
              </h2>
              <p className="text-xs font-bold text-on-surface-variant opacity-70">
                Estrategia oficial SIEEE vinculada a la Malla Curricular
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Informante del Estudiante */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider block text-amber-700">Estudiante en Riesgo Académico</span>
            <span className="text-base font-black uppercase">{studentName}</span>
            <span className="text-xs font-bold block text-amber-800">DOC: {student.nroDocumento} | Grado {normalizeGrade(student.grado)} - {student.curso}</span>
          </div>
          <div className="px-4 py-2 bg-amber-500 text-white rounded-xl font-black text-sm shadow-md">
            Nota: {average.toFixed(2)} / 5.0
          </div>
        </div>

        {/* Vista previa del documento */}
        <div className="relative">
          {isGenerating ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3 bg-slate-900 text-slate-200 rounded-2xl">
              <Sparkles size={32} className="animate-spin text-amber-400" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-300">
                Generando Plan de Nivelación desde la Malla Curricular...
              </p>
            </div>
          ) : (
            <div className="w-full bg-slate-900 text-slate-100 rounded-2xl p-6 font-mono text-[10px] md:text-xs leading-relaxed overflow-y-auto max-h-[360px] border border-slate-800 shadow-inner custom-scrollbar whitespace-pre-wrap">
              {generatedPlanText}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-surface-container text-on-surface-variant rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-container-high transition-all flex-1"
          >
            Cerrar
          </button>

          <button
            onClick={handlePrint}
            disabled={isGenerating || !generatedPlanText}
            className="px-8 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-105 transition-all flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Printer size={18} /> Imprimir Plan para Entregar al Alumno
          </button>
        </div>
      </div>
    </div>
  );
}
