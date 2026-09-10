"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Bell, CheckCircle2, ClipboardList, AlertTriangle, 
  X, ArrowRight, Zap, Target, BookOpen, Clock, CalendarDays, Sparkles, Check
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface SessionRemindersProps {
  subject: string;
  course: string;
  grade?: string;
}

export default function SessionReminders({ subject, course, grade }: SessionRemindersProps) {
  const { agendaNotes, updateAgendaNote, myStudents } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [hasDismissedForSession, setHasDismissedForSession] = useState<string>("");

  // Buscar tareas y talleres pendientes específicos de esta clase y materia
  const pendingTasks = useMemo(() => {
    return agendaNotes.filter(n => {
      const matchSub = !n.subject || n.subject.toUpperCase() === subject.toUpperCase();
      const matchCourse = !n.course || n.course === course || n.course === "TODOS" || (grade && n.course.includes(`${grade}-${course}`));
      return matchSub && matchCourse && n.type === 'TASK' && !n.isCompleted;
    });
  }, [agendaNotes, course, subject, grade]);

  // Historial de notas y temas de la sesión anterior
  const lastSessionNote = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return agendaNotes
      .filter(n => {
        const matchSub = !n.subject || n.subject.toUpperCase() === subject.toUpperCase();
        const matchCourse = !n.course || n.course === course || n.course === "TODOS";
        return matchSub && matchCourse && n.date !== todayStr;
      })
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [agendaNotes, course, subject]);

  // Asistencia tomada hoy para este curso
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const attendanceDoneToday = useMemo(() => {
    const classStudents = myStudents.filter(s => s.curso === course);
    if (classStudents.length === 0) return false;
    return classStudents.some(s => s.attendanceRecord?.[todayStr] !== undefined);
  }, [myStudents, course, todayStr]);

  // Mostrar modal SOLO si hay información procesable (tareas pendientes o bitácora previa)
  // y solo una vez por combinación de curso/materia en la sesión actual
  useEffect(() => {
    const sessionKey = `${subject}_${course}`;
    if (hasDismissedForSession === sessionKey) return;

    if (pendingTasks.length > 0 || lastSessionNote) {
      const timer = setTimeout(() => setShowModal(true), 600);
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
    }
  }, [course, subject, pendingTasks.length, lastSessionNote, hasDismissedForSession]);

  const handleClose = () => {
    setShowModal(false);
    setHasDismissedForSession(`${subject}_${course}`);
  };

  const markTaskExecuted = async (id: string) => {
    try {
      await updateAgendaNote(id, { isCompleted: true });
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  return (
    <>
      {/* MODAL INSTRUCTIVO DE ASISTENTE PEDAGÓGICO DE INICIO DE CLASE */}
      {showModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-slate-900/50 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/30 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-blue-700 p-6 md:p-8 text-white relative shrink-0">
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                    <Sparkles size={24} className="text-amber-300 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-200">Asistente de Inicio de Clase</span>
                    <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight leading-tight">
                      {subject} · {course}
                    </h3>
                  </div>
                </div>
                <button 
                  onClick={handleClose} 
                  className="p-2 hover:bg-white/20 rounded-full transition-all text-white/80 hover:text-white"
                  title="Cerrar ventana"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 space-y-5 overflow-y-auto flex-1 scrollbar-premium">
              
              {/* Explicación de Función */}
              <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100/80 flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  i
                </div>
                <p className="text-[11px] font-medium text-slate-700 leading-relaxed">
                  <strong>Propósito:</strong> Este asistente sincroniza tus compromisos, talleres asignados y el último tema visto con este grupo antes de iniciar la clase.
                </p>
              </div>

              {/* Bitácora de la Última Sesión */}
              {lastSessionNote && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-primary" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">Último Tema Registrado</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400">{lastSessionNote.date}</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-xl border border-slate-100">
                    &ldquo;{lastSessionNote.content}&rdquo;
                  </p>
                </div>
              )}

              {/* Compromisos y Talleres Pendientes */}
              {pendingTasks.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Talleres o Tareas por Recoger ({pendingTasks.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {pendingTasks.map(task => (
                      <div key={task.id} className="p-4 bg-rose-50/40 rounded-2xl border border-rose-200/60 flex items-center justify-between gap-3 group">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 animate-pulse" />
                          <p className="text-xs font-black text-slate-800 uppercase leading-snug">{task.content}</p>
                        </div>
                        <button 
                          onClick={() => markTaskExecuted(task.id)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[9px] uppercase tracking-wider transition-all shadow-sm shrink-0 flex items-center gap-1 active:scale-95"
                          title="Marcar compromiso como cumplido"
                        >
                          <Check size={12} /> Revisado
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <p className="text-xs font-bold text-emerald-800">
                    No tienes talleres ni tareas pendientes asignadas para este grupo.
                  </p>
                </div>
              )}

              {/* Estado de Asistencia de Hoy */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClipboardList size={18} className={attendanceDoneToday ? "text-emerald-600" : "text-amber-600"} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-800">Asistencia de Hoy ({todayStr})</p>
                    <p className="text-[9px] font-bold text-slate-500">
                      {attendanceDoneToday ? "Asistencia ya registrada" : "Pendiente por tomar asistencia"}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase ${attendanceDoneToday ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {attendanceDoneToday ? "LISTO" : "PENDIENTE"}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 shrink-0">
              <button 
                onClick={handleClose}
                className="w-full py-4 bg-on-surface hover:bg-slate-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95"
              >
                Comenzar Clase Ahora <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
