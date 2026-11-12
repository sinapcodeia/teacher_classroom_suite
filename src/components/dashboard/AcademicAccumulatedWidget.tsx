"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { calculateStudentAcademicSummary, calculateDetailedFinal } from "@/lib/gradeUtils";
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
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedRecoveryStudent, setSelectedRecoveryStudent] = useState<any>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any>(null);

  const activePeriod = masterData.activePeriod || "p2";
  const activeSubject = (subjectFilter && subjectFilter !== "TODOS") ? subjectFilter : ((masterData.subjects?.[0] as any)?.name || masterData.subjects?.[0] || "TECNOLOGÍA");

  // Procesar notas por período (P1, P2, P3) y proyecciones pedagógicas
  const studentSummaries = useMemo(() => {
    return myStudents.filter(s => {
      if (s.isActive === false) return false;
      const matchGrado = gradoFilter === "TODOS" || normalizeGrade(s.grado) === normalizeGrade(gradoFilter);
      const matchCurso = cursoFilter === "TODOS" || s.curso === cursoFilter;
      return matchGrado && matchCurso;
    }).map(student => {
      const summary = calculateStudentAcademicSummary(student, activePeriod);
      const detailedGrades = student.detailedGrades || {};
      
      const periodNotes: Record<string, number | null> = { p1: null, p2: null, p3: null };
      
      ["p1", "p2", "p3"].forEach(pId => {
        const subNotes: number[] = [];
        
          const mapsToCheck = (subjectFilter && subjectFilter !== "TODOS") 
            ? (detailedGrades[activeSubject] ? [detailedGrades[activeSubject]] : [])
            : Object.values(detailedGrades);
          
          mapsToCheck.forEach(pMap => {
          if (pMap && pMap[pId]) {
            const finalSubNote = calculateDetailedFinal(pMap[pId]);
            if (finalSubNote > 0) subNotes.push(finalSubNote);
          }
        });
        if (subNotes.length > 0) {
          const avg = subNotes.reduce((a, b) => a + b, 0) / subNotes.length;
          periodNotes[pId] = Number(avg.toFixed(2));
        }
      });

      if (periodNotes.p1 === null && periodNotes.p2 === null && periodNotes.p3 === null && student.avgGrade) {
        periodNotes.p1 = Number(student.avgGrade.toFixed(2));
      }

      const completedPeriods = ["p1", "p2", "p3"].filter(p => periodNotes[p] !== null);
      const completedCount = completedPeriods.length;
      const totalPeriodsYear = 3;

      const sumCompleted = completedPeriods.reduce((sum, p) => sum + (periodNotes[p] || 0), 0);
      const currentOverallAvg = completedCount > 0 ? Number((sumCompleted / completedCount).toFixed(2)) : (student.avgGrade || 0);

      const targetTotalYear = totalPeriodsYear * 3.0; // 9.0 puntos acumulados necesarios en 3 períodos
      const pointsNeededRemaining = targetTotalYear - sumCompleted;
      const remainingPeriodsCount = totalPeriodsYear - completedCount;

      let minScoreNeededInNext = 0;
      let guidanceStatus: "safe" | "warning" | "danger" | "passed" | "pending_start" = "safe";
      let guidanceText = "";

      if (completedCount === 0) {
        guidanceStatus = "pending_start";
        guidanceText = "Períodos sin iniciar";
      } else if (remainingPeriodsCount <= 0) {
        if (currentOverallAvg >= 3.0) {
          guidanceStatus = "passed";
          guidanceText = "¡Año Aprobado!";
        } else {
          guidanceStatus = "danger";
          guidanceText = "Año Reprobado (Requiere Recuperación)";
        }
      } else {
        minScoreNeededInNext = Number((pointsNeededRemaining / remainingPeriodsCount).toFixed(2));

        if (minScoreNeededInNext <= 1.0) {
          guidanceStatus = "safe";
          guidanceText = "✅ Año Asegurado (Incluso con 1.0 en P3 aprueba)";
        } else if (minScoreNeededInNext <= 3.0) {
          guidanceStatus = "safe";
          guidanceText = `✓ Necesita mín. ${minScoreNeededInNext.toFixed(1)} en P${completedCount + 1} para ganar el año`;
        } else if (minScoreNeededInNext <= 5.0) {
          guidanceStatus = "warning";
          guidanceText = `⚠️ Alerta: Necesita sacar al menos ${minScoreNeededInNext.toFixed(1)} en P${completedCount + 1} para alcanzar 3.0`;
        } else {
          guidanceStatus = "danger";
          guidanceText = `🚨 Riesgo Crítico: Requisito mayor a 5.0 (${minScoreNeededInNext.toFixed(1)}). Necesita nivelación obligatoria`;
        }
      }

      return {
        student,
        periodNotes,
        completedCount,
        currentOverallAvg,
        isPassingNow: currentOverallAvg >= 3.0,
        minScoreNeededInNext,
        guidanceStatus,
        guidanceText
      };
    }).sort((a, b) => a.currentOverallAvg - b.currentOverallAvg);
  }, [myStudents, gradoFilter, cursoFilter, activePeriod, activeSubject, subjectFilter]);

  // Métricas globales del grupo
  const stats = useMemo(() => {
    const total = studentSummaries.length;
    if (total === 0) return { total: 0, passing: 0, failing: 0, passRate: 0 };
    const passing = studentSummaries.filter(s => s.isPassingNow).length;
    const failing = total - passing;
    const passRate = Math.round((passing / total) * 100);
    return { total, passing, failing, passRate };
  }, [studentSummaries]);

  // Filtrado por búsqueda y estado seleccionado en las tarjetas KPI
  const displayedStudents = useMemo(() => {
    const list = studentSummaries.filter(s => {
      if (statusFilter === "FAILING" && s.isPassingNow) return false;
      if (statusFilter === "PASSING" && !s.isPassingNow) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const fullName = `${s.student.primerApellido || ""} ${s.student.segundoApellido || ""} ${s.student.primerNombre || ""} ${s.student.segundoNombre || ""}`.toLowerCase();
      const doc = (s.student.nroDocumento || "").toLowerCase();
      return fullName.includes(term) || doc.includes(term);
    });
    return [...list].sort((a, b) =>
      sortOrder === "asc"
        ? a.currentOverallAvg - b.currentOverallAvg
        : b.currentOverallAvg - a.currentOverallAvg
    );
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
                Orden {sortOrder === "asc" ? "↑ Menor a Mayor" : "↓ Mayor a Menor"}
              </span>
            </div>
            <p className="text-2xl md:text-3xl font-black text-indigo-700 mt-1">
              {(studentSummaries.reduce((a, b) => a + b.currentOverallAvg, 0) / (stats.total || 1)).toFixed(2)}
            </p>
            <p className="text-[9px] font-bold text-indigo-600 mt-0.5">
              Promedio de períodos cursados · <span className="underline">Toca para ordenar / ver todos</span>
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
            </div>
          </div>

          {/* Tabla de Desglose por Período y Pronóstico */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-[440px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider sticky top-0 border-b border-slate-200">
                  <th className="p-3 pl-4">Estudiante (Toca para Ficha 360°)</th>
                  <th className="p-3 text-center">Período 1</th>
                  <th className="p-3 text-center">Período 2</th>
                  <th className="p-3 text-center">Período 3</th>
                  <th className="p-3 text-center">Acumulado Actual</th>
                  <th className="p-3 pl-4">Guía Docente / Acciones 360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {displayedStudents.map(({ student, periodNotes, currentOverallAvg, isPassingNow, guidanceStatus, guidanceText }) => {
                  return (
                    <tr
                      key={student.id}
                      onClick={() => setSelectedProfileStudent(student)}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer group ${!isPassingNow ? 'bg-rose-50/40' : ''}`}
                    >
                      <td className="p-3 pl-4">
                        <div className="font-black text-on-surface group-hover:text-primary transition-colors uppercase leading-tight flex items-center gap-1.5">
                          <span>{student.primerApellido} {student.segundoApellido} {student.primerNombre} {student.segundoNombre}</span>
                          <Eye size={12} className="opacity-0 group-hover:opacity-100 text-primary transition-opacity shrink-0" />
                        </div>
                        <div className="text-[9px] font-bold text-slate-400">DOC: {student.nroDocumento} | Grado {normalizeGrade(student.grado)} - {student.curso}</div>
                      </td>
                      
                      {/* P1 */}
                      <td className="p-3 text-center">
                        {periodNotes.p1 !== null ? (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${periodNotes.p1 >= 3.0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                            {periodNotes.p1.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">⏳ Pend.</span>
                        )}
                      </td>

                      {/* P2 */}
                      <td className="p-3 text-center">
                        {periodNotes.p2 !== null ? (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${periodNotes.p2 >= 3.0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                            {periodNotes.p2.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">⏳ Pend.</span>
                        )}
                      </td>

                      {/* P3 */}
                      <td className="p-3 text-center">
                        {periodNotes.p3 !== null ? (
                          <span className={`px-2 py-0.5 rounded-md text-xs font-black ${periodNotes.p3 >= 3.0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'}`}>
                            {periodNotes.p3.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">⏳ Pend.</span>
                        )}
                      </td>

                      {/* Promedio Acumulado Cursado */}
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black border ${
                          currentOverallAvg >= 4.6 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                          currentOverallAvg >= 4.0 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                          currentOverallAvg >= 3.0 ? 'bg-indigo-100 text-indigo-800 border-indigo-300' :
                          'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                        }`}>
                          {currentOverallAvg.toFixed(2)}
                        </span>
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
                          {(!isPassingNow || guidanceStatus === "warning" || guidanceStatus === "danger") && (
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
