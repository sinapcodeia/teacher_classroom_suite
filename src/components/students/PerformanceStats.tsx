"use client";

import { TrendingUp, Users, AlertTriangle, Award } from "lucide-react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { useMemo } from "react";

interface PerformanceStatsProps {
  grado: string;
  curso: string;
}

export default function PerformanceStats({ grado, curso }: PerformanceStatsProps) {
  const { students, profile } = useApp();

  // ── Governance + Dynamic Filters ─────────────────────────────
  const myStudents = useMemo(() => {
    // 1. Base Governance (Docente vs Admin)
    let list = students.filter(s => s.isActive !== false);
    
    if (!(profile.isSuperAdmin || profile.role === "RECTOR" || profile.role === "COORDINADOR" || profile.role === "BIENESTAR")) {
      const effectiveCourses =
        (profile.teachingCourses?.length ?? 0) > 0
          ? profile.teachingCourses
          : [...new Set((profile.weeklySchedule || []).map(b => b.course))];
      list = list.filter(s => effectiveCourses.includes(s.curso));
    }

    // 2. Apply Dynamic Filters from UI
    if (grado !== "TODOS") {
      list = list.filter(s => normalizeGrade(s.grado) === grado);
    }
    if (curso !== "TODOS") {
      list = list.filter(s => s.curso === curso);
    }

    return list;
  }, [students, profile, grado, curso]);

  const avgGrade =
    myStudents.length > 0
      ? (myStudents.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / myStudents.length)
      : 0;

  const atRisk      = myStudents.filter(s => (s.avgGrade || 0) < 3.0).length;
  const topPerform  = myStudents.filter(s => (s.avgGrade || 0) >= 4.6).length;

  // Distribución por grados para tooltip / subtexto
  const gradeGroups = useMemo(() => {
    const map: Record<string, number> = {};
    myStudents.forEach(s => {
      const g = normalizeGrade(s.grado);
      map[g] = (map[g] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [myStudents]);

  const avgPct = (avgGrade / 5) * 100;

  if (students.length === 0) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[210px] bg-surface-container-low rounded-3xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: "avg",
      label: "Promedio Grupal",
      value: avgGrade.toFixed(1),
      sub: `/ 5.0 — ${avgGrade >= 4.6 ? "Superior" : avgGrade >= 4.0 ? "Alto" : avgGrade >= 3.0 ? "Básico" : "Bajo"}`,
      icon: <TrendingUp size={28} />,
      accent: "from-primary to-primary/80",
      iconBg: "bg-white/20",
      textColor: "text-white",
      progress: avgPct,
      progressColor: "bg-white/60",
      progressBg: "bg-white/20",
    },
    {
      key: "total",
      label: "Estudiantes Activos",
      value: myStudents.length.toString(),
      sub: gradeGroups.slice(0, 3).map(([g, c]) => `${g}: ${c}`).join(" · "),
      icon: <Users size={28} />,
      accent: "from-slate-700 to-slate-600",
      iconBg: "bg-white/10",
      textColor: "text-white",
      progress: null,
      progressColor: "",
      progressBg: "",
    },
    {
      key: "risk",
      label: "En Riesgo Académico",
      value: atRisk.toString(),
      sub: atRisk === 0 ? "¡Ninguno en riesgo!" : `Promedio inferior a 3.0`,
      icon: <AlertTriangle size={28} />,
      accent: atRisk > 0 ? "from-red-600 to-rose-500" : "from-emerald-600 to-green-500",
      iconBg: "bg-white/20",
      textColor: "text-white",
      progress: myStudents.length > 0 ? (atRisk / myStudents.length) * 100 : 0,
      progressColor: "bg-white/60",
      progressBg: "bg-white/20",
    },
    {
      key: "top",
      label: "Desempeño Superior",
      value: topPerform.toString(),
      sub: myStudents.length > 0 ? `${((topPerform / myStudents.length) * 100).toFixed(0)}% del total` : "Sin datos",
      icon: <Award size={28} />,
      accent: "from-secondary to-secondary/80",
      iconBg: "bg-white/20",
      textColor: "text-white",
      progress: myStudents.length > 0 ? (topPerform / myStudents.length) * 100 : 0,
      progressColor: "bg-white/60",
      progressBg: "bg-white/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(card => (
        <div
          key={card.key}
          className={`relative bg-gradient-to-br ${card.accent} rounded-3xl p-6 overflow-hidden shadow-xl group hover:scale-[1.02] transition-transform duration-300`}
        >
          {/* Background decoration */}
          <div className="absolute -top-4 -right-4 opacity-10 rotate-12 group-hover:rotate-6 transition-transform duration-500">
            <div className="w-24 h-24">{card.icon}</div>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            {/* Icon */}
            <div className={`w-11 h-11 ${card.iconBg} rounded-2xl flex items-center justify-center ${card.textColor}`}>
              {card.icon}
            </div>

            {/* Label */}
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-70 ${card.textColor}`}>
              {card.label}
            </p>

            {/* Value */}
            <p className={`text-4xl font-black leading-none ${card.textColor}`}>
              {card.value}
            </p>

            {/* Subtexto */}
            <p className={`text-[9px] font-bold opacity-60 ${card.textColor} truncate`}>
              {card.sub}
            </p>

            {/* Progress bar */}
            {card.progress !== null && (
              <div className={`h-1.5 ${card.progressBg} rounded-full overflow-hidden mt-1`}>
                <div
                  className={`h-full ${card.progressColor} rounded-full transition-all duration-1000`}
                  style={{ width: `${Math.min(card.progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
