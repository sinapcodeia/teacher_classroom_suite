"use client";
import { normalizeGrade } from "@/lib/constants";
import { useApp } from "@/context/AppContext";
import {
  BrainCircuit, Sparkles, TrendingUp, AlertTriangle,
  ArrowUpRight, Activity, Target, Eye, Printer, X, BookOpen,
  CheckCircle2, MessageCircle, FileText
} from "lucide-react";
import { useState, useMemo } from "react";
import StudentProfileModal from "@/components/shared/StudentProfileModal";
import RecoveryPlanModal from "@/components/live-class/RecoveryPlanModal";
import { printAnalyticsReport } from "@/lib/printService";
import Link from "next/link";

interface EduAISentinelProps {
  grado?: string;
  curso?: string;
}

type SentinelModalView = "risk" | "trend" | "curriculum" | null;

export default function EduAISentinel({ grado = "TODOS", curso = "TODOS" }: EduAISentinelProps) {
  const { myStudents, agendaNotes, curriculum, masterData, profile, students } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState<SentinelModalView>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any>(null);
  const [selectedRecoveryStudent, setSelectedRecoveryStudent] = useState<any>(null);

  const activePeriod = masterData?.activePeriod || "p2";
  const activeSubject =
    (profile.teachingSubjectsList && profile.teachingSubjectsList[0]) ||
    (masterData?.subjects?.[0] as any)?.name ||
    masterData?.subjects?.[0] ||
    "TECNOLOGÍA";

  const analytics = useMemo(() => {
    let filteredStudents = myStudents.filter(s => s.isActive !== false);
    let filteredNotes = agendaNotes;

    if (grado !== "TODOS") {
      filteredStudents = filteredStudents.filter(s => normalizeGrade(s.grado) === normalizeGrade(grado));
      filteredNotes = filteredNotes.filter(
        n => !n.grade || n.grade === "TODOS" || normalizeGrade(n.grade) === normalizeGrade(grado)
      );
    }
    if (curso !== "TODOS") {
      filteredStudents = filteredStudents.filter(s => s.curso === curso);
      filteredNotes = filteredNotes.filter(n => !n.course || n.course === "TODOS" || n.course === curso);
    }

    // 1. Estudiantes en riesgo por ausentismo y/o bajo rendimiento
    const riskStudents = filteredStudents
      .map(s => {
        const absCount = Object.values(s.attendanceRecord || {}).filter(v => v === "absent").length;
        const lateCount = Object.values(s.attendanceRecord || {}).filter(v => v === "late").length;
        const avg = s.avgGrade || 0;
        const isCriticalAbsence = absCount >= 3;
        const isFailing = avg > 0 && avg < 3.0;
        const isCombinedRisk = (absCount >= 2 && avg < 3.5) || isCriticalAbsence || isFailing;
        return {
          student: s,
          absCount,
          lateCount,
          avg,
          isCriticalAbsence,
          isFailing,
          isCombinedRisk,
        };
      })
      .filter(r => r.isCombinedRisk)
      .sort((a, b) => b.absCount - a.absCount || a.avg - b.avg);

    // 2. Promedio general y desglose por escala nacional SIEEE
    const total = filteredStudents.length;
    const avg =
      total > 0
        ? filteredStudents.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / total
        : 0;

    const scaleDistribution = {
      superior: filteredStudents.filter(s => (s.avgGrade || 0) >= 4.6).length,
      alto: filteredStudents.filter(s => (s.avgGrade || 0) >= 4.0 && (s.avgGrade || 0) < 4.6).length,
      basico: filteredStudents.filter(s => (s.avgGrade || 0) >= 3.0 && (s.avgGrade || 0) < 4.0).length,
      bajo: filteredStudents.filter(s => (s.avgGrade || 0) > 0 && (s.avgGrade || 0) < 3.0).length,
    };

    // 3. Promedios reales por dimensión SIEEE (Saber, Saber-Hacer, Ser, Convivencia, Autoevaluación)
    const dimSums = { sb: 0, sbCount: 0, sbh: 0, sbhCount: 0, sr: 0, srCount: 0, cv: 0, cvCount: 0, aut: 0, autCount: 0 };
    filteredStudents.forEach(s => {
      const dg = s.detailedGrades || {};
      Object.values(dg).forEach((subjMap: any) => {
        const pData = subjMap?.[activePeriod] || subjMap?.p2 || subjMap?.p1;
        if (!pData) return;
        const pushArr = (arr: any[], sumKey: "sb" | "sbh" | "sr" | "cv", countKey: "sbCount" | "sbhCount" | "srCount" | "cvCount") => {
          if (!Array.isArray(arr)) return;
          const valid = arr.filter(v => typeof v === "number" && !isNaN(v)) as number[];
          if (valid.length > 0) {
            dimSums[sumKey] += valid.reduce((a, b) => a + b, 0) / valid.length;
            dimSums[countKey]++;
          }
        };
        pushArr(pData.sb, "sb", "sbCount");
        pushArr(pData.sbh, "sbh", "sbhCount");
        pushArr(pData.sr, "sr", "srCount");
        pushArr(pData.cv, "cv", "cvCount");
        if (typeof pData.aut === "number" && !isNaN(pData.aut)) {
          dimSums.aut += pData.aut;
          dimSums.autCount++;
        }
      });
    });

    const dimensionAverages = [
      { key: "sb", label: "Hilo Saber (30%)", avg: dimSums.sbCount > 0 ? dimSums.sb / dimSums.sbCount : avg },
      { key: "sbh", label: "Hilo Saber-Hacer (40%)", avg: dimSums.sbhCount > 0 ? dimSums.sbh / dimSums.sbhCount : avg },
      { key: "sr", label: "Hilo Ser (20%)", avg: dimSums.srCount > 0 ? dimSums.sr / dimSums.srCount : avg },
      { key: "cv", label: "Convivencia (5%)", avg: dimSums.cvCount > 0 ? dimSums.cv / dimSums.cvCount : avg },
      { key: "aut", label: "Autoevaluación (5%)", avg: dimSums.autCount > 0 ? dimSums.aut / dimSums.autCount : avg },
    ];

    const weakestDim = [...dimensionAverages].sort((a, b) => a.avg - b.avg)[0];
    const strongestDim = [...dimensionAverages].sort((a, b) => b.avg - a.avg)[0];

    // 4. Cobertura Curricular de las Higras del Conocimiento y Agenda
    const relevantCurricula = curriculum.filter(c => {
      if (grado !== "TODOS" && normalizeGrade(c.grade) !== normalizeGrade(grado)) return false;
      return true;
    });
    const allTopics = relevantCurricula.flatMap(c => (c.units || []).flatMap(u => u.topics || []));
    const coveredTopics = allTopics.filter(t => t.status === "covered").length;
    const inProgressTopics = allTopics.filter(t => t.status === "active").length;
    const coveragePct =
      allTopics.length > 0
        ? Math.round(((coveredTopics + inProgressTopics * 0.5) / allTopics.length) * 100)
        : 0;

    const pendingTasks = filteredNotes.filter(n => n.type === "TASK" && !n.isCompleted);

    // 5. Desglose por curso real
    const courseMap = new Map<string, { course: string; grade: string; count: number; avgSum: number; riskCount: number }>();
    filteredStudents.forEach(s => {
      const key = `${normalizeGrade(s.grado)}-${s.curso}`;
      const item = courseMap.get(key) || {
        course: s.curso,
        grade: normalizeGrade(s.grado),
        count: 0,
        avgSum: 0,
        riskCount: 0,
      };
      item.count++;
      item.avgSum += s.avgGrade || 0;
      const abs = Object.values(s.attendanceRecord || {}).filter(v => v === "absent").length;
      if (abs >= 3 || ((s.avgGrade || 0) > 0 && (s.avgGrade || 0) < 3.0)) {
        item.riskCount++;
      }
      courseMap.set(key, item);
    });
    const courseStats = Array.from(courseMap.values()).map(c => ({
      ...c,
      avg: c.count > 0 ? c.avgSum / c.count : 0,
    }));

    return {
      total,
      avg,
      riskStudents,
      scaleDistribution,
      dimensionAverages,
      weakestDim,
      strongestDim,
      allTopics,
      coveredTopics,
      inProgressTopics,
      coveragePct,
      pendingTasks,
      courseStats,
    };
  }, [myStudents, agendaNotes, curriculum, grado, curso, activePeriod]);

  const cards = [
    {
      id: "risk" as const,
      title: "Detección de Abandono y Riesgo",
      message:
        analytics.riskStudents.length > 0
          ? `Se han identificado ${analytics.riskStudents.length} estudiante(s) con patrones de ausentismo o promedio inferior a 3.0 en ${grado !== "TODOS" ? `Grado ${grado}` : "tus cursos"}.`
          : "0 estudiantes en riesgo crítico de deserción o reprobación en el filtro seleccionado.",
      action: `Ver reporte de riesgo (${analytics.riskStudents.length})`,
      icon: AlertTriangle,
      color: "text-rose-400",
      bg: "bg-rose-500/10 hover:bg-rose-500/15",
      border: "border-rose-500/25 hover:border-rose-400/50",
    },
    {
      id: "trend" as const,
      title: "Optimización de Rendimiento SIEEE",
      message: `Promedio actual: ${analytics.avg.toFixed(2)} / 5.0 (${analytics.scaleDistribution.superior + analytics.scaleDistribution.alto} en Superior/Alto y ${analytics.scaleDistribution.bajo} en Bajo). Fortaleza: ${analytics.strongestDim?.label.split(" (")[0] || "Saber"}.`,
      action: "Analizar tendencias 360°",
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10 hover:bg-blue-500/15",
      border: "border-blue-500/25 hover:border-blue-400/50",
    },
    {
      id: "curriculum" as const,
      title: "Tejido Curricular y Gestión de Aula",
      message: `Cobertura de Higras del Conocimiento: ${analytics.coveragePct}% (${analytics.coveredTopics}/${analytics.allTopics.length} cubiertas, ${analytics.inProgressTopics} en curso) y ${analytics.pendingTasks.length} compromiso(s) activos en agenda.`,
      action: "Explorar malla y agenda",
      icon: Target,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 hover:bg-emerald-500/15",
      border: "border-emerald-500/25 hover:border-emerald-400/50",
    },
  ];

  const sendAlertWA = (student: any, absCount: number, avg: number) => {
    const phone = (student.acudienteTelefono || "").replace(/\D/g, "");
    const msg = `Cordial saludo desde IETABA. Informamos seguimiento académico 360° para ${student.primerNombre} ${student.primerApellido} (Grado ${normalizeGrade(student.grado)} - ${student.curso}): registra ${absCount} inasistencia(s) y promedio actual de ${avg.toFixed(1)}. Agradecemos su acompañamiento.`;
    if (!phone) {
      navigator.clipboard?.writeText(msg);
      alert("Sin teléfono registrado. Se copió el mensaje preventivo al portapapeles.");
      return;
    }
    window.open(`https://wa.me/${phone.startsWith("57") ? phone : "57" + phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section className="mb-10 relative">
      <div className="bg-slate-950 rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden relative">
        {/* Background Aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[80px] pointer-events-none" />

        <div className="p-6 md:p-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                  <BrainCircuit size={28} className="text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white font-black text-xl tracking-tighter uppercase italic">EduAI Sentinel</h2>
                  <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-blue-500/20 tracking-widest">
                    v4.0 PRO · 360°
                  </span>
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Analítica Predictiva e Inteligencia Institucional en Tiempo Real ({analytics.total} Estudiantes)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => printAnalyticsReport(students, profile, masterData)}
                className="px-4 py-3 bg-indigo-600/20 border border-indigo-400/30 rounded-2xl text-[10px] font-black uppercase text-indigo-300 tracking-widest hover:bg-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileText size={14} /> Imprimir Analítica PDF
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white tracking-widest hover:bg-white/15 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isExpanded ? "Contraer Panel 360°" : "Explorar Insights"}
                <Activity size={14} className="text-blue-400" />
              </button>
            </div>
          </div>

          {/* 3 Tarjetas Interactivas 360° */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((insight, idx) => (
              <div
                key={insight.id}
                onClick={() => setActiveModal(insight.id)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") setActiveModal(insight.id);
                }}
                className={`p-6 rounded-3xl border ${insight.border} ${insight.bg} group relative overflow-hidden transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div>
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-15 transition-opacity">
                    <insight.icon size={48} />
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-xl ${insight.bg} border ${insight.border} flex items-center justify-center ${insight.color}`}>
                      <insight.icon size={16} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${insight.color}`}>
                      {insight.title}
                    </h3>
                  </div>

                  <p className="text-slate-200 text-xs font-medium leading-relaxed mb-6">
                    {insight.message}
                  </p>
                </div>

                <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase text-white tracking-[0.2em] group-hover:text-blue-300 transition-colors">
                  {insight.action}
                  <ArrowUpRight size={14} className="text-slate-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </div>
            ))}
          </div>

          {/* Panel Expandido 360° en Vivo (Cero texto quemado) */}
          {isExpanded && (
            <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in-up">
              {/* Columna 1: Desempeño por Hilos del Saber */}
              <div className="lg:col-span-5 bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    Diagnóstico Real por Hilos SIEEE ({activePeriod.toUpperCase()})
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal("trend")}
                    className="text-[9px] font-black uppercase text-slate-300 hover:text-white underline cursor-pointer"
                  >
                    Ver Detalle →
                  </button>
                </div>
                <div className="space-y-3">
                  {analytics.dimensionAverages.map(dim => {
                    const pct = Math.min(100, Math.round((dim.avg / 5) * 100));
                    return (
                      <div key={dim.key} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-slate-300">
                          <span>{dim.label}</span>
                          <span className={dim.avg >= 4.0 ? "text-emerald-400 font-black" : dim.avg >= 3.0 ? "text-blue-400 font-black" : "text-rose-400 font-black"}>
                            {dim.avg.toFixed(2)} / 5.0
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              dim.avg >= 4.0 ? "bg-emerald-500" : dim.avg >= 3.0 ? "bg-blue-500" : "bg-rose-500"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna 2: Distribución Escala Nacional y Recomendación Dinámica */}
              <div className="lg:col-span-7 bg-white/5 p-6 rounded-3xl border border-white/10 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Distribución Escala Nacional & Recomendación Pedagógica en Vivo
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveModal("trend")}
                      className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left hover:bg-emerald-500/20 transition-all cursor-pointer"
                    >
                      <p className="text-[9px] font-black uppercase text-emerald-400">Superior (4.6–5.0)</p>
                      <p className="text-xl font-black text-white mt-1">{analytics.scaleDistribution.superior}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal("trend")}
                      className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-left hover:bg-blue-500/20 transition-all cursor-pointer"
                    >
                      <p className="text-[9px] font-black uppercase text-blue-400">Alto (4.0–4.5)</p>
                      <p className="text-xl font-black text-white mt-1">{analytics.scaleDistribution.alto}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal("trend")}
                      className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left hover:bg-amber-500/20 transition-all cursor-pointer"
                    >
                      <p className="text-[9px] font-black uppercase text-amber-400">Básico (3.0–3.9)</p>
                      <p className="text-xl font-black text-white mt-1">{analytics.scaleDistribution.basico}</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModal("risk")}
                      className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-left hover:bg-rose-500/20 transition-all cursor-pointer"
                    >
                      <p className="text-[9px] font-black uppercase text-rose-400">Bajo (&lt; 3.0)</p>
                      <p className="text-xl font-black text-white mt-1">{analytics.scaleDistribution.bajo}</p>
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/20">
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <strong className="text-indigo-300 uppercase">Diagnóstico IA en Tiempo Real: </strong>
                      El grupo registra un promedio de <strong>{analytics.avg.toFixed(2)}</strong>. El hilo con mayor oportunidad de fortalecimiento es{" "}
                      <strong className="text-amber-300">{analytics.weakestDim?.label}</strong> ({analytics.weakestDim?.avg.toFixed(2)}).{" "}
                      {analytics.riskStudents.length > 0
                        ? `Se recomienda generar Plan de Nivelación para los ${analytics.riskStudents.length} estudiantes con alerta activa.`
                        : "Todos los estudiantes mantienen asistencia y promedio fuera de peligro crítico."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal("risk")}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
                  >
                    Atender Casos en Riesgo ({analytics.riskStudents.length})
                  </button>
                  <Link
                    href="/clase-en-vivo"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider"
                  >
                    Ir a Clase en Vivo
                  </Link>
                  <Link
                    href="/curriculo"
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider"
                  >
                    Revisar Higras del Conocimiento
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 360° DE SENTINEL (Riesgo / Tendencias / Malla) */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[140] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setActiveModal(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-900 text-blue-400">
                  EduAI Sentinel v4.0 PRO · Vista 360°
                </span>
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  {activeModal === "risk" && `Reporte de Riesgo de Abandono y Reprobación (${analytics.riskStudents.length} Estudiantes)`}
                  {activeModal === "trend" && `Análisis de Tendencias y Rendimiento por Curso (${analytics.total} Estudiantes)`}
                  {activeModal === "curriculum" && `Estado de Higras del Conocimiento y Compromisos de Agenda`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
              {activeModal === "risk" && (
                <>
                  {analytics.riskStudents.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-500" />
                      <p className="text-xs font-black uppercase">No hay estudiantes en riesgo crítico para este filtro</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-rose-200 rounded-2xl overflow-hidden">
                      {analytics.riskStudents.map(({ student: s, absCount, lateCount, avg }) => (
                        <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-50/40">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-900 uppercase">
                                {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                avg < 3.0 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                Promedio: {avg.toFixed(2)}
                              </span>
                              {absCount > 0 && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-black uppercase">
                                  {absCount} Falla(s){lateCount > 0 ? ` · ${lateCount} Retardo(s)` : ""}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-500 mt-1">
                              Grado {normalizeGrade(s.grado)} · Curso {s.curso} · Doc: {s.nroDocumento} · Acudiente: {s.acudienteNombres || "Sin registrar"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => sendAlertWA(s, absCount, avg)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <MessageCircle size={11} /> Citar Acudiente
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedRecoveryStudent(s)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Printer size={11} /> Plan Nivelación
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedProfileStudent(s)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer"
                            >
                              <Eye size={11} /> Ficha 360°
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeModal === "trend" && (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="p-3">Grado / Curso</th>
                          <th className="p-3 text-center">Estudiantes</th>
                          <th className="p-3 text-center">Promedio Grupal</th>
                          <th className="p-3 text-center">En Alerta</th>
                          <th className="p-3 text-right">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.courseStats.map((cs, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-3 font-black text-slate-900">Grado {cs.grade} · Curso {cs.course}</td>
                            <td className="p-3 text-center font-bold">{cs.count}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-lg font-black ${
                                cs.avg >= 4.0 ? "bg-emerald-100 text-emerald-800" : cs.avg >= 3.0 ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                              }`}>
                                {cs.avg.toFixed(2)}
                              </span>
                            </td>
                            <td className="p-3 text-center font-bold text-rose-600">{cs.riskCount}</td>
                            <td className="p-3 text-right">
                              <Link
                                href={`/clase-en-vivo?grado=${encodeURIComponent(cs.grade)}&curso=${encodeURIComponent(cs.course)}`}
                                onClick={() => setActiveModal(null)}
                                className="px-3 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase"
                              >
                                Abrir Aula →
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeModal === "curriculum" && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-800">Avance de Higras del Conocimiento</p>
                      <p className="text-xs font-bold text-emerald-700 mt-0.5">
                        {analytics.coveredTopics} cubiertas · {analytics.inProgressTopics} en curso · {Math.max(0, analytics.allTopics.length - analytics.coveredTopics - analytics.inProgressTopics)} pendientes ({analytics.coveragePct}% global)
                      </p>
                    </div>
                    <Link
                      href="/curriculo"
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase shrink-0"
                    >
                      Ir a Currículo
                    </Link>
                  </div>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {analytics.allTopics.length === 0 ? (
                      <div className="p-8 text-center text-xs font-bold text-slate-400 uppercase">
                        No hay Higras cargadas para este filtro. Ve a Currículo para cargar el tejido.
                      </div>
                    ) : (
                      analytics.allTopics.map((t: any, idx: number) => (
                        <div key={t.id || idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                          <div>
                            <p className="text-xs font-black text-slate-800 uppercase">{t.title}</p>
                            <p className="text-[10px] font-bold text-slate-500">
                              {(t.ejes || []).length} tema(s) de la Higra
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase shrink-0 ${
                            t.status === "covered"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.status === "active"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}>
                            {t.status === "covered" ? "Cubierta" : t.status === "active" ? "En Curso" : "Pendiente"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProfileStudent && (
        <StudentProfileModal
          student={selectedProfileStudent}
          onClose={() => setSelectedProfileStudent(null)}
        />
      )}

      {selectedRecoveryStudent && (
        <RecoveryPlanModal
          isOpen={!!selectedRecoveryStudent}
          onClose={() => setSelectedRecoveryStudent(null)}
          student={selectedRecoveryStudent}
          subject={activeSubject}
        />
      )}
    </section>
  );
}
