"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Circle, Book, Loader2, Sparkles, FilePlus } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function TopicTree({ grade, subject }: { grade: string, subject: string }) {
  const { curriculum, updateTopicStatus } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Seleccionar el currículo activo basado en los filtros
  const activeCurriculum = useMemo(() => {
    return curriculum.find(c => c.grade === grade && c.subjectId === subject);
  }, [curriculum, grade, subject]);

  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    if (!activeCurriculum) {
      setLoadingProgress(0);
      const timer = setInterval(() => {
        setLoadingProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 200);
      return () => clearInterval(timer);
    }
  }, [activeCurriculum]);

  if (!activeCurriculum) {
    return (
      <div className="bg-white border border-outline-variant rounded-[2.5rem] p-16 text-center shadow-2xl space-y-6">
        <div className="relative w-24 h-24 mx-auto">
           <Book size={64} className="mx-auto text-primary/20 animate-pulse" />
           <Loader2 size={24} className="absolute bottom-0 right-0 text-primary animate-spin" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
           <h3 className="text-xl font-black uppercase tracking-tighter italic">Buscando Tejido Institucional</h3>
           <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Sincronizando con la base de datos de {grade} - {subject}</p>
        </div>
        
        <div className="max-w-xs mx-auto">
           <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500 ease-out" 
                style={{ width: `${loadingProgress}%` }}
              />
           </div>
        </div>

        {loadingProgress === 90 && (
          <div className="pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
             <div className="bg-amber-50 border border-amber-200 p-6 rounded-[2rem] inline-block">
                <div className="flex items-center gap-2 text-amber-700 mb-2 justify-center">
                   <Sparkles size={18} />
                   <span className="text-[10px] font-black uppercase tracking-widest">¿Tejido no encontrado?</span>
                </div>
                <p className="text-xs font-medium text-amber-900/70 mb-4">Usa el extractor de PDF arriba para cargar la malla de este grado.</p>
                <div className="flex gap-2 justify-center">
                   <div className="w-2 h-2 rounded-full bg-amber-300 animate-bounce" />
                   <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                   <div className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                </div>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
             <span className="font-bold text-lg">{activeCurriculum.grade[0] || 'C'}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Tejido de Aprendizaje - Grado {activeCurriculum.grade}</p>
            <h2 className="text-xl font-black text-on-surface uppercase italic tracking-tighter">{activeCurriculum.subjectId}</h2>
          </div>
        </div>
      </div>
      
      {activeCurriculum.objective && (
        <div className="mb-6 p-4 bg-surface-container border border-outline-variant rounded-xl">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Objetivo del Tejido</p>
          <p className="text-sm font-medium text-on-surface leading-relaxed">{activeCurriculum.objective}</p>
        </div>
      )}

      <div className="space-y-6">
        {activeCurriculum.units.sort((a, b) => a.order - b.order).map((unit) => (
          <div key={unit.id} className="space-y-3">
             <h3 className="text-xs font-black text-on-surface-variant uppercase tracking-[0.2em] px-2">{unit.title}</h3>
             <div className="space-y-3">
                {unit.topics.map((topic) => (
                  <div key={topic.id} className={`border rounded-xl overflow-hidden transition-all ${
                    topic.status === "active" ? "border-primary ring-1 ring-primary/10" : "border-outline-variant"
                  } ${topic.status === "not_started" ? "opacity-70" : ""}`}>
                    
                    <div 
                      onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
                      className={`px-5 py-4 flex items-center justify-between cursor-pointer transition-colors ${
                        topic.status === "covered" ? "bg-surface-container-low" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="cursor-pointer hover:scale-110 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus = topic.status === "covered" ? "active" : topic.status === "active" ? "not_started" : "covered";
                            updateTopicStatus(activeCurriculum.id!, unit.id, topic.id, nextStatus as any);
                          }}
                        >
                          {topic.status === "covered" ? (
                            <CheckCircle size={24} className="text-secondary fill-secondary/10" />
                          ) : (
                            <Circle size={24} className={topic.status === "active" ? "text-primary" : "text-outline"} />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">{topic.id} {topic.title}</h4>
                          <p className={`text-[10px] ${topic.status === "active" ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                            {topic.status === "covered" ? `Cubierto el ${topic.date || 'recientemente'}` : topic.date || 'Pendiente'}
                          </p>
                        </div>
                      </div>
                      {expandedId === topic.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {expandedId === topic.id && (
                      <div className="p-6 bg-surface-container-lowest border-t border-outline-variant grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Higra del Conocimiento & Hilos del Saber */}
                        <div className="space-y-4">
                           <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                              <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Tuh Putkamna</h5>
                              <p className="text-[9px] font-bold text-on-surface-variant uppercase opacity-70 mb-2">Higra del Conocimiento</p>
                              <p className="text-sm font-medium text-on-surface">{topic.tuhPutkamna || "No definido"}</p>
                           </div>
                           
                           <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-xl">
                              <h5 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Piankammu Mi</h5>
                              <p className="text-[9px] font-bold text-on-surface-variant uppercase opacity-70 mb-2">Núcleo Temático</p>
                              <p className="text-sm font-medium text-on-surface">{topic.title || "No definido"}</p>
                           </div>
                        </div>

                        {/* Saberes Propios e Interculturales */}
                        <div className="space-y-4">
                           <div className="p-4 bg-surface-container border border-outline-variant rounded-xl">
                              <h5 className="text-[10px] font-black text-on-surface uppercase tracking-widest mb-1">Pianaizpa Competencias Sabidurías</h5>
                              <div className="mt-3 space-y-3">
                                <div>
                                  <span className="text-[9px] font-bold text-on-surface-variant uppercase opacity-70 block mb-1">Pañapain Propias (Saberes Propios)</span>
                                  <p className="text-sm font-medium text-on-surface">{topic.panapain || "No definido"}</p>
                                </div>
                                <div className="h-px w-full bg-outline-variant/50"></div>
                                <div>
                                  <span className="text-[9px] font-bold text-on-surface-variant uppercase opacity-70 block mb-1">Ñanpaskas Piankamna (Saberes Interculturales)</span>
                                  <p className="text-sm font-medium text-on-surface">{topic.nanpaskas || "No definido"}</p>
                                </div>
                              </div>
                           </div>
                        </div>

                        {/* Metodología y Ayudas */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="p-4 bg-tertiary/5 border border-tertiary/20 rounded-xl">
                              <h5 className="text-[10px] font-black text-tertiary uppercase tracking-widest mb-1">Katkin Aizpa Saina</h5>
                              <p className="text-[9px] font-bold text-on-surface-variant uppercase opacity-70 mb-2">Ayudas Pedagógicas</p>
                              <p className="text-xs font-medium text-on-surface whitespace-pre-wrap">{topic.katkinAizpa || "No definido"}</p>
                           </div>
                           <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                              <h5 className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Sat Ishkit Kammtana</h5>
                              <p className="text-[9px] font-bold text-amber-700/70 uppercase mb-2">Tejiendo Aprendo (Metodología)</p>
                              <p className="text-xs font-medium text-amber-900 whitespace-pre-wrap">{topic.satIshkit || "No definido"}</p>
                           </div>
                        </div>
                        
                      </div>
                    )}
                  </div>
                ))}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
