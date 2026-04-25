"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { useApp } from "@/context/AppContext";
import { Plus, RefreshCw, Star, Calendar as CalendarIcon, ArrowRight, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import NextClassAlert from "@/components/dashboard/NextClassAlert";

export default function Home() {
  const { subjects, schedule, profile } = useApp();

  const formattedDate = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Obtener la sesión actual del horario según la hora (Simplificado para visualización en dashboard)
  const currentSession = schedule[0]; // Para la demo, mostramos la primera si no se encuentra clase activa

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest font-inter">
      <TopAppBar />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto w-full pb-32">
        
        {/* Alertas en Tiempo Real */}
        <NextClassAlert />
        
        {/* Encabezado del Dashboard */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] font-black text-primary mb-2 uppercase tracking-[0.4em]">{formattedDate}</p>
            <h2 className="text-4xl font-black text-on-surface tracking-tighter uppercase italic">¡Hola, {profile.name.split(" ")[1]}!</h2>
            <p className="text-xs font-bold text-on-surface-variant uppercase mt-1 opacity-60">IETABA — GESTIÓN DOCENTE NIVEL SUPERIOR</p>
          </div>
          <div className="flex items-center bg-surface-container rounded-2xl p-1.5 shadow-inner">
             <Link href="/horario" className="px-8 py-3 text-[10px] font-black bg-white shadow-xl rounded-xl text-primary uppercase tracking-widest hover:scale-105 transition-all">Ver Horario Completo</Link>
          </div>
        </div>

        {/* Cuadrícula Principal del Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Resumen del Horario Interactivo */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-white border border-outline-variant rounded-[3rem] overflow-hidden shadow-2xl relative">
                <div className="bg-surface-container-low px-8 py-6 border-b border-outline-variant flex items-center justify-between">
                   <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant flex items-center gap-3">
                      <Clock size={18} className="text-primary" /> Actividad del Día
                   </h3>
                   <span className="text-[9px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase italic">Tiempo Real</span>
                </div>
                
                <div className="p-8">
                   <div className="space-y-4">
                      {schedule.slice(0, 4).map((session, i) => (
                        <div key={i} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface-container-lowest transition-all group border border-transparent hover:border-outline-variant/30">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${session.color}`}>
                              {session.time.split(' ')[0]}
                           </div>
                           <div className="flex-1">
                              <p className="text-[12px] font-black text-on-surface uppercase tracking-tight">{session.subject}</p>
                              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">Grado {session.group}</p>
                           </div>
                           <Link href="/clase-en-vivo" className="p-3 text-on-surface-variant hover:text-primary opacity-0 group-hover:opacity-100 transition-all">
                              <ArrowRight size={20} />
                           </Link>
                        </div>
                      ))}
                   </div>
                   
                   <Link href="/horario" className="mt-8 block text-center py-4 bg-surface-container-low rounded-2xl text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary/5 transition-all">
                      Ver Calendario Semanal Completo
                   </Link>
                </div>
             </div>
          </div>

          {/* Widgets de Barra Lateral */}
          <aside className="lg:col-span-4 space-y-8">
             {/* Tarjeta de Próxima Sesión de Alta Prioridad */}
             <div className="bg-on-surface text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover:rotate-45 transition-all duration-1000"><CalendarIcon size={140} /></div>
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-primary-container uppercase tracking-[0.3em] mb-6">Próxima Sesión</p>
                   <h4 className="text-3xl font-black tracking-tighter uppercase italic mb-2">
                      {currentSession?.subject || "Sin Clase"}
                   </h4>
                   <p className="text-sm font-bold opacity-60 uppercase mb-8">Grado {currentSession?.group} • {currentSession?.time}</p>
                   
                   <Link href="/clase-en-vivo" className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                      Tomar Asistencia
                      <ArrowRight size={18} />
                   </Link>
                </div>
             </div>
 
             {/* Widget de Integridad del Sistema */}
             <div className="bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                      <RefreshCw size={24} />
                   </div>
                   <div>
                      <h5 className="text-[11px] font-black uppercase tracking-widest text-on-surface">Base de Datos</h5>
                      <span className="text-[9px] font-bold text-secondary uppercase">Estado: Sincronizado</span>
                   </div>
                </div>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed mb-6">
                   Toda la población estudiantil y el horario oficial están cargados y listos para uso fuera de línea.
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-outline-variant">
                   <div className="flex -space-x-2">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-surface-container border-2 border-white flex items-center justify-center text-[8px] font-black">
                           {i}
                        </div>
                      ))}
                   </div>
                   <Link href="/admin" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Gestionar Master</Link>
                </div>
             </div>
          </aside>
        </div>
      </main>

      <BottomNavBar />
    </div>
  );
}
