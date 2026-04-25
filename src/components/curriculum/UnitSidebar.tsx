"use client";

import { CheckCircle, Lock } from "lucide-react";

const UNITS = [
  { id: 1, title: "Fundamentos de Cálculo", status: "completed" },
  { id: 2, title: "Límites y Continuidad", status: "completed" },
  { id: 3, title: "Derivadas", status: "active" },
  { id: 4, title: "Integrales", status: "locked" },
];

export default function UnitSidebar() {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-on-surface-variant px-2 uppercase tracking-widest">Unidades</p>
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden divide-y divide-outline-variant shadow-sm">
        {UNITS.map((unit) => (
          <button 
            key={unit.id}
            className={`w-full text-left px-5 py-4 transition-colors flex justify-between items-center group ${
              unit.status === "active" ? "bg-surface-container-low border-l-4 border-primary" : "hover:bg-surface-container-lowest"
            } ${unit.status === "locked" ? "opacity-60" : ""}`}
          >
            <div>
              <span className={`text-[10px] font-bold uppercase ${unit.status === "active" ? "text-primary" : "text-on-surface-variant"}`}>
                Unidad {unit.id}
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
