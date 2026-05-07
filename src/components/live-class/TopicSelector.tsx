"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { BookOpen, ChevronDown, Target, TrendingUp, Calendar } from "lucide-react";

interface TopicSelectorProps {
  subjectId?: string; // e.g. "Matemáticas"
  grade?: string;     // e.g. "11°"
}

export default function TopicSelector({ subjectId, grade }: TopicSelectorProps) {
  const { curriculum, updateTopicStatus } = useApp();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  // Encontrar el currículo que coincida con la materia y el grado
  const activeCurriculum = useMemo(() => {
    if (!subjectId) return curriculum[0];
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    const targetSubject = normalize(subjectId);
    
    return curriculum.find(c => {
      const cSubject = normalize(c.subjectId);
      return (cSubject.includes(targetSubject) || targetSubject.includes(cSubject)) && c.grade === grade;
    }) || curriculum.find(c => c.grade === grade) || curriculum[0];
  }, [curriculum, subjectId, grade]);

  // Aplanar todos los temas con su ID de unidad para el selector
  const allTopics = useMemo(() => {
    if (!activeCurriculum) return [];
    return activeCurriculum.units.flatMap(u => 
      u.topics.map(t => ({ ...t, unitId: u.id }))
    );
  }, [activeCurriculum]);

  const selectedTopic = useMemo(() => {
    return allTopics.find(t => t.id === selectedTopicId) || allTopics.find(t => t.status === "active") || allTopics[0];
  }, [allTopics, selectedTopicId]);

  // Calcular progreso del periodo (Simulado: estamos a mitad del 2do periodo)
  const periodProgress = 65; 
  const curriculumProgress = useMemo(() => {
    if (allTopics.length === 0) return 0;
    const covered = allTopics.filter(t => t.status === "covered").length;
    return Math.round((covered / allTopics.length) * 100);
  }, [allTopics]);

  if (!activeCurriculum || allTopics.length === 0) {
    return (
      <section className="bg-white border border-outline-variant rounded-[2rem] p-8 text-center shadow-sm">
        <p className="text-sm text-on-surface-variant font-bold italic uppercase tracking-widest opacity-40">Sin currículo asignado</p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── CUMPLIMIENTO DEL PERIODO ── */}
      <section className="bg-white border border-outline-variant rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <Calendar size={20} />
             </div>
             <div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-900">Progreso del Periodo</h3>
                <p className="text-[9px] font-bold text-indigo-400 uppercase">Periodo Académico II</p>
             </div>
          </div>
          <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{periodProgress}%</span>
        </div>
        
        <div className="space-y-4">
           <div>
              <div className="flex justify-between text-[9px] font-black uppercase mb-1.5 px-1">
                 <span className="text-slate-400">Tiempo Transcurrido</span>
                 <span className="text-slate-600">{periodProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${periodProgress}%` }} />
              </div>
           </div>
           <div>
              <div className="flex justify-between text-[9px] font-black uppercase mb-1.5 px-1">
                 <span className="text-slate-400">Cumplimiento Malla</span>
                 <span className={`font-black ${curriculumProgress < periodProgress - 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {curriculumProgress}%
                 </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                 <div className={`h-full rounded-full ${curriculumProgress < periodProgress - 10 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${curriculumProgress}%` }} />
              </div>
           </div>
        </div>
        
        {curriculumProgress < periodProgress - 10 && (
          <div className="mt-4 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-3">
             <TrendingUp size={16} className="text-rose-500 rotate-180" />
             <p className="text-[9px] font-bold text-rose-700 uppercase leading-tight">Alerta: Vas un {periodProgress - curriculumProgress}% atrás del cronograma ideal.</p>
          </div>
        )}
      </section>

      {/* ── SELECTOR DE TEMA ── */}
      <section className="bg-white border border-outline-variant rounded-[2rem] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <h2 className="text-[12px] font-black text-on-surface uppercase tracking-widest">Tema de la Sesión</h2>
          </div>
          {selectedTopic?.status === "covered" && (
             <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200">Cubierto</span>
          )}
        </div>
        
        <div className="p-6 space-y-6">
          <div className="relative">
            <select 
              value={selectedTopic?.id}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
            >
              {allTopics.map(t => (
                <option key={t.id} value={t.id} className="font-bold">{t.id} - {t.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={20} />
          </div>

          {selectedTopic && (
            <div className="p-5 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-4">
                <Target size={14} className="text-primary" />
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Objetivos de Aprendizaje</h4>
              </div>
              <ul className="space-y-3">
                {selectedTopic.objectives?.map((obj, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-700 uppercase leading-tight">{obj}</span>
                  </li>
                )) || <li className="text-[10px] italic opacity-50 uppercase font-bold">No hay objetivos definidos</li>}
              </ul>
              
              <button 
                onClick={() => updateTopicStatus(activeCurriculum.id!, selectedTopic.unitId, selectedTopic.id, "covered")}
                className="w-full mt-6 py-3 bg-white border border-blue-200 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              >
                Marcar como Tema Cubierto
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

