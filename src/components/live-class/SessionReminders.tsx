"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Bell, CheckCircle2, ClipboardList, AlertTriangle, 
  X, ArrowRight, Zap, Target, BookOpen, Clock
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface SessionRemindersProps {
  subject: string;
  course: string;
}

export default function SessionReminders({ subject, course }: SessionRemindersProps) {
  const { agendaNotes, updateAgendaNote, students } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [sessionChecklist, setSessionChecklist] = useState([
    { id: 'attendance', label: 'Control de Asistencia', completed: false, icon: ClipboardList },
    { id: 'topic', label: 'Desarrollo de Temática', completed: false, icon: BookOpen },
    { id: 'grades', label: 'Registro de Calificaciones', completed: false, icon: Zap },
    { id: 'homework', label: 'Asignación de Tarea/Taller', completed: false, icon: Target },
  ]);

  // Buscar tareas pendientes específicas de esta clase
  const pendingTasks = useMemo(() => {
    return agendaNotes.filter(n => 
      n.course === course && 
      n.subject === subject && 
      n.type === 'TASK' && 
      !n.isCompleted
    );
  }, [agendaNotes, course, subject]);

  // Historial de notas para este curso y materia (excluyendo la de hoy)
  const lastSessionNote = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    return agendaNotes
      .filter(n => n.course === course && n.subject === subject && n.date !== todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  }, [agendaNotes, course, subject]);

  // Mostrar modal al cargar si hay tareas pendientes o si hubo notas en la sesión anterior
  useEffect(() => {
    if (pendingTasks.length > 0 || lastSessionNote) {
      const timer = setTimeout(() => setShowModal(true), 800);
      return () => clearTimeout(timer);
    }
  }, [course, subject]); 

  const toggleCheck = (id: string) => {
    setSessionChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const markTaskExecuted = async (id: string) => {
    try {
      await updateAgendaNote(id, { isCompleted: true });
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const completedCount = sessionChecklist.filter(c => c.completed).length;
  const progress = (completedCount / sessionChecklist.length) * 100;

  return (
    <>
      {/* MODAL DE ALERTAS DE CLASE */}
      {showModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-on-surface/30 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
            <div className="bg-rose-600 p-8 text-white relative">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12 scale-150"><Bell size={120} /></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <AlertTriangle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Recordatorios de Clase</h3>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{course} · {subject}</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {lastSessionNote && (
                <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Contexto: Última Sesión</span>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-relaxed italic">
                    &quot;{lastSessionNote.content.length > 150 ? lastSessionNote.content.slice(0, 150) + '...' : lastSessionNote.content}&quot;
                  </p>
                  <p className="text-[8px] font-bold text-indigo-400 mt-2 uppercase">Registrado el {lastSessionNote.date}</p>
                </div>
              )}

              {pendingTasks.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Compromisos Pendientes:</p>
                  {pendingTasks.map(task => (
                    <div key={task.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-rose-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <div>
                          <p className="text-[11px] font-black text-on-surface uppercase leading-tight">{task.content}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => markTaskExecuted(task.id)}
                        className="px-4 py-2 bg-rose-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-900/20"
                      >
                        Ejecutado
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setShowModal(false)}
                className="w-full py-5 bg-on-surface text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-2xl"
              >
                Entendido, Iniciar Clase <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANEL DE GUÍA DOCENTE (CHECKLIST) */}
      <section className="bg-white border border-outline-variant rounded-[2.5rem] shadow-xl overflow-hidden mt-6">
        <div className="p-6 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface uppercase tracking-tighter italic">Guía de Ejecución</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-500" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          {sessionChecklist.map(item => (
            <button 
              key={item.id}
              onClick={() => toggleCheck(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border group ${item.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent hover:border-indigo-100'}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.completed ? 'bg-emerald-500 text-white rotate-[360deg]' : 'bg-white text-slate-400 group-hover:text-indigo-500'}`}>
                <item.icon size={16} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest text-left flex-1 ${item.completed ? 'text-emerald-700 line-through opacity-60' : 'text-slate-600'}`}>
                {item.label}
              </span>
              {item.completed && <CheckCircle2 size={16} className="text-emerald-500" />}
            </button>
          ))}
        </div>

        <div className="px-6 py-4 bg-slate-50 text-center border-t border-outline-variant">
           <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
             Sigue esta guía para garantizar el cumplimiento del proceso pedagógico institucional.
           </p>
        </div>
      </section>
    </>
  );
}
