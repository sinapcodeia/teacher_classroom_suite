"use client";

import React, { useState, useCallback } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import RoleGuard from "@/components/shared/RoleGuard";
import { useApp, ScheduleBlock } from "@/context/AppContext";
import { printStudentsByCourse, printStudentsByGrade, printAttendanceSheet, printWeeklySchedule } from "@/lib/printService";
import { User, Calendar, Printer, Save, Plus, Trash2, ChevronRight, AlertTriangle, Sun, CheckCircle2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ── CONSTANTS ──────────────────────────────────────────────────────────────────
const DAYS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"] as const;
type DayType = typeof DAYS[number];

const SLOTS_MANANA = [
  { start: "07:30", end: "08:30" },
  { start: "08:30", end: "09:30" },
  { start: "09:30", end: "10:30" },
  // 10:30–11:00 DESCANSO
  { start: "11:00", end: "11:50" },
  { start: "11:50", end: "12:40" },
  { start: "12:40", end: "13:30" },
];

const BLOCK_COLORS = [
  "bg-blue-100 text-blue-900 border-blue-200",
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-purple-100 text-purple-900 border-purple-200",
  "bg-rose-100 text-rose-900 border-rose-200",
  "bg-cyan-100 text-cyan-900 border-cyan-200",
  "bg-lime-100 text-lime-900 border-lime-200",
  "bg-orange-100 text-orange-900 border-orange-200",
];

type Tab = "perfil" | "horario" | "impresion";
type Jornada = "MAÑANA";

function TabBtn({ id, active, label, icon: Icon, onClick }: { id: Tab; active: Tab; label: string; icon: React.ElementType; onClick: (t: Tab) => void }) {
  const isActive = id === active;
  return (
    <button onClick={() => onClick(id)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
      <Icon size={15} />{label}
    </button>
  );
}

// ── COLLISION CHECKER ──────────────────────────────────────────────────────────
interface CollisionResult {
  hasCollision: boolean;
  conflictWith?: string;
  conflictInfo?: string;
}

async function checkCollision(
  day: DayType,
  startTime: string,
  course: string,
  currentUserId: string
): Promise<CollisionResult> {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    for (const userDoc of usersSnap.docs) {
      if (userDoc.id === currentUserId) continue;
      const data = userDoc.data();
      const schedule: ScheduleBlock[] = data.weeklySchedule || [];
      const conflict = schedule.find(
        b => b.day === day && b.startTime === startTime && b.course === course
      );
      if (conflict) {
        const teacherName = data.name || data.firstName || "Otro docente";
        return {
          hasCollision: true,
          conflictWith: teacherName,
          conflictInfo: `${conflict.subject} · ${conflict.course}`,
        };
      }
    }
    return { hasCollision: false };
  } catch {
    return { hasCollision: false };
  }
}

// ── SCHEDULE GRID ──────────────────────────────────────────────────────────────
function ScheduleGrid({
  blocks,
  jornada,
  masterData,
  userId,
  onAdd,
  onRemove,
}: {
  blocks: ScheduleBlock[];
  jornada: Jornada;
  masterData: { subjects: string[]; grades: string[]; courses: string[] };
  userId: string;
  onAdd: (block: Omit<ScheduleBlock, "id">) => void;
  onRemove: (id: string) => void;
}) {
  const slots = SLOTS_MANANA; // Only MAÑANA for now (can extend for TARDE)
  const [editing, setEditing] = useState<{ day: DayType; start: string; end: string } | null>(null);
  const [form, setForm] = useState({
    subject: masterData.subjects[0] || "",
    grade: masterData.grades[0] || "",
    course: masterData.courses[0] || "",
  });
  const [checking, setChecking] = useState(false);
  const [collision, setCollision] = useState<CollisionResult | null>(null);

  const blockAt = (day: DayType, start: string) =>
    blocks.find(b => b.day === day && b.startTime === start);

  function openSlot(day: DayType, slot: typeof slots[number]) {
    if (blockAt(day, slot.start)) return;
    setEditing({ day, start: slot.start, end: slot.end });
    setForm({
      subject: masterData.subjects[0] || "",
      grade: masterData.grades[0] || "",
      course: masterData.courses[0] || "",
    });
    setCollision(null);
  }

  async function handleAdd() {
    if (!editing || !form.subject || !form.course) return;
    setChecking(true);
    setCollision(null);

    const result = await checkCollision(editing.day, editing.start, form.course, userId);
    setChecking(false);

    if (result.hasCollision) {
      setCollision(result);
      return;
    }

    const colorIndex = masterData.subjects.indexOf(form.subject);
    const color = BLOCK_COLORS[colorIndex % BLOCK_COLORS.length] || BLOCK_COLORS[0];

    onAdd({
      day: editing.day,
      startTime: editing.start,
      endTime: editing.end,
      subject: form.subject,
      grade: form.grade,
      course: form.course,
      color,
    });
    setEditing(null);
  }

  return (
    <div>
      {/* Jornada badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full">
          <Sun size={12} className="text-amber-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700">Jornada {jornada}</span>
        </div>
        <span className="text-[10px] text-gray-400 font-medium">07:30 a.m. – 01:30 p.m.</span>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100">
        <table className="w-full border-collapse min-w-[560px] text-xs">
          <thead>
            <tr>
              <th className="p-2 bg-gray-50 text-gray-400 font-black text-[9px] uppercase tracking-widest w-[90px]">Hora</th>
              {DAYS.map(d => <th key={d} className="p-2 bg-gray-50 text-gray-600 font-black text-[9px] uppercase tracking-widest">{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {slots.map(slot => (
              <React.Fragment key={slot.start}>
                {slot.start === "11:00" && (
                  <tr>
                    <td className="p-1.5 text-center text-[9px] font-black text-amber-600 bg-amber-50 border-t border-amber-100">🔴 10:30–11:00</td>
                    {DAYS.map(d => <td key={d} className="p-1.5 bg-amber-50 border-t border-l border-amber-100 text-center text-[9px] font-bold text-amber-500">DESCANSO</td>)}
                  </tr>
                )}
                <tr>
                  <td className="p-1.5 text-center text-[9px] font-bold text-gray-400 bg-gray-50 border-t border-gray-100 whitespace-nowrap">
                    {slot.start}–{slot.end}
                  </td>
                  {DAYS.map(day => {
                    const b = blockAt(day, slot.start);
                    return (
                      <td key={day} className="p-1 border-t border-l border-gray-100">
                        {b ? (
                          <div className={`rounded-xl p-2 text-[10px] font-black flex items-start justify-between border ${b.color}`}>
                            <div>
                              <div>{b.subject}</div>
                              <div className="opacity-60 font-medium text-[9px]">{b.course}</div>
                            </div>
                            <button onClick={() => onRemove(b.id)} className="opacity-50 hover:opacity-100 transition-opacity">
                              <Trash2 size={9} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => openSlot(day, slot)}
                            className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center text-gray-300 hover:text-blue-400"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-400 mt-3">{blocks.length} clase(s) configurada(s)</p>

      {/* Modal agregar clase */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(4,12,26,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h4 className="text-sm font-black uppercase mb-1 text-gray-800">Agregar Clase</h4>
            <p className="text-[10px] text-gray-400 mb-6 font-semibold uppercase tracking-widest">{editing.day} · {editing.start} – {editing.end}</p>

            {/* Collision Alert */}
            {collision?.hasCollision && (
              <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-red-700 uppercase">⚠ Colisión de Horario Detectada</p>
                  <p className="text-[11px] text-red-600 mt-1">
                    <strong>{collision.conflictWith}</strong> ya tiene asignado el curso <strong>{form.course}</strong> en esta franja.
                  </p>
                  <p className="text-[10px] text-red-400 mt-1">Escoge otro curso o franja horaria.</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Materia */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Materia</label>
                <select
                  value={form.subject}
                  onChange={e => { setForm(f => ({ ...f, subject: e.target.value })); setCollision(null); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400 bg-white"
                >
                  {masterData.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Grado */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Grado</label>
                <select
                  value={form.grade}
                  onChange={e => { setForm(f => ({ ...f, grade: e.target.value })); setCollision(null); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400 bg-white"
                >
                  {masterData.grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Curso */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Grupo / Curso</label>
                <select
                  value={form.course}
                  onChange={e => { setForm(f => ({ ...f, course: e.target.value })); setCollision(null); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:border-blue-400 bg-white"
                >
                  {masterData.courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setEditing(null); setCollision(null); }}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-[11px] font-black uppercase text-gray-500 hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.subject || !form.course || checking}
                className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {checking ? (
                  <><span className="animate-spin border-2 border-white border-t-transparent rounded-full w-3 h-3" />Validando...</>
                ) : (
                  <><CheckCircle2 size={14} />Agregar</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { user, profile, updateProfile, students, masterData } = useApp();
  const [tab, setTab] = useState<Tab>("perfil");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isOnboarding = !profile.isProfileComplete || !profile.weeklySchedule || profile.weeklySchedule.length === 0;

  // Perfil
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName, setLastName] = useState(profile.lastName || "");
  const [phone, setPhone] = useState(profile.phone || "");

  // Horario
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(profile.weeklySchedule || []);
  const [jornada] = useState<Jornada>("MAÑANA");

  // Impresión
  const printCoursesList = profile.isSuperAdmin ? masterData.grades : masterData.courses;
  const printGradesList  = profile.isSuperAdmin ? masterData.grades : masterData.grades;
  const printSubjectsList = masterData.subjects;
  const [printCourse, setPrintCourse] = useState(printCoursesList[0] || "");
  const [printGrade,  setPrintGrade]  = useState(printGradesList[0]  || "");
  const [printSubject, setPrintSubject] = useState(printSubjectsList[0] || "");

  const teacherName = `${firstName} ${lastName}`.trim() || profile.name;

  const addBlock = useCallback((block: Omit<ScheduleBlock, "id">) => {
    setBlocks(prev => [...prev, { id: `b-${Date.now()}`, ...block }]);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  }, []);

  async function save() {
    setSaving(true);
    const teachingGrades    = [...new Set(blocks.map(b => b.grade))];
    const teachingCourses   = [...new Set(blocks.map(b => b.course))];
    const teachingSubjectsList = [...new Set(blocks.map(b => b.subject))];
    await updateProfile({
      firstName, lastName, phone,
      teachingGrades, teachingCourses, teachingSubjectsList,
      weeklySchedule: blocks,
      isProfileComplete: firstName.trim().length > 0 && lastName.trim().length > 0 && blocks.length > 0,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <RoleGuard>
      <div className="flex flex-col min-h-screen" style={{ background: "#f8faff" }}>
        <TopAppBar />
        <main className="pt-20 pb-32 px-4 md:px-8 max-w-5xl mx-auto w-full">

          {/* Header + Onboarding Banner */}
          <div className="mt-8 mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900">Mi Configuración</h1>
            <p className="text-xs text-gray-400 mt-1">Perfil docente · Horario · Impresión</p>
          </div>

          {/* ⚠️ Banner obligatorio de configuración */}
          {isOnboarding && (
            <div className="mb-6 p-5 rounded-2xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                <Calendar size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-blue-800 uppercase tracking-wide">¡Configura tu horario para continuar!</p>
                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                  Antes de acceder al sistema, debes completar tu perfil y registrar al menos una clase en tu malla horaria.
                  Los datos se toman del catálogo institucional — sin texto libre.
                </p>
              </div>
              <button onClick={() => setTab("horario")}
                className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                Ir a Horario <ChevronRight size={12} />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
            <TabBtn id="perfil"    active={tab} label="Perfil"     icon={User}     onClick={setTab} />
            {!profile.isSuperAdmin && <TabBtn id="horario"  active={tab} label="Horario"   icon={Calendar} onClick={setTab} />}
            <TabBtn id="impresion" active={tab} label="Impresión"  icon={Printer}  onClick={setTab} />
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">

            {/* ── PERFIL ── */}
            {tab === "perfil" && (
              <div className="space-y-5 max-w-xl">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-700 mb-6">Datos Personales</h2>
                {[
                  { label: "Primer Nombre", val: firstName, set: setFirstName, ph: "ANTONIO" },
                  { label: "Apellidos",     val: lastName,  set: setLastName,  ph: "RODRÍGUEZ BURGOS" },
                  { label: "Celular",       val: phone,     set: setPhone,     ph: "+57 300 000 0000" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">{f.label}</label>
                    <input
                      value={f.val}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.ph}
                      className="w-full border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-sm focus:outline-none focus:border-blue-400 uppercase"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* ── HORARIO ── */}
            {tab === "horario" && !profile.isSuperAdmin && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Malla Horaria Semanal</h2>
                  <div className="flex items-center gap-2">
                    <Sun size={14} className="text-amber-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">IETABA · 7:30 – 13:30</span>
                  </div>
                </div>

                <ScheduleGrid
                  blocks={blocks}
                  jornada={jornada}
                  masterData={masterData}
                  userId={user?.uid || ""}
                  onAdd={addBlock}
                  onRemove={removeBlock}
                />
              </div>
            )}

            {/* ── IMPRESIÓN ── */}
            {tab === "impresion" && (
              <div className="space-y-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-700">Imprimir Listados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Por Curso */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Listado por Curso</p>
                    <select value={printCourse} onChange={e => setPrintCourse(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 font-semibold focus:outline-none bg-white">
                      {printCoursesList.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <button onClick={() => printStudentsByCourse(students as Parameters<typeof printStudentsByCourse>[0], printCourse, teacherName)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase">
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                  {/* Por Grado */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Listado por Grado</p>
                    <select value={printGrade} onChange={e => setPrintGrade(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 font-semibold focus:outline-none bg-white">
                      {printGradesList.map(g => <option key={g}>{g}</option>)}
                    </select>
                    <button onClick={() => printStudentsByGrade(students as Parameters<typeof printStudentsByGrade>[0], printGrade, teacherName)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl text-[11px] font-black uppercase">
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                  {/* Planilla Asistencia */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Planilla de Asistencia</p>
                    <select value={printCourse} onChange={e => setPrintCourse(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-2 font-semibold focus:outline-none bg-white">
                      {printCoursesList.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <select value={printSubject} onChange={e => setPrintSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 font-semibold focus:outline-none bg-white">
                      {printSubjectsList.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => printAttendanceSheet(students as Parameters<typeof printAttendanceSheet>[0], printCourse, teacherName, printSubject)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase">
                      <Printer size={14} /> Imprimir
                    </button>
                  </div>
                  {/* Mi Horario Semanal */}
                  {!profile.isSuperAdmin && (
                    <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Mi Horario Semanal</p>
                      <p className="text-xs text-gray-400 mb-4">{blocks.length} clases configuradas en el horario actual.</p>
                      <button onClick={() => printWeeklySchedule(blocks, teacherName)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-xl text-[11px] font-black uppercase">
                        <Printer size={14} /> Imprimir Horario
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save button */}
            {tab !== "impresion" && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
                  style={{ background: saved ? "#10b981" : "#1a56db", color: "#fff", boxShadow: "0 8px 24px rgba(26,86,219,0.25)" }}
                >
                  {saving ? "Guardando..." : saved ? <><CheckCircle2 size={15} /> Guardado</> : <><Save size={15} /> Guardar Cambios</>}
                  {!saving && !saved && <ChevronRight size={15} />}
                </button>
              </div>
            )}
          </div>
        </main>
        <BottomNavBar />
      </div>
    </RoleGuard>
  );
}
