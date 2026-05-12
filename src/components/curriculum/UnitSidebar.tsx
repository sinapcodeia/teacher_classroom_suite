"use client";

import { CheckCircle, Lock } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export default function UnitSidebar({ grade, subject }: { grade: string, subject: string }) {
  const { curriculum } = useApp();
  
  const activeCurriculum = useMemo(() => 
    curriculum.find(c => c.grade === grade && c.subjectId === subject), 
  [curriculum, grade, subject]);

  const units = activeCurriculum?.units || [
    { id: "1", title: "Primer Periodo", status: "active" },
    { id: "2", title: "Segundo Periodo", status: "locked" },
    { id: "3", title: "Tercer Periodo", status: "locked" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-on-surface-variant px-2 uppercase tracking-widest">Periodos Académicos</p>
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant shadow-sm">
        {units.map((unit: any) => (
          <button 
            key={unit.id}
            className={`w-full text-left px-5 py-4 transition-colors flex justify-between items-center group ${
              unit.status === "active" || unit.status === undefined ? "bg-surface-container-low border-l-4 border-primary" : "hover:bg-surface-container-lowest"
            }`}
          >
            <div>
              <span className={`text-[10px] font-bold uppercase ${unit.status === "active" ? "text-primary" : "text-on-surface-variant"}`}>
                Periodo {unit.id || unit.order}
              </span>
              <h4 className="text-sm font-bold text-on-surface">{unit.title}</h4>
            </div>
            {unit.status === "completed" && <CheckCircle size={18} className="text-secondary fill-secondary/20" />}
            {unit.status === "active" && <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />}
            {unit.status === "locked" && <Lock size={18} className="text-outline-variant" />}
          </button>
        ))}
      </div>
    </div>
  );
}
