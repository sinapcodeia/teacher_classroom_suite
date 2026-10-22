"use client";

import { useMemo, useState } from "react";
import { Award, Calendar, CheckCircle2, ChevronDown, ChevronUp, FileSpreadsheet, Layers, Sparkles, UserCheck } from "lucide-react";
import { DetailedGrades } from "@/lib/gradeUtils";

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
}

interface EvaluatedActivitiesSummaryProps {
  students: any[];
  subject: string;
  periodId: string;
  grade: string;
  course: string;
  onSelectActivity?: (category: "sb" | "sbh" | "sr" | "cv" | "aut" | "rec", slotIndex: number, title: string) => void;
}

const CATEGORY_META: Record<string, { label: string; weight: string; color: string; badgeBg: string }> = {
  sb: { label: "Saber", weight: "30%", color: "text-blue-700 border-blue-200 bg-blue-50", badgeBg: "bg-blue-600 text-white" },
  sbh: { label: "Saber-Hacer", weight: "40%", color: "text-emerald-700 border-emerald-200 bg-emerald-50", badgeBg: "bg-emerald-600 text-white" },
  sr: { label: "Ser", weight: "20%", color: "text-amber-700 border-amber-200 bg-amber-50", badgeBg: "bg-amber-600 text-white" },
  cv: { label: "Convivencia", weight: "5%", color: "text-purple-700 border-purple-200 bg-purple-50", badgeBg: "bg-purple-600 text-white" },
  aut: { label: "Autoevaluación", weight: "5%", color: "text-rose-700 border-rose-200 bg-rose-50", badgeBg: "bg-rose-600 text-white" },
  rec: { label: "Recuperación", weight: "Nivelación", color: "text-orange-700 border-orange-200 bg-orange-50", badgeBg: "bg-orange-600 text-white" }
};

export default function EvaluatedActivitiesSummary({
  students,
  subject,
  periodId,
  grade,
  course,
  onSelectActivity
}: EvaluatedActivitiesSummaryProps) {
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const activities: EvaluatedActivityItem[] = useMemo(() => {
    if (!students || students.length === 0 || !subject) return [];

    const subjectUpper = subject.toUpperCase();
    const map = new Map<string, EvaluatedActivityItem>();

    // 1. Extraer actividades nombradas del historial student.grades
    // ESTRICTO: Solo incluir notas que pertenezcan a la materia actual
    students.forEach(student => {
      if (student.grades && Array.isArray(student.grades)) {
        student.grades.forEach((g: any) => {
          if (g.periodId && g.periodId !== periodId) return;

          const titleUpper = (g.title || "").toUpperCase().trim();
          const subjectTag = `[${subjectUpper}]`;
          
          // REGLA ESTRICTA DE MATERIA:
          // Si tiene etiqueta [MATERIA], debe ser EXACTAMENTE la materia actual.
          // Si tiene la etiqueta de OTRA materia (ej: [FÍSICA], [MATEMÁTICAS] cuando estamos en TECNOLOGÍA), se DESCARTA.
          const hasOtherSubjectTag = titleUpper.startsWith("[") && !titleUpper.startsWith(subjectTag);
          if (hasOtherSubjectTag) return;

          const matchesCurrentSubject = titleUpper.startsWith(subjectTag) || 
            (g.subject && g.subject.toUpperCase() === subjectUpper);

          // Si no tiene etiqueta pero tiene categoría y título, solo aceptar si coincide explícitamente o no pertenece a otra materia
          if (matchesCurrentSubject || (!titleUpper.startsWith("[") && g.category && g.title)) {
            const cleanTitle = g.title ? g.title.replace(new RegExp(`^\\[${subjectUpper}\\]\\s*`, 'i'), '').trim() : "Actividad";
            const category = (g.category || (g.type === 'exam' ? 'sb' : (g.type === 'participation' ? 'sr' : 'sbh'))) as "sb" | "sbh" | "sr" | "cv" | "aut" | "rec";
            const slotIndex = g.slotIndex !== undefined ? g.slotIndex : 0;
            const key = `${category}-${slotIndex}`;

            if (!map.has(key)) {
              const meta = CATEGORY_META[category] || { label: category.toUpperCase(), weight: "", color: "", badgeBg: "" };
              map.set(key, {
                key,
                category,
                categoryLabel: meta.label,
                categoryWeight: meta.weight,
                slotIndex,
                colLabel: (category === 'aut' || category === 'rec') ? meta.label : `Columna ${slotIndex + 1}`,
                cleanTitle: cleanTitle || `Actividad ${slotIndex + 1}`,
                date: g.date ? g.date.slice(0, 10) : "",
                evaluatedCount: 0,
                totalStudents: students.length,
                average: null
              });
            } else if (g.date && !map.get(key)!.date) {
              map.get(key)!.date = g.date.slice(0, 10);
            }
          }
        });
      }
    });

    // 2. Extraer notas que estén asentadas directamente en detailedGrades (Planilla)
    // Para asegurarnos de que ninguna columna calificada quede por fuera aunque se haya guardado por importación
    const categories: Array<"sb" | "sbh" | "sr" | "cv" | "aut" | "rec"> = ["sb", "sbh", "sr", "cv", "aut", "rec"];
    categories.forEach(cat => {
      const maxSlots = cat === 'sr' ? 5 : (cat === 'cv' ? 3 : ((cat === 'aut' || cat === 'rec') ? 1 : 8));
      for (let slot = 0; slot < maxSlots; slot++) {
        const key = `${cat}-${slot}`;
        const scores: number[] = [];

        students.forEach(s => {
          const detailed = s.detailedGrades?.[subject]?.[periodId];
          if (detailed) {
            if (cat === 'aut' || cat === 'rec') {
              const val = detailed[cat];
              if (val !== null && val !== undefined && !isNaN(val)) scores.push(val);
            } else {
              const arr = detailed[cat as "sb" | "sbh" | "sr" | "cv"];
              if (arr && arr[slot] !== null && arr[slot] !== undefined && !isNaN(arr[slot])) {
                scores.push(arr[slot]);
              }
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
          } else {
            // Actividad presente en planilla
            map.set(key, {
              key,
              category: cat,
              categoryLabel: meta.label,
              categoryWeight: meta.weight,
              slotIndex: slot,
              colLabel: (cat === 'aut' || cat === 'rec') ? meta.label : `Columna ${slot + 1}`,
              cleanTitle: `${meta.label} - Columna ${slot + 1}`,
              date: "En Planilla",
              evaluatedCount: scores.length,
              totalStudents: students.length,
              average: Math.round(avg * 10) / 10
            });
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Ordenar por fecha reciente o categoría
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

  return (
    <section className="bg-white border border-outline-variant/60 rounded-3xl md:rounded-[2.5rem] shadow-xl overflow-hidden mb-8 transition-all">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-5 md:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 bg-teal-500/20 border border-teal-400/30 text-teal-300 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Award size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black tracking-tight text-white uppercase italic">
                Resumen de Saberes y Actividades Evaluadas
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-400/20 text-teal-300 border border-teal-400/30">
                {activities.length} registradas
              </span>
            </div>
            <p className="text-[10px] text-slate-300 font-medium mt-0.5">
              Periodo {periodId.toUpperCase()} · {subject} · Grado {grade} - Curso {course}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            {isCollapsed ? <><ChevronDown size={14} /> Mostrar</> : <><ChevronUp size={14} /> Minimizar</>}
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
              onClick={() => setFilterCategory("ALL")}
              className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${
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
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${
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

          {/* Cards Grid / Table */}
          {filtered.length === 0 ? (
            <div className="py-12 px-6 text-center text-slate-400 space-y-2">
              <Sparkles size={28} className="mx-auto text-slate-300 opacity-60" />
              <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                Aún no has registrado notas en este curso para el periodo {periodId.toUpperCase()}
              </p>
              <p className="text-[10px] text-slate-400 max-w-md mx-auto">
                Escribe un nombre de actividad en el calificador de abajo, ingresa notas y pulsa "Guardar Todo". Aparecerán automáticamente en este resumen con fecha y pilar evaluado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filtered.map(act => {
                  const meta = CATEGORY_META[act.category];
                  const completionRate = act.totalStudents > 0 ? Math.round((act.evaluatedCount / act.totalStudents) * 100) : 0;
                  const isComplete = act.evaluatedCount >= act.totalStudents && act.totalStudents > 0;

                  return (
                    <div
                      key={act.key}
                      onClick={() => onSelectActivity && onSelectActivity(act.category, act.slotIndex, act.cleanTitle)}
                      className={`group p-4 rounded-2xl border transition-all relative overflow-hidden bg-white hover:shadow-md hover:-translate-y-0.5 ${
                        onSelectActivity ? "cursor-pointer hover:border-teal-400" : ""
                      } border-slate-200`}
                    >
                      {/* Top badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase border ${meta.color} flex items-center gap-1`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {meta.label} ({meta.weight})
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                          {act.colLabel}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-black text-slate-800 uppercase leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors">
                        {act.cleanTitle}
                      </h4>

                      {/* Footer with stats and date */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[9.5px]">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{act.date || "Fecha no registrada"}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {act.average !== null && (
                            <span className={`font-black px-1.5 py-0.5 rounded ${
                              act.average >= 4.0 ? "bg-emerald-50 text-emerald-700" : act.average >= 3.0 ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                            }`}>
                              Prom: {act.average.toFixed(1)}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 font-bold ${isComplete ? "text-emerald-600" : "text-amber-600"}`}>
                            <UserCheck size={12} />
                            {act.evaluatedCount}/{act.totalStudents} ({completionRate}%)
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso sutil */}
                      <div className="w-full h-1 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${completionRate}%` }}
                        />
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
  );
}
