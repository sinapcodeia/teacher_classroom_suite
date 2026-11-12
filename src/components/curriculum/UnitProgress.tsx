"use client";

import { useApp } from "@/context/AppContext";
import { useMemo } from "react";
import { computeCurriculumCoverage } from "@/lib/tejidoTemplate";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function UnitProgress({ grade, subject }: { grade: string; subject: string }) {
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

  if (!activeCurriculum) return null;

  return (
    <div className="bg-white border border-outline-variant rounded-2xl p-6 shadow-sm space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-black text-on-surface uppercase tracking-tight">
            Cumplimiento de la Higra
          </h3>
          <span
            className={`text-[10px] font-black py-1 px-2.5 uppercase rounded-full ${
              coverage.overallPercentage === 100
                ? "text-emerald-700 bg-emerald-100"
                : "text-secondary bg-secondary-container"
            }`}
          >
            {coverage.overallPercentage === 100 ? "100% Cumplido" : "En Progreso"}
          </span>
        </div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          Seguimiento de todos los temas por periodo
        </p>
      </div>

      <div>
        <div className="flex mb-1.5 items-center justify-between text-xs font-black">
          <span className="text-on-surface-variant uppercase text-[10px] tracking-widest">
            Avance Total Anual
          </span>
          <span className="text-secondary text-sm">{coverage.overallPercentage}%</span>
        </div>
        <div className="overflow-hidden h-2.5 text-xs flex rounded-full bg-surface-container">
          <div
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-secondary transition-all duration-700"
            style={{ width: `${coverage.overallPercentage}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-outline-variant">
        <div>
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
            Higras Cubiertas
          </p>
          <p className="text-2xl font-black text-on-surface">
            {coverage.coveredHigras}/{coverage.totalHigras}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
            Temas de la Higra
          </p>
          <p className="text-2xl font-black text-primary">
            {coverage.completedEjes}/{coverage.totalEjes}
          </p>
        </div>
      </div>

      {/* Desglose por cada periodo para verificar cumplimiento a cabalidad */}
      <div className="pt-3 border-t border-outline-variant space-y-2.5">
        <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
          Verificación por Periodo Académico
        </p>
        {coverage.periods.map(p => (
          <div key={p.unitId} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-on-surface uppercase">
                P{p.order} · {p.title.replace(/^(MAZA|PAS|KUTÑA)\s+T\+T\s*[–-]\s*/i, "")}
              </span>
              <span
                className={`text-[10px] font-black flex items-center gap-1 ${
                  p.percentage === 100
                    ? "text-emerald-600"
                    : p.percentage > 0
                    ? "text-amber-600"
                    : "text-slate-400"
                }`}
              >
                {p.percentage === 100 ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                {p.completedEjes}/{p.totalEjes} temas ({p.percentage}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  p.percentage === 100
                    ? "bg-emerald-500"
                    : p.percentage > 0
                    ? "bg-amber-500"
                    : "bg-slate-300"
                }`}
                style={{ width: `${p.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
