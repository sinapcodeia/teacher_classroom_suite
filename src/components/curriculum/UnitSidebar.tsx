"use client";

import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useMemo } from "react";
import { computeCurriculumCoverage } from "@/lib/tejidoTemplate";

export default function UnitSidebar({ grade, subject }: { grade: string; subject: string }) {
  const { curriculum } = useApp();

  const activeCurriculum = useMemo(() => {
    if (!curriculum.length || !grade || !subject) return null;
    const normStr = (s: string) =>
      s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
    const targetSubject = normStr(subject);
    const targetGradeNum = grade.replace(/[^\d]/g, "");

    const candidates = curriculum.filter(c => c.grade.replace(/[^\d]/g, "") === targetGradeNum);
    return (
      candidates.find(c => normStr(c.subjectId) === targetSubject) ||
      candidates.find(c => normStr(c.subjectId).startsWith(targetSubject)) ||
      candidates.find(c => targetSubject.startsWith(normStr(c.subjectId))) ||
      null
    );
  }, [curriculum, grade, subject]);

  const coverage = useMemo(() => computeCurriculumCoverage(activeCurriculum), [activeCurriculum]);

  const scrollToUnit = (unitId: string) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(`curriculum-unit-${unitId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-on-surface-variant px-2 uppercase tracking-widest">
        Periodos Académicos
      </p>
      <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden divide-y divide-outline-variant shadow-sm">
        {coverage.periods.map(period => {
          const isCompleted = period.percentage === 100 && period.totalEjes > 0;
          const isInProgress = period.percentage > 0 && period.percentage < 100;

          return (
            <button
              key={period.unitId}
              onClick={() => scrollToUnit(period.unitId)}
              className={`w-full text-left px-5 py-4 transition-colors flex flex-col gap-2 group ${
                isCompleted
                  ? "bg-emerald-50/40 border-l-4 border-emerald-500"
                  : isInProgress
                  ? "bg-surface-container-low border-l-4 border-primary"
                  : "hover:bg-surface-container-lowest border-l-4 border-transparent"
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${
                      isCompleted
                        ? "text-emerald-700"
                        : isInProgress
                        ? "text-primary"
                        : "text-on-surface-variant"
                    }`}
                  >
                    Periodo {period.order} · {period.completedEjes}/{period.totalEjes} temas
                  </span>
                  <h4 className="text-sm font-black text-on-surface mt-0.5">{period.title}</h4>
                </div>
                {isCompleted ? (
                  <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                ) : isInProgress ? (
                  <Clock size={18} className="text-primary animate-pulse shrink-0" />
                ) : (
                  <AlertCircle size={18} className="text-slate-300 shrink-0" />
                )}
              </div>

              {period.pendingEjesList.length > 0 && (
                <div className="text-[10px] text-slate-500 bg-white/80 rounded-lg px-2.5 py-1.5 border border-slate-200/70">
                  <span className="font-black text-amber-700 uppercase text-[9px] block">
                    Pendientes por dictar ({period.pendingEjesList.length}):
                  </span>
                  <span className="line-clamp-2 font-medium">
                    {period.pendingEjesList.map(x => x.eje).join(" · ")}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
