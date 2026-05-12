"use client";

import { useApp } from "@/context/AppContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, LineChart, Line,
  Cell, PieChart, Pie
} from "recharts";
import { TrendingUp, Users, Target, Activity, Calendar } from "lucide-react";
import { useMemo } from "react";

export default function PredictiveTrends() {
  const { students, profile } = useApp();

  // ── FILTRADO POR GOBERNANZA (CONTEXTO DOCENTE) ──
  const myStudents = useMemo(() => {
    const isAdmin = profile.isSuperAdmin || profile.role === "RECTOR" || profile.role === "COORDINADOR";
    if (isAdmin) return students;
    
    // Si no es admin, solo vemos nuestros cursos del horario
    const effectiveCourses = (profile.teachingCourses?.length ?? 0) > 0 
      ? profile.teachingCourses 
      : [...new Set((profile.weeklySchedule || []).map(b => b.course))];
    
    return students.filter(s => effectiveCourses.includes(s.curso));
  }, [students, profile]);

  // 1. Distribución de Desempeño
  const performanceData = useMemo(() => {
    const counts = { "Superior": 0, "Alto": 0, "Básico": 0, "Bajo": 0 };
    myStudents.forEach(s => {
      const avg = s.avgGrade || 0;
      if (avg >= 4.6) counts["Superior"]++;
      else if (avg >= 4.0) counts["Alto"]++;
      else if (avg >= 3.0) counts["Básico"]++;
      else counts["Bajo"]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [myStudents]);

  // 2. Tendencia de Notas
  const trendData = useMemo(() => {
    const months: Record<string, { sum: number, count: number }> = {};
    myStudents.forEach(s => {
      s.grades?.forEach(g => {
        const month = new Date(g.date).toLocaleDateString('es-CO', { month: 'short' });
        if (!months[month]) months[month] = { sum: 0, count: 0 };
        months[month].sum += g.score;
        months[month].count++;
      });
    });
    
    return Object.entries(months).map(([month, data]) => ({
      month,
      avg: parseFloat((data.sum / data.count).toFixed(2))
    })).sort((a, b) => {
      const order = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
      return order.indexOf(a.month) - order.indexOf(b.month);
    });
  }, [myStudents]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  return (
    <section className="mb-10 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Centro de Analítica Avanzada</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Monitoreo de Tendencias y Big Data Educativo</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 shadow-sm">
             <Calendar size={12} className="text-primary" />
             Periodo Actual
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Desempeño General - AreaChart */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  {profile.role === 'DOCENTE' ? 'Evolución de Mis Cursos' : 'Evolución de Promedio Institucional'}
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  {profile.role === 'DOCENTE' ? 'Rendimiento histórico de tus estudiantes' : 'Tendencia mensual de notas registradas'}
                </p>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <YAxis 
                  domain={[0, 5]} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="avg" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorAvg)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución de Rangos - PieChart */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40">
           <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Distribución de Mis Alumnos</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Por nivel de desempeño académico</p>
            </div>
          </div>

          <div className="h-[220px] w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={performanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {performanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
             {performanceData.map((item, i) => (
               <div key={item.name} className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                   <span className="text-[10px] font-bold text-slate-500 uppercase">{item.name}</span>
                 </div>
                 <span className="text-xs font-black text-slate-900">{item.value} est.</span>
               </div>
             ))}
          </div>
        </div>

      </div>
    </section>
  );
}
