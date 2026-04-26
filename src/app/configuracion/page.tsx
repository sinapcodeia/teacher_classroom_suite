"use client";

import { useState } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import RoleGuard from "@/components/shared/RoleGuard";
import { useApp, ScheduleBlock } from "@/context/AppContext";
import { printStudentsByCourse, printStudentsByGrade, printAttendanceSheet, printWeeklySchedule } from "@/lib/printService";
import { User, BookOpen, Calendar, Printer, Save, Plus, Trash2, ChevronRight } from "lucide-react";

const ALL_GRADES = ["1°","2°","3°","4°","5°","6°","7°","8°","9°","10°","11°"];
const DAYS = ["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES"] as const;
const TIME_SLOTS = [
  { start:"07:30", end:"08:30" }, { start:"08:30", end:"09:30" },
  { start:"09:30", end:"10:00" }, { start:"10:30", end:"11:30" },
  { start:"11:30", end:"12:30" }, { start:"12:30", end:"13:30" },
];

type Tab = "perfil" | "carga" | "horario" | "impresion";

function TabBtn({ id, active, label, icon: Icon, onClick }: { id: Tab; active: Tab; label: string; icon: React.ElementType; onClick: (t: Tab) => void }) {
  const isActive = id === active;
  return (
    <button onClick={() => onClick(id)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-500 hover:bg-gray-100"}`}>
      <Icon size={15} />{label}
    </button>
  );
}

export default function ConfiguracionPage() {
  const { profile, updateProfile, students } = useApp();
  const [tab, setTab] = useState<Tab>("perfil");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Perfil
  const [firstName, setFirstName] = useState(profile.firstName || "");
  const [lastName,  setLastName]  = useState(profile.lastName  || "");
  const [phone,     setPhone]     = useState(profile.phone     || "");

  // Carga
  const [grades,   setGrades]   = useState<string[]>(profile.teachingGrades   || []);
  const [courses,  setCourses]  = useState<string[]>(profile.teachingCourses  || []);
  const [subjects, setSubjects] = useState<string[]>(profile.teachingSubjectsList || []);
  const [newCourse,  setNewCourse]  = useState("");
  const [newSubject, setNewSubject] = useState("");

  // Horario
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(profile.weeklySchedule || []);
  const [editSlot, setEditSlot] = useState<{day: typeof DAYS[number]; start: string; end: string} | null>(null);
  const [slotForm, setSlotForm] = useState({ subject: "", grade: "6°", course: "" });

  // Impresión
  const [printCourse,  setPrintCourse]  = useState(courses[0] || "");
  const [printGrade,   setPrintGrade]   = useState(grades[0]  || "");
  const [printSubject, setPrintSubject] = useState(subjects[0] || "");

  const teacherName = `${firstName} ${lastName}`.trim() || profile.name;

  async function save() {
    setSaving(true);
    await updateProfile({ firstName, lastName, phone, teachingGrades: grades, teachingCourses: courses, teachingSubjectsList: subjects, weeklySchedule: blocks });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addBlock() {
    if (!editSlot || !slotForm.subject || !slotForm.course) return;
    const colors = ["bg-blue-100 text-blue-900","bg-emerald-100 text-emerald-900","bg-amber-100 text-amber-900","bg-purple-100 text-purple-900","bg-rose-100 text-rose-900","bg-cyan-100 text-cyan-900"];
    const color = colors[subjects.indexOf(slotForm.subject) % colors.length] || colors[0];
    setBlocks(prev => [...prev, { id:`b-${Date.now()}`, day: editSlot.day, startTime: editSlot.start, endTime: editSlot.end, ...slotForm, color }]);
    setEditSlot(null);
  }

  const blockAt = (day: typeof DAYS[number], start: string) => blocks.find(b => b.day === day && b.startTime === start);

  return (
    <RoleGuard>
      <div className="flex flex-col min-h-screen" style={{ background: "#f8faff" }}>
        <TopAppBar />
        <main className="pt-20 pb-32 px-4 md:px-8 max-w-5xl mx-auto w-full">

          {/* Header */}
          <div className="mt-8 mb-8">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic text-gray-900">Mi Configuración</h1>
            <p className="text-xs text-gray-400 mt-1">Perfil docente · Horario · Impresión</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-fit">
            <TabBtn id="perfil"    active={tab} label="Perfil"       icon={User}     onClick={setTab} />
            <TabBtn id="carga"     active={tab} label="Carga Docente" icon={BookOpen} onClick={setTab} />
            <TabBtn id="horario"   active={tab} label="Horario"      icon={Calendar} onClick={setTab} />
            <TabBtn id="impresion" active={tab} label="Impresión"    icon={Printer}  onClick={setTab} />
          </div>

          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">

            {/* ── PERFIL ── */}
            {tab === "perfil" && (
              <div className="space-y-5 max-w-xl">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-700 mb-6">Datos Personales</h2>
                {[
                  { label:"Primer Nombre", val: firstName, set: setFirstName, ph:"ANTONIO" },
                  { label:"Apellidos",     val: lastName,  set: setLastName,  ph:"RODRÍGUEZ BURGOS" },
                  { label:"Celular",       val: phone,     set: setPhone,     ph:"+57 300 000 0000" },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">{f.label}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      className="w-full border border-gray-200 rounded-2xl px-5 py-4 font-semibold text-sm focus:outline-none focus:border-blue-400 uppercase" />
                  </div>
                ))}
              </div>
            )}

            {/* ── CARGA DOCENTE ── */}
            {tab === "carga" && (
              <div className="space-y-8 max-w-xl">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">Grados que dictas</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_GRADES.map(g => (
                      <button key={g} onClick={() => setGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                        className={`px-4 py-2 rounded-full text-[11px] font-black uppercase transition-all ${grades.includes(g) ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                {[
                  { label:"Grupos / Cursos", items: courses, setItems: setCourses, newVal: newCourse, setNew: setNewCourse, color:"blue", ph:"6-3, 7A..." },
                  { label:"Materias",        items: subjects, setItems: setSubjects, newVal: newSubject, setNew: setNewSubject, color:"purple", ph:"MATEMÁTICAS..." },
                ].map(f => (
                  <div key={f.label}>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-3">{f.label}</label>
                    <div className="flex gap-2 mb-3">
                      <input value={f.newVal} onChange={e => f.setNew(e.target.value)} onKeyDown={e => { if (e.key==="Enter") { const v=f.newVal.trim().toUpperCase(); if(v&&!f.items.includes(v)) f.setItems(p=>[...p,v]); f.setNew(""); }}} placeholder={f.ph}
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-blue-400 uppercase" />
                      <button onClick={() => { const v=f.newVal.trim().toUpperCase(); if(v&&!f.items.includes(v)) f.setItems(p=>[...p,v]); f.setNew(""); }}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl"><Plus size={16}/></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {f.items.map(it => (
                        <span key={it} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black">
                          {it}<button onClick={() => f.setItems(p=>p.filter(x=>x!==it))}><Trash2 size={10}/></button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── HORARIO ── */}
            {tab === "horario" && (
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-700 mb-6">Horario Semanal · IETABA (7:30 – 13:30)</h2>
                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full border-collapse min-w-[540px] text-xs">
                    <thead>
                      <tr>
                        <th className="p-2 bg-gray-50 text-gray-400 font-black text-[9px] uppercase w-24">Hora</th>
                        {DAYS.map(d => <th key={d} className="p-2 bg-gray-50 text-gray-600 font-black text-[9px] uppercase">{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {TIME_SLOTS.map(slot => (
                        <tr key={slot.start}>
                          <td className="p-2 text-center text-[9px] font-bold text-gray-400 bg-gray-50 border-t border-gray-100 whitespace-nowrap">{slot.start}–{slot.end}</td>
                          {DAYS.map(day => {
                            const b = blockAt(day, slot.start);
                            return (
                              <td key={day} className="p-1 border-t border-l border-gray-100">
                                {b ? (
                                  <div className={`rounded-xl p-2 text-[10px] font-black flex items-start justify-between ${b.color}`}>
                                    <div><div>{b.subject}</div><div className="opacity-60 font-medium">{b.course}</div></div>
                                    <button onClick={() => setBlocks(p=>p.filter(x=>x.id!==b.id))}><Trash2 size={10}/></button>
                                  </div>
                                ) : (
                                  <button onClick={() => { setEditSlot({day, start:slot.start, end:slot.end}); setSlotForm({subject:subjects[0]||"",grade:"6°",course:""}); }}
                                    className="w-full h-10 rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center justify-center text-gray-300 hover:text-blue-400">
                                    <Plus size={14}/>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td className="p-2 text-center text-[9px] font-black text-amber-600 bg-amber-50 border-t border-amber-100">🔴 10:00–10:30</td>
                        {DAYS.map(d => <td key={d} className="p-2 bg-amber-50 border-t border-l border-amber-100 text-center text-[9px] font-bold text-amber-500">DESCANSO</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-gray-400 mt-3">{blocks.length} clase(s) configurada(s)</p>
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
                    <select value={printCourse} onChange={e=>setPrintCourse(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 font-semibold focus:outline-none">
                      {courses.map(c=><option key={c}>{c}</option>)}
                    </select>
                    <button onClick={() => printStudentsByCourse(students as Parameters<typeof printStudentsByCourse>[0], printCourse, teacherName)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-[11px] font-black uppercase">
                      <Printer size={14}/> Imprimir
                    </button>
                  </div>
                  {/* Por Grado */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Listado por Grado</p>
                    <select value={printGrade} onChange={e=>setPrintGrade(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 font-semibold focus:outline-none">
                      {(grades.length ? grades : ALL_GRADES).map(g=><option key={g}>{g}</option>)}
                    </select>
                    <button onClick={() => printStudentsByGrade(students as Parameters<typeof printStudentsByGrade>[0], printGrade, teacherName)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-xl text-[11px] font-black uppercase">
                      <Printer size={14}/> Imprimir
                    </button>
                  </div>
                  {/* Planilla Asistencia */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Planilla de Asistencia</p>
                    <select value={printCourse} onChange={e=>setPrintCourse(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-2 font-semibold focus:outline-none">
                      {courses.map(c=><option key={c}>{c}</option>)}
                    </select>
                    <select value={printSubject} onChange={e=>setPrintSubject(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-3 font-semibold focus:outline-none">
                      {subjects.map(s=><option key={s}>{s}</option>)}
                    </select>
                    <button onClick={() => printAttendanceSheet(students as Parameters<typeof printAttendanceSheet>[0], printCourse, teacherName, printSubject)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase">
                      <Printer size={14}/> Imprimir
                    </button>
                  </div>
                  {/* Horario Semanal */}
                  <div className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Mi Horario Semanal</p>
                    <p className="text-xs text-gray-400 mb-4">{blocks.length} clases configuradas en el horario actual.</p>
                    <button onClick={() => printWeeklySchedule(blocks, teacherName)}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 text-white rounded-xl text-[11px] font-black uppercase">
                      <Printer size={14}/> Imprimir Horario
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            {tab !== "impresion" && (
              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all disabled:opacity-60"
                  style={{ background: saved ? "#10b981" : "#1a56db", color: "#fff", boxShadow: "0 8px 24px rgba(26,86,219,0.25)" }}>
                  {saving ? "Guardando..." : saved ? <>✓ Guardado</> : <><Save size={15}/> Guardar Cambios</>}
                  {!saving && !saved && <ChevronRight size={15}/>}
                </button>
              </div>
            )}
          </div>

          {/* Block editor modal */}
          {editSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(0,0,0,0.4)" }}>
              <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
                <h4 className="text-sm font-black uppercase mb-1 text-gray-800">Agregar Clase</h4>
                <p className="text-[10px] text-gray-400 mb-6">{editSlot.day} · {editSlot.start}–{editSlot.end}</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Materia</label>
                    {subjects.length > 0 ? (
                      <select value={slotForm.subject} onChange={e=>setSlotForm(f=>({...f,subject:e.target.value}))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none">
                        {subjects.map(s=><option key={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input value={slotForm.subject} onChange={e=>setSlotForm(f=>({...f,subject:e.target.value.toUpperCase()}))} placeholder="MATEMÁTICAS"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none uppercase"/>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Grado</label>
                    <select value={slotForm.grade} onChange={e=>setSlotForm(f=>({...f,grade:e.target.value}))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none">
                      {ALL_GRADES.map(g=><option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1.5">Grupo / Curso</label>
                    {courses.length > 0 ? (
                      <select value={slotForm.course} onChange={e=>setSlotForm(f=>({...f,course:e.target.value}))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none">
                        {courses.map(c=><option key={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input value={slotForm.course} onChange={e=>setSlotForm(f=>({...f,course:e.target.value.toUpperCase()}))} placeholder="6-3"
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none uppercase"/>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={()=>setEditSlot(null)} className="flex-1 py-3 rounded-2xl border border-gray-200 text-[11px] font-black uppercase text-gray-500">Cancelar</button>
                  <button onClick={addBlock} disabled={!slotForm.subject||!slotForm.course} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase disabled:opacity-40">Agregar</button>
                </div>
              </div>
            </div>
          )}
        </main>
        <BottomNavBar />
      </div>
    </RoleGuard>
  );
}
