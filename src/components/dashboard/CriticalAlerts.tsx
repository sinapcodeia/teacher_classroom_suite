"use client";

import { useApp, normalizeGrade } from "@/context/AppContext";
import { AlertTriangle, ChevronRight, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function CriticalAlerts() {
  const { students, profile } = useApp();

  const criticalGroups = useMemo(() => {
    // Agrupar estudiantes por curso
    const groups: Record<string, { total: number, sum: number, grade: string }> = {};
    
    students.forEach(s => {
      if (!s.isActive) return;
      const key = s.curso;
      if (!groups[key]) groups[key] = { total: 0, sum: 0, grade: s.grado };
      groups[key].total++;
      groups[key].sum += (s.avgGrade || 0);
    });

    return Object.entries(groups)
      .map(([curso, data]) => ({
        curso,
        grade: data.grade,
        avg: data.sum / data.total
      }))
      .filter(g => g.avg > 0 && g.avg < 3.2) // Umbral crítico 3.2 para alerta temprana
      .sort((a, b) => a.avg - b.avg);
  }, [students]);

  // Solo para directivos
  const isManagement = profile.role === "RECTOR" || profile.role === "COORDINADOR";
  if (!isManagement || criticalGroups.length === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      {criticalGroups.map(group => (
        <div 
          key={group.curso}
          className="bg-red-50 border-2 border-red-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-left-4 duration-500"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-red-200 shrink-0">
              <TrendingDown size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Alerta de Rendimiento Crítico</span>
                <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded-full animate-pulse">URGENTE</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                GRADO {normalizeGrade(group.grade)} — CURSO {group.curso}
              </h3>
              <p className="text-xs font-bold text-slate-500 mt-0.5">
                El promedio grupal ha caído a <span className="text-red-600 font-black">{group.avg.toFixed(1)}</span>. Se requiere intervención pedagógica.
              </p>
            </div>
          </div>

          <Link 
            href={`/reportes/calificaciones?grado=${normalizeGrade(group.grade)}&curso=${group.curso}`}
            className="px-8 py-4 bg-white text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 group"
          >
            Analizar Sabana
            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      ))}
    </div>
  );
}
