"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Bell, Clock, ArrowRight, PlayCircle } from "lucide-react";
import Link from "next/link";

export default function NextClassAlert() {
  const { schedule } = useApp();
  const [nextClass, setNextClass] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const daysMap = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const currentDay = daysMap[currentTime.getDay()];
    
    const currentHour = currentTime.getHours();
    const currentMin = currentTime.getMinutes();
    const currentTotalMin = currentHour * 60 + currentMin;

    // Find classes for today that haven't ended yet
    const todayClasses = schedule.filter(s => s.day === currentDay);
    
    const upcoming = todayClasses.find(s => {
      const startTimeStr = s.time.split(' - ')[0]; // e.g. "07:30"
      const [h, m] = startTimeStr.split(':').map(Number);
      const startTotalMin = h * 60 + m;
      
      // If the class starts after now, or if we are currently in it
      return startTotalMin >= currentTotalMin - 60; // Allow 1 hour window
    });

    setNextClass(upcoming);
  }, [currentTime, schedule]);

  if (!nextClass) return null;

  return (
    <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-700">
      <div className="bg-primary text-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border-4 border-white/10">
        {/* Animated Background Element */}
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-inner">
             <Bell className="animate-bounce" size={32} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Alerta de Clase Activa</span>
               <span className="px-2 py-0.5 bg-secondary text-white text-[8px] font-black rounded-full animate-pulse">EN VIVO</span>
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">{nextClass.subject} — GRADO {nextClass.group}</h2>
            <p className="text-sm font-bold opacity-80 flex items-center gap-2 mt-1">
               <Clock size={16} /> Horario: {nextClass.time}
            </p>
          </div>
        </div>

        <Link 
          href="/clase-en-vivo" 
          className="px-10 py-5 bg-white text-primary rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 relative z-10"
        >
          <PlayCircle size={20} />
          Iniciar Toma de Asistencia
          <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
