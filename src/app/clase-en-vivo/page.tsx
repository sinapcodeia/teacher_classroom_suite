"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import AttendanceList from "@/components/live-class/AttendanceList";
import TopicSelector from "@/components/live-class/TopicSelector";
import SessionNotes from "@/components/live-class/SessionNotes";
import { ArrowLeft, Plus, CheckCircle, HardDrive, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 pb-24 md:pb-8">
        
        {/* Header Section */}
        <div className="lg:col-span-12 mb-2">
          <div className="flex justify-between items-center mb-6">
            <Link href="/horario" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all group px-4 py-2 bg-white rounded-xl border border-outline-variant/30 shadow-sm">
              <LayoutDashboard size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Volver al Horario</span>
            </Link>
            <div className="flex items-center gap-2 px-4 py-2 bg-secondary/10 text-secondary rounded-xl font-black text-[10px] tracking-widest">
              <span className="animate-pulse w-2 h-2 rounded-full bg-secondary"></span>
              CLASE EN VIVO
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-8 rounded-3xl border border-outline-variant shadow-sm relative overflow-hidden">
            {/* Background design element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-lg uppercase tracking-tighter">
                  MATRÍCULA {displayGrado}
                </span>
                <span className="text-xs font-bold text-on-surface-variant uppercase opacity-60">— Sesión de Hoy</span>
              </div>
              <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase">{displaySubject}</h1>
              <p className="text-lg text-on-surface-variant font-medium mt-1">
                AULA DE CLASE
              </p>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button className="h-14 px-6 border border-outline-variant rounded-2xl flex items-center gap-2 text-on-surface hover:bg-surface-container-low transition-all text-sm font-bold active:scale-95">
                <Plus size={20} />
                <span>Nota Rápida</span>
              </button>
              <button className="h-14 px-10 bg-primary text-white rounded-2xl flex items-center gap-3 hover:opacity-90 shadow-xl shadow-primary/20 transition-all text-sm font-black active:scale-95">
                <CheckCircle size={22} />
                <span>Finalizar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <AttendanceList />
        </div>

        {/* Sidebar (4 cols) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <TopicSelector subjectId={subject?.id} />
          <SessionNotes />
          
          <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <HardDrive size={60} />
            </div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <HardDrive size={18} className="text-on-surface" />
                <span className="text-xs font-black text-on-surface uppercase tracking-widest">Almacenamiento Offline</span>
              </div>
              <span className="text-[10px] text-secondary font-black">94% ÓPTIMO</span>
            </div>
            <div className="w-full bg-outline-variant h-2.5 rounded-full overflow-hidden relative z-10">
              <div className="bg-secondary h-full w-[94%] rounded-full shadow-[0_0_8px_rgba(0,108,74,0.4)]"></div>
            </div>
            <p className="mt-4 text-[11px] text-on-surface-variant font-medium leading-relaxed relative z-10">
              La protección 360 activa está guardando cada acción en tu memoria local. No necesitas internet para continuar tu labor docente.
            </p>
          </div>
        </aside>
      </main>

      <BottomNavBar />
    </div>
  );
}
