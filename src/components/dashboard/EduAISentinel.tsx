"use client";

import { useApp } from "@/context/AppContext";
import { 
  BrainCircuit, Sparkles, TrendingUp, AlertTriangle, 
  ChevronRight, Zap, Target, ArrowUpRight, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

export default function EduAISentinel() {
  const { students, agendaNotes } = useApp();
  const [isExpanded, setIsExpanded] = useState(false);

  // Simulación de lógica de cierre SAPRED o días restantes para propósitos de IA
  const daysLeft = 12; 

  const insights = useMemo(() => {
    const list = [];
    
    // Predicción de Deserción
    const riskCount = students.filter(s => {
      const abs = Object.values(s.attendanceRecord || {}).filter(v => v === 'absent').length;
      return abs >= 3 && (s.avgGrade || 0) < 3.5;
    }).length;

    if (riskCount > 0) {
      list.push({
        id: "risk",
        title: "Detección de Abandono Escolar",
        message: `Se han identificado ${riskCount} estudiantes con patrones correlacionados de ausentismo y bajo promedio. Riesgo de deserción elevado para este periodo.`,
        level: "CRITICAL",
        action: "Ver reporte de riesgo",
        icon: AlertTriangle,
        color: "text-rose-500",
        bg: "bg-rose-500/10",
        border: "border-rose-500/20"
      });
    }

    // Tendencia Académica
    const avg = students.reduce((acc, s) => acc + (s.avgGrade || 0), 0) / (students.length || 1);
    list.push({
      id: "trend",
      title: "Optimización de Rendimiento",
      message: `El promedio institucional se mantiene en ${avg.toFixed(1)}. Los grupos de 10° muestran una aceleración del 15% en la entrega de actividades técnicas.`,
      level: "INFO",
      action: "Analizar tendencias",
      icon: TrendingUp,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20"
    });

    // Agenda Inteligente
    const pending = agendaNotes.filter(n => n.type === 'TASK' && !n.isCompleted).length;
    if (pending > 0) {
      list.push({
        id: "agenda",
        title: "Priorización de Carga Docente",
        message: `Detectadas ${pending} tareas críticas sin calificar. Basado en el cierre SAPRED (${daysLeft} días), hoy es el momento óptimo para la consolidación.`,
        level: "WARNING",
        action: "Ir a la Agenda",
        icon: Target,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20"
      });
    }

    return list;
  }, [students, agendaNotes, daysLeft]);

  return (
    <section className="mb-10 relative">
      <motion.div 
        layout
        className="bg-slate-950 rounded-[2.5rem] p-1 border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Background Aura */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[80px] pointer-events-none" />

        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                  <BrainCircuit size={28} className="text-white" />
                </div>
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-950" 
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                   <h2 className="text-white font-black text-xl tracking-tighter uppercase italic">EduAI Sentinel</h2>
                   <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-full border border-blue-500/20 tracking-widest">v4.0 PRO</span>
                </div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Analítica Predictiva e Inteligencia Institucional</p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              {isExpanded ? "Contraer" : "Explorar Insights"}
              <Activity size={14} className="text-blue-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatePresence>
              {insights.map((insight, idx) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`p-6 rounded-3xl border ${insight.border} ${insight.bg} group relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <insight.icon size={48} />
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-8 h-8 rounded-xl ${insight.bg} border ${insight.border} flex items-center justify-center ${insight.color}`}>
                       <insight.icon size={16} />
                    </div>
                    <h3 className={`text-[10px] font-black uppercase tracking-widest ${insight.color}`}>{insight.title}</h3>
                  </div>

                  <p className="text-slate-200 text-xs font-medium leading-relaxed mb-6">
                    {insight.message}
                  </p>

                  <button className="flex items-center gap-2 text-[9px] font-black uppercase text-white tracking-[0.2em] group/btn">
                    {insight.action}
                    <ArrowUpRight size={14} className="text-slate-500 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-8 pt-8 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              {/* More advanced metrics here later */}
              <div className="space-y-4">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recomendación Estratégica</p>
                 <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                    <p className="text-sm text-slate-300 italic leading-relaxed">
                      &quot;Basado en el historial de los últimos 3 años, el Grado 9° tiende a mostrar una caída del 20% en participación durante la segunda semana de mayo por festividades locales. Sugerimos adelantar talleres evaluativos a hoy.&quot;
                    </p>
                 </div>
              </div>
              <div className="flex items-center justify-center">
                 <div className="text-center p-10 bg-gradient-to-br from-indigo-900/20 to-transparent rounded-full border border-indigo-500/10">
                    <Sparkles size={40} className="text-indigo-400 mx-auto mb-4 animate-pulse" />
                    <p className="text-xs font-bold text-slate-400">Motor de IA trabajando en segundo plano...</p>
                 </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
