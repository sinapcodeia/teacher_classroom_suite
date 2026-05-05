"use client";

import { useState, useMemo } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Circle, Book } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function TopicTree() {
  const { curriculum, updateTopicStatus } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Seleccionar el currículo activo basado en el perfil o el primero disponible
  const activeCurriculum = useMemo(() => {
    return curriculum[0]; // Por ahora, simplificamos al primero.
  }, [curriculum]);

  if (!activeCurriculum) {
    return (
      <div className="bg-white border border-outline-variant rounded-xl p-12 text-center shadow-sm">
        <Book size={48} className="mx-auto text-outline-variant mb-4 opacity-20" />
        <p className="text-on-surface-variant font-bold text-sm italic uppercase tracking-widest">Cargando currículo institucional...</p>
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
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Plan de Aula - {activeCurriculum.grade}</p>
            <h2 className="text-xl font-bold text-on-surface">Materia: {activeCurriculum.subjectId}</h2>
          </div>
        </div>
      </div>

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

                    {expandedId === topic.id && topic.subtopics && topic.subtopics.length > 0 && (
                      <div className="p-5 space-y-4 bg-surface-container-lowest border-t border-outline-variant">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Subtemas Detallados</p>
                        <div className="space-y-2">
                          {topic.subtopics.map((sub, i) => (
                            <div key={i} className={`flex items-center justify-between p-3 bg-white border border-outline-variant rounded-lg ${
                              sub.status === "next" ? "border-l-4 border-l-primary" : ""
                            }`}>
                              <div className="flex items-center gap-3">
                                {sub.status === "completed" ? (
                                  <CheckCircle size={16} className="text-secondary" />
                                ) : (
                                  <Circle size={16} className={sub.status === "next" ? "text-primary" : "text-outline"} />
                                )}
                                <span className="text-sm font-medium text-on-surface">{sub.title}</span>
                              </div>
                            </div>
                          ))}
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
