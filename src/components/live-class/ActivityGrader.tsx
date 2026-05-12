"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import {
  Save, Award, FileText, CheckCircle2, List, User,
  ChevronLeft, ChevronRight, AlertTriangle, Zap,
} from "lucide-react";

interface ActivityGraderProps {
  course: string;
  subject: string;
}

type GradeMode = "list" | "individual";

const QUICK_SCORES = [1.0, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0];

function scoreColor(n: number) {
  if (n >= 4.6) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (n >= 4.0) return "text-blue-600 bg-blue-50 border-blue-200";
  if (n >= 3.0) return "text-amber-600 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export default function ActivityGrader({ course, subject }: ActivityGraderProps) {
  const { students, addGrade } = useApp();

  const [mode, setMode] = useState<GradeMode>("list");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityType, setActivityType] = useState<"activity" | "participation" | "exam">("activity");
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSuccess, setShowSuccess] = useState(false);

  // Individual mode
  const [currentIdx, setCurrentIdx] = useState(0);
  const [indivScore, setIndivScore] = useState("5.0");
  const [indivSaving, setIndivSaving] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const filteredStudents = useMemo(() =>
    students
      .filter(s => s.curso === course && s.isActive !== false)
      .sort((a, b) => a.primerApellido.localeCompare(b.primerApellido)),
    [students, course]
  );

  const gradedCount = Object.values(grades).filter(v => v !== "").length;
  const total = filteredStudents.length;

  // Reset individual index when course changes
  useEffect(() => { setCurrentIdx(0); }, [course]);

  const currentStudent = filteredStudents[currentIdx];

  // ── List mode helpers ────────────────────────────────────────────────────
  const handleGradeChange = (studentId: string, rawValue: string) => {
    const value = rawValue.replace(",", ".");
    const num = parseFloat(value);
    if (value !== "" && (isNaN(num) || num < 0 || num > 5)) return;
    setGrades(prev => ({ ...prev, [studentId]: value }));
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      const next = filteredStudents[idx + 1];
      if (next) inputRefs.current[next.id]?.focus();
    }
  };

  const handleSaveAll = async () => {
    if (!activityTitle.trim()) return alert("Ingresa un nombre para la actividad.");
    const toGrade = Object.keys(grades).filter(id => grades[id] !== "");
    if (toGrade.length === 0) return alert("No hay notas ingresadas.");
    setIsSaving(true);
    const prefixedTitle = subject ? `[${subject}] ${activityTitle}` : activityTitle;
    try {
      const today = new Date().toISOString();
      await Promise.all(toGrade.map(id =>
        addGrade(id, { title: prefixedTitle, score: parseFloat(grades[id]), type: activityType, date: today })
      ));
      setSavedIds(prev => new Set([...prev, ...toGrade]));
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); setGrades({}); setActivityTitle(""); }, 3500);
    } catch { alert("Error al guardar las notas."); }
    finally { setIsSaving(false); }
  };

  // ── Individual mode helpers ───────────────────────────────────────────────
  const handleSaveAndNext = async () => {
    if (!activityTitle.trim()) return alert("Ingresa un nombre para la evaluación.");
    if (!currentStudent) return;
    setIndivSaving(true);
    const prefixedTitle = subject ? `[${subject}] ${activityTitle}` : activityTitle;
    try {
      await addGrade(currentStudent.id, {
        title: prefixedTitle,
        score: parseFloat(indivScore) || 0,
        type: activityType,
        date: new Date().toISOString(),
      });
      setSavedIds(prev => new Set([...prev, currentStudent.id]));
      if (currentIdx < total - 1) {
        setCurrentIdx(i => i + 1);
        setIndivScore("5.0");
      } else {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } catch { alert("Error al guardar."); }
    finally { setIndivSaving(false); }
  };

  // ── Shared header ────────────────────────────────────────────────────────
  const Header = () => (
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
            onClick={() => { setMode("individual"); setCurrentIdx(0); setIndivScore("5.0"); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === "individual" ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            <User size={14} /> Uno a Uno
          </button>
        </div>
      </div>

      {/* Activity config */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={activityTitle}
            onChange={e => setActivityTitle(e.target.value)}
            placeholder="Nombre de la evaluación / actividad…"
            className="w-full bg-white border border-outline-variant rounded-2xl px-5 py-3.5 text-sm font-bold focus:ring-2 focus:ring-primary outline-none uppercase"
          />
          <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
        </div>
        <select
          value={activityType}
          onChange={e => setActivityType(e.target.value as typeof activityType)}
          className="bg-white border border-outline-variant rounded-2xl px-4 py-3.5 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="activity">Actividad / Taller</option>
          <option value="exam">Examen / Evaluación</option>
          <option value="participation">Participación</option>
        </select>
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
        <Header />

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
              {filteredStudents.map((student, idx) => {
                const val = grades[student.id] || "";
                const num = parseFloat(val);
                const hasSaved = savedIds.has(student.id);
                const hasDuplicate = student.grades?.some(g => g.title === activityTitle && g.date?.slice(0, 10) === new Date().toISOString().slice(0, 10));

                return (
                  <tr key={student.id} className={`transition-colors ${hasSaved ? "bg-emerald-50/40" : "hover:bg-surface-container-lowest"}`}>
                    <td className="px-6 py-3 text-[10px] font-black text-on-surface-variant">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-[10px] shrink-0 ${hasSaved ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"}`}>
                          {hasSaved ? <CheckCircle2 size={16} /> : `${student.primerApellido[0]}${student.primerNombre[0]}`}
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase text-on-surface leading-tight">
                            {student.primerApellido} {student.segundoApellido}, {student.primerNombre}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="text-[8px] font-bold text-on-surface-variant opacity-50 uppercase">{student.nroDocumento}</p>
                            {hasDuplicate && activityTitle && (
                              <span className="text-[8px] font-black bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                                <AlertTriangle size={9} /> Ya tiene esta nota
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
                        ref={el => { inputRefs.current[student.id] = el; }}
                        type="text"
                        inputMode="decimal"
                        placeholder="—"
                        value={val}
                        onChange={e => handleGradeChange(student.id, e.target.value)}
                        onKeyDown={e => handleKeyDown(e, idx)}
                        className={`w-20 h-11 border-2 rounded-xl text-center font-black text-base outline-none transition-all focus:scale-110 focus:shadow-lg ${
                          val !== "" && !isNaN(num)
                            ? `${scoreColor(num)} border-current/30 focus:ring-2 focus:ring-current/30`
                            : "border-outline-variant bg-surface-container-low focus:border-primary focus:ring-2 focus:ring-primary/20"
                        }`}
                      />
                    </td>
                  </tr>
                );
              })}
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

  return (
    <section className="bg-white border border-outline-variant rounded-[2.5rem] shadow-xl overflow-hidden mt-6">
      <Header />

      {/* Navigator */}
      <div className="flex items-center justify-between px-6 py-3 bg-surface-container-low border-b border-outline-variant">
        <button
          onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setIndivScore("5.0"); }}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-outline-variant text-[10px] font-black uppercase tracking-widest hover:bg-surface-container transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft size={16} /> Anterior
        </button>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {filteredStudents.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setCurrentIdx(i); setIndivScore("5.0"); }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIdx ? "bg-primary scale-125" : savedIds.has(s.id) ? "bg-emerald-400" : "bg-outline-variant"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">
            {currentIdx + 1} / {total}
          </span>
        </div>
        <button
          onClick={() => { setCurrentIdx(i => Math.min(total - 1, i + 1)); setIndivScore("5.0"); }}
          disabled={currentIdx >= total - 1}
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
                : `${currentStudent.primerApellido[0]}${currentStudent.primerNombre[0]}`
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
          {activityTitle && currentStudent.grades && currentStudent.grades.filter(g => g.title === activityTitle).length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-amber-800">Este estudiante ya tiene una nota con este nombre</p>
                {currentStudent.grades.filter(g => g.title === activityTitle).map(g => (
                  <p key={g.id} className="text-[9px] font-bold text-amber-700">{g.date?.slice(0, 10)} → {g.score.toFixed(1)}</p>
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
              ) : currentIdx < total - 1 ? (
                <><Save size={18} /> Guardar y Siguiente <ChevronRight size={18} /></>
              ) : (
                <><Zap size={18} /> Guardar Último</>
              )}
            </button>
          </div>

          {/* Saved count */}
          <p className="text-center text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">
            {savedIds.size} de {total} estudiantes calificados
          </p>
        </div>
      ) : (
        <div className="py-16 flex flex-col items-center gap-3 text-on-surface-variant opacity-30">
          <Award size={40} />
          <p className="text-xs font-black uppercase tracking-widest">Sin estudiantes en este curso</p>
        </div>
      )}
    </section>
  );
}
