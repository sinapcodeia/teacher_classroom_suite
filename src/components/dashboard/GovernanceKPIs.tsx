"use client";

import { useApp, normalizeGrade } from "@/context/AppContext";
import { Cake, Users, TrendingUp, AlertTriangle, ChevronRight, UserCheck, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface GovernanceKPIsProps {
  grado: string;
  curso: string;
}

export default function GovernanceKPIs({ grado, curso }: GovernanceKPIsProps) {
  const { students, myStudents, profile } = useApp();
  
  const stats = useMemo(() => {
    const targetStudents = profile.isSuperAdmin ? students : myStudents;
    
    // Aplicar filtros dinámicos
    let active = targetStudents.filter(s => s.isActive !== false);
    if (grado !== "TODOS") {
      active = active.filter(s => normalizeGrade(s.grado) === grado);
    }
    if (curso !== "TODOS") {
      active = active.filter(s => s.curso === curso);
    }

    const today = new Date();
    const todayStr = today.toISOString().slice(5, 10);
    const monthStr = today.toISOString().slice(5, 7);

    const birthdaysToday = active.filter(s => {
      if (!s.fechaNacimiento) return false;
      const bDate = new Date(s.fechaNacimiento);
      return !isNaN(bDate.getTime()) && bDate.toISOString().slice(5, 10) === todayStr;
    });

    const birthdaysMonth = active.filter(s => {
      if (!s.fechaNacimiento) return false;
      const bDate = new Date(s.fechaNacimiento);
      return !isNaN(bDate.getTime()) && bDate.toISOString().slice(5, 7) === monthStr;
    });

    const gender = {
      m: active.filter(s => s.genero === "M").length,
      f: active.filter(s => s.genero === "F").length,
      parity: 0
    };
    gender.parity = active.length > 0 ? Math.round((Math.min(gender.m, gender.f) / Math.max(gender.m, gender.f)) * 100) : 0;

    const extraedad = active.filter(s => {
      if (!s.fechaNacimiento) return false;
      const age = today.getFullYear() - new Date(s.fechaNacimiento).getFullYear();
      const gradeNum = parseInt(normalizeGrade(s.grado));
      if (isNaN(gradeNum)) return false;
      return age > (gradeNum + 8);
    });

    return { birthdaysToday, birthdaysMonth, gender, extraedad, totalActive: active.length };
  }, [students, myStudents, profile.isSuperAdmin, grado, curso]);

  const { birthdaysToday, birthdaysMonth, gender, extraedad, totalActive } = stats;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* CARD: CUMPLEAÑOS (Engagement) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
          <Cake size={80} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
            <Cake size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Pedagogía del Afecto</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tighter text-on-surface">
            {birthdaysToday.length} <span className="text-xs font-bold text-on-surface-variant/40">HOY</span>
          </h3>
          <p className="text-[11px] font-bold text-on-surface-variant">
            {birthdaysMonth.length} cumpleañeros este mes
          </p>
        </div>
        {birthdaysToday.length > 0 && (
          <div className="mt-4 p-3 bg-rose-50 rounded-2xl border border-rose-100 animate-pulse">
            <p className="text-[10px] font-black text-rose-700 uppercase leading-tight">
              🎉 {birthdaysToday.map(s => s.primerNombre).join(", ")}
            </p>
          </div>
        )}
      </motion.div>

      {/* CARD: GÉNERO (Población) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Equidad Institucional</span>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tighter text-on-surface">{gender.parity}%</h3>
            <p className="text-[11px] font-bold text-on-surface-variant">Índice de Paridad</p>
          </div>
          <div className="text-right">
            <div className="flex gap-1 mb-1">
              <div className="w-2 h-4 bg-blue-400 rounded-full" />
              <div className="w-2 h-4 bg-rose-400 rounded-full" />
            </div>
            <p className="text-[9px] font-black text-on-surface-variant/40 uppercase">{gender.m}M | {gender.f}F</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: `${(gender.m / totalActive) * 100}%` }} className="bg-blue-500 h-full" />
          <div style={{ width: `${(gender.f / totalActive) * 100}%` }} className="bg-rose-500 h-full" />
        </div>
      </motion.div>

      {/* CARD: EXTRAEDAD (Riesgo) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-[2.5rem] border border-outline-variant shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Alerta Pedagógica</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tighter text-on-surface">
            {extraedad.length} <span className="text-xs font-bold text-on-surface-variant/40">CASOS</span>
          </h3>
          <p className="text-[11px] font-bold text-on-surface-variant">Riesgo por Extraedad Detectado</p>
        </div>
        {extraedad.length > 0 && (
          <div className="mt-4 flex items-center gap-2 text-amber-600">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-black uppercase">Intervención Recomendada</span>
          </div>
        )}
      </motion.div>

      {/* CARD: TOTAL (Gobernanza) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-on-surface p-6 rounded-[2.5rem] shadow-2xl group relative overflow-hidden"
      >
        <div className="absolute -right-4 -bottom-4 p-4 opacity-10 scale-150 rotate-12">
          <UserCheck size={80} className="text-white" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
            <UserCheck size={20} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Gobernanza Activa</span>
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tighter text-white">{totalActive}</h3>
          <p className="text-[11px] font-bold text-white/60">Estudiantes bajo tu cuidado</p>
        </div>
        <div className="mt-4 flex items-center gap-2 text-primary-container">
          <Heart size={14} fill="currentColor" />
          <span className="text-[10px] font-black uppercase">Datos Protegidos 100%</span>
        </div>
      </motion.div>
    </div>
  );
}
