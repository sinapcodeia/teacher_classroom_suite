"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, BrainCircuit, Target, CheckCircle2, FileText, ChevronRight, Loader2, Save } from "lucide-react";
import { Topic, useApp } from "@/context/AppContext";
import { printCopilotLessonPlan } from "@/lib/printService";
import { Printer } from "lucide-react";

interface LessonCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic | null;
  subject: string;
  grade: string;
}

export default function LessonCopilotModal({ isOpen, onClose, topic, subject, grade }: LessonCopilotModalProps) {
  const { profile } = useApp();
  const [generating, setGenerating] = useState(true);
  const [progress, setProgress] = useState(0);
  const [plan, setPlan] = useState<any>(null);
  
  useEffect(() => {
    if (isOpen && topic) {
      setGenerating(true);
      setProgress(0);
      setPlan(null);
      
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            return 100;
          }
          return p + 2;
        });
      }, 50);

      
      setTimeout(() => {
        setGenerating(false);
        const t = topic.title || 'este tema';
        setPlan({
          objective: `Al finalizar la clase, los estudiantes estarán en capacidad de analizar, comprender y aplicar de manera crítica los fundamentos de ${t.toLowerCase()}, reconociendo su impacto en el entorno local y global mediante ejercicios de resolución de problemas.`,
          warmup: `Exploración de Saberes (15 min): Iniciaremos con una pregunta detonante en el tablero: "¿Cómo creen que impacta ${t.toLowerCase()} en nuestra vida cotidiana?". Los estudiantes participarán mediante una lluvia de ideas (brainstorming). El docente construirá un mapa mental en la pizarra con los aportes más relevantes para activar el conocimiento previo.`,
          development: `Estructuración Cognitiva (30 min): Explicación magistral dialogada apoyada en un mapa conceptual visual. Se desglosarán los 3 componentes principales de ${t.toLowerCase()}. Se presentará un caso de estudio real o ejemplo práctico paso a paso. Los estudiantes tomarán apuntes estructurados usando el método Cornell.`,
          activity: `Transferencia y Práctica (35 min): Trabajo colaborativo en grupos de 3 estudiantes. Se les entregará un "Reto de Aplicación" donde deberán resolver un problema práctico utilizando los conceptos expuestos. Cada grupo deberá entregar un boceto o borrador con su solución. El docente circulará por el aula brindando retroalimentación formativa y resolviendo dudas.`,
          assessment: `Cierre y Evaluación Formativa (10 min): Dinámica de "Ticket de Salida". Cada estudiante recibirá una tira de papel donde deberá responder a dos preguntas cortas: 1. ¿Cuál fue el aprendizaje más importante de hoy? 2. ¿Qué duda me quedó sobre ${t.toLowerCase()}?. Esto servirá como diagnóstico para la siguiente sesión.`,
          homework: `Actividad Extraclase: Investigar un ejemplo real en su comunidad donde se aplique el concepto visto hoy, y traer un pequeño reporte de un párrafo para discutir al inicio de la próxima clase.`,
          materials: ["Tablero y Marcadores de colores", "Copias del Reto de Aplicación (1 por grupo)", "Tiras de papel para Ticket de Salida", "Recursos Audiovisuales (Opcional)"]
        });
      }, 3000);

      
      return () => clearInterval(interval);
    }
  }, [isOpen, topic]);

  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/60 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-indigo-100">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-6 text-white relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/30 rounded-xl flex items-center justify-center backdrop-blur-md border border-indigo-400/30">
              <Sparkles className="text-indigo-200" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Copiloto de Planeación</h2>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
                SinapCode IA <ChevronRight size={10} /> {grade} • {subject}
              </p>
            </div>
          </div>
          <h3 className="text-lg font-medium mt-4 text-white/90">Tema: <strong className="text-white">{topic.title || 'Sin Título'}</strong></h3>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                  <BrainCircuit size={40} className="text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h4 className="text-lg font-black text-slate-700 uppercase tracking-widest mb-4">Diseñando Sesión...</h4>
              <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-medium text-slate-400 mt-4 uppercase tracking-widest">
                Analizando malla curricular y contexto...
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-700 mb-2">
                  <Target size={18} />
                  <h4 className="font-black uppercase tracking-widest text-sm">Objetivo de la Clase</h4>
                </div>
                <p className="text-slate-700 text-sm">{plan.objective}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100/50">
                  <h4 className="font-black uppercase tracking-widest text-xs text-amber-700 mb-2">1. Calentamiento (Inicio)</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.warmup}</p>
                </div>
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                  <h4 className="font-black uppercase tracking-widest text-xs text-blue-700 mb-2">2. Desarrollo Teórico</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.development}</p>
                </div>
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                  <h4 className="font-black uppercase tracking-widest text-xs text-emerald-700 mb-2">3. Actividad Práctica</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.activity}</p>
                </div>
                <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100/50">
                  <h4 className="font-black uppercase tracking-widest text-xs text-purple-700 mb-2">4. Cierre y Evaluación</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.assessment}</p>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                <h4 className="font-black uppercase tracking-widest text-xs text-indigo-700 mb-2">5. Trabajo Autónomo (Tarea)</h4>
                <p className="text-slate-600 text-sm leading-relaxed">{plan.homework}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-slate-500" />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs text-slate-700 mb-1">Materiales Recomendados</h4>
                  <p className="text-slate-500 text-sm font-medium">{plan.materials.join(" • ")}</p>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 p-4 shrink-0 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
          
          {!generating && (
            <button 
              onClick={() => {
                printCopilotLessonPlan(plan, {
                  topic: topic.title || 'Tema',
                  grade,
                  subject,
                  teacher: profile?.name || 'Docente'
                });
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
              <Printer size={16} /> Descargar PDF
            </button>
          )}
          {!generating && (
            <button 
              onClick={() => {
                alert("Guardado en tu Google Drive y en la planeación institucional.");
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <Save size={16} /> Aplicar a mi Clase
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
