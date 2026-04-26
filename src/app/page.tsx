"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import RoleGuard from "@/components/shared/RoleGuard";
import { useApp } from "@/context/AppContext";
import {
  Users, BookOpen, ArrowRight, TrendingUp,
  ShieldCheck, Zap, BarChart3, Clock,
  CheckCircle2, AlertCircle, Activity
} from "lucide-react";
import Link from "next/link";

const GREETINGS = ["¡Buenos días", "¡Buenas tardes", "¡Buenas noches"];
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 18) return GREETINGS[1];
  return GREETINGS[2];
}

export default function Home() {
  const { schedule, profile, students, subjects } = useApp();

  const formattedDate = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  const firstName = profile.name.split(" ")[0];
  const todaySchedule = schedule.slice(0, 5);
  const activeStudents = students.filter((s) => s.isActive !== false).length;
  const atRisk = students.filter((s) => parseFloat(s.attendance) < 75).length;
  const highPerf = students.filter((s) => s.avgGrade >= 4.0).length;

  const quickStats = [
    {
      label: "Estudiantes",
      value: activeStudents || students.length,
      icon: Users,
      color: "#3b82f6",
      bg: "rgba(59,130,246,0.1)",
      link: "/estudiantes",
      trend: "+3 este mes",
    },
    {
      label: "Materias",
      value: subjects.length,
      icon: BookOpen,
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.1)",
      link: "/curriculo",
      trend: `${subjects.length} activas`,
    },
    {
      label: "Rendimiento Alto",
      value: highPerf,
      icon: TrendingUp,
      color: "#10b981",
      bg: "rgba(16,185,129,0.1)",
      link: "/reportes/asistencia",
      trend: `${activeStudents ? Math.round((highPerf / activeStudents) * 100) : 0}% del total`,
    },
    {
      label: "En Riesgo",
      value: atRisk,
      icon: AlertCircle,
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
      link: "/estudiantes",
      trend: atRisk > 0 ? "Requiere atención" : "Todo bien",
    },
  ];

  const quickActions = profile.isSuperAdmin
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
      ];

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
                    <Link href="/clase-en-vivo"
                      className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-105"
                      style={{ background: "#3b82f6", color: "#fff", boxShadow: "0 8px 24px rgba(59,130,246,0.4)" }}>
                      <Zap size={16} />
                      Clase en Vivo
                    </Link>
                  )}
                </div>
              </div>
            </div>
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
                    {/* Accent corner */}
                    <div className="absolute bottom-0 right-0 w-16 h-16 rounded-tl-[2rem] opacity-5 group-hover:opacity-10 transition-all"
                      style={{ background: stat.color }} />
                  </Link>
                );
              })}
            </div>
          </section>

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
                          Grado {session.group} · {session.time}
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

              {/* NEXT CLASS CARD */}
              {schedule[0] && (
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
                    {schedule[0].subject}
                  </h4>
                  <p className="text-[10px] font-bold uppercase mb-6" style={{ color: "rgba(191,219,254,0.6)" }}>
                    Grado {schedule[0].group} · {schedule[0].time}
                  </p>
                  <Link href="/clase-en-vivo"
                    className="flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all hover:scale-[1.02]"
                    style={{ background: "#3b82f6", color: "#fff", boxShadow: "0 8px 20px rgba(59,130,246,0.4)" }}>
                    Tomar Asistencia <ArrowRight size={16} />
                  </Link>
                </div>
              )}

              {/* SUPER ADMIN PANEL */}
              {profile.isSuperAdmin && (
                <div className="rounded-[2rem] p-6"
                  style={{
                    background: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
                    border: "1px solid rgba(244,63,94,0.2)",
                    boxShadow: "0 4px 24px rgba(244,63,94,0.08)",
                  }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(244,63,94,0.15)" }}>
                      <ShieldCheck size={20} style={{ color: "#f43f5e" }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: "#f43f5e" }}>
                        Panel Master
                      </p>
                      <p className="text-[9px] font-bold" style={{ color: "#fda4af" }}>Acceso Total</p>
                    </div>
                  </div>
                  <Link href="/admin"
                    className="block text-center py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(244,63,94,0.12)", color: "#f43f5e" }}>
                    Gestionar Usuarios →
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
