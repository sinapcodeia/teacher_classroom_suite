"use client";

import { TrendingUp, Users, Award } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function PerformanceStats() {
  const { students } = useApp();
  
  const activeStudents = students.filter(s => s.isActive !== false);
  const avgGrade = activeStudents.length > 0 
    ? (activeStudents.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / activeStudents.length).toFixed(1)
    : "0.0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-primary text-white rounded-3xl p-8 flex items-center justify-between shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Users size={80} /></div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Promedio Grupal</p>
          <h3 className="text-4xl font-black">{avgGrade} <span className="text-xs opacity-40">/ 5.0</span></h3>
        </div>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center relative z-10">
          <TrendingUp size={32} />
        </div>
      </div>
      
      <div className="bg-white border border-outline-variant rounded-3xl p-8 flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><Award size={80} /></div>
        <div className="space-y-1 relative z-10">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Estudiantes Activos</p>
          <h3 className="text-4xl font-black text-on-surface">{activeStudents.length}</h3>
        </div>
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center relative z-10">
          <Users size={32} />
        </div>
      </div>
    </div>
  );
}
