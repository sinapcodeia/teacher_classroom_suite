"use client";

import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";

const TOPICS = [
  { 
    id: "3.4", 
    title: "Integración por Partes",
    objectives: ["Identificar componentes u y dv", "Resolver integrales lineales de segundo orden", "Aplicar fórmula a problemas de física"]
  },
  { 
    id: "3.5", 
    title: "Fracciones Parciales",
    objectives: ["Descomponer expresiones racionales", "Resolver constantes por sustitución", "Integrar términos logarítmicos"]
  }
];

interface TopicSelectorProps {
  subjectId?: string;
}

export default function TopicSelector({ subjectId }: TopicSelectorProps) {
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);

  return (
    <section className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex items-center gap-2">
        <BookOpen className="text-primary" size={20} />
        <h2 className="text-lg font-bold text-on-surface">Tema de Hoy</h2>
      </div>
      <div className="p-4 space-y-4">
        <div className="relative">
          <select 
            value={selectedTopic.id}
            onChange={(e) => setSelectedTopic(TOPICS.find(t => t.id === e.target.value) || TOPICS[0])}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
          >
            {TOPICS.map(t => (
              <option key={t.id} value={t.id}>{t.id} {t.title}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline" size={20} />
        </div>

        <div className="p-4 bg-primary-container/10 rounded-xl border border-primary-container/20">
          <h4 className="text-xs font-bold text-primary mb-2 uppercase tracking-wider">Objetivos de Aprendizaje</h4>
          <ul className="text-sm text-on-surface-variant space-y-2 list-disc pl-4">
            {selectedTopic.objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
