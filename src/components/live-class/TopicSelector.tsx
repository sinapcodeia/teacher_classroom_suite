"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { BookOpen, ChevronDown } from "lucide-react";

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
    return curriculum.find(c => 
      c.subjectId.toLowerCase().includes(subjectId.toLowerCase()) || 
      c.grade === grade
    ) || curriculum[0];
  }, [curriculum, subjectId, grade]);

  // Aplanar todos los temas de todas las unidades para el selector
  const allTopics = useMemo(() => {
    if (!activeCurriculum) return [];
    return activeCurriculum.units.flatMap(u => u.topics);
  }, [activeCurriculum]);

  const selectedTopic = useMemo(() => {
    return allTopics.find(t => t.id === selectedTopicId) || allTopics[0];
  }, [allTopics, selectedTopicId]);

  if (!activeCurriculum || allTopics.length === 0) {
    return (
      <section className="bg-white border border-outline-variant rounded-xl p-8 text-center">
        <p className="text-sm text-on-surface-variant italic">No hay currículo disponible para esta clase.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="text-primary" size={20} />
          <h2 className="text-lg font-bold text-on-surface">Tema de Hoy</h2>
        </div>
        {selectedTopic?.status === "covered" && (
           <span className="bg-secondary/10 text-secondary text-[9px] font-black uppercase px-2 py-1 rounded-full border border-secondary/20">Ya cubierto</span>
        )}
      </div>
      <div className="p-4 space-y-4">
        <div className="relative">
          <select 
            value={selectedTopicId || allTopics[0]?.id}
            onChange={(e) => setSelectedTopicId(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer uppercase"
          >
            {allTopics.map(t => (
              <option key={t.id} value={t.id}>{t.id} - {t.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline" size={20} />
        </div>

        {selectedTopic && (
          <div className="p-4 bg-primary-container/10 rounded-xl border border-primary-container/20 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-xs font-black text-primary mb-3 uppercase tracking-widest">Objetivos de Aprendizaje</h4>
            <ul className="text-sm text-on-surface-variant space-y-3">
              {selectedTopic.objectives?.map((obj, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                  <span className="font-medium">{obj}</span>
                </li>
              )) || <li className="italic opacity-50">No hay objetivos definidos</li>}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
