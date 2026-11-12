"use client";

import { useMemo, useState } from "react";
import {
  Award, Calendar, ChevronDown, ChevronUp, Layers,
  Sparkles, UserCheck, Eye, X, Edit3
} from "lucide-react";
import StudentProfileModal from "@/components/shared/StudentProfileModal";
import { normalizeGrade } from "@/lib/constants";

export interface EvaluatedActivityItem {
  key: string;
  category: "sb" | "sbh" | "sr" | "cv" | "aut" | "rec";
  categoryLabel: string;
  categoryWeight: string;
  slotIndex: number;
  colLabel: string;
  cleanTitle: string;
  date: string;
  evaluatedCount: number;
  totalStudents: number;
  average: number | null;
  sampleGrade?: string;
  sampleCourse?: string;
}

interface EvaluatedActivitiesSummaryProps {
  students: any[];
  subject: string;
  periodId: string;
  grade: string;
  course: string;
  onSelectActivity?: (
    category: "sb" | "sbh" | "sr" | "cv" | "aut" | "rec",
    slotIndex: number,
    title: string,
    inferredGrade?: string,
    inferredCourse?: string
  ) => void;
}

const CATEGORY_META: Record<string, { label: string; weight: string; color: string; badgeBg: string }> = {
  sb: { label: "Saber", weight: "30%", color: "text-blue-700 border-blue-200 bg-blue-50", badgeBg: "bg-blue-600 text-white" },
  sbh: { label: "Saber-Hacer", weight: "40%", color: "text-emerald-700 border-emerald-200 bg-emerald-50", badgeBg: "bg-emerald-600 text-white" },
  sr: { label: "Ser", weight: "20%", color: "text-amber-700 border-amber-200 bg-amber-50", badgeBg: "bg-amber-600 text-white" },
  cv: { label: "Convivencia", weight: "5%", color: "text-purple-700 border-purple-200 bg-purple-50", badgeBg: "bg-purple-600 text-white" },
  aut: { label: "Autoevaluación", weight: "5%", color: "text-rose-700 border-rose-200 bg-rose-50", badgeBg: "bg-rose-600 text-white" },
  rec: { label: "Recuperación", weight: "Nivelación", color: "text-orange-700 border-orange-200 bg-orange-50", badgeBg: "bg-orange-600 text-white" },
};

export default function EvaluatedActivitiesSummary({
  students,
  subject,
  periodId,
  grade,
  course,
  onSelectActivity,
}: EvaluatedActivitiesSummaryProps) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [inspectedActivity, setInspectedActivity] = useState<EvaluatedActivityItem | null>(null);
  const [selectedProfileStudent, setSelectedProfileStudent] = useState<any>(null);

  const getStudentScoreForSlot = (
    student: any,
    cat: "sb" | "sbh" | "sr" | "cv" | "aut" | "rec",
    slot: number
  ): number | null => {
    const detailed = student.detailedGrades?.[subject]?.[periodId];
    if (!detailed) return null;
    if (cat === "aut" || cat === "rec") {
      const val = detailed[cat];
      return typeof val === "number" && !isNaN(val) ? val : null;
    }
    const arr = detailed[cat];
    if (Array.isArray(arr) && typeof arr[slot] === "number" && !isNaN(arr[slot])) {
      return arr[slot];
    }
    return null;
  };

  const activities: EvaluatedActivityItem[] = useMemo(() => {
    if (!students || students.length === 0 || !subject) return [];

    const subjectUpper = subject.toUpperCase();
    const map = new Map<string, EvaluatedActivityItem>();

    students.forEach(student => {
      if (student.grades && Array.isArray(student.grades)) {
        student.grades.forEach((g: any) => {
          if (g.periodId && g.periodId !== periodId) return;

          const titleUpper = (g.title || "").toUpperCase().trim();
          const subjectTag = `[${subjectUpper}]`;
          const hasOtherSubjectTag = titleUpper.startsWith("[") && !titleUpper.startsWith(subjectTag);
          if (hasOtherSubjectTag) return;

          const matchesCurrentSubject =
            titleUpper.startsWith(subjectTag) || (g.subject && g.subject.toUpperCase() === subjectUpper);

          if (matchesCurrentSubject || (!titleUpper.startsWith("[") && g.category && g.title)) {
            const cleanTitle = g.title
              ? g.title.replace(new RegExp(`^\\[${subjectUpper}\\]\\s*`, "i"), "").trim()
              : "Actividad";
            const category = (g.category ||
              (g.type === "exam" ? "sb" : g.type === "participation" ? "sr" : "sbh")) as
              | "sb"
              | "sbh"
              | "sr"
              | "cv"
              | "aut"
              | "rec";
            const slotIndex = g.slotIndex !== undefined ? g.slotIndex : 0;
            const key = `${category}-${slotIndex}`;

            if (!map.has(key)) {
              const meta = CATEGORY_META[category] || {
                label: category.toUpperCase(),
                weight: "",
                color: "",
                badgeBg: "",
              };
              map.set(key, {
                key,
                category,
                categoryLabel: meta.label,
                categoryWeight: meta.weight,
                slotIndex,
                colLabel: category === "aut" || category === "rec" ? meta.label : `Columna ${slotIndex + 1}`,
                cleanTitle: cleanTitle || `Actividad ${slotIndex + 1}`,
                date: g.date ? g.date.slice(0, 10) : "",
                evaluatedCount: 0,
                totalStudents: students.length,
                average: null,
                sampleGrade: normalizeGrade(student.grado),
                sampleCourse: student.curso,
              });
            } else if (g.date && !map.get(key)!.date) {
              map.get(key)!.date = g.date.slice(0, 10);
            }
          }
        });
      }
    });

    const categories: Array<"sb" | "sbh" | "sr" | "cv" | "aut" | "rec"> = ["sb", "sbh", "sr", "cv", "aut", "rec"];
    categories.forEach(cat => {
      const maxSlots = cat === "sr" ? 5 : cat === "cv" ? 3 : cat === "aut" || cat === "rec" ? 1 : 8;
      for (let slot = 0; slot < maxSlots; slot++) {
        const key = `${cat}-${slot}`;
        const scores: number[] = [];
        let sampleG: string | undefined;
        let sampleC: string | undefined;

        students.forEach(s => {
          const val = getStudentScoreForSlot(s, cat, slot);
          if (val !== null) {
            scores.push(val);
            if (!sampleG) {
              sampleG = normalizeGrade(s.grado);
              sampleC = s.curso;
            }
          }
        });

        if (scores.length > 0) {
          const meta = CATEGORY_META[cat] || { label: cat.toUpperCase(), weight: "", color: "", badgeBg: "" };
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

          if (map.has(key)) {
            const existing = map.get(key)!;
            existing.evaluatedCount = scores.length;
            existing.average = Math.round(avg * 10) / 10;
            if (!existing.sampleGrade && sampleG) {
              existing.sampleGrade = sampleG;
              existing.sampleCourse = sampleC;
            }
          } else {
            map.set(key, {
              key,
              category: cat,
              categoryLabel: meta.label,
              categoryWeight: meta.weight,
              slotIndex: slot,
              colLabel: cat === "aut" || cat === "rec" ? meta.label : `Columna ${slot + 1}`,
              cleanTitle: `${meta.label} - Columna ${slot + 1}`,
              date: "En Planilla",
              evaluatedCount: scores.length,
              totalStudents: students.length,
              average: Math.round(avg * 10) / 10,
              sampleGrade: sampleG,
              sampleCourse: sampleC,
            });
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.date && b.date && a.date !== "En Planilla" && b.date !== "En Planilla") {
        return b.date.localeCompare(a.date);
      }
      return a.category.localeCompare(b.category);
    });
  }, [students, subject, periodId]);

  const filtered = useMemo(() => {
    if (filterCategory === "ALL") return activities;
    return activities.filter(a => a.category === filterCategory);
  }, [activities, filterCategory]);

  const handleOpenInGrader = (act: EvaluatedActivityItem) => {
    if (onSelectActivity) {
      onSelectActivity(act.category, act.slotIndex, act.cleanTitle, act.sampleGrade, act.sampleCourse);
    }
    setInspectedActivity(null);
    setTimeout(() => {
      const el = document.getElementById("activity-grader-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <>
      <section className="bg-white border border-outline-variant/60 rounded-3xl md:rounded-[2.5rem] shadow-xl overflow-hidden mb-8 transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 md:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-teal-500/20 border border-teal-400/30 text-teal-300 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Award size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm md:text-base font-black tracking-tight text-white uppercase italic">
                  Resumen de Saberes y Actividades Evaluadas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  {activities.length} registradas
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                Periodo {periodId.toUpperCase()} · {subject} · Grado {grade} - Curso {course} · Toca una actividad para ver notas 360° o editarla
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown size={14} /> Mostrar
                </>
              ) : (
                <>
                  <ChevronUp size={14} /> Minimizar
                </>
              )}
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Categorías Filter Chips */}
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
                <Layers size={11} /> Filtrar por Saber:
              </span>
              <button
                type="button"
                onClick={() => setFilterCategory("ALL")}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all cursor-pointer ${
                  filterCategory === "ALL"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                Todos ({activities.length})
              </button>
              {(["sb", "sbh", "sr", "cv", "aut", "rec"] as const).map(cat => {
                const meta = CATEGORY_META[cat];
                const count = activities.filter(a => a.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all cursor-pointer ${
                      filterCategory === cat
                        ? `${meta.badgeBg} shadow-xs`
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {meta.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Cards Grid */}
            {filtered.length === 0 ? (
              <div className="py-12 px-6 text-center text-slate-400 space-y-2">
                <Sparkles size={28} className="mx-auto text-slate-300 opacity-60" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                  Aún no has registrado notas en este curso para el periodo {periodId.toUpperCase()}
                </p>
                <p className="text-[10px] text-slate-400 max-w-md mx-auto">
                  Escribe un nombre de actividad en el calificador de abajo, ingresa notas y pulsa &quot;Guardar Todo&quot;. Aparecerán automáticamente en este resumen con fecha y pilar evaluado.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto p-4 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filtered.map(act => {
                    const meta = CATEGORY_META[act.category];
                    const completionRate =
                      act.totalStudents > 0 ? Math.round((act.evaluatedCount / act.totalStudents) * 100) : 0;
                    const isComplete = act.evaluatedCount >= act.totalStudents && act.totalStudents > 0;

                    return (
                      <div
                        key={act.key}
                        onClick={() => setInspectedActivity(act)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") setInspectedActivity(act);
                        }}
                        className="group p-4 rounded-2xl border border-slate-200 hover:border-teal-500 transition-all relative overflow-hidden bg-white hover:shadow-lg hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase border ${meta.color} flex items-center gap-1`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {meta.label} ({meta.weight})
                            </span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                              {act.colLabel}
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-slate-800 uppercase leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
                            {act.cleanTitle}
                          </h4>
                        </div>

                        <div>
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[9.5px]">
                            <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{act.date || "Fecha no registrada"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {act.average !== null && (
                                <span
                                  className={`font-black px-1.5 py-0.5 rounded ${
                                    act.average >= 4.0
                                      ? "bg-emerald-50 text-emerald-700"
                                      : act.average >= 3.0
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  Prom: {act.average.toFixed(1)}
                                </span>
                              )}
                              <span
                                className={`flex items-center gap-1 font-bold ${
                                  isComplete ? "text-emerald-600" : "text-amber-600"
                                }`}
                              >
                                <UserCheck size={12} />
                                {act.evaluatedCount}/{act.totalStudents} ({completionRate}%)
                              </span>
                            </div>
                          </div>

                          <div className="w-full h-1 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>

                          <div className="mt-2.5 flex items-center justify-between gap-2 pt-1">
                            <span className="text-[9px] font-black uppercase text-teal-700 group-hover:underline flex items-center gap-1">
                              <Eye size={11} /> Ver Notas 360°
                            </span>
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleOpenInGrader(act);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-teal-700 text-white text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 size={10} /> Calificar / Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* MODAL 360° DE NOTAS POR ACTIVIDAD */}
      {inspectedActivity && (
        <div
          className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setInspectedActivity(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[2.5rem] max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 max-h-[88vh] flex flex-col space-y-5"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-[9px] font-black uppercase">
                    {inspectedActivity.categoryLabel} ({inspectedActivity.categoryWeight}) · {inspectedActivity.colLabel}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Fecha: {inspectedActivity.date || "En Planilla"}
                  </span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight mt-1">
                  {inspectedActivity.cleanTitle}
                </h3>
                <p className="text-[11px] font-bold text-slate-500">
                  Evaluados: {inspectedActivity.evaluatedCount} de {inspectedActivity.totalStudents} estudiantes · Promedio:{" "}
                  {inspectedActivity.average !== null ? inspectedActivity.average.toFixed(1) : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectedActivity(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 min-h-0">
              {students.map(s => {
                const score = getStudentScoreForSlot(s, inspectedActivity.category, inspectedActivity.slotIndex);
                return (
                  <div key={s.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <p className="text-xs font-black text-slate-900 uppercase">
                        {s.primerApellido} {s.segundoApellido} {s.primerNombre} {s.segundoNombre}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500">
                        Grado {normalizeGrade(s.grado)} · Curso {s.curso} · Doc: {s.nroDocumento}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {score !== null ? (
                        <span
                          className={`px-3 py-1 rounded-xl font-black text-xs border ${
                            score >= 4.0
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : score >= 3.0
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase">
                          Pendiente
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedProfileStudent(s)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-[9px] font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye size={11} /> Ficha 360°
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 shrink-0">
              <button
                type="button"
                onClick={() => setInspectedActivity(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleOpenInGrader(inspectedActivity)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Edit3 size={13} /> Abrir en el Calificador para Editar Notas
              </button>
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
    </>
  );
}
