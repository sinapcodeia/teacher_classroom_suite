"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import React from "react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import {
  Save, Award, FileText, CheckCircle2, List, User,
  ChevronLeft, ChevronRight, AlertTriangle, Zap, Search, X
} from "lucide-react";

interface ActivityGraderProps {
  course: string;
  subject: string;
  grade: string;
}

type GradeMode = "list" | "individual";

const QUICK_SCORES = [1.0, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0];

function scoreColor(n: number) {
  if (n >= 4.6) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (n >= 4.0) return "text-blue-600 bg-blue-50 border-blue-200";
  if (n >= 3.0) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

const StudentRow = React.memo(({
  student,
  idx,
  val,
  hasSaved,
  hasDuplicate,
  activityTitle,
  onGradeChange,
  onKeyDown,
  inputRef
}: {
  student: any;
  idx: number;
  val: string;
  hasSaved: boolean;
  hasDuplicate: boolean;
  activityTitle: string;
  onGradeChange: (id: string, val: string) => void;
  onKeyDown: (e: any, idx: number) => void;
  inputRef: (el: HTMLInputElement | null) => void;
}) => {
  const num = parseFloat(val);
  return (
    <tr className={`transition-colors ${hasSaved ? "bg-emerald-50/40" : "hover:bg-surface-container-lowest"}`}>
      <td className="px-6 py-3 text-[10px] font-black text-on-surface-variant">{idx + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 ${hasSaved ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}>
            {hasSaved ? <CheckCircle2 size={16} /> : `${(student.primerApellido || "")[0] || ""}${(student.primerNombre || "")[0] || ""}`}
          </div>
          <div>
            <p className="text-[11px] font-black uppercase text-on-surface leading-tight">
              {student.primerApellido || ""} {student.segundoApellido || ""}{student.primerApellido ? "," : ""} {student.primerNombre || ""} {student.segundoNombre || ""}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[8px] font-bold text-on-surface-variant opacity-50 uppercase">{student.nroDocumento}</p>
              {hasDuplicate && activityTitle && (
                <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={9} /> Nota registrada
                </span>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-md">{normalizeGrade(student.grado)}</span>
          <span className="text-[8px] font-bold text-on-surface-variant opacity-50">{student.curso}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${scoreColor(student.avgGrade || 0)}`}>
          {(student.avgGrade || 0).toFixed(1)}
        </span>
      </td>
      <td className="px-6 py-3 text-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          placeholder="—"
          value={val}
          onChange={e => onGradeChange(student.id, e.target.value)}
          onKeyDown={e => onKeyDown(e, idx)}
          className={`w-20 h-11 border-2 rounded-xl text-center font-black text-base outline-none transition-all focus:scale-110 focus:shadow-lg ${
            val !== "" && !isNaN(num)
              ? `${scoreColor(num)} border-current/30 focus:ring-2 focus:ring-current/30`
              : "border-outline-variant bg-surface-container-low focus:border-primary focus:ring-2 focus:ring-primary/20"
          }`}
        />
      </td>
    </tr>
  );
});
StudentRow.displayName = "StudentRow";

export default function ActivityGrader({ course, subject, grade }: ActivityGraderProps) {
  const { students, myStudents, addGrade, updateSingleDetailedGrade, masterData } = useApp();
  const [targetCategory, setTargetCategory] = useState<"sb" | "sbh" | "sr" | "cv" | "aut">("sbh");
  const [targetSlot, setTargetSlot] = useState(0);

  const [mode, setMode] = useState<GradeMode>("list");
  const [activityTitle, setActivityTitle] = useState("");
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  // Search & Past Activity states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActivityKey, setSelectedActivityKey] = useState<string>("new");

  // Individual mode
  const [currentIdx, setCurrentIdx] = useState(0);
  const [indivScore, setIndivScore] = useState("5.0");
  const [indivSaving, setIndivSaving] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getActivePeriod = useCallback(() => {
    if (subject === "FÍSICA" && normalizeGrade(grade) === "6") return "p1";
    return masterData.activePeriod || "p2";
  }, [subject, grade, masterData.activePeriod]);

  const filteredStudents = useMemo(() =>
    myStudents
      .filter(s => 
        s.curso === course && 
        normalizeGrade(s.grado) === normalizeGrade(grade) && 
        s.isActive !== false
      )
      .sort((a, b) => {
        const nameA = `${a.primerApellido || ""} ${a.segundoApellido || ""} ${a.primerNombre || ""} ${a.segundoNombre || ""}`.trim().toUpperCase();
        const nameB = `${b.primerApellido || ""} ${b.segundoApellido || ""} ${b.primerNombre || ""} ${b.segundoNombre || ""}`.trim().toUpperCase();
        return nameA.localeCompare(nameB);
      }),
    [myStudents, course, grade]
  );

  const searchedStudents = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredStudents;
    return filteredStudents.filter(s => {
      const fullName = `${s.primerApellido || ""} ${s.segundoApellido || ""} ${s.primerNombre || ""} ${s.segundoNombre || ""}`.toLowerCase();
      return fullName.includes(term) || (s.nroDocumento && s.nroDocumento.includes(term));
    });
  }, [filteredStudents, searchTerm]);

  // Overall grading statistics (independent of search filter)
  const gradedCount = filteredStudents.filter(s => grades[s.id] && grades[s.id] !== "").length;
  const total = filteredStudents.length;

  const currentStudent = searchedStudents[currentIdx];

  // Reset index when course changes
  useEffect(() => {
    setCurrentIdx(0);
    setSearchTerm("");
    setSelectedActivityKey("new");
    setActivityTitle("");
  }, [course]);

  // Reset index when search term changes
  useEffect(() => {
    setCurrentIdx(0);
  }, [searchTerm]);

  // Compile unique past activities for this course/subject in the current period
  const pastActivities = useMemo(() => {
    const activityMap = new Map<string, {
      title: string;
      cleanTitle: string;
      category: "sb" | "sbh" | "sr" | "cv" | "aut";
      slotIndex: number;
      date: string;
    }>();

    const periodId = getActivePeriod();
    const subjectUpper = subject.toUpperCase();

    filteredStudents.forEach(student => {
      if (student.grades) {
        student.grades.forEach(g => {
          if (g.periodId !== periodId) return;

          const subjectTag = `[${subjectUpper}]`;
          if (g.title && g.title.toUpperCase().includes(subjectTag)) {
            const cleanTitle = g.title.replace(new RegExp(`\\s*\\[${subject}\\s*\\]\\s*`, 'i'), '').trim();
            const category = g.category || (g.type === 'exam' ? 'sb' : (g.type === 'participation' ? 'sr' : 'sbh'));
            const slotIndex = g.slotIndex !== undefined ? g.slotIndex : 0;
            const key = `${category}-${slotIndex}`;

            if (!activityMap.has(key)) {
              activityMap.set(key, {
                title: g.title,
                cleanTitle: cleanTitle || g.title,
                category,
                slotIndex,
                date: g.date
              });
            }
          }
        });
      }
    });

    return Array.from(activityMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredStudents, subject, grade, getActivePeriod]);

  // Dynamic grade pre-loading from detailedGrades when category/slot details change
  useEffect(() => {
    const periodId = getActivePeriod();
    const loadedGrades: Record<string, string> = {};

    filteredStudents.forEach(student => {
      const detailed = student.detailedGrades?.[subject]?.[periodId];
      if (detailed) {
        let score: number | null = null;
        if (targetCategory === 'aut') {
          score = detailed.aut;
        } else {
          const catArray = detailed[targetCategory];
          if (catArray && catArray[targetSlot] !== undefined) {
            score = catArray[targetSlot];
          }
        }
        loadedGrades[student.id] = score !== null && score !== undefined ? score.toString() : "";
      } else {
        loadedGrades[student.id] = "";
      }
    });

    setGrades(loadedGrades);
    setSavedIds(new Set()); // Reset save flags when slot changes
  }, [targetCategory, targetSlot, subject, course, grade, filteredStudents, getActivePeriod]);

  // Sync individual student score when selection changes
  useEffect(() => {
    if (currentStudent) {
      const periodId = getActivePeriod();
      const detailed = currentStudent.detailedGrades?.[subject]?.[periodId];
      let score: number | null = null;
      if (detailed) {
        if (targetCategory === 'aut') {
          score = detailed.aut;
        } else {
          const catArray = detailed[targetCategory];
          if (catArray && catArray[targetSlot] !== undefined) {
            score = catArray[targetSlot];
          }
        }
      }
      setIndivScore(score !== null && score !== undefined ? score.toString() : "5.0");
    }
  }, [currentStudent, targetCategory, targetSlot, subject, getActivePeriod]);

  // Handlers
  const handleActivitySelection = (key: string) => {
    setSelectedActivityKey(key);
    if (key === "new") {
      setActivityTitle("");
      return;
    }

    const found = pastActivities.find(act => `${act.category}-${act.slotIndex}` === key);
    if (found) {
      setActivityTitle(found.cleanTitle);
      setTargetCategory(found.category);
      setTargetSlot(found.slotIndex);
    }
  };

  const handleGradeChange = useCallback((studentId: string, rawValue: string) => {
    const value = rawValue.replace(",", ".");
    const num = parseFloat(value);
    if (value !== "" && (isNaN(num) || num < 0 || num > 5)) return;
    setGrades(prev => ({ ...prev, [studentId]: value }));
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const next = searchedStudents[idx + 1];
      if (next) inputRefs.current[next.id]?.focus();
    }
  }, [searchedStudents]);

  const handleSaveAll = async () => {
    if (!activityTitle.trim()) return alert("Ingresa un nombre para la actividad.");
    const toGrade = Object.keys(grades).filter(id => grades[id] !== "");
    if (toGrade.length === 0) return alert("No hay notas ingresadas.");
    
    setIsSaving(true);
    const today = new Date().toISOString();
    const periodId = getActivePeriod();
    const prefix = `[${subject.toUpperCase()}]`;
    const fullTitle = activityTitle.startsWith('[') ? activityTitle : `${prefix} ${activityTitle}`;

    try {
      for (const id of toGrade) {
        const score = parseFloat(grades[id]);
        
        // 1. Sincronización con el Pilar Institucional (Planilla Oficial)
        await updateSingleDetailedGrade(id, subject, periodId, targetCategory, targetSlot, score);
        
        // 2. Historial de sesión (Visibilidad en Consola y Sabana)
        await addGrade(id, { 
          title: fullTitle, 
          score, 
          type: targetCategory === 'sb' ? 'exam' : (targetCategory === 'sbh' ? 'participation' : 'activity'), 
          date: today,
          periodId,
          category: targetCategory,
          slotIndex: targetSlot
        });
      }
      setSavedIds(prev => new Set([...prev, ...toGrade]));
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); }, 3500);
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Hubo un error al guardar las notas.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (!activityTitle.trim()) return alert("Ingresa un nombre para la evaluación.");
    if (!currentStudent) return;
    
    setIndivSaving(true);
    const periodId = getActivePeriod();
    const score = parseFloat(indivScore) || 0;
    const today = new Date().toISOString();
    const prefix = `[${subject.toUpperCase()}]`;
    const fullTitle = activityTitle.startsWith('[') ? activityTitle : `${prefix} ${activityTitle}`;

    try {
      // 1. Sincronización con el Pilar Institucional
      await updateSingleDetailedGrade(currentStudent.id, subject, periodId, targetCategory, targetSlot, score);

      // 2. Historial de sesión
      await addGrade(currentStudent.id, {
        title: fullTitle,
        score,
        type: targetCategory === 'sb' ? 'exam' : (targetCategory === 'sbh' ? 'participation' : 'activity'),
        date: today,
        periodId,
        category: targetCategory,
        slotIndex: targetSlot
      });
      
      setSavedIds(prev => new Set([...prev, currentStudent.id]));
      
      if (currentIdx < searchedStudents.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error al guardar:", err);
      alert("Error al guardar.");
    } finally {
      setIndivSaving(false);
    }
  };

  // Shared UI blocks
  const renderHeader = () => (
    <div className="p-6 border-b border-outline-variant bg-surface-container-lowest space-y-5">
      {/* Title row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Award size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-on-surface tracking-tighter uppercase italic">Panel de Calificaciones</h2>
            <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">
              Curso: {course} · {subject}
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 bg-surface-container-low rounded-2xl p-1.5 border border-outline-variant">
          <button
            onClick={() => setMode("list")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "list" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <List size={14} /> Modo Lista
          </button>
          <button
            onClick={() => { setMode("individual"); setCurrentIdx(0); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "individual" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <User size={14} /> Uno a Uno
          </button>
        </div>
      </div>

      {/* Dynamic Search Box */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Buscar estudiante por nombre, apellido o documento..."
          className="w-full bg-surface-container-low border border-outline-variant rounded-2xl pl-12 pr-10 py-3.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none uppercase shadow-sm"
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline opacity-40 animate-pulse" size={16} />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Institutional Config Card */}
      <div className="flex flex-col gap-5 bg-slate-50 p-5 md:p-8 rounded-[2.5rem] border border-slate-200 shadow-inner">
        {/* Past Activity Selection Dropdown */}
        <div className="space-y-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Actividad (Nueva o Existente)</p>
          <select
            value={selectedActivityKey}
            onChange={e => handleActivitySelection(e.target.value)}
            className="w-full h-14 bg-white border border-outline-variant rounded-2xl px-5 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary shadow-sm cursor-pointer"
          >
            <option value="new">+ REGISTRAR NUEVA ACTIVIDAD (INGRESAR DETALLES)</option>
            {pastActivities.map(act => (
              <option key={`${act.category}-${act.slotIndex}`} value={`${act.category}-${act.slotIndex}`}>
                [{act.category.toUpperCase()} - COL {act.slotIndex + 1}] {act.cleanTitle.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col xl:flex-row gap-4">
          <div className="flex-1 space-y-2 min-w-[200px]">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción de la Actividad</p>
            <div className="relative">
              <input
                type="text"
                value={activityTitle}
                onChange={e => setActivityTitle(e.target.value)}
                placeholder="Ej: Taller de circuitos, Examen parcial..."
                disabled={selectedActivityKey !== "new"}
                className={`w-full border border-outline-variant rounded-2xl px-5 py-4 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-primary outline-none uppercase shadow-sm ${
                  selectedActivityKey !== "new" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                }`}
              />
              <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-outline opacity-30" size={18} />
            </div>
          </div>

          <div className="md:flex gap-4">
            <div className="flex-1 md:w-64 space-y-2">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilar Institucional</p>
              <select
                value={targetCategory}
                onChange={e => setTargetCategory(e.target.value as any)}
                disabled={selectedActivityKey !== "new"}
                className={`w-full h-14 border border-outline-variant rounded-2xl px-5 font-black text-[9px] sm:text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary shadow-sm ${
                  selectedActivityKey !== "new" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                }`}
              >
                <option value="sb">SABER (30%) - EXÁMENES</option>
                <option value="sbh">SABER-HACER (40%) - PARTICIPACIÓN</option>
                <option value="sr">SER (20%) - ACTITUDINAL</option>
                <option value="cv">CONVIVENCIA (5%)</option>
                <option value="aut">AUTOEVALUACIÓN (5%)</option>
              </select>
            </div>

            <div className="w-full md:w-32 space-y-2 mt-4 md:mt-0">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Columna</p>
              <select
                value={targetSlot}
                onChange={e => setTargetSlot(parseInt(e.target.value))}
                disabled={selectedActivityKey !== "new"}
                className={`w-full h-14 border border-outline-variant rounded-2xl px-5 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary shadow-sm ${
                  selectedActivityKey !== "new" ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
                }`}
              >
                {[...Array(targetCategory === 'sr' ? 5 : (targetCategory === 'cv' ? 3 : (targetCategory === 'aut' ? 1 : 8)))].map((_, i) => (
                  <option key={i} value={i}>COL {i + 1}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={20} />
          <span className="text-xs font-black uppercase tracking-widest">¡Notas guardadas correctamente en los perfiles!</span>
        </div>
      )}
    </div>
  );

  // ── LIST MODE ─────────────────────────────────────────────────────────────
  if (mode === "list") {
    return (
      <section className="bg-white border border-outline-variant rounded-[2.5rem] shadow-xl overflow-hidden mt-6">
        {renderHeader()}

        {/* Progress bar */}
        <div className="px-6 py-3 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex-1 h-2 bg-outline-variant/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: total > 0 ? `${(gradedCount / total) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
              {gradedCount} / {total} calificados
            </span>
          </div>
          <button
            onClick={handleSaveAll}
            disabled={isSaving || gradedCount === 0}
            className="ml-4 px-6 py-2.5 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
          >
            <Save size={14} />
            {isSaving ? "Guardando…" : "Guardar Todo"}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[540px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[9px] font-black uppercase tracking-[0.18em] border-b border-outline-variant/30">
                <th className="px-6 py-4 text-left w-8">#</th>
                <th className="px-4 py-4 text-left">Estudiante</th>
                <th className="px-4 py-4 text-center">Grado / Curso</th>
                <th className="px-4 py-4 text-center">Promedio</th>
                <th className="px-6 py-4 text-center w-32">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {searchedStudents.map((student, idx) => {
                const val = grades[student.id] || "";
                const hasSaved = savedIds.has(student.id);

                const prefix = `[${subject.toUpperCase()}]`;
                const fullTitle = activityTitle.startsWith('[') ? activityTitle : `${prefix} ${activityTitle}`;
                const hasDuplicate = !!student.grades?.some(g => g.title?.toLowerCase() === fullTitle.toLowerCase());

                return (
                  <StudentRow
                    key={student.id}
                    student={student}
                    idx={idx}
                    val={val}
                    hasSaved={hasSaved}
                    hasDuplicate={hasDuplicate}
                    activityTitle={activityTitle}
                    onGradeChange={handleGradeChange}
                    onKeyDown={handleKeyDown}
                    inputRef={el => { inputRefs.current[student.id] = el; }}
                  />
                );
              })}
              {searchedStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant opacity-40 font-bold uppercase tracking-wider text-[10px]">
                    No se encontraron estudiantes que coincidan con la búsqueda
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 bg-surface-container-lowest border-t border-outline-variant text-center">
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">
            Usa <kbd className="px-1.5 py-0.5 bg-surface-container border border-outline-variant rounded text-[8px]">Tab</kbd> o{" "}
            <kbd className="px-1.5 py-0.5 bg-surface-container border border-outline-variant rounded text-[8px]">Enter</kbd>{" "}
            para avanzar al siguiente estudiante
          </p>
        </div>
      </section>
    );
  }

  // ── INDIVIDUAL MODE ───────────────────────────────────────────────────────
  const scoreNum = parseFloat(indivScore) || 0;
  const scoreConf = scoreColor(scoreNum);
  const pct = (scoreNum / 5) * 100;
  const totalSearched = searchedStudents.length;

  const prefix = `[${subject.toUpperCase()}]`;
  const fullTitle = activityTitle.startsWith('[') ? activityTitle : `${prefix} ${activityTitle}`;

  return (
    <section className="bg-white border border-outline-variant rounded-[2.5rem] shadow-xl overflow-hidden mt-6">
      {renderHeader()}

      {/* Navigator */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-container-low border-b border-outline-variant">
        <button
          onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); }}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-outline-variant text-[10px] font-black uppercase tracking-widest hover:bg-surface-container transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 max-w-[200px] sm:max-w-[400px] overflow-x-auto py-1">
            {searchedStudents.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrentIdx(i); }}
                className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${
                  i === currentIdx ? "bg-primary scale-125 font-black ring-2 ring-primary ring-offset-2" : savedIds.has(s.id) ? "bg-emerald-400" : "bg-outline-variant"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest shrink-0">
            {totalSearched > 0 ? `${currentIdx + 1} / ${totalSearched}` : "0 / 0"}
          </span>
        </div>
        <button
          onClick={() => { setCurrentIdx(i => Math.min(totalSearched - 1, i + 1)); }}
          disabled={currentIdx >= totalSearched - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-outline-variant text-[10px] font-black uppercase tracking-widest hover:bg-surface-container transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          Siguiente <ChevronRight size={16} />
        </button>
      </div>

      {currentStudent ? (
        <div className="p-8 space-y-6">
          {/* Student card */}
          <div className="flex items-center gap-6 p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-black border-4 shrink-0 ${savedIds.has(currentStudent.id) ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-primary/10 text-primary border-primary/20"}`}>
              {savedIds.has(currentStudent.id)
                ? <CheckCircle2 size={36} />
                : `${(currentStudent.primerApellido || "")[0] || ""}${(currentStudent.primerNombre || "")[0] || ""}`
              }
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black uppercase text-on-surface leading-tight truncate">
                {currentStudent.primerApellido} {currentStudent.segundoApellido}
              </h3>
              <p className="text-sm font-bold text-on-surface-variant uppercase">{currentStudent.primerNombre} {currentStudent.segundoNombre}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-[9px] font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg">GRADO {normalizeGrade(currentStudent.grado)}</span>
                <span className="text-[9px] font-black bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-lg">CURSO {currentStudent.curso}</span>
                <span className="text-[9px] font-black bg-surface-container text-on-surface-variant px-2.5 py-0.5 rounded-lg">DOC: {currentStudent.nroDocumento}</span>
                {currentStudent.avgGrade > 0 && (
                  <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-lg border ${scoreColor(currentStudent.avgGrade)}`}>
                    PROM: {currentStudent.avgGrade.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Score input */}
          <div className="space-y-4">
            <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest text-center">Calificación (0.0 – 5.0)</p>

            {/* Big score display */}
            <div className="flex flex-col items-center gap-3">
              <input
                type="number"
                step="0.1" min="0" max="5"
                value={indivScore}
                onChange={e => setIndivScore(e.target.value)}
                className={`w-40 h-20 border-4 rounded-3xl text-center text-5xl font-black outline-none transition-all focus:scale-105 ${scoreConf}`}
              />
              {/* Progress bar */}
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-current"
                  style={{ width: `${Math.min(pct, 100)}%`, color: "inherit" }}
                />
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="0" max="5" step="0.1"
              value={indivScore}
              onChange={e => setIndivScore(parseFloat(e.target.value).toFixed(1))}
              className="w-full accent-primary h-2 cursor-pointer"
            />

            {/* Quick buttons */}
            <div className="grid grid-cols-7 gap-2">
              {QUICK_SCORES.map(s => (
                <button
                  key={s}
                  onClick={() => setIndivScore(s.toFixed(1))}
                  className={`py-2.5 rounded-xl text-[10px] font-black uppercase border-2 transition-all hover:scale-105 ${
                    parseFloat(indivScore) === s ? `${scoreColor(s)} border-current/40 scale-105` : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary hover:text-primary"
                  }`}
                >
                  {s.toFixed(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Previous grades of this student for this activity */}
          {activityTitle && currentStudent.grades && currentStudent.grades.filter(g => g.title?.toLowerCase() === fullTitle.toLowerCase()).length > 0 && (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-emerald-800">Este estudiante ya tiene una nota guardada para esta actividad</p>
                {currentStudent.grades.filter(g => g.title?.toLowerCase() === fullTitle.toLowerCase()).map(g => (
                  <p key={g.id} className="text-[9px] font-bold text-emerald-700">{g.date?.slice(0, 10)} → {g.score.toFixed(1)}</p>
                ))}
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex gap-3">
            <button
              onClick={handleSaveAndNext}
              disabled={indivSaving || !activityTitle.trim()}
              className="flex-1 py-5 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-3"
            >
              {indivSaving ? (
                <span className="animate-pulse">Guardando…</span>
              ) : currentIdx < totalSearched - 1 ? (
                <><Save size={18} /> Guardar y Siguiente <ChevronRight size={18} /></>
              ) : (
                <><Zap size={18} /> Guardar Último</>
              )}
            </button>
          </div>

          {/* Saved count */}
          <p className="text-center text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">
            {gradedCount} de {total} estudiantes calificados en total
          </p>
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center gap-3 text-on-surface-variant opacity-30">
          <Award size={40} />
          <p className="text-xs font-black uppercase tracking-widest">Sin estudiantes que coincidan con el filtro</p>
        </div>
      )}
    </section>
  );
}
