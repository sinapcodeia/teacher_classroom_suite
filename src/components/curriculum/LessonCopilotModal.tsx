"use client";

import { useState, useEffect } from "react";
import { Sparkles, X, BrainCircuit, Target, FileText, ChevronRight, Save, Printer, Layers } from "lucide-react";
import { Topic, useApp } from "@/context/AppContext";
import { printCopilotLessonPlan } from "@/lib/printService";
import { normalizeTopicForDisplay } from "@/lib/tejidoTemplate";

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

  const norm = normalizeTopicForDisplay(topic);

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
          return p + 5;
        });
      }, 45);

      const n = normalizeTopicForDisplay(topic);
      const timer = setTimeout(() => {
        setGenerating(false);
        const temasStr = n.ejes.join(", ");
        const estrategias = n.satIshkit || "Trabajo individual y colaborativo, mesa redonda, lluvia de ideas y carteleras";

        setPlan({
          higra: n.higra,
          ejes: n.ejes,
          saber: n.saber,
          hacer: n.hacer,
          ser: n.ser,
          objective: `Desarrollar sobre la Higra del Conocimiento "${n.higra}" los temas (${temasStr}), articulando el Hilo SABER (${n.saber}), el Hilo HACER (${n.hacer}) y el Hilo SER (${n.ser}) en armonía con el territorio Awá.`,
          warmup: `Exploración y Saberes Propios — Pañapain (15 min): Círculo de la palabra alrededor de la Higra "${n.higra}". Sabiduría propia a dialogar: "${n.panapain || "Aplicación comunitaria en Katsa Su"}". Lluvia de ideas sobre cómo se viven los temas (${temasStr}) en la vida diaria de la comunidad.`,
          development: `Estructuración — Hilo SABER y Sabiduría Intercultural Ñanpaskas (30 min): Desarrollo conceptual sobre la Higra "${n.higra}" abordando paso a paso los temas: ${n.ejes.map((e, i) => `(${i + 1}) ${e}`).join("; ")}. Enfoque del Hilo SABER: "${n.saber}". Diálogo intercultural: "${n.nanpaskas || "Estándares disciplinares e interculturales"}".`,
          activity: `Práctica Tejiendo Aprendo — Hilo HACER (35 min): Aplicando las estrategias metodológicas (${estrategias}), los estudiantes desarrollan retos prácticos enfocados en el Hilo HACER: "${n.hacer}", resolviendo situaciones contextualizadas sobre ${temasStr}.`,
          assessment: `Valoración Integral — Hilo SER (10 min): Evaluación formativa de los tres hilos: comprobación conceptual (SABER), revisión del ejercicio práctico (HACER) y autoevaluación actitudinal y comunitaria según el Hilo SER: "${n.ser}".`,
          homework: `Compromiso en el Territorio: Dialogar en familia sobre cómo se aplica "${n.higra}" (${n.ejes[0] || ""}) en las actividades productivas o cotidianas de la vereda y registrar un ejemplo en el cuaderno.`,
          materials: n.katkinAizpa
            ? n.katkinAizpa.split(/[,|\n]/).map(s => s.trim()).filter(Boolean)
            : [
                `Guía didáctica de la Higra: ${n.higra}`,
                "Cuaderno de trabajo y tablero",
                "Material concreto del entorno comunitario Awá",
                `Insumos para: ${estrategias.split(/[,|\n]/).slice(0, 3).join(", ")}`,
              ],
        });
      }, 1000);

      return () => {
        clearInterval(interval);
        clearTimeout(timer);
      };
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
              <h2 className="text-xl font-black uppercase tracking-tight">
                Copiloto IA · Preparación sobre la Higra
              </h2>
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-widest flex items-center gap-2">
                SinapCode IA <ChevronRight size={10} /> {grade} • {subject}
              </p>
            </div>
          </div>
          <h3 className="text-base font-bold mt-3 text-white/95">
            Higra del Conocimiento (Tuh Putkamna): <strong className="text-yellow-300">{norm.higra}</strong>
          </h3>
          <p className="text-[11px] text-indigo-100 mt-1">
            Temas de la Higra: {norm.ejes.join(" · ")}
          </p>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
          {generating || !plan ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-20"></div>
                <div className="absolute inset-2 bg-indigo-100 rounded-full flex items-center justify-center shadow-inner">
                  <BrainCircuit size={40} className="text-indigo-600 animate-pulse" />
                </div>
              </div>
              <h4 className="text-lg font-black text-slate-700 uppercase tracking-widest mb-4">
                Tejiendo Sesión sobre la Higra...
              </h4>
              <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-75 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs font-medium text-slate-400 mt-4 uppercase tracking-widest">
                Articulando Higra ({norm.higra}) + Hilos SABER, HACER y SER...
              </p>
            </div>
          ) : (
            <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
              {/* Resumen de Hilos del Saber */}
              <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Layers size={18} />
                  <h4 className="font-black uppercase tracking-widest text-xs">
                    Hilos del Saber (Piankammu Mi) desprendidos de la Higra
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 block mb-1">
                      Hilo SABER
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{norm.saber}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-800 block mb-1">
                      Hilo HACER
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{norm.hacer}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-violet-50/70 border border-violet-200">
                    <span className="text-[9px] font-black uppercase tracking-widest text-violet-800 block mb-1">
                      Hilo SER
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">{norm.ser}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 text-indigo-700 mb-2">
                  <Target size={18} />
                  <h4 className="font-black uppercase tracking-widest text-sm">Objetivo Integral de la Clase</h4>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed">{plan.objective}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                  <h4 className="font-black uppercase tracking-widest text-xs text-amber-800 mb-2">
                    1. Inicio y Sabiduría Propia (Pañapain)
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.warmup}</p>
                </div>
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <h4 className="font-black uppercase tracking-widest text-xs text-blue-800 mb-2">
                    2. Desarrollo sobre la Higra y SABER
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.development}</p>
                </div>
                <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                  <h4 className="font-black uppercase tracking-widest text-xs text-emerald-800 mb-2">
                    3. Práctica Tejiendo Aprendo y HACER
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.activity}</p>
                </div>
                <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100">
                  <h4 className="font-black uppercase tracking-widest text-xs text-purple-800 mb-2">
                    4. Cierre y Valoración del SER
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{plan.assessment}</p>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100/50">
                <h4 className="font-black uppercase tracking-widest text-xs text-indigo-700 mb-2">
                  5. Trabajo Autónomo Comunitario
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">{plan.homework}</p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-slate-500" />
                </div>
                <div>
                  <h4 className="font-black uppercase tracking-widest text-xs text-slate-700 mb-1">
                    Recursos y Ayudas Pedagógicas Recomendadas
                  </h4>
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

          {!generating && plan && (
            <button
              onClick={() => {
                printCopilotLessonPlan(plan, {
                  topic: `${norm.higra} (${norm.ejes.join(", ")})`,
                  grade,
                  subject,
                  teacher: profile?.name || "Docente",
                });
              }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-2"
            >
              <Printer size={16} /> Descargar PDF
            </button>
          )}
          {!generating && plan && (
            <button
              onClick={() => {
                alert("Planeación de la Higra guardada en tu planeador institucional.");
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
