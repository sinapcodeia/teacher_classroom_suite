"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import AttendanceList from "@/components/live-class/AttendanceList";
import TopicSelector from "@/components/live-class/TopicSelector";
import SessionNotes from "@/components/live-class/SessionNotes";
import ActivityGrader from "@/components/live-class/ActivityGrader";
import ClassInsights from "@/components/live-class/ClassInsights";
import { ArrowLeft, Plus, CheckCircle, HardDrive, LayoutDashboard, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { useEffect, useState } from "react";

export default function LiveClassPage() {
  const { subjects, schedule } = useApp();
  const [displaySubject, setDisplaySubject] = useState("MATERIA");
  const [displayGrado, setDisplayGrado] = useState("GRADO");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSubject = params.get("subject");
      const urlCurso = params.get("curso");
      
      if (urlSubject) setDisplaySubject(urlSubject);
      if (urlCurso) setDisplayGrado(urlCurso);
    }
  }, []);

  const subject = subjects.find(s => s.name === displaySubject);
  const normalizedGradeForCurriculum = normalizeGrade(displayGrado.split('-')[0]);

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 md:pb-8">
        
        {/* Header Section */}
        <div className="lg:col-span-12 mb-2">
          <div className="flex justify-between items-center mb-6">
            <Link href="/horario" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all group px-4 py-2 bg-white rounded-xl border border-outline-variant/30 shadow-sm">
              <LayoutDashboard size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Volver al Horario</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-xl font-black text-[10px] tracking-widest">
              <span className="animate-pulse w-2 h-2 rounded-full bg-secondary"></span>
              CENTRO DE MANDO EN VIVO
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-10 rounded-[3rem] border border-outline-variant shadow-2xl relative overflow-hidden">
            {/* Elemento de diseño de fondo */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-lg shadow-primary/20">
                  MATRÍCULA {displayGrado}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-[10px] font-black text-on-surface-variant uppercase opacity-40 tracking-widest">Sesión de Hoy</span>
              </div>
              <h1 className="text-5xl font-black text-on-surface tracking-tighter uppercase italic leading-none">{displaySubject}</h1>
              <p className="text-sm font-bold text-on-surface-variant uppercase tracking-[0.5em] mt-3 opacity-60">
                Aula de Clase Interactiva
              </p>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button className="h-16 px-8 bg-slate-50 border border-slate-200 rounded-[1.5rem] flex items-center gap-3 text-slate-700 hover:bg-slate-100 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95 shadow-sm">
                <LayoutGrid size={20} />
                <span>Recursos</span>
              </button>
              <button className="h-16 px-12 bg-primary text-white rounded-[1.5rem] flex items-center gap-3 hover:opacity-90 shadow-2xl shadow-primary/30 transition-all text-[11px] font-black uppercase tracking-widest active:scale-95">
                <CheckCircle size={22} />
                <span>Finalizar Clase</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contenido Principal (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <AttendanceList />
          
          {/* Dashboard de Calificaciones */}
          <ActivityGrader course={displayGrado} subject={displaySubject} />
        </div>

        {/* Barra Lateral (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <ClassInsights course={displayGrado} subject={displaySubject} />
          <TopicSelector subjectId={displaySubject} grade={normalizedGradeForCurriculum} />
          <SessionNotes subject={displaySubject} course={displayGrado} />
          
          <div className="p-8 bg-surface-container rounded-[2.5rem] border border-outline-variant relative overflow-hidden group shadow-inner">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <HardDrive size={80} />
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                   <HardDrive size={20} className="text-on-surface" />
                </div>
                <span className="text-[11px] font-black text-on-surface uppercase tracking-widest">Estado Local</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-black px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">94% ÓPTIMO</span>
            </div>
            <div className="w-full bg-outline-variant h-3 rounded-full overflow-hidden relative z-10 shadow-inner">
              <div className="bg-emerald-500 h-full w-[94%] rounded-full shadow-[0_0_12px_rgba(16,185,129,0.4)]"></div>
            </div>
            <p className="mt-6 text-xs text-on-surface-variant font-medium leading-relaxed relative z-10">
              La protección 360 activa está guardando cada acción en tu memoria local. No necesitas internet para continuar tu labor docente.
            </p>
          </div>
        </aside>
      </main>

      <BottomNavBar />
    </div>
  );
}

