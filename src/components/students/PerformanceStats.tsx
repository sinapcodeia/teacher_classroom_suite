"use client";
import { normalizeGrade } from "@/lib/constants";
import { TrendingUp, Users, AlertTriangle, Award, CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";

export type StudentPerfFilter = "ALL" | "RISK" | "SUPERIOR" | "PASSING";

interface PerformanceStatsProps {
  grado: string;
  curso: string;
  materia?: string;
  activeFilter?: StudentPerfFilter;
  onSelectFilter?: (filter: StudentPerfFilter) => void;
}

export default function PerformanceStats({
  grado,
  curso,
  materia = "TODAS",
  activeFilter = "ALL",
  onSelectFilter,
}: PerformanceStatsProps) {
  const { students, profile, masterData } = useApp();
  const activePeriod = masterData.activePeriod || "p2";

  const getSubjectAverage = (st: any, subject: string, periodId: string) => {
    const pid = periodId.toLowerCase();

    if (st.detailedGrades?.[subject]?.[pid]) {
      const d = st.detailedGrades[subject][pid];
      const getAvg = (vals: (number | null)[]) => {
        if (!vals) return null;
        const valid = vals.filter(v => typeof v === "number") as number[];
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      };
      const sbAvg = getAvg(d.sb);
      const sbhAvg = getAvg(d.sbh);
      const srAvg = getAvg(d.sr);
      const cvAvg = getAvg(d.cv);
      const aut = d.aut;

      if (sbAvg === null && sbhAvg === null && srAvg === null && cvAvg === null && aut === null) {
        return 0;
      }

      const final =
        (sbAvg ?? 0) * 0.3 +
        (sbhAvg ?? 0) * 0.4 +
        (srAvg ?? 0) * 0.2 +
        (cvAvg ?? 0) * 0.05 +
        (aut ?? 0) * 0.05;
      return parseFloat(final.toFixed(1));
    }

    if (st.grades) {
      const subjectGrades = st.grades.filter(
        (g: any) => g.periodId === pid && g.title?.toUpperCase().includes(`[${subject.toUpperCase()}]`)
      );
      if (subjectGrades.length === 0) return 0;

      const validScores = subjectGrades.filter((g: any) => g.type !== "participation").map((g: any) => g.score);
      const baseAvg =
        validScores.length > 0
          ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length
          : 0;
      const bonus = subjectGrades
        .filter((g: any) => g.type === "participation")
        .reduce((a: number, b: any) => a + b.score * 0.02, 0);
      return parseFloat(Math.min(5.0, baseAvg + bonus).toFixed(1));
    }

    return 0;
  };

  const myStudents = useMemo(() => {
    let list = students.filter(s => s.isActive !== false);

    if (
      !(
        profile.isSuperAdmin ||
        profile.role === "RECTOR" ||
        profile.role === "COORDINADOR" ||
        profile.role === "BIENESTAR"
      )
    ) {
      const effectiveCourses =
        (profile.teachingCourses?.length ?? 0) > 0
          ? profile.teachingCourses
          : [...new Set((profile.weeklySchedule || []).map(b => b.course))];
      list = list.filter(s => effectiveCourses.includes(s.curso));
    }

    if (grado !== "TODOS") {
      list = list.filter(s => normalizeGrade(s.grado) === grado);
    }
    if (curso !== "TODOS") {
      list = list.filter(s => s.curso === curso);
    }

    return list;
  }, [students, profile, grado, curso]);

  const studentGrades = useMemo(() => {
    return myStudents.map(s => {
      if (materia === "TODAS") {
        return s.avgGrade || 0;
      } else {
        return getSubjectAverage(s, materia, activePeriod);
      }
    });
  }, [myStudents, materia, activePeriod]);

  const avgGrade =
    studentGrades.length > 0
      ? studentGrades.reduce((acc, g) => acc + g, 0) / studentGrades.length
      : 0;

  const atRisk = studentGrades.filter(g => g > 0 && g < 3.0).length;
  const topPerform = studentGrades.filter(g => g >= 4.6).length;
  const passingCount = studentGrades.filter(g => g >= 3.0).length;

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

  const cards: {
    key: string;
    filterValue: StudentPerfFilter;
    label: string;
    value: string;
    sub: string;
    cta: string;
    icon: React.ReactNode;
    accent: string;
    iconBg: string;
    textColor: string;
    progress: number | null;
    progressColor: string;
    progressBg: string;
  }[] = [
    {
      key: "avg",
      filterValue: "PASSING",
      label: "Promedio Grupal",
      value: avgGrade.toFixed(1),
      sub: `/ 5.0 — ${avgGrade >= 4.6 ? "Superior" : avgGrade >= 4.0 ? "Alto" : avgGrade >= 3.0 ? "Básico" : "Bajo"} (${passingCount} aprueban)`,
      cta: activeFilter === "PASSING" ? "Mostrando Aprobados (≥ 3.0)" : "Toca para filtrar aprobados",
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
      filterValue: "ALL",
      label: "Estudiantes Activos",
      value: myStudents.length.toString(),
      sub: gradeGroups.slice(0, 3).map(([g, c]) => `${g}: ${c}`).join(" · ") || "Matrícula Activa",
      cta: activeFilter === "ALL" ? "Mostrando Todos los Activos" : "Toca para ver todos",
      icon: <Users size={28} />,
      accent: "from-slate-700 to-slate-600",
      iconBg: "bg-white/10",
      textColor: "text-white",
      progress: 100,
      progressColor: "bg-white/50",
      progressBg: "bg-white/15",
    },
    {
      key: "risk",
      filterValue: "RISK",
      label: "En Riesgo Académico",
      value: atRisk.toString(),
      sub: atRisk === 0 ? "¡Ninguno en riesgo!" : "Promedio inferior a 3.0",
      cta: activeFilter === "RISK" ? "Mostrando En Riesgo (< 3.0)" : "Toca para filtrar en riesgo",
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
      filterValue: "SUPERIOR",
      label: "Desempeño Superior",
      value: topPerform.toString(),
      sub: myStudents.length > 0 ? `${((topPerform / myStudents.length) * 100).toFixed(0)}% del total (≥ 4.6)` : "Sin datos",
      cta: activeFilter === "SUPERIOR" ? "Mostrando Nivel Superior" : "Toca para filtrar superiores",
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
      {cards.map(card => {
        const isSelected = activeFilter === card.filterValue;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => {
              if (!onSelectFilter) return;
              if (card.filterValue === "ALL") {
                onSelectFilter("ALL");
              } else {
                onSelectFilter(activeFilter === card.filterValue ? "ALL" : card.filterValue);
              }
            }}
            className={`text-left relative bg-gradient-to-br ${card.accent} rounded-3xl p-6 overflow-hidden shadow-xl group hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 cursor-pointer ${
              isSelected ? "ring-4 ring-slate-900/30 shadow-2xl scale-[1.01]" : ""
            }`}
          >
            {/* Background decoration */}
            <div className="absolute -top-4 -right-4 opacity-10 rotate-12 group-hover:rotate-6 transition-transform duration-500">
              <div className="w-24 h-24">{card.icon}</div>
            </div>

            <div className="relative z-10 flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className={`w-11 h-11 ${card.iconBg} rounded-2xl flex items-center justify-center ${card.textColor}`}>
                  {card.icon}
                </div>
                {isSelected && (
                  <span className="px-2.5 py-1 rounded-full bg-white text-slate-900 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={10} className="text-emerald-600" /> Activo
                  </span>
                )}
              </div>

              <p className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-80 ${card.textColor}`}>
                {card.label}
              </p>

              <p className={`text-4xl font-black leading-none ${card.textColor}`}>
                {card.value}
              </p>

              <p className={`text-[9px] font-bold opacity-75 ${card.textColor} truncate`}>
                {card.sub}
              </p>

              {card.progress !== null && (
                <div className={`h-1.5 ${card.progressBg} rounded-full overflow-hidden mt-0.5`}>
                  <div
                    className={`h-full ${card.progressColor} rounded-full transition-all duration-1000`}
                    style={{ width: `${Math.min(card.progress, 100)}%` }}
                  />
                </div>
              )}

              <p className={`text-[8.5px] font-black uppercase tracking-wider underline opacity-90 ${card.textColor}`}>
                {card.cta}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
