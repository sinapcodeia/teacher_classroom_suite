"use client";

import { useState } from "react";
import { useApp, ScheduleBlock, TeacherProfile } from "@/context/AppContext";
import { User, Phone, BookOpen, Calendar, ChevronRight, ChevronLeft, Check, Plus, Trash2 } from "lucide-react";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ALL_GRADES = ["1°","2°","3°","4°","5°","6°","7°","8°","9°","10°","11°"];
const DAYS = ["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES"] as const;

// Time slots for IETABA (Official from image)
const TIME_SLOTS = [
  { start: "07:30", end: "08:30", label: "07:30 – 08:30" },
  { start: "08:30", end: "09:30", label: "08:30 – 09:30" },
  { start: "09:30", end: "10:30", label: "09:30 – 10:30" },
  // 10:30 – 11:00 = DESCANSO
  { start: "11:00", end: "11:50", label: "11:00 – 11:50" },
  { start: "11:50", end: "12:40", label: "11:50 – 12:40" },
  { start: "12:40", end: "13:30", label: "12:40 – 01:30" },
];

const BLOCK_COLORS = [
  "bg-blue-100 text-blue-900",    "bg-emerald-100 text-emerald-900",
  "bg-amber-100 text-amber-900",  "bg-purple-100 text-purple-900",
  "bg-rose-100 text-rose-900",    "bg-cyan-100 text-cyan-900",
  "bg-lime-100 text-lime-900",    "bg-orange-100 text-orange-900",
];

function colorFor(subject: string, subjects: string[]): string {
  const i = subjects.indexOf(subject);
  return BLOCK_COLORS[i % BLOCK_COLORS.length] || BLOCK_COLORS[0];
}

// ── STEP INDICATOR ────────────────────────────────────────────────────────────
function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-all ${
        done ? "bg-emerald-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"
      }`}>
        {done ? <Check size={16}/> : step}
      </div>
      <span className={`text-[9px] font-bold uppercase tracking-widest hidden md:block ${active ? "text-blue-600" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  );
}

// ── SCHEDULE GRID ─────────────────────────────────────────────────────────────
function ScheduleGrid({
  blocks, subjects, onAdd, onRemove
}: {
  blocks: ScheduleBlock[];
  subjects: string[];
  onAdd: (block: Omit<ScheduleBlock, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState<{ day: typeof DAYS[number]; start: string; end: string } | null>(null);
  const [form, setForm] = useState({ subject: "", grade: ALL_GRADES[4], course: "" });

  const blockAt = (day: typeof DAYS[number], start: string) =>
    blocks.find(b => b.day === day && b.startTime === start);

  function openSlot(day: typeof DAYS[number], slot: typeof TIME_SLOTS[number]) {
    if (blockAt(day, slot.start)) return; // already has a block
    setEditing({ day, start: slot.start, end: slot.end });
    setForm({ subject: subjects[0] || "", grade: ALL_GRADES[4], course: "" });
  }

  function saveBlock() {
    if (!editing || !form.subject || !form.course) return;
    onAdd({
      day: editing.day,
      startTime: editing.start,
      endTime: editing.end,
      subject: form.subject,
      grade: form.grade,
      course: form.course,
      color: colorFor(form.subject, subjects) + " border-2",
    });
    setEditing(null);
  }

  return (
    <div>
      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full text-xs border-collapse min-w-[520px]">
          <thead>
            <tr>
              <th className="p-2 bg-gray-50 text-gray-400 font-black text-[9px] uppercase tracking-widest w-24">Hora</th>
              {DAYS.map(d => (
                <th key={d} className="p-2 bg-gray-50 text-gray-600 font-black text-[9px] uppercase tracking-widest">{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot.start}>
                <td className="p-2 text-center text-[9px] font-bold text-gray-400 bg-gray-50 border-t border-gray-100 whitespace-nowrap">
                  {slot.label}
                </td>
                {DAYS.map(day => {
                  const block = blockAt(day, slot.start);
                  return (
                    <td key={day} className="p-1.5 border-t border-l border-gray-100 align-top">
                      {block ? (
                        <div className={`rounded-xl p-2 text-[10px] font-black leading-tight flex items-start justify-between gap-1 ${block.color}`}>
                          <div>
                            <div>{block.subject}</div>
                            <div className="font-medium opacity-70">{block.course}</div>
                          </div>
                          <button onClick={() => onRemove(block.id)} className="opacity-50 hover:opacity-100 shrink-0">
                            <Trash2 size={10}/>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openSlot(day, slot)}
                          className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center text-gray-300 hover:text-blue-400"
                        >
                          <Plus size={14}/>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Break row */}
            <tr>
              <td className="p-2 text-center text-[9px] font-black text-amber-600 bg-amber-50 border-t border-amber-100">
                🔴 10:30–11:00
              </td>
              {DAYS.map(d => (
                <td key={d} className="p-2 bg-amber-50 border-t border-l border-amber-100 text-center text-[9px] font-bold text-amber-500">
                  DESCANSO
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Block editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h4 className="text-sm font-black uppercase tracking-widest mb-1 text-gray-800">Agregar Clase</h4>
            <p className="text-[10px] text-gray-400 mb-6">{editing.day} · {editing.start} – {editing.end}</p>

            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Materia</label>
                {subjects.length > 0 ? (
                  <select
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400"
                  >
                    {subjects.map(s => <option key={s}>{s}</option>)}
                  </select>
                ) : (
                  <input
                    placeholder="Ej: MATEMÁTICAS"
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value.toUpperCase() }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400"
                  />
                )}
              </div>

              {/* Grade */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Grado</label>
                <select
                  value={form.grade}
                  onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400"
                >
                  {ALL_GRADES.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>

              {/* Course/Group */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1.5">Grupo / Curso</label>
                <input
                  placeholder="Ej: 6-3, 6A, 5-1"
                  value={form.course}
                  onChange={e => setForm(f => ({ ...f, course: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-500">
                Cancelar
              </button>
              <button
                onClick={saveBlock}
                disabled={!form.subject || !form.course}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-40"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN WIZARD ───────────────────────────────────────────────────────────────
export default function OnboardingWizard() {
  const { updateProfile, profile } = useApp();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [firstName, setFirstName]   = useState(profile.firstName || "");
  const [lastName,  setLastName]    = useState(profile.lastName  || "");
  const [phone,     setPhone]       = useState(profile.phone     || "");

  // Step 2 fields
  const [grades,   setGrades]   = useState<string[]>(profile.teachingGrades   || []);
  const [courses,  setCourses]  = useState<string[]>(profile.teachingCourses  || []);
  const [subjects, setSubjects] = useState<string[]>(profile.teachingSubjectsList || []);
  const [newCourse,  setNewCourse]  = useState("");
  const [newSubject, setNewSubject] = useState("");

  // Step 3 — schedule blocks
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(profile.weeklySchedule || []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function toggleGrade(g: string) {
    setGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  function addCourse() {
    const v = newCourse.trim().toUpperCase();
    if (v && !courses.includes(v)) { setCourses(prev => [...prev, v]); }
    setNewCourse("");
  }

  function addSubject() {
    const v = newSubject.trim().toUpperCase();
    if (v && !subjects.includes(v)) { setSubjects(prev => [...prev, v]); }
    setNewSubject("");
  }

  function addBlock(block: Omit<ScheduleBlock, "id">) {
    setBlocks(prev => [...prev, { ...block, id: `blk-${Date.now()}-${Math.random().toString(36).slice(2)}` }]);
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  function nextStep() {
    setError("");
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) { setError("Ingresa tu nombre y apellidos."); return; }
    }
    if (step === 2) {
      if (grades.length === 0) { setError("Selecciona al menos un grado."); return; }
    }
    setStep(s => s + 1);
  }

  async function finish() {
    setSaving(true);
    setError("");
    try {
      const updates: Partial<TeacherProfile> = {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        phone:     phone.trim(),
        teachingGrades:      grades,
        teachingCourses:     courses,
        teachingSubjectsList: subjects,
        weeklySchedule:      blocks,
        isProfileComplete:   true,
      };
      await updateProfile(updates);
    } catch {
      setError("No se pudo guardar. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)" }}>

      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Configuración Inicial</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight italic">
            Bienvenido a EduManager
          </h1>
          <p className="text-blue-300 text-sm mt-1">Configura tu perfil docente para empezar</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <StepDot step={1} current={step} label="Identidad" />
          <div className="w-16 h-px bg-white/20" />
          <StepDot step={2} current={step} label="Carga Docente" />
          <div className="w-16 h-px bg-white/20" />
          <StepDot step={3} current={step} label="Horario" />
        </div>

        {/* Card */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl">

          {/* ── STEP 1: Personal Info ── */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <User size={20} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Datos Personales</h2>
                  <p className="text-[10px] text-gray-400">Tu identidad en la plataforma</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Primer Nombre *</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="ANTONIO"
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-sm focus:outline-none focus:border-blue-400 transition-all uppercase"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">Apellidos *</label>
                  <input value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="RODRÍGUEZ BURGOS"
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-sm focus:outline-none focus:border-blue-400 transition-all uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-2">
                  <Phone size={12} className="inline mr-1" /> Celular
                </label>
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                  type="tel"
                  className="w-full border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-sm focus:outline-none focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          )}

          {/* ── STEP 2: Teaching Config ── */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <BookOpen size={20} className="text-purple-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Carga Docente</h2>
                  <p className="text-[10px] text-gray-400">Grados, grupos y materias que dictas</p>
                </div>
              </div>

              {/* Grades */}
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Grados que dictas *</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_GRADES.map(g => (
                    <button key={g} onClick={() => toggleGrade(g)}
                      className={`px-4 py-2 rounded-full text-[11px] font-black uppercase transition-all ${
                        grades.includes(g)
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Courses */}
              <div className="mb-6">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Grupos / Cursos</label>
                <div className="flex gap-2 mb-2">
                  <input value={newCourse} onChange={e => setNewCourse(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCourse()}
                    placeholder="Ej: 6-3, 7A, 5-1"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-400 uppercase"
                  />
                  <button onClick={addCourse} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[11px] font-black">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {courses.map(c => (
                    <span key={c} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase">
                      {c}
                      <button onClick={() => setCourses(prev => prev.filter(x => x !== c))} className="hover:text-red-500"><Trash2 size={10}/></button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3">Materias que dictas</label>
                <div className="flex gap-2 mb-2">
                  <input value={newSubject} onChange={e => setNewSubject(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addSubject()}
                    placeholder="Ej: MATEMÁTICAS, TECNOLOGÍA"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-400 uppercase"
                  />
                  <button onClick={addSubject} className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-[11px] font-black">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(s => (
                    <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-[10px] font-black uppercase">
                      {s}
                      <button onClick={() => setSubjects(prev => prev.filter(x => x !== s))} className="hover:text-red-500"><Trash2 size={10}/></button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Schedule ── */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Calendar size={20} className="text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-800">Horario Semanal</h2>
                  <p className="text-[10px] text-gray-400">Haz clic en un bloque para agregar una clase</p>
                </div>
              </div>

              <ScheduleGrid
                blocks={blocks}
                subjects={subjects}
                onAdd={addBlock}
                onRemove={removeBlock}
              />

              <p className="text-[10px] text-gray-400 text-center mt-4">
                {blocks.length} clase(s) configurada(s) · Puedes modificar esto luego desde Configuración
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-[11px] font-bold text-center">
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-600 hover:bg-gray-50 transition-all">
                <ChevronLeft size={16}/> Anterior
              </button>
            ) : <div />}

            {step < 3 ? (
              <button onClick={nextStep} className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Siguiente <ChevronRight size={16}/>
              </button>
            ) : (
              <button onClick={finish} disabled={saving} className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-60">
                {saving ? "Guardando..." : <><Check size={16}/> Completar Perfil</>}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-blue-400/50 text-[9px] font-bold uppercase tracking-widest mt-6">
          EduManager · IETABA · Configuración Segura
        </p>
      </div>
    </div>
  );
}
