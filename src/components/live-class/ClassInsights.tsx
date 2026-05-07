"use client";

import { useMemo } from "react";
import { Sparkles, AlertTriangle, Lightbulb, Users, ArrowUpRight, TrendingDown } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface ClassInsightsProps {
  course: string;
  subject: string;
}

export default function ClassInsights({ course, subject }: ClassInsightsProps) {
  const { students } = useApp();

  const insights = useMemo(() => {
    const classStudents = students.filter(s => s.curso === course && s.isActive !== false);
    if (classStudents.length === 0) return [];

    const results: { title: string, message: string, type: 'warning' | 'tip' | 'success', icon: any }[] = [];

    // 1. Análisis de Ausentismo
    const atRiskAbsence = classStudents.filter(s => {
      if (!s.attendanceRecord) return false;
      return Object.values(s.attendanceRecord).filter(v => v === 'absent').length >= 3;
    });

    if (atRiskAbsence.length > 0) {
      results.push({
        title: "Alerta de Deserción",
        message: `Hay ${atRiskAbsence.length} estudiantes con inasistencia crítica. Se sugiere citar a acudientes.`,
        type: 'warning',
        icon: AlertTriangle
      });
    }

    // 2. Análisis de Rendimiento
    const failingStudents = classStudents.filter(s => s.avgGrade > 0 && s.avgGrade < 3.0);
    if (failingStudents.length > 3) {
      results.push({
        title: "Refuerzo Necesario",
        message: `El ${Math.round((failingStudents.length / classStudents.length) * 100)}% del grupo tiene bajo rendimiento. Considera una sesión de nivelación.`,
        type: 'warning',
        icon: TrendingDown
      });
    } else {
      results.push({
        title: "Sugerencia IA",
        message: "El rendimiento grupal es estable. Puedes avanzar hacia temas de mayor complejidad.",
        type: 'success',
        icon: ArrowUpRight
      });
    }

    // 3. Sugerencia Pedagógica Dinámica
    const tips = [
      "Integra herramientas visuales para reforzar el tema de hoy.",
      "Realiza una pausa activa de 5 minutos para mejorar el enfoque.",
      "Fomenta el trabajo en pares para los estudiantes con dificultades.",
      "Utiliza ejemplos del contexto local (El Diviso) para mayor relevancia."
    ];
    results.push({
      title: "Tip Metodológico",
      message: tips[Math.floor(Math.random() * tips.length)],
      type: 'tip',
      icon: Lightbulb
    });

    return results;
  }, [students, course]);

  return (
    <section className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
          <Sparkles size={20} className="text-primary-container" />
        </div>
        <div>
          <h2 className="text-lg font-black uppercase tracking-tighter italic">Asistente IA IETABA</h2>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Análisis predictivo de aula</p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        {insights.map((insight, i) => (
          <div key={i} className={`p-4 rounded-2xl border flex gap-4 animate-in slide-in-from-right-4 duration-500 delay-${i * 100} ${
            insight.type === 'warning' ? 'bg-rose-500/10 border-rose-500/20' : 
            insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 
            'bg-blue-500/10 border-blue-500/20'
          }`}>
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${
              insight.type === 'warning' ? 'bg-rose-500/20 text-rose-400' : 
              insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 
              'bg-blue-500/20 text-blue-400'
            }`}>
              <insight.icon size={18} />
            </div>
            <div>
              <h3 className={`text-[11px] font-black uppercase tracking-widest mb-1 ${
                insight.type === 'warning' ? 'text-rose-400' : 
                insight.type === 'success' ? 'text-emerald-400' : 
                'text-blue-400'
              }`}>{insight.title}</h3>
              <p className="text-[11px] font-medium text-slate-300 leading-relaxed">{insight.message}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/10 hover:text-white transition-all">
        Ver Reporte de IA Completo
      </button>
    </section>
  );
}
