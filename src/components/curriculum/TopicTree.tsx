"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, PlusCircle, Circle, MoreVertical } from "lucide-react";

const TOPICS = [
  {
    id: "3.1",
    title: "Definiendo la Derivada",
    date: "Sept 12, 2023",
    classes: 2,
    status: "covered",
    subtopics: []
  },
  {
    id: "3.2",
    title: "Reglas de Derivación",
    date: "Mañana, 10:00 AM",
    status: "active",
    subtopics: [
      { title: "Regla de la Potencia y Constante", status: "completed" },
      { title: "Reglas del Producto y Cociente", status: "next" },
      { title: "Fundamentos de la Regla de la Cadena", status: "pending" }
    ]
  },
  {
    id: "3.3",
    title: "Derivación Implícita",
    date: "Oct 2 - Oct 6",
    status: "not_started",
    subtopics: []
  }
];

export default function TopicTree() {
  const [expandedId, setExpandedId] = useState<string | null>("3.2");

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
             <span className="font-bold text-lg">f(x)</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Unidad Activa</p>
            <h2 className="text-xl font-bold text-on-surface">Unidad 3: Derivadas</h2>
          </div>
        </div>
        <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
          <MoreVertical size={20} className="text-on-surface-variant" />
        </button>
      </div>

      <div className="space-y-4">
        {TOPICS.map((topic) => (
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
                {topic.status === "covered" ? (
                  <CheckCircle size={20} className="text-secondary fill-secondary/10" />
                ) : (
                  <Circle size={20} className={topic.status === "active" ? "text-primary" : "text-outline"} />
                )}
                <div>
                  <h4 className="text-sm font-bold text-on-surface">{topic.id} {topic.title}</h4>
                  <p className={`text-[10px] ${topic.status === "active" ? "text-primary font-bold" : "text-on-surface-variant"}`}>
                    {topic.status === "covered" ? `Cubierto el ${topic.date}` : topic.date}
                  </p>
                </div>
              </div>
              {expandedId === topic.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedId === topic.id && topic.subtopics.length > 0 && (
              <div className="p-5 space-y-4 bg-surface-container-lowest border-t border-outline-variant">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Subtemas</p>
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
                      <span className={`text-[10px] font-bold py-1 px-2 rounded uppercase ${
                        sub.status === "completed" ? "bg-secondary-container text-on-secondary-container" :
                        sub.status === "next" ? "bg-primary-container text-white" : "bg-surface-container text-on-surface-variant"
                      }`}>
                        {sub.status === "completed" ? "Completado" : sub.status === "next" ? "Siguiente" : "Pendiente"}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="w-full py-2 border-2 border-dashed border-outline-variant rounded-xl text-xs font-bold text-on-surface-variant hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                  <PlusCircle size={16} />
                  Añadir Subtema
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
