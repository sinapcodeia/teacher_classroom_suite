"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { calculateGroupRankings, calculateStudentYearBreakdown, formatRank, normalizePeriodId, PASSING_GRADE, TOTAL_ACADEMIC_PERIODS, type RankingScope } from "@/lib/gradeUtils";
import { 
  Trophy, AlertTriangle, CheckCircle2, TrendingUp, 
  Search, ChevronDown, ChevronUp, UserCheck, UserX, Award,
  HelpCircle, Info, Sparkles, Clock, Target, FileText, Printer, Eye
} from "lucide-react";
import { normalizeGrade } from "@/lib/constants";
import RecoveryPlanModal from "@/components/live-class/RecoveryPlanModal";
import StudentProfileModal from "@/components/shared/StudentProfileModal";

interface AcademicAccumulatedWidgetProps {
  gradoFilter: string;
  cursoFilter: string;
  subjectFilter?: string;
}

export default function AcademicAccumulatedWidget({ gradoFilter, cursoFilter, subjectFilter }: AcademicAccumulatedWidgetProps) {
  const { myStudents, masterData } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PASSING" | "FAILING">("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | RankingScope>("asc");
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedRecoveryStudent, setSelectedRecoveryStudent] = useState<any>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any>(null);

  const activePeriod = masterData.activePeriod || "p2";
  const activeSubject = (subjectFilter && subjectFilter !== "TODOS") ? subjectFilter : ((masterData.subjects?.[0] as any)?.name || masterData.subjects?.[0] || "TECNOLOGÍA");

  // Procesar notas por período (P1, P2, P3), puestos y proyecciones con el MOTOR OFICIAL SIEEE
  const subjectForCalc = (subjectFilter && subjectFilter !== "TODOS") ? activeSubject : undefined;
  const studentSummaries = useMemo(() => {
    const groupStudents = myStudents.filter(s => {
      if (s.isActive === false) return false;
      const matchGrado = gradoFilter === "TODOS" || normalizeGrade(s.grado) === normalizeGrade(gradoFilter);
      const matchCurso = cursoFilter === "TODOS" || s.curso === cursoFilter;
      return matchGrado && matchCurso;
    });

    // Puestos dentro de cada salón (grado + curso)
    const rankings = calculateGroupRankings(groupStudents, { activePeriod, subject: subjectForCalc, groupBy: "course" });

    return groupStudents.map(student => {
      const entry = rankings.entries.get(student.id)!;
      const { breakdown } = entry;
      const periodNotes: Record<string, number | null> = { ...breakdown.periods };

      const completedCount = breakdown.evaluatedPeriods.length;
      const totalPeriodsYear = TOTAL_ACADEMIC_PERIODS;
      const sumCompleted = breakdown.pointsAccumulated;
      const currentOverallAvg = breakdown.accumulatedAvg ?? 0;

      const targetTotalYear = totalPeriodsYear * PASSING_GRADE; // 9.0 puntos acumulados necesarios en 3 períodos
      const pointsNeededRemaining = targetTotalYear - sumCompleted;
      const remainingPeriodsCount = totalPeriodsYear - completedCount;

      let minScoreNeededInNext = 0;
      let guidanceStatus: "safe" | "warning" | "danger" | "passed" | "pending_start" = "safe";
      let guidanceText = "";

      // Evaluar materia por materia su acumulado de los períodos evaluados (ej: Física (P1+P2+P3)/3 >= 3.0 gana Física independiente de Tecnología)
      const activePId = normalizePeriodId(activePeriod) || "p3";
      const subjsToCheck = subjectForCalc
        ? [subjectForCalc]
        : Object.keys(student.detailedGrades || {});
      const failingAnnualSubjs = subjsToCheck
        .map(subj => {
          const subBd = calculateStudentYearBreakdown(student, activePId, {
            subject: subj,
            includeBonus: false,
            evaluatedPeriods: breakdown.evaluatedPeriods
          });
          return { subj, score: subBd.accumulatedAvg };
        })
        .filter((x): x is { subj: string; score: number } => x.score !== null && x.score < PASSING_GRADE);

      if (breakdown.accumulatedAvg === null) {
        guidanceStatus = "pending_start";
        guidanceText = "Sin notas registradas";
      } else if (remainingPeriodsCount <= 0) {
        if (currentOverallAvg >= PASSING_GRADE) {
          if (failingAnnualSubjs.length > 0) {
            guidanceStatus = "warning";
            guidanceText = `Pierde Def. Anual (P1-P3): ${failingAnnualSubjs.map(f => `${f.subj} (${f.score.toFixed(2)})`).join(", ")}`;
          } else {
            guidanceStatus = "passed";
            guidanceText = "¡Año Aprobado!";
          }
        } else {
          guidanceStatus = "danger";
          guidanceText = failingAnnualSubjs.length > 0
            ? `Reprobado (${failingAnnualSubjs.map(f => `${f.subj} ${f.score.toFixed(2)}`).join(", ")})`
            : "Año Reprobado (Requiere Recuperación)";
        }
      } else {
        minScoreNeededInNext = Number((pointsNeededRemaining / remainingPeriodsCount).toFixed(2));
        const nextP = completedCount + 1;

        if (minScoreNeededInNext <= 1.0) {
          guidanceStatus = "safe";
          guidanceText = `✅ Año Asegurado (Incluso con 1.0 en P${nextP} aprueba)`;
        } else if (minScoreNeededInNext <= 3.0) {
          guidanceStatus = "safe";
          guidanceText = `✓ Necesita mín. ${minScoreNeededInNext.toFixed(1)} en P${nextP} para ganar el año`;
        } else if (minScoreNeededInNext <= 5.0) {
          guidanceStatus = "warning";
          guidanceText = `⚠️ Alerta: Necesita sacar al menos ${minScoreNeededInNext.toFixed(1)} en P${nextP} para alcanzar 3.0`;
        } else {
          guidanceStatus = "danger";
          guidanceText = `🚨 Riesgo Crítico: Requisito mayor a 5.0 (${minScoreNeededInNext.toFixed(1)}). Necesita nivelación obligatoria`;
        }
        if (failingAnnualSubjs.length > 0 && guidanceStatus === "safe") {
          guidanceStatus = "warning";
          guidanceText += ` · Acum. < 3.0 en: ${failingAnnualSubjs.map(f => `${f.subj} (${f.score.toFixed(2)})`).join(", ")}`;
        }
      }
      if (breakdown.missingPeriods.length > 0 && breakdown.accumulatedAvg !== null) {
        guidanceText += ` · Sin nota en ${breakdown.missingPeriods.map(p => p.toUpperCase()).join(", ")} (cuenta 0)`;
        if (guidanceStatus === "safe") guidanceStatus = "warning";
      }

      return {
        student,
        periodNotes,
        periodRanks: entry.periodRanks,
        finalRank: entry.finalRank,
        rankedOf: entry.rankedOf,
        isYearClosed: breakdown.isYearClosed,
        completedCount,
        currentOverallAvg,
        isPassingNow: breakdown.accumulatedAvg !== null && currentOverallAvg >= PASSING_GRADE,
        hasGrades: breakdown.accumulatedAvg !== null,
        minScoreNeededInNext,
        guidanceStatus,
        guidanceText
      };
    }).sort((a, b) => a.currentOverallAvg - b.currentOverallAvg);
  }, [myStudents, gradoFilter, cursoFilter, activePeriod, subjectForCalc]);

  // Métricas globales del grupo (solo estudiantes con notas cuentan para aprobando / en riesgo)
  const stats = useMemo(() => {
    const total = studentSummaries.length;
    if (total === 0) return { total: 0, passing: 0, failing: 0, passRate: 0, graded: 0, groupAvg: 0 };
    const gradedList = studentSummaries.filter(s => s.hasGrades);
    const graded = gradedList.length;
    const passing = gradedList.filter(s => s.isPassingNow).length;
    const failing = graded - passing;
    const passRate = graded > 0 ? Math.round((passing / graded) * 100) : 0;
    const groupAvg = graded > 0 ? gradedList.reduce((a, b) => a + b.currentOverallAvg, 0) / graded : 0;
    return { total, passing, failing, passRate, graded, groupAvg };
  }, [studentSummaries]);

  // Filtrado por búsqueda y estado seleccionado en las tarjetas KPI
  const displayedStudents = useMemo(() => {
    const list = studentSummaries.filter(s => {
      if (statusFilter === "FAILING" && (s.isPassingNow || !s.hasGrades)) return false;
      if (statusFilter === "PASSING" && !s.isPassingNow) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const fullName = `${s.student.primerApellido || ""} ${s.student.segundoApellido || ""} ${s.student.primerNombre || ""} ${s.student.segundoNombre || ""}`.toLowerCase();
      const doc = (s.student.nroDocumento || "").toLowerCase();
      return fullName.includes(term) || doc.includes(term);
    });
    const rankOf = (s: typeof list[number], scope: RankingScope) =>
      (scope === "final" ? s.finalRank : s.periodRanks[scope]) ?? Number.MAX_SAFE_INTEGER;
    return [...list].sort((a, b) => {
      if (sortOrder === "asc") return a.currentOverallAvg - b.currentOverallAvg;
      if (sortOrder === "desc") return b.currentOverallAvg - a.currentOverallAvg;
      return rankOf(a, sortOrder) - rankOf(b, sortOrder) || b.currentOverallAvg - a.currentOverallAvg;
    });
  }, [studentSummaries, statusFilter, searchTerm, sortOrder]);

  if (studentSummaries.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-outline-variant/30 shadow-xl space-y-6">
      {/* Header del Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Trophy size={24} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-on-surface uppercase tracking-tight">
                Estado Acumulado Multi-Período (Guía SIEEE)
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(true);
                  setStatusFilter("ALL");
                }}
                className="text-[9px] font-black bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase transition-all cursor-pointer"
                title="Haz clic para ver el listado completo del período activo"
              >
                Período {activePeriod.replace("p", "")} Activo · Ver Todos
              </button>
            </div>
            <p className="text-xs font-bold text-on-surface-variant opacity-70">
              Toca cualquier tarjeta superior para filtrar o toca un estudiante para abrir su Ficha 360° y Plan de Nivelación
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsExpanded(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface-variant rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {isExpanded ? "Ocultar Detalle" : "Ver Guía por Estudiante"}
        </button>
      </div>

      {/* KPI Cards Interactivas 360° de Resumen del Grupo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setStatusFilter(prev => (prev === "PASSING" ? "ALL" : "PASSING"));
            setSortOrder("desc");
          }}
          className={`text-left bg-emerald-50/60 hover:bg-emerald-50 p-5 rounded-2xl flex items-center justify-between transition-all cursor-pointer group ${
            statusFilter === "PASSING"
              ? "border-2 border-emerald-600 ring-4 ring-emerald-500/15 shadow-lg"
              : "border border-emerald-200/60 hover:shadow-md hover:-translate-y-0.5"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Aprobando Actualmente (≥ 3.0)</p>
              {statusFilter === "PASSING" && (
                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">Filtro Activo</span>
              )}
            </div>
            <p className="text-2xl md:text-3xl font-black text-emerald-700 mt-1">
              {stats.passing} <span className="text-xs font-bold opacity-70">/ {stats.total}</span>
            </p>
            <p className="text-[9px] font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              {stats.passRate}% del grupo en proyección positiva · <span className="underline">Ver listado 360°</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500 group-hover:scale-110 transition-transform text-white flex items-center justify-center shadow-md shrink-0">
            <UserCheck size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setStatusFilter(prev => (prev === "FAILING" ? "ALL" : "FAILING"));
            setSortOrder("asc");
          }}
          className={`text-left bg-rose-50/60 hover:bg-rose-50 p-5 rounded-2xl flex items-center justify-between transition-all cursor-pointer group ${
            statusFilter === "FAILING"
              ? "border-2 border-rose-600 ring-4 ring-rose-500/15 shadow-lg"
              : "border border-rose-200/60 hover:shadow-md hover:-translate-y-0.5"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">En Riesgo de Reprobar (&lt; 3.0)</p>
              {statusFilter === "FAILING" && (
                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">Filtro Activo</span>
              )}
            </div>
            <p className="text-2xl md:text-3xl font-black text-rose-700 mt-1">
              {stats.failing} <span className="text-xs font-bold opacity-70">estudiantes</span>
            </p>
            <p className="text-[9px] font-bold text-rose-600 mt-0.5 flex items-center gap-1">
              {stats.failing > 0 ? (
                <>⚠️ <span className="underline">Filtrar en riesgo e imprimir Plan de Nivelación</span></>
              ) : (
                "¡Grupo 100% al día!"
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500 group-hover:scale-110 transition-transform text-white flex items-center justify-center shadow-md shrink-0">
            <UserX size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setStatusFilter("ALL");
            setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
          }}
          className={`text-left bg-indigo-50/60 hover:bg-indigo-50 p-5 rounded-2xl flex items-center justify-between transition-all cursor-pointer group ${
            statusFilter === "ALL"
              ? "border-2 border-indigo-500/60 shadow-md"
              : "border border-indigo-200/60 hover:shadow-md hover:-translate-y-0.5"
          }`}
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">Promedio Acumulado Grupo</p>
              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Orden {sortOrder === "asc" ? "↑ Menor a Mayor" : sortOrder === "desc" ? "↓ Mayor a Menor" : `🏆 Puesto ${sortOrder === "final" ? "Final" : sortOrder.toUpperCase()}`}
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-black text-indigo-700 mt-1">
              {stats.groupAvg.toFixed(2)}
            </p>
            <p className="text-[9px] font-bold text-indigo-600 mt-0.5">
              Promedio de períodos evaluados ({stats.graded} con notas) · <span className="underline">Toca para ordenar / ver todos</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-600 group-hover:scale-110 transition-transform text-white flex items-center justify-center shadow-md shrink-0">
            <TrendingUp size={20} />
          </div>
        </button>
      </div>

      {/* Contenido Detallado Expandible */}
      {isExpanded && (
        <div className="space-y-4 pt-2">
          {/* Barra de Filtro y Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar estudiante por nombre o documento..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary uppercase"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Todos ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("PASSING")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "PASSING"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 size={13} />
                Aprobando ({stats.passing})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("FAILING")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  statusFilter === "FAILING"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                    : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                }`}
              >
                <AlertTriangle size={13} />
                En Riesgo ({stats.failing})
              </button>
              <span className="hidden sm:inline-block w-px h-6 bg-slate-200 mx-1" aria-hidden="true" />
              {(["p1", "p2", "p3", "final"] as RankingScope[]).map(scope => (
                <button
                  key={scope}
                  type="button"
                  onClick={() => { setSortOrder(prev => (prev === scope ? "asc" : scope)); setStatusFilter("ALL"); }}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                    sortOrder === scope
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                  }`}
                  title={scope === "final" ? "Ordenar por Puesto Final (acumulado de los períodos evaluados)" : `Ordenar por Puesto en el Período ${scope.replace("p", "")}`}
                >
                  <Award size={12} /> Puesto {scope === "final" ? "Final" : scope.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Desglose por Período y Pronóstico */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[440px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <th className="p-3 pl-4">Estudiante (Toca para Ficha 360°)</th>
                  <th className="p-3 text-center">Período 1</th>
                  <th className="p-3 text-center">Período 2</th>
                  <th className="p-3 text-center">Período 3</th>
                  <th className="p-3 text-center">Acumulado / Final</th>
                  <th className="p-3 text-center">Puesto Final</th>
                  <th className="p-3 pl-4">Guía Docente / Acciones 360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {displayedStudents.map(({ student, periodNotes, periodRanks, finalRank, rankedOf, isYearClosed, hasGrades, currentOverallAvg, isPassingNow, guidanceStatus, guidanceText }) => {
                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedProfileStudent(student)}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer group ${hasGrades && !isPassingNow ? 'bg-rose-50/40' : ''}`}
                    >
                      <td className="p-3 pl-4">
                        <div className="font-black text-on-surface group-hover:text-primary transition-colors uppercase leading-tight flex items-center gap-1.5">
                          <span>{student.primerApellido} {student.segundoApellido} {student.primerNombre} {student.segundoNombre}</span>
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0" />
                        </div>
                        <div className="text-[9px] font-bold text-slate-400">DOC: {student.nroDocumento} | Grado {normalizeGrade(student.grado)} - {student.curso}</div>
                      </td>
                      
                      {/* P1 · P2 · P3 con su puesto en el salón */}
                      {(["p1", "p2", "p3"] as const).map(pId => {
                        const note = periodNotes[pId];
                        const rank = periodRanks[pId];
                        return (
                          <td key={pId} className="p-3 text-center">
                            {note !== null ? (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className={`px-2 py-0.5 rounded-md text-xs font-black ${note >= PASSING_GRADE ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                                  {note.toFixed(2)}
                                </span>
                                {rank !== null && (
                                  <span className={`text-[8.5px] font-black ${rank <= 3 ? 'text-amber-600' : 'text-slate-400'}`} title={`Puesto ${rank} de ${rankedOf[pId]} en el salón`}>
                                    {formatRank(rank)} / {rankedOf[pId]}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">⏳ Pend.</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Acumulado de períodos evaluados (= Nota Final de los 3 períodos al cerrar P3) */}
                      <td className="p-3 text-center">
                        {hasGrades ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                              currentOverallAvg >= 4.6 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                              currentOverallAvg >= 4.0 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              currentOverallAvg >= PASSING_GRADE ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                              'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                            }`}>
                              {currentOverallAvg.toFixed(2)}
                            </span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">{isYearClosed ? "Nota Final" : "Acumulado"}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Sin notas</span>
                        )}
                      </td>

                      {/* Puesto Final */}
                      <td className="p-3 text-center">
                        {finalRank !== null ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black border whitespace-nowrap ${finalRank <= 3 ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-600 border-slate-200'}`}
                            title={`Puesto ${finalRank} de ${rankedOf.final} en su salón (${isYearClosed ? "Nota Final de los 3 períodos" : "acumulado de los períodos evaluados"})`}
                          >
                            {formatRank(finalRank)} <span className="ml-1 opacity-60">/ {rankedOf.final}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400">—</span>
                        )}
                      </td>

                      {/* Pronóstico / Guía Docente + Botones 360° */}
                      <td className="p-3 pl-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9.5px] font-black uppercase border ${
                            guidanceStatus === "passed" || guidanceStatus === "safe"
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : guidanceStatus === "warning"
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}>
                            {guidanceStatus === "warning" && <AlertTriangle size={12} className="shrink-0 text-amber-600" />}
                            {guidanceStatus === "danger" && <AlertTriangle size={12} className="shrink-0 text-rose-600 animate-pulse" />}
                            {guidanceStatus === "safe" && <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />}
                            {guidanceText}
                          </span>

                          <button
                            type="button"
                            onClick={() => setSelectedProfileStudent(student)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-black text-[9px] uppercase tracking-wider transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Abrir Ficha Estudiantil 360° (Notas, Asistencia, Observador y Acudiente)"
                          >
                            <Eye size={11} /> Ficha 360°
                          </button>

                          {/* Botón para generar el Plan de Nivelación listo para imprimir */}
                          {hasGrades && (!isPassingNow || guidanceStatus === "warning" || guidanceStatus === "danger") && (
                            <button
                              type="button"
                              onClick={() => setSelectedRecoveryStudent(student)}
                              className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-[9px] uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
                              title="Generar Plan de Nivelación vinculado a la Malla Curricular listo para imprimir y entregar al estudiante"
                            >
                              <Printer size={12} /> Plan de Nivelación
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Plan de Nivelación */}
      {selectedRecoveryStudent && (
        <RecoveryPlanModal
          isOpen={!!selectedRecoveryStudent}
          onClose={() => setSelectedRecoveryStudent(null)}
          student={selectedRecoveryStudent}
          subject={activeSubject}
        />
      )}

      {/* Modal 360° del Estudiante */}
      {selectedProfileStudent && (
        <StudentProfileModal
          student={selectedProfileStudent}
          onClose={() => setSelectedProfileStudent(null)}
        />
      )}
    </div>
  );
}
