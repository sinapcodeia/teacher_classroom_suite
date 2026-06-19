"use client";

import { useApp } from "@/context/AppContext";
import { 
  ClipboardList, AlertCircle, CheckCircle2, 
  ArrowRight, Bell, Zap, Calendar, Target
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

export default function PedagogicalControlPanel() {
  const { schedule, students, agendaNotes, profile } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const days = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
  
  // Date calculations inside a memo or only after mount
  const { currentDay, todayStr } = useMemo(() => {
    if (!mounted) return { currentDay: "", todayStr: "" };
    const now = new Date();
    return {
      currentDay: days[now.getDay()],
      todayStr: now.toISOString().slice(0, 10)
    };
  }, [mounted]);

  // Clases de hoy
  const todayClasses = useMemo(() => {
    if (!currentDay) return [];
    return schedule.filter(s => s.day?.toUpperCase() === currentDay);
  }, [schedule, currentDay]);

  // Alertas de Control
  const alerts = useMemo(() => {
    const list: any[] = [];
    
    // Optimización: Agrupar estudiantes por curso una sola vez
    const studentsByCourse = students.reduce((acc, s) => {
      if (!acc[s.curso]) acc[s.curso] = [];
      acc[s.curso].push(s);
      return acc;
    }, {} as Record<string, typeof students>);

    // 1. Clases sin asistencia
    todayClasses.forEach(c => {
      const classStudents = studentsByCourse[c.group] || [];
      const hasAttendance = classStudents.some(s => s.attendanceRecord?.[todayStr]);
      
      if (!hasAttendance && classStudents.length > 0) {
        list.push({
          type: "ATTENDANCE",
          title: `Asistencia Pendiente: Grado ${c.grade} — Curso ${c.group}`,
          subtitle: `${c.subject} · Sesión de hoy`,
          link: `/clase-en-vivo?subject=${c.subject}&grado=${c.grade}&curso=${c.group}`,
          icon: ClipboardList,
          color: "text-amber-600",
          bg: "bg-amber-50",
          border: "border-amber-200"
        });
      }
    });

    // 2. Tareas por recibir (AgendaNotes tipo TASK pendientes)
    const pendingTasks = agendaNotes.filter(n => n.type === 'TASK' && !n.isCompleted);
    pendingTasks.forEach(task => {
      list.push({
        type: "TASK",
        title: `Tarea Pendiente: ${task.course}`,
        subtitle: `${task.subject} · ${task.content}`,
        link: `/clase-en-vivo?subject=${task.subject}&grado=${task.grade || ""}&curso=${task.course}`,
        icon: Bell,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200"
      });
    });

    return list.slice(0, 4); // Limitar a 4 alertas más importantes
  }, [todayClasses, students, todayStr, agendaNotes]);

  if (!mounted) return null;
  if (alerts.length === 0 && !profile.isSuperAdmin) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-on-surface text-white rounded-2xl flex items-center justify-center shadow-lg">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-on-surface uppercase tracking-tighter italic">Control Pedagógico</h2>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Alertas de seguimiento y ejecución</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alerts.length > 0 ? (
          alerts.map((alert, idx) => (
            <Link 
              key={idx} 
              href={alert.link}
              className={`p-5 rounded-[2rem] border ${alert.border} ${alert.bg} flex flex-col gap-4 transition-all hover:scale-[1.02] active:scale-95 group`}
            >
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alert.bg} border ${alert.border} shadow-sm`}>
                  <alert.icon size={20} className={alert.color} />
                </div>
                <ArrowRight size={16} className={`${alert.color} opacity-40 group-hover:opacity-100 transition-all`} />
              </div>
              <div>
                <h3 className={`text-[11px] font-black uppercase leading-tight ${alert.color}`}>{alert.title}</h3>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase opacity-60 line-clamp-1">{alert.subtitle}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full p-10 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
               <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">¡Todo al día!</p>
              <p className="text-[10px] font-bold text-emerald-600/60 uppercase mt-1">No tienes alertas de control pendientes para hoy.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
