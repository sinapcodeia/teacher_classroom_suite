"use client";

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import RoleGuard from "@/components/shared/RoleGuard";
import { useApp, normalizeGrade } from "@/context/AppContext";
import {
  Users, BookOpen, ArrowRight, TrendingUp,
  ShieldCheck, Zap, BarChart3, Clock,
  CheckCircle2, AlertCircle, Activity, ClipboardList, AlertTriangle, FileText,
  BrainCircuit, Trophy, CalendarDays, UploadCloud, Target, Sparkles, Filter, Loader2
} from "lucide-react";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { motion } from "framer-motion";

const CriticalAlerts = nextDynamic(() => import("@/components/dashboard/CriticalAlerts"), { ssr: false });
const EduAISentinel = nextDynamic(() => import("@/components/dashboard/EduAISentinel"), { ssr: false });
const PredictiveTrends = nextDynamic(() => import("@/components/analytics/PredictiveTrends"), { ssr: false });
const PedagogicalControlPanel = nextDynamic(() => import("@/components/dashboard/PedagogicalControlPanel"), { ssr: false });
const QuickResourceHub = nextDynamic(() => import("@/components/dashboard/QuickResourceHub"), { ssr: false });
const GovernanceKPIs = nextDynamic(() => import("@/components/dashboard/GovernanceKPIs"), { ssr: false });

const GREETINGS = ["¡Buenos días", "¡Buenas tardes", "¡Buenas noches"];
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 18) return GREETINGS[1];
  return GREETINGS[2];
}

const QUICK_ACTIONS = (isSuperAdmin: boolean) => isSuperAdmin
  ? [
      { label: "Administración", icon: ShieldCheck, href: "/admin", color: "#f43f5e" },
      { label: "Ver Estudiantes", icon: Users, href: "/estudiantes", color: "#3b82f6" },
      { label: "Reportes", icon: BarChart3, href: "/reportes/asistencia", color: "#10b981" },
      { label: "Currículo", icon: BookOpen, href: "/curriculo", color: "#8b5cf6" },
    ]
  : [
      { label: "Tomar Asistencia", icon: CheckCircle2, href: "/clase-en-vivo", color: "#3b82f6" },
      { label: "Ver Estudiantes", icon: Users, href: "/estudiantes", color: "#8b5cf6" },
      { label: "Reportes", icon: BarChart3, href: "/reportes/asistencia", color: "#10b981" },
      { label: "Currículo", icon: BookOpen, href: "/curriculo", color: "#8b5cf6" },
    ];

const SUBJECT_SUPPORT: Record<string, { title: string, news: string, tip: string, icon: any, color: string }> = {
  "TECNOLOGÍA": {
    title: "Innovación y Territorio",
    news: "Nuevas herramientas de IA pueden ayudar a los estudiantes de 8-3 a visualizar conceptos de robótica básica usando materiales reciclados.",
    tip: "Tip: Inicia la clase preguntando cómo la tecnología puede proteger los ríos del piedemonte costero.",
    icon: Zap,
    color: "text-blue-600"
  },
  "MATEMÁTICAS": {
    title: "Pensamiento Numérico Awá",
    news: "Se recomienda usar el sistema de conteo basado en el tejido de 'shingras' para explicar progresiones aritméticas hoy.",
    tip: "Tip: Los patrones geométricos en la cestería tradicional son ideales para explicar simetría.",
    icon: Target,
    color: "text-emerald-600"
  },
  "ÉTICA": {
    title: "Tejido Social",
    news: "Dinámica sugerida: El 'Círculo de la Palabra' para resolver conflictos recientes detectados en los grados superiores.",
    tip: "Tip: Refuerza el valor de la 'Minga' como forma de trabajo colaborativo en el aula.",
    icon: Sparkles,
    color: "text-amber-600"
  },
  "FÍSICA": {
    title: "Física del Entorno",
    news: "Usa el ejemplo del funcionamiento del trapiche para explicar torque y fuerza centrífuga en la sesión de hoy.",
    tip: "Tip: La caída del agua en las quebradas cercanas es perfecta para introducir energía potencial.",
    icon: Activity,
    color: "text-rose-600"
  },
  "DEFAULT": {
    title: "Inspiración Docente",
    news: "La educación contextualizada es la clave del éxito en el IETABA. Cada clase es un tejido de saberes.",
    tip: "Tip: Recuerda que tu rol como guía es fundamental para el fortalecimiento de la identidad Awá.",
    icon: BrainCircuit,
    color: "text-primary"
  }
};

export default function Home() {
  const { schedule, profile, students, subjects, agendaNotes, updateAgendaNote, curriculum, myStudents } = useApp();
  
  const formattedDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  const firstName = profile.name.split(" ")[0];

  const [gradoFilter, setGradoFilter] = useState("TODOS");
  const [cursoFilter, setCursoFilter] = useState("TODOS");

  // Opciones de filtro dinámicas basadas en los datos del docente
  const gradoOptions = useMemo(() => {
    const list = profile.isSuperAdmin ? students : myStudents;
    return [...new Set(list.map(s => normalizeGrade(s.grado)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [students, myStudents, profile.isSuperAdmin]);

  const cursoOptions = useMemo(() => {
    const list = profile.isSuperAdmin ? students : myStudents;
    const base = gradoFilter === "TODOS"
      ? list
      : list.filter(s => normalizeGrade(s.grado) === gradoFilter);
    return [...new Set(base.map(s => s.curso))].filter(Boolean).sort();
  }, [students, myStudents, gradoFilter, profile.isSuperAdmin]);
  
  // Lista filtrada globalmente que afecta a TODO el dashboard
  const filteredDashboardStudents = useMemo(() => {
    return myStudents.filter(s => {
      const matchGrado = gradoFilter === "TODOS" || normalizeGrade(s.grado) === gradoFilter;
      const matchCurso = cursoFilter === "TODOS" || s.curso === cursoFilter;
      return matchGrado && matchCurso;
    });
  }, [myStudents, gradoFilter, cursoFilter]);

  const activeStudentsCount = useMemo(() => 
    filteredDashboardStudents.filter((s) => s.isActive !== false).length
  , [filteredDashboardStudents]);

  const effectiveCourses = useMemo(() => {
    if (profile.isSuperAdmin) return null;
    const courses = (profile.teachingCourses?.length ?? 0) > 0
      ? profile.teachingCourses
      : [...new Set((schedule || []).map(b => b.group))];
    return courses;
  }, [profile, schedule]);

  const todaySchedule = useMemo(() => {
    const days = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const currentDay = days[new Date().getDay()];
    // Filtrar por el día de hoy. Si es fin de semana o no hay clases, mostrará vacío.
    return schedule.filter(s => s.day?.toUpperCase() === currentDay).slice(0, 5);
  }, [schedule]);

  const nextClass = useMemo(() => {
    return todaySchedule.length > 0 ? todaySchedule[0] : schedule[0] || null;
  }, [todaySchedule, schedule]);

  // Memoize critical absences and high performance
  const { criticalAbsences, highPerf, atRisk } = useMemo(() => {
    const critical = filteredDashboardStudents.filter((s) => {
      if (!s.attendanceRecord) return false;
      const absCount = Object.values(s.attendanceRecord).filter(v => v === 'absent').length;
      return absCount >= 3 && s.isActive !== false;
    });

    const high = filteredDashboardStudents.filter((s) => s.avgGrade >= 4.0).length;

    return {
      criticalAbsences: critical,
      highPerf: high,
      atRisk: critical.length
    };
  }, [filteredDashboardStudents]);

  // Tareas pendientes
  // Tareas pendientes (filtradas por los cursos que dicta el docente)
  const pendingTasks = useMemo(() => {
    return agendaNotes.filter(n => {
      const isPendingTask = n.type === 'TASK' && !n.isCompleted;
      if (!isPendingTask) return false;
      
      // Si es SuperAdmin ve todas, si es docente solo las de sus cursos
      if (profile.isSuperAdmin) return true;
      return effectiveCourses?.includes(n.course);
    });
  }, [agendaNotes, profile.isSuperAdmin, effectiveCourses]);

  // Top 5 Estudiantes (Cuadro de Honor)
  const topStudents = useMemo(() => [...filteredDashboardStudents]
    .filter(s => s.isActive !== false && s.avgGrade)
    .sort((a, b) => b.avgGrade - a.avgGrade)
    .slice(0, 5), [filteredDashboardStudents]);

  // Fechas SAPRED
  const { periodEndDate, daysLeft } = useMemo(() => {
    const end = new Date(new Date().getFullYear(), 5, 15); // Simulación: 15 de Junio
    const left = Math.max(0, Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
    return { periodEndDate: end, daysLeft: left };
  }, []);

  // IA Insight (Asistente)
  const aiInsight = useMemo(() => {
    if (criticalAbsences.length >= 3) {
      return { 
        message: `Atención: Tienes ${criticalAbsences.length} estudiantes en riesgo crítico de ausentismo. Sugerimos contactar coordinación o acudientes pronto.`, 
        title: "Alerta Prioritaria",
        icon: AlertTriangle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        iconBg: "bg-rose-100"
      };
    } else if (pendingTasks.length > 0) {
      return { 
        message: `Recordatorio: Tienes ${pendingTasks.length} tareas pendientes de revisión en tu agenda. Organiza un bloque de tiempo hoy para calificarlas.`, 
        title: "Gestión de Tiempo",
        icon: Target,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        iconBg: "bg-amber-100"
      };
    } else if (daysLeft <= 10) {
      return { 
        message: `El periodo termina en ${daysLeft} días. Recuerda consolidar tus notas para subirlas al sistema SAPRED a tiempo.`, 
        title: "Cierre de Periodo",
        icon: UploadCloud,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        iconBg: "bg-purple-100"
      };
    }
    return { 
      message: "Todo en orden. Excelente control de tus grupos hoy. ¡Sigue así!", 
      title: "Insight Positivo",
      icon: Sparkles,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
      iconBg: "bg-blue-100"
    };
  }, [criticalAbsences.length, pendingTasks.length, daysLeft]);

  const subjectNews = useMemo(() => {
    if (!nextClass) return SUBJECT_SUPPORT.DEFAULT;
    const normalized = nextClass.subject.toUpperCase();
    if (normalized.includes("TECNOLOGÍA") || normalized.includes("INFORMÁTICA")) return SUBJECT_SUPPORT.TECNOLOGÍA;
    if (normalized.includes("MATEMÁTICAS")) return SUBJECT_SUPPORT.MATEMÁTICAS;
    if (normalized.includes("ÉTICA")) return SUBJECT_SUPPORT.ÉTICA;
    if (normalized.includes("FÍSICA")) return SUBJECT_SUPPORT.FÍSICA;
    return SUBJECT_SUPPORT.DEFAULT;
  }, [nextClass]);

  const quickStats = useMemo(() => [
    {
      label: "Estudiantes",
      value: activeStudentsCount || myStudents.length,
      icon: Users,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      link: "/estudiantes",
      trend: "Matrícula Activa",
    },
    {
      label: "Materias",
      value: subjects.length,
      icon: BookOpen,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      link: "/curriculo",
      trend: `${subjects.length} Planificadas`,
      isNew: curriculum.some(c => {
        const created = parseInt(c.id?.split("-")[1] || "0");
        return Date.now() - created < 60000; // Creado en el último minuto
      })
    },
    {
      label: "Nivel Superior",
      value: highPerf,
      icon: TrendingUp,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      link: "/reportes/asistencia",
      trend: `${activeStudentsCount ? Math.round((highPerf / activeStudentsCount) * 100) : 0}% con 4.0+`,
    },
    {
      label: "En Alerta",
      value: atRisk,
      icon: AlertCircle,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      link: "/estudiantes",
      trend: atRisk > 0 ? "Requiere Atención" : "Asistencia Óptima",
    },
  ], [activeStudentsCount, students.length, subjects.length, highPerf, atRisk]);

  const quickActions = useMemo(() => QUICK_ACTIONS(!!profile.isSuperAdmin), [profile.isSuperAdmin]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <RoleGuard>
      <div
        className="flex flex-col min-h-screen"
        style={{ background: "linear-gradient(160deg, #f8faff 0%, #eef2ff 50%, #f0f7ff 100%)" }}
      >
        <TopAppBar />

        <main className="pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto w-full">

          {/* ── HERO HEADER ── */}
          <section className="mt-8 mb-10">
            <div
              className="relative overflow-hidden rounded-[2.5rem] p-8 md:p-12"
              style={{
                background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 60%, #1d4ed8 100%)",
                boxShadow: "0 32px 80px rgba(29,78,216,0.35)",
              }}
            >
              {/* Orb decorativo */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(99,179,237,0.15) 0%, transparent 70%)" }} />
              <div className="pointer-events-none absolute -bottom-10 left-1/2 w-96 h-48 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
                <div>
                  {/* Fecha */}
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] mb-3"
                    style={{ color: "rgba(147,197,253,0.8)" }}>
                    {formattedDate}
                  </p>

                  {/* Saludo */}
                  <h1 className="font-black tracking-tighter leading-none mb-2"
                    style={{
                      fontSize: "clamp(28px, 5vw, 52px)",
                      color: "#ffffff",
                      fontStyle: "italic",
                    }}>
                    {getGreeting()}, {firstName}!
                  </h1>

                  <p className="text-sm font-medium" style={{ color: "rgba(191,219,254,0.7)" }}>
                    IETABA · Gestión Educativa Institucional
                  </p>

                  {/* Super Admin Badge */}
                  {profile.isSuperAdmin && (
                    <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
                      style={{ background: "rgba(244,63,94,0.2)", border: "1px solid rgba(244,63,94,0.4)" }}>
                      <ShieldCheck size={14} style={{ color: "#fb7185" }} />
                      <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#fb7185" }}>
                        Super Admin · Control Total
                      </span>
                    </div>
                  )}
                </div>

                {/* Live indicator / Admin Button */}
                <div className="shrink-0 flex flex-col items-end gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#34d399" }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#34d399" }}>
                      {profile.isSuperAdmin ? "Consola Institucional" : "Sistema Activo"}
                    </span>
                  </div>
                  {profile.isSuperAdmin ? (
                    <Link href="/admin"
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105"
                      style={{ background: "#f43f5e", color: "#fff", boxShadow: "0 8px 24px rgba(244,63,94,0.4)" }}>
                      <ShieldCheck size={16} />
                      Panel de Control
                    </Link>
                  ) : (
                    <div className="flex gap-3">
                      <Link href="/agenda"
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105 bg-white/10 text-white border border-white/20">
                        <FileText size={16} />
                        Ver Agenda
                      </Link>
                      <Link href="/clase-en-vivo"
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105"
                        style={{ background: "#3b82f6", color: "#fff", boxShadow: "0 8px 24px rgba(59,130,246,0.4)" }}>
                        <Zap size={16} />
                        Clase en Vivo
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>


          {/* ── GLOBAL DASHBOARD FILTERS ── */}
          <section className="mb-10 animate-in fade-in zoom-in duration-500">
             <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-4 shadow-xl flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 px-6 py-3 bg-on-surface text-white rounded-[1.5rem] shadow-lg">
                   <Filter size={18} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Filtro de Control</span>
                </div>
                
                <div className="flex-1 flex gap-3">
                   <select 
                      value={gradoFilter}
                      onChange={(e) => { setGradoFilter(e.target.value); setCursoFilter("TODOS"); }}
                      className="flex-1 h-14 bg-white border-2 border-outline-variant/30 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all cursor-pointer appearance-none shadow-sm"
                   >
                      <option value="TODOS">Todos los Grados</option>
                      {gradoOptions.map(g => <option key={g} value={g}>Grado {g}</option>)}
                   </select>

                   <select 
                      value={cursoFilter}
                      onChange={(e) => setCursoFilter(e.target.value)}
                      className="flex-1 h-14 bg-white border-2 border-outline-variant/30 rounded-2xl px-6 text-[11px] font-black uppercase tracking-widest outline-none focus:border-primary transition-all cursor-pointer appearance-none shadow-sm"
                   >
                      <option value="TODOS">Todos los Cursos</option>
                      {cursoOptions.map(c => <option key={c} value={c}>Curso {c}</option>)}
                   </select>
                </div>

                <div className="hidden md:flex items-center gap-2 px-6 py-3 bg-primary/5 border border-primary/10 rounded-[1.5rem]">
                   <Users size={16} className="text-primary" />
                   <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {filteredDashboardStudents.length} <span className="opacity-40">Registros</span>
                   </span>
                </div>
             </div>
          </section>

          {/* ── RECENT AGENDA (BITÁCORA) ── */}
          {!profile.isSuperAdmin && agendaNotes.length > 0 && (
            <section className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <CalendarDays size={20} />
                    </div>
                    <h2 className="text-xl font-black text-on-surface tracking-tighter uppercase italic">Bitácora Reciente</h2>
                  </div>
                  <Link href="/agenda" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Historial Completo</Link>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {agendaNotes.slice(0, 3).map((note, i) => (
                    <Link key={note.id || i} href="/agenda" className="group bg-white p-6 rounded-[2rem] border border-outline-variant shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                       <div className="flex items-center justify-between mb-4">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${note.type === 'NO_CLASS' ? 'bg-rose-50 text-rose-600' : note.type === 'TASK' ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                             {note.type === 'NO_CLASS' ? 'Excepción' : note.type === 'TASK' ? 'Tarea' : 'Bitácora'}
                          </span>
                          <span className="text-[8px] font-bold text-on-surface-variant opacity-40 uppercase">{new Date(note.date).toLocaleDateString()}</span>
                       </div>
                       <p className="text-[11px] font-black text-on-surface leading-snug uppercase line-clamp-3 group-hover:text-primary transition-colors">
                         {note.content}
                       </p>
                       <div className="mt-4 pt-4 border-t border-outline-variant/30 flex items-center gap-2">
                          <span className="text-[8px] font-black text-on-surface-variant opacity-50 uppercase tracking-widest">{note.subject} · {note.course}</span>
                       </div>
                    </Link>
                  ))}
               </div>
            </section>
          )}

          {/* ── CONTROL PEDAGÓGICO (ALERTAS Y SEGUIMIENTO) ── */}
          {!profile.isSuperAdmin && <PedagogicalControlPanel />}

          {/* ── RECURSOS DE CLASE INTUITIVOS ── */}
          {!profile.isSuperAdmin && <QuickResourceHub />}

          {/* ── ALERTA CRÍTICA PARA DIRECTIVOS ── */}
          <CriticalAlerts />

          {/* ── KPI DE GOBERNANZA E INTELIGENCIA DE POBLACIÓN ── */}
          <section className="mb-10">
            <GovernanceKPIs grado={gradoFilter} curso={cursoFilter} />
          </section>

          {/* ── KPI STATS ── */}
          <section className="mb-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Link key={stat.label} href={stat.link}
                    className="group relative overflow-hidden rounded-[1.75rem] p-6 transition-all hover:-translate-y-1"
                    style={{
                      background: "#ffffff",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                      border: "1px solid rgba(226,232,240,0.8)",
                    }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                        style={{ background: stat.bg }}>
                        <Icon size={22} style={{ color: stat.color }} />
                      </div>
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-1 group-hover:translate-x-0"
                        style={{ color: stat.color }} />
                    </div>
                    <p className="text-3xl font-black tracking-tighter" style={{ color: "#0f172a" }}>
                      {stat.value}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider mt-1" style={{ color: "#64748b" }}>
                      {stat.label}
                    </p>
                    <p className="text-[9px] font-semibold mt-1" style={{ color: stat.color }}>
                      {stat.trend}
                    </p>
                    {stat.isNew && (
                      <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[7px] font-black uppercase px-2 py-1 rounded-full animate-bounce shadow-lg">
                        ¡Recién Cargado!
                      </div>
                    )}
                    {/* Accent corner */}
                    <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-[2rem] opacity-5 group-hover:opacity-10 transition-all"
                      style={{ background: stat.color }} />
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ── ANALÍTICA DE ÚLTIMA GENERACIÓN ── */}
          <PredictiveTrends />

          {/* ── EDUAI SENTINEL (IA PROFESIONAL) ── */}
          <EduAISentinel grado={gradoFilter} curso={cursoFilter} />

          {/* ── MAIN GRID ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* SCHEDULE CARD */}
            <div className="lg:col-span-7">
              <div className="rounded-[2rem] overflow-hidden"
                style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(226,232,240,0.8)" }}>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5"
                  style={{ borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: profile.isSuperAdmin ? "rgba(139,92,246,0.1)" : "rgba(59,130,246,0.1)" }}>
                      {profile.isSuperAdmin ? <BookOpen size={18} style={{ color: "#8b5cf6" }} /> : <Clock size={18} style={{ color: "#3b82f6" }} />}
                    </div>
                    <div>
                      <h2 className="text-[12px] font-black uppercase tracking-widest" style={{ color: "#0f172a" }}>
                        {profile.isSuperAdmin ? "Estructura Académica" : "Actividad del Día"}
                      </h2>
                      <p className="text-[9px] font-semibold" style={{ color: "#94a3b8" }}>{profile.isSuperAdmin ? "Grados y Materias" : "Horario activo"}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                    Tiempo Real
                  </span>
                </div>

                {/* Content: Schedule for Teachers, Summary for Admin */}
                <div className="p-6 space-y-2">
                  {profile.isSuperAdmin ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Grados</p>
                           <p className="text-xl font-black text-slate-800">11 Niveles</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Materias Base</p>
                           <p className="text-xl font-black text-slate-800">{subjects.length} Activas</p>
                        </div>
                      </div>
                      <Link href="/admin" className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">
                        <span className="text-[10px] font-black uppercase">Gestionar Datos Maestros</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ) : todaySchedule.length > 0 ? todaySchedule.map((session, i) => (
                    <Link key={i} href="/clase-en-vivo"
                      className="flex items-center gap-5 p-4 rounded-2xl group transition-all hover:bg-slate-50">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-black shrink-0 ${session.color}`}>
                        {session.time.split(":")[0]}h
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black truncate uppercase tracking-tight" style={{ color: "#0f172a" }}>
                          {session.subject}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5" style={{ color: "#94a3b8" }}>
                          Grado {session.grade} · Curso {session.group} · {session.time}
                        </p>
                      </div>
                      <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        style={{ color: "#3b82f6" }} />
                    </Link>
                  )) : (
                    <div className="text-center py-12" style={{ color: "#94a3b8" }}>
                      <Activity size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-[11px] font-bold uppercase tracking-widest">Sin clases programadas hoy</p>
                    </div>
                  )}
                </div>

                {!profile.isSuperAdmin && (
                  <div className="px-6 pb-6">
                    <Link href="/horario"
                      className="block text-center py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]"
                      style={{ background: "rgba(59,130,246,0.07)", color: "#3b82f6" }}>
                      Ver Horario Completo →
                    </Link>
                  </div>
                )}
              </div>

              {/* CALENDARIO INSTITUCIONAL Y SAPRED */}
              {!profile.isSuperAdmin && (
                <div className="rounded-[2rem] p-6 border shadow-sm bg-white mt-6" style={{ borderColor: "rgba(226,232,240,0.8)" }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                      <CalendarDays size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Cierre Académico</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Plataforma SAPRED</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Faltan</p>
                       <p className="text-4xl font-black text-slate-800 mb-1">{daysLeft}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase">Días para el Cierre</p>
                    </div>
                    <div className="p-5 rounded-2xl flex flex-col justify-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #f3e8ff, #e9d5ff)", border: "1px solid #d8b4fe" }}>
                       <UploadCloud size={24} className="text-purple-600 mb-2" />
                       <p className="text-[11px] font-black uppercase text-purple-900 leading-tight mb-3">Sincronización de Notas SAPRED</p>
                       <button className="bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest py-2 px-4 rounded-xl shadow-md hover:bg-purple-700 transition-colors">
                          Sincronizar Ahora
                       </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <aside className="lg:col-span-5 space-y-5">

              {/* QUICK ACTIONS */}
              <div className="rounded-[2rem] p-6"
                style={{ background: "#fff", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid rgba(226,232,240,0.8)" }}>
                <h3 className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: "#64748b" }}>
                  Acciones Rápidas
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Link key={a.label} href={a.href}
                        className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:-translate-y-0.5"
                        style={{ background: `${a.color}10`, border: `1px solid ${a.color}20` }}>
                        <Icon size={22} style={{ color: a.color }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight"
                          style={{ color: a.color }}>
                          {a.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* NEXT CLASS CARD — Solo para docentes */}
              {nextClass && !profile.isSuperAdmin && (
                <div className="rounded-[2rem] p-7 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #0f172a, #1e3a8a)",
                    boxShadow: "0 16px 48px rgba(29,78,216,0.3)",
                  }}>
                  <div className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 rounded-full"
                    style={{ background: "rgba(99,179,237,0.1)" }} />
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3"
                    style={{ color: "rgba(147,197,253,0.7)" }}>Próxima Sesión</p>
                  <h4 className="text-2xl font-black uppercase tracking-tight italic mb-1" style={{ color: "#fff" }}>
                    {nextClass.subject}
                  </h4>
                  <p className="text-[10px] font-bold uppercase mb-6" style={{ color: "rgba(191,219,254,0.6)" }}>
                    Grado {nextClass.grade} · Curso {nextClass.group} · {nextClass.time}
                  </p>
                  <Link href="/clase-en-vivo"
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02]"
                    style={{ background: "#3b82f6", color: "#fff", boxShadow: "0 8px 20px rgba(59,130,246,0.4)" }}>
                    Tomar Asistencia <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              {/* CUADRO DE HONOR (RANKING) */}
              {!profile.isSuperAdmin && topStudents.length > 0 && (
                <div className="rounded-[2rem] p-6 border shadow-sm bg-white" style={{ borderColor: "rgba(226,232,240,0.8)" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                        <Trophy size={20} className="text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Ranking Excelencia</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Top Estudiantes</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {topStudents.map((student, idx) => {
                      const isFirst = idx === 0;
                      return (
                        <div key={student.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all hover:scale-[1.02] ${isFirst ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black ${isFirst ? 'bg-amber-400 text-amber-900 shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                              #{idx + 1}
                            </div>
                            <div className="flex flex-col">
                              <p className={`text-[11px] font-black uppercase ${isFirst ? 'text-amber-900' : 'text-slate-700'}`}>
                                {student.primerApellido} {student.primerNombre}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${isFirst ? 'bg-amber-200/50 text-amber-900' : 'bg-slate-200/50 text-slate-500'}`}>
                                  Grado {student.grado}
                                </span>
                                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${isFirst ? 'bg-amber-200/50 text-amber-900' : 'bg-slate-200/50 text-slate-500'}`}>
                                  Curso {student.curso}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${isFirst ? 'bg-amber-100 text-amber-700' : 'bg-white text-slate-600 border border-slate-200'}`}>
                            {student.avgGrade.toFixed(1)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AGENDA PENDIENTE */}
              {!profile.isSuperAdmin && pendingTasks.length > 0 && (
                <div className="rounded-[2rem] p-6 relative overflow-hidden bg-emerald-50 border border-emerald-100 shadow-xl shadow-emerald-500/5">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                       <ClipboardList size={20} />
                     </div>
                     <div>
                       <h3 className="text-sm font-black uppercase tracking-tight text-emerald-900">Agenda / Tareas</h3>
                       <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">Pendientes por revisar</p>
                     </div>
                  </div>
                  <div className="space-y-3">
                     {pendingTasks.map(task => (
                       <div key={task.id} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50/50 flex flex-col gap-2 relative">
                         <p className="text-xs font-medium text-slate-700 pr-8">{task.content}</p>
                         <p className="text-[9px] font-black uppercase text-emerald-500">Curso {task.course} · {task.subject}</p>
                         <button 
                           onClick={() => updateAgendaNote(task.id, { isCompleted: true })}
                           className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-500 hover:text-white transition-all"
                           title="Marcar como completada"
                         >
                           <CheckCircle2 size={16} />
                         </button>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {/* ALERTAS CRÍTICAS DE AUSENTISMO */}
              {!profile.isSuperAdmin && criticalAbsences.length > 0 && (
                <div className="rounded-[2rem] p-6 relative overflow-hidden bg-rose-50 border border-rose-100 shadow-xl shadow-rose-500/5">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center animate-pulse">
                       <AlertTriangle size={20} />
                     </div>
                     <div>
                       <h3 className="text-sm font-black uppercase tracking-tight text-rose-900">Alerta de Ausentismo</h3>
                       <p className="text-[9px] font-bold uppercase tracking-widest text-rose-600">Estudiantes en riesgo (&gt;3 faltas)</p>
                     </div>
                  </div>
                  <div className="space-y-2">
                     {criticalAbsences.slice(0, 3).map(student => {
                        const fallas = Object.values(student.attendanceRecord || {}).filter(v => v === 'absent').length;
                        return (
                         <div key={student.id} className="bg-white p-3 rounded-2xl shadow-sm border border-rose-50/50 flex justify-between items-center">
                           <div>
                             <p className="text-[11px] font-black uppercase text-slate-800">{student.primerApellido} {student.primerNombre}</p>
                             <p className="text-[9px] font-bold text-slate-400">Grado {student.grado} · Curso {student.curso}</p>
                           </div>
                           <span className="text-xs font-black text-rose-600 bg-rose-100 px-2 py-1 rounded-lg">{fallas} faltas</span>
                         </div>
                       );
                     })}
                     {criticalAbsences.length > 3 && (
                        <Link href="/estudiantes" className="block text-center mt-2 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">
                           Ver {criticalAbsences.length - 3} más...
                        </Link>
                     )}
                  </div>
                </div>
              )}

              {/* GLOBAL MONITOR — Solo para SuperAdmin */}
              {profile.isSuperAdmin && (
                <div className="rounded-[2rem] p-7 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #0f172a, #1e293b)",
                    boxShadow: "0 16px 48px rgba(15,23,42,0.25)",
                    border: "1px solid rgba(255,255,255,0.05)"
                  }}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-1 text-blue-400">Monitor Global</p>
                      <h4 className="text-xl font-black uppercase tracking-tight italic text-white">Estado del Sistema</h4>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">
                      Online
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sincronización Cloud</span>
                      <span className="text-[10px] font-black text-white">ACTIVA</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                       <div className="bg-blue-500 h-full w-[94%] animate-pulse" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Uso de Almacenamiento</span>
                      <span className="text-[10px] font-black text-white">12%</span>
                    </div>
                  </div>

                  <Link href="/admin"
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10 border border-white/10 text-white">
                    Ver Logs del Sistema <ArrowRight size={14} />
                  </Link>
                </div>
              )}

              {/* SUPER ADMIN PANEL */}
              {profile.isSuperAdmin && (
                <div className="rounded-[2rem] p-8 relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #fff, #fef2f2)",
                    border: "2px solid #fee2e2",
                    boxShadow: "0 20px 40px rgba(244,63,94,0.12)",
                  }}>
                  {/* Decorative element */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)", color: "#fff" }}>
                      <ShieldCheck size={28} />
                    </div>
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-widest text-rose-600">
                        Acceso de Control MASTER
                      </p>
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tighter">Nivel Institucional Máximo</p>
                    </div>
                  </div>
                  
                  <p className="text-[11px] font-medium text-slate-500 leading-relaxed mb-6">
                    Usted tiene privilegios totales sobre la base de datos, gestión de usuarios y configuraciones maestras del colegio.
                  </p>

                  <Link href="/admin"
                    className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-rose-500/20 active:scale-95"
                    style={{ background: "#f43f5e", color: "#fff" }}>
                    Gestionar Usuarios e Infraestructura →
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </main>

        <BottomNavBar />
      </div>
    </RoleGuard>
  );
}
