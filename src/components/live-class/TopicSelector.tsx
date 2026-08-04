"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { BookOpen, ChevronDown, Target, TrendingUp, Calendar, Sparkles, ArrowRight, BrainCircuit, Lightbulb } from "lucide-react";

interface TopicSelectorProps {
  subjectId?: string; // e.g. "Matemáticas"
  grade?: string;     // e.g. "11°"
}

export default function TopicSelector({ subjectId, grade }: TopicSelectorProps) {
  const { curriculum, updateTopicStatus } = useApp();
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");

  const activeCurriculum = useMemo(() => {
    if (!curriculum.length || !subjectId) return null;
    
    const normStr = (s: string) => s
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    
    const targetSubject = normStr(subjectId);
    const gradeNum = (grade || "").replace(/[^\d]/g, "");
    
    const candidates = curriculum.filter(c => {
      const cGradeNum = c.grade.replace(/[^\d]/g, "");
      return gradeNum && cGradeNum === gradeNum;
    });

    if (candidates.length === 0) return null;

    // Prioridad 1: Coincidencia exacta normalizada
    const exactMatch = candidates.find(c => normStr(c.subjectId) === targetSubject);
    if (exactMatch) return exactMatch;

    // Prioridad 2: El currículo guardado EMPIEZA con el nombre de la materia buscada
    // (ej: busco "tecnologia", el currículo dice "tecnologiaeinformatica" → válido)
    const startsWithMatch = candidates.find(c => normStr(c.subjectId).startsWith(targetSubject));
    if (startsWithMatch) return startsWithMatch;

    // Prioridad 3: La materia buscada EMPIEZA con el nombre del currículo
    // (ej: currículo dice "tecnologia", yo busco "tecnologia e informatica" → válido)
    const reverseStartsWithMatch = candidates.find(c => targetSubject.startsWith(normStr(c.subjectId)));
    if (reverseStartsWithMatch) return reverseStartsWithMatch;

    // Sin coincidencia: no mezclar con otras materias
    return null;
  }, [curriculum, subjectId, grade]);

  // Aplanar todos los temas con su ID de unidad para el selector
  const allTopics = useMemo(() => {
    if (!activeCurriculum) return [];
    return activeCurriculum.units.flatMap(u => 
      u.topics.map(t => ({ ...t, unitId: u.id }))
    );
  }, [activeCurriculum]);

  const selectedTopic = useMemo(() => {
    // Si hay uno seleccionado por el usuario, ese manda
    if (selectedTopicId) return allTopics.find(t => t.id === selectedTopicId);
    
    // Si no, buscar el primero que NO esté cubierto (Pendiente o Activo)
    const nextPending = allTopics.find(t => t.status !== "covered");
    return nextPending || allTopics[0];
  }, [allTopics, selectedTopicId]);

  const isCurrentTopicCovered = selectedTopic?.status === "covered";
  
  const nextSuggestedTopic = useMemo(() => {
    if (!isCurrentTopicCovered) return null;
    const currentIndex = allTopics.findIndex(t => t.id === selectedTopic?.id);
    return allTopics[currentIndex + 1] || null;
  }, [allTopics, selectedTopic, isCurrentTopicCovered]);

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
            <div className="space-y-4">
              {/* Card Pedagógica IA */}
              <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                 <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                    <BrainCircuit size={120} />
                 </div>
                 <div className="relative z-10">
                   <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Recomendación Pedagógica</span>
                   </div>
                   <h5 className="text-sm font-black uppercase italic mb-3 leading-tight pr-8">
                     {isCurrentTopicCovered ? "Siguiente Hilo del Saber" : "Enfoque de Hoy: Higra del Conocimiento"}
                   </h5>
                   <p className="text-[11px] font-bold opacity-90 leading-relaxed mb-6 uppercase">
                     {isCurrentTopicCovered 
                       ? `Ya cubriste "${selectedTopic.title}". ¿Iniciamos con "${nextSuggestedTopic?.title || 'Fin del Currículo'}"?`
                       : selectedTopic.tuhPutkamna || "Inicia el desarrollo del núcleo temático con actividades prácticas."}
                   </p>
                   
                   {isCurrentTopicCovered && nextSuggestedTopic ? (
                     <button 
                       onClick={() => setSelectedTopicId(nextSuggestedTopic.id)}
                       className="w-full py-4 bg-white text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-300 hover:text-black transition-all"
                     >
                       Cargar Siguiente Tema <ArrowRight size={16} />
                     </button>
                   ) : (
                     <div className="flex gap-2 flex-wrap">
                        <div className="px-3 py-1.5 bg-white/10 rounded-full flex items-center gap-2">
                           <Lightbulb size={12} className="text-yellow-300" />
                           <span className="text-[8px] font-black uppercase tracking-tighter">Saberes Propios: {selectedTopic.panapain?.substring(0, 30)}...</span>
                        </div>
                        {selectedTopic.hijosSaber && (
                           <div className="px-3 py-1.5 bg-yellow-300/20 rounded-full flex items-center gap-2 border border-yellow-300/30">
                              <Sparkles size={12} className="text-yellow-300" />
                              <span className="text-[8px] font-black uppercase tracking-tighter text-yellow-100">Incluye Hijos del Saber</span>
                           </div>
                        )}
                     </div>
                   )}
                 </div>
              </div>

              {/* Detalle del Tema */}
              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={14} className="text-primary" />
                  <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Objetivos Específicos</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[8px] font-black text-primary uppercase block mb-1">Pianaizpa Competencias Sabidurías</span>
                    <p className="text-[11px] font-bold text-slate-700 uppercase leading-relaxed italic pr-4">
                      {selectedTopic.panapain || "No definido"} | {selectedTopic.nanpaskas || "No definido"}
                    </p>
                  </div>
                  
                  <div className="h-px bg-slate-200" />
                  
                  <div>
                    <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1">Tejiendo Aprendo (Metodología)</span>
                    <p className="text-[10px] font-bold text-slate-600 uppercase leading-relaxed">
                      {selectedTopic.satIshkit || "No definido"}
                    </p>
                  </div>
                </div>
                
                {!isCurrentTopicCovered && (
                  <button 
                    onClick={() => updateTopicStatus(activeCurriculum.id!, selectedTopic.unitId, selectedTopic.id, "covered")}
                    className="w-full mt-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                  >
                    Marcar como Tema Cubierto
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
