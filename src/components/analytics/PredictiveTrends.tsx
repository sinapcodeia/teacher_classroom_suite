"use client";

import { useApp, calculateDetailedFinal, DetailedGrades } from "@/context/AppContext";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie
} from "recharts";
import { TrendingUp, Users, Target, Activity, Calendar, Filter, Award } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

export default function PredictiveTrends() {
  const { students, myStudents, profile, masterData } = useApp();
  const [mounted, setMounted] = useState(false);

  // ── ESTADOS DE FILTROS ACTIVO 360 ──────────────────────────────────────────
  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1"); // "p1", "p2", "p3", "acumulado"
  const [selectedSubject, setSelectedSubject] = useState<string>("TODAS"); // "TODAS", "TECNOLOGÍA", "MATEMÁTICAS", etc.
  const [selectedGradeCourse, setSelectedGradeCourse] = useState<string>("TODOS"); // "TODOS", "6°-6", etc.

  useEffect(() => {
    setMounted(true);
  }, []);

  // Obtener combinaciones de Grado-Curso del docente
  const availableGradeCourses = useMemo(() => {
    if (profile.teachingCourses?.length) {
      return ["TODOS", ...profile.teachingCourses];
    }
    // Fallback: cursos de mis alumnos
    const courses = new Set<string>();
    myStudents.forEach(s => {
      if (s.grado && s.curso) {
        courses.add(`${s.grado}-${s.curso}`);
      }
    });
    return ["TODOS", ...Array.from(courses)];
  }, [myStudents, profile]);

  // Obtener materias disponibles
  const availableSubjects = useMemo(() => {
    if (profile.teachingSubjectsList?.length) {
      return ["TODAS", ...profile.teachingSubjectsList];
    }
    return ["TODAS", "TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"];
  }, [profile]);

  // ── CÁLCULO DINÁMICO DE PROMEDIO DE UN ESTUDIANTE ──────────────────────────
  const getStudentAvgForFilter = (student: any, period: string, subjectFilter: string): number | null => {
    const detailed = student.detailedGrades;
    if (!detailed) return student.avgGrade || null;

    // Obtener las materias a evaluar
    let subjectsToEval: string[] = [];
    if (subjectFilter === "TODAS") {
      subjectsToEval = Object.keys(detailed);
      if (subjectsToEval.length === 0) return student.avgGrade || null;
    } else {
      subjectsToEval = [subjectFilter];
    }

    const periodsToEval = period === "acumulado" ? ["p1", "p2", "p3"] : [period];
    let totalScoreSum = 0;
    let scoreCount = 0;

    subjectsToEval.forEach(subj => {
      const subjGrades = detailed[subj];
      if (!subjGrades) return;

      periodsToEval.forEach(p => {
        const pGrades = subjGrades[p] as DetailedGrades;
        if (!pGrades) return;

        // Comprobar si hay alguna nota ingresada
        const hasGrades = 
          pGrades.sb.some(v => v !== null) || 
          pGrades.sbh.some(v => v !== null) || 
          pGrades.sr.some(v => v !== null) || 
          pGrades.cv.some(v => v !== null) || 
          pGrades.aut !== null;

        if (hasGrades) {
          const finalScore = calculateDetailedFinal(pGrades);
          if (finalScore > 0) {
            totalScoreSum += finalScore;
            scoreCount++;
          }
        }
      });
    });

    return scoreCount > 0 ? Number((totalScoreSum / scoreCount).toFixed(1)) : null;
  };

  // ── ESTUDIANTES FILTRADOS ──────────────────────────────────────────────────
  const filteredStudentsWithGrades = useMemo(() => {
    return myStudents.map(s => {
      // Aplicar filtro de grado y curso
      if (selectedGradeCourse !== "TODOS") {
        const [g, c] = selectedGradeCourse.split('-');
        if (s.grado !== g || s.curso !== c) return null;
      }
      
      const computedGrade = getStudentAvgForFilter(s, selectedPeriod, selectedSubject);
      return computedGrade !== null ? { ...s, displayGrade: computedGrade } : null;
    }).filter(Boolean) as any[];
  }, [myStudents, selectedPeriod, selectedSubject, selectedGradeCourse]);

  // ── 1. DISTRIBUCIÓN DE DESEMPEÑO REAL (PIE) ────────────────────────────────
  const performanceData = useMemo(() => {
    const counts = { "Superior (4.6 - 5.0)": 0, "Alto (4.0 - 4.5)": 0, "Básico (3.0 - 3.9)": 0, "Bajo (1.0 - 2.9)": 0 };
    filteredStudentsWithGrades.forEach(s => {
      const avg = s.displayGrade;
      if (avg >= 4.6) counts["Superior (4.6 - 5.0)"]++;
      else if (avg >= 4.0) counts["Alto (4.0 - 4.5)"]++;
      else if (avg >= 3.0) counts["Básico (3.0 - 3.9)"]++;
      else counts["Bajo (1.0 - 2.9)"]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredStudentsWithGrades]);

  // ── 2. EVOLUCIÓN / COMPARATIVA DE CURSOS DINÁMICA (AREA/LINE) ──────────────
  const trendData = useMemo(() => {
    // Si no hay alumnos, retornar vacío
    if (filteredStudentsWithGrades.length === 0) return [];

    // Agrupar promedios por Curso para comparar el rendimiento real de las aulas
    const courseStats: Record<string, { sum: number, count: number }> = {};
    
    filteredStudentsWithGrades.forEach(s => {
      const key = `${s.grado}-${s.curso}`;
      if (!courseStats[key]) {
        courseStats[key] = { sum: 0, count: 0 };
      }
      courseStats[key].sum += s.displayGrade;
      courseStats[key].count++;
    });

    return Object.entries(courseStats).map(([course, stats]) => ({
      course,
      promedio: parseFloat((stats.sum / stats.count).toFixed(2))
    })).sort((a, b) => a.course.localeCompare(b.course));
  }, [filteredStudentsWithGrades]);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

  if (!mounted) return <div className="h-[400px] w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />;

  return (
    <section className="mb-10 space-y-6">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 md:p-8 rounded-[2rem] border border-outline-variant/30 shadow-xl">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic flex items-center gap-2">
            <TrendingUp className="text-primary" />
            Centro de Analítica Avanzada 360°
          </h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
            Monitoreo en Tiempo Real de Calificaciones y Progreso Curricular
          </p>
        </div>
        
        {/* PANEL DE FILTROS CONTROLADO */}
        <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-200/50">
          <div className="flex items-center gap-1 text-[8px] font-black uppercase text-slate-400 tracking-widest pl-2">
            <Filter size={10} />
            Filtros:
          </div>

          {/* Selector de Periodo */}
          <select 
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-wider focus:outline-none cursor-pointer hover:bg-slate-50"
          >
            <option value="p1">1° Periodo (Maza)</option>
            <option value="p2">2° Periodo (Pas)</option>
            <option value="p3">3° Periodo (Kutña)</option>
            <option value="acumulado">Promedio Acumulado</option>
          </select>

          {/* Selector de Materia */}
          <select 
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-wider focus:outline-none cursor-pointer hover:bg-slate-50"
          >
            {availableSubjects.map(sub => (
              <option key={sub} value={sub}>{sub === "TODAS" ? "Todas las Materias" : sub}</option>
            ))}
          </select>

          {/* Selector de Curso */}
          <select 
            value={selectedGradeCourse}
            onChange={(e) => setSelectedGradeCourse(e.target.value)}
            className="bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-wider focus:outline-none cursor-pointer hover:bg-slate-50"
          >
            {availableGradeCourses.map(gc => (
              <option key={gc} value={gc}>{gc === "TODOS" ? "Todos los Cursos" : `Curso ${gc}`}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DASHBOARD ANALÍTICO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRÁFICO 1: EVOLUCIÓN Y COMPARATIVA DE CURSOS */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">
                  Promedio de Notas por Aula y Nivel
                </h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">
                  Comparativa de rendimiento en el periodo académico seleccionado
                </p>
              </div>
            </div>
            <div className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">
              {filteredStudentsWithGrades.length} Estudiantes Evaluados
            </div>
          </div>

          <div className="h-[300px] min-h-[300px] w-full flex items-center justify-center">
            {trendData.length > 0 ? (
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
                    dataKey="course" 
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
                    formatter={(value) => [`${value} / 5.0`, 'Promedio']}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="promedio" 
                    stroke="#3b82f6" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorAvg)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-3 opacity-40 py-20">
                <Activity size={48} className="mx-auto text-slate-300 animate-pulse" />
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-800">Sin datos de notas ingresadas para este filtro</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Registra notas en la bitácora o en la clase en vivo</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO 2: DONA DE DISTRIBUCIÓN DE DESEMPEÑOS */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
           <div>
             <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight">Distribución de Mis Alumnos</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Por nivel de desempeño real</p>
              </div>
            </div>

            <div className="h-[200px] min-h-[200px] w-full mb-6 flex items-center justify-center">
              {filteredStudentsWithGrades.length > 0 ? (
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
              ) : (
                <div className="text-center space-y-2 opacity-40">
                  <Users size={48} className="mx-auto text-slate-300 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">No hay alumnos evaluados</p>
                </div>
              )}
            </div>
           </div>

           <div className="space-y-3 pt-4 border-t border-slate-100">
             {performanceData.map((item, i) => (
               <div key={item.name} className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{item.name}</span>
                 </div>
                 <span className="text-xs font-black text-slate-900 bg-slate-50 px-3 py-1 rounded-lg">
                   {item.value} {item.value === 1 ? 'estudiante' : 'estudiantes'}
                 </span>
               </div>
             ))}
           </div>
        </div>

      </div>
    </section>
  );
}
