"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { 
  Users, UserCheck, UserX, Cake, Award, 
  BarChart3, PieChart, TrendingDown, MapPin, 
  ChevronRight, AlertCircle, Calendar, X
} from "lucide-react";
import StudentProfileModal from "@/components/shared/StudentProfileModal";

export default function StatisticsDashboard() {
  const { students } = useApp();
  const [drilldownData, setDrilldownData] = useState<{title: string, students: any[]} | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const stats = useMemo(() => {
    // Solo procesar estudiantes activos
    const activeStudents = students.filter(s => s.isActive !== false);
    const total = activeStudents.length;
    if (total === 0) return null;

    const menList = activeStudents.filter(s => s.genero === "M");
    const womenList = activeStudents.filter(s => s.genero === "F");
    
    // Cálculo de edad
    const agesList: number[] = [];
    const ageDemographics = { 
       niños: [] as any[], 
       adolescentes: [] as any[], 
       jovenes: [] as any[], 
       adultos: [] as any[] 
    };
    const currentYear = new Date().getFullYear();
    
    activeStudents.forEach(s => {
      let birthYear = currentYear - 10;
      if (s.fechaNacimiento && !isNaN(Number(s.fechaNacimiento))) {
        const date = new Date((Number(s.fechaNacimiento) - 25569) * 86400 * 1000);
        birthYear = date.getFullYear();
      } else if (s.fechaNacimiento) {
        birthYear = new Date(s.fechaNacimiento).getFullYear() || birthYear;
      }
      
      const age = currentYear - birthYear;
      if (!isNaN(age) && age > 0 && age < 100) {
        agesList.push(age);
        if (age < 12) ageDemographics.niños.push(s);
        else if (age <= 14) ageDemographics.adolescentes.push(s);
        else if (age <= 17) ageDemographics.jovenes.push(s);
        else ageDemographics.adultos.push(s);
      }
    });

    const avgAge = agesList.length ? agesList.reduce((a, b) => a + b, 0) / agesList.length : 0;

    // Distribución por Grado y Curso con información de género
    const grades: Record<string, { count: number, students: any[] }> = {};
    const courses: Record<string, { total: number, m: number, f: number, students: any[] }> = {};
    
    activeStudents.forEach(s => {
      if (!grades[s.grado]) grades[s.grado] = { count: 0, students: [] };
      grades[s.grado].count++;
      grades[s.grado].students.push(s);
      
      const courseKey = `${s.grado}-${s.curso}`;
      if (!courses[courseKey]) courses[courseKey] = { total: 0, m: 0, f: 0, students: [] };
      courses[courseKey].total++;
      courses[courseKey].students.push(s);
      if (s.genero === "M") courses[courseKey].m++;
      if (s.genero === "F") courses[courseKey].f++;
    });

    let topFemaleCourse = { course: "-", ratio: 0, count: 0, students: [] as any[] };
    Object.entries(courses).forEach(([c, data]) => {
      const ratio = data.f / data.total;
      if (ratio > topFemaleCourse.ratio && data.total > 5) {
        topFemaleCourse = { course: c, ratio, count: data.f, students: data.students.filter(s => s.genero === "F") };
      }
    });

    const performance = {
      excelencia: activeStudents.filter(s => s.avgGrade >= 4.5),
      promedio: activeStudents.filter(s => s.avgGrade >= 3.0 && s.avgGrade < 4.5),
      riesgo: activeStudents.filter(s => s.avgGrade < 3.0),
    };

    const attendanceRisk = activeStudents.map(s => {
      const parsed = parseInt(s.attendance || "100");
      return { ...s, attNum: isNaN(parsed) ? 100 : parsed };
    }).filter(s => s.attNum < 90).sort((a, b) => a.attNum - b.attNum).slice(0, 5);

    const todayStr = new Date().toISOString().slice(5, 10);
    const birthdaysToday = activeStudents.filter(s => {
      if (!s.fechaNacimiento) return false;
      let monthDay = "";
      if (!isNaN(Number(s.fechaNacimiento))) {
         const d = new Date((Number(s.fechaNacimiento) - 25569) * 86400 * 1000);
         monthDay = d.toISOString().slice(5, 10);
      } else {
         monthDay = s.fechaNacimiento.slice(5, 10);
      }
      return monthDay === todayStr;
    });

    return {
      activeStudents, total, 
      menList, womenList, 
      avgAge: avgAge.toFixed(1), 
      majorities: ageDemographics.adultos,
      grades, courses, topFemaleCourse, ageDemographics, 
      performance, attendanceRisk, birthdaysToday,
      lowPerformance: performance.riesgo.length
    };
  }, [students]);

  if (!stats) {
    return (
      <div className="p-20 text-center text-on-surface-variant opacity-30 italic">
        <BarChart3 size={64} className="mx-auto mb-4" />
        <p className="font-black uppercase tracking-widest">Esperando datos de población...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Quick Stats - Rediseño Minimalista/Premium */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
        <div 
          onClick={() => setDrilldownData({title: "Población Estudiantil", students: stats.activeStudents})}
          className="bg-white p-8 rounded-[2rem] border border-outline-variant/30 shadow-[0_10px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer border-b-4 border-b-blue-500"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500"><Users size={80} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Población Total</p>
          <p className="text-4xl font-black text-on-surface leading-none">{stats.total}</p>
          <div className="mt-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Activos en Firestore</span>
          </div>
        </div>

        <div 
          onClick={() => setDrilldownData({title: "Distribución por Género", students: [...stats.womenList, ...stats.menList]})}
          className="bg-white p-8 rounded-[2rem] border border-outline-variant/30 shadow-[0_10px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:shadow-2xl transition-all cursor-pointer border-b-4 border-b-indigo-500"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500"><UserCheck size={80} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Equidad de Género</p>
          <div className="flex items-baseline gap-3">
            <p className="text-4xl font-black text-on-surface">{stats.menList.length}</p>
            <span className="text-[10px] font-black text-slate-300">H</span>
            <span className="text-slate-200 px-1 font-light text-2xl">|</span>
            <p className="text-4xl font-black text-on-surface">{stats.womenList.length}</p>
            <span className="text-[10px] font-black text-pink-400">M</span>
          </div>
        </div>

        <div 
          onClick={() => setDrilldownData({title: "Mayores de Edad (18+)", students: stats.majorities})}
          className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-outline-variant shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform"><Award size={60} /></div>
          <p className="text-[9px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-wider md:tracking-widest truncate">Mayores de Edad</p>
          <p className="text-2xl md:text-3xl font-black text-on-surface mt-1 md:mt-2">{stats.majorities.length}</p>
          <p className="text-[8px] font-bold text-on-surface-variant mt-3 md:mt-4 uppercase tracking-wider truncate">Alumnos con 18+ años</p>
        </div>

        <div 
          onClick={() => setDrilldownData({title: "Riesgo Académico", students: stats.performance.riesgo})}
          className="bg-error/5 p-5 md:p-6 rounded-2xl md:rounded-3xl border border-error/20 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-110 transition-transform"><TrendingDown size={60} /></div>
          <p className="text-[9px] md:text-[10px] font-black text-error uppercase tracking-wider md:tracking-widest truncate">Riesgo Académico</p>
          <p className="text-2xl md:text-3xl font-black text-error mt-1 md:mt-2">{stats.lowPerformance}</p>
          <p className="text-[8px] font-bold text-error/60 mt-3 md:mt-4 uppercase tracking-wider truncate">Bajo promedio mín.</p>
        </div>
      </div>
            {/* Middle Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        
        {/* Performance Tiers */}
        <div className="bg-white p-10 rounded-[2.5rem] border border-outline-variant/30 shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col">
          <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-[11px] font-black text-on-surface uppercase tracking-[0.2em] flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><BarChart3 size={18} /></div>
                 Rendimiento Académico
               </h3>
             </div>
          </div>
          <div className="flex-1 flex flex-col justify-center space-y-6">
             <div 
               onClick={() => setDrilldownData({title: "Alumnos con Excelencia", students: stats.performance.excelencia})}
               className="space-y-2 cursor-pointer hover:bg-slate-50 p-4 -m-4 rounded-[1.5rem] transition-all"
             >
                <div className="flex justify-between text-[10px] font-black uppercase text-amber-600">
                   <span>Excelencia Académica</span>
                   <span>{stats.performance.excelencia.length} Alumnos</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                   <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]" style={{ width: `${(stats.performance.excelencia.length/stats.total)*100}%` }}></div>
                </div>
             </div>
             <div 
               onClick={() => setDrilldownData({title: "Alumnos en Promedio", students: stats.performance.promedio})}
               className="space-y-2 cursor-pointer hover:bg-slate-50 p-4 -m-4 rounded-[1.5rem] transition-all"
             >
                <div className="flex justify-between text-[10px] font-black uppercase text-blue-600">
                   <span>Desempeño Promedio</span>
                   <span>{stats.performance.promedio.length} Alumnos</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                   <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${(stats.performance.promedio.length/stats.total)*100}%` }}></div>
                </div>
             </div>
             <div 
               onClick={() => setDrilldownData({title: "Alumnos en Riesgo", students: stats.performance.riesgo})}
               className="space-y-2 cursor-pointer hover:bg-slate-50 p-4 -m-4 rounded-[1.5rem] transition-all"
             >
                <div className="flex justify-between text-[10px] font-black uppercase text-rose-600">
                   <span>Riesgo Académico</span>
                   <span>{stats.performance.riesgo.length} Alumnos</span>
                </div>
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                   <div className="bg-gradient-to-r from-rose-400 to-rose-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(225,29,72,0.3)]" style={{ width: `${(stats.performance.riesgo.length/stats.total)*100}%` }}></div>
                </div>
             </div>
          </div>
        </div>

        {/* Age Demographics */}
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant shadow-md flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-[10px] md:text-[11px] font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
               <PieChart size={16} className="text-secondary" /> Demografía de Edad
             </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 flex-1">
             <div 
               onClick={() => setDrilldownData({title: "Población Infantil", students: stats.ageDemographics.niños})}
               className="bg-surface-container-low hover:bg-surface-container p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
             >
                <span className="text-[9px] font-bold text-on-surface-variant uppercase mb-1">Niños (0-11)</span>
                <span className="text-2xl font-black text-on-surface">{stats.ageDemographics.niños.length}</span>
             </div>
             <div 
               onClick={() => setDrilldownData({title: "Población Adolescente", students: stats.ageDemographics.adolescentes})}
               className="bg-surface-container-low hover:bg-surface-container p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
             >
                <span className="text-[9px] font-bold text-on-surface-variant uppercase mb-1">Adoles. (12-14)</span>
                <span className="text-2xl font-black text-on-surface">{stats.ageDemographics.adolescentes.length}</span>
             </div>
             <div 
               onClick={() => setDrilldownData({title: "Población Joven", students: stats.ageDemographics.jovenes})}
               className="bg-surface-container-low hover:bg-surface-container p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
             >
                <span className="text-[9px] font-bold text-on-surface-variant uppercase mb-1">Jóvenes (15-17)</span>
                <span className="text-2xl font-black text-on-surface">{stats.ageDemographics.jovenes.length}</span>
             </div>
             <div 
               onClick={() => setDrilldownData({title: "Población Adulta", students: stats.ageDemographics.adultos})}
               className="bg-secondary/10 hover:bg-secondary/20 border border-secondary/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
             >
                <span className="text-[9px] font-bold text-secondary uppercase mb-1">Adultos (18+)</span>
                <span className="text-2xl font-black text-secondary">{stats.ageDemographics.adultos.length}</span>
             </div>
          </div>
        </div>

        {/* Absence Risk & AI Insights */}
        <div className="bg-surface-container-low p-6 md:p-8 rounded-3xl border border-outline-variant/50 shadow-inner flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03]"><AlertCircle size={100} /></div>
          
          <div className="mb-6">
             <h3 className="text-[10px] md:text-[11px] font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
               <UserX size={16} className="text-error" /> Top Ausentismo
             </h3>
             <p className="text-[8px] uppercase tracking-widest font-bold opacity-50 mt-1">Vigilancia Prioritaria</p>
          </div>
          
          <div className="flex-1 space-y-3 relative z-10">
             {stats.attendanceRisk.length > 0 ? stats.attendanceRisk.map((s, i) => (
                <div key={i} className="flex items-center justify-between bg-white/60 p-3 rounded-xl border border-white/50 backdrop-blur-sm">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center font-black text-[10px]">{s.attNum}%</div>
                      <div>
                         <p className="text-[10px] font-black uppercase leading-tight truncate max-w-[120px]">{s.primerNombre} {s.primerApellido}</p>
                         <p className="text-[8px] font-bold opacity-60 uppercase">Grado {s.grado} - {s.curso}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedStudent(s)} className="p-2 bg-white rounded-lg shadow-sm hover:bg-surface-container transition-colors"><ChevronRight size={14}/></button>
                </div>
             )) : (
                <div className="h-full flex items-center justify-center opacity-40 text-[10px] font-black uppercase">Sin Riesgos Detectados</div>
             )}
          </div>
        </div>
      </div>

      {/* Bottom Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
        
        {/* Course Gender Demographics */}
        <div 
          onClick={() => setDrilldownData({title: `Mujeres en ${stats.topFemaleCourse.course}`, students: stats.topFemaleCourse.students})}
          className="bg-primary text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden cursor-pointer hover:shadow-2xl transition-all"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Users size={120} /></div>
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
               <h3 className="text-[10px] md:text-[11px] font-black uppercase tracking-widest flex items-center gap-2 mb-2 opacity-90">
                 <MapPin size={16} /> Insight de Datos Demográficos
               </h3>
               <p className="text-sm font-medium opacity-80 leading-relaxed max-w-sm">
                 Análisis de distribución de género y densidad poblacional por espacios curriculares.
               </p>
            </div>
            
            <div className="mt-8 bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
               <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-2">Mayor Concentración Femenina</p>
               <div className="flex items-end gap-4">
                  <div className="text-5xl font-black">{stats.topFemaleCourse.course}</div>
                  <div className="pb-1">
                     <p className="text-sm font-bold text-pink-300">{(stats.topFemaleCourse.ratio * 100).toFixed(0)}% Mujeres</p>
                     <p className="text-[10px] uppercase opacity-70 font-black tracking-wider">{stats.topFemaleCourse.count} alumnas</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Birthday Alerts & Events - ACTIVATED */}
        <div className="space-y-6">
          <div 
            onClick={() => setDrilldownData({title: "Cumpleaños del Día", students: stats.birthdaysToday})}
            className="bg-secondary/5 p-6 md:p-8 rounded-3xl border border-secondary/20 shadow-md relative overflow-hidden cursor-pointer hover:bg-secondary/10 transition-all group h-full flex flex-col"
          >
            <div className="absolute -right-4 -top-4 opacity-[0.03] rotate-12 group-hover:scale-125 transition-transform"><Cake size={120} /></div>
            <h3 className="text-[10px] md:text-[11px] font-black text-secondary uppercase tracking-widest flex items-center gap-2 mb-6">
              <Calendar size={16} /> Cumpleaños del Día
            </h3>
            <div className="flex-1">
              {stats.birthdaysToday.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  {stats.birthdaysToday.map((s, i) => (
                    <div key={i} className="bg-white p-4 md:p-5 rounded-2xl border border-secondary/10 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center font-black animate-bounce"><Cake size={18}/></div>
                         <div>
                            <p className="font-black text-xs md:text-sm uppercase text-on-surface">{s.primerNombre} {s.primerApellido}</p>
                            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">Grado {s.grado} - {s.curso}</p>
                         </div>
                      </div>
                      <span className="text-[9px] font-black bg-secondary text-white px-3 py-1.5 rounded-lg uppercase hidden sm:block">Hoy</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full min-h-[150px] flex items-center justify-center flex-col text-on-surface-variant opacity-40 relative z-10">
                  <Cake size={48} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-[10px]">No hay cumpleaños hoy.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Role-Based Panel Links - ACTIVATED */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         {[
           { id: "rectoria", label: "Rectoría", color: "bg-on-surface", desc: "Balance Institucional" },
           { id: "coordinacion", label: "Coordinación", color: "bg-primary", desc: "Control Académico" },
           { id: "convivencia", label: "Convivencia", color: "bg-secondary", desc: "Seguimiento Social" },
           { id: "profesorado", label: "Profesorado", color: "bg-tertiary", desc: "Agenda Docente" }
         ].map(panel => (
           <button 
             key={panel.id} 
             onClick={() => alert(`Accediendo al Panel de ${panel.label}...\nFuncionalidad autorizada para personal administrativo.`)}
             className={`${panel.color} text-white p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 hover:scale-[1.05] active:scale-95 transition-all shadow-2xl border-4 border-white/10 group`}
           >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-1 group-hover:rotate-12 transition-transform">
                 <ShieldCheck size={24} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{panel.label}</span>
              <span className="text-[7px] font-bold opacity-60 uppercase tracking-widest">{panel.desc}</span>
           </button>
         ))}
      </div>

      {/* DRILLDOWN MODAL OVERLAY */}
      {drilldownData && (
        <div className="fixed inset-0 z-[100] bg-on-surface/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
             <div className="p-6 md:p-8 flex items-center justify-between border-b border-outline-variant/30">
               <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">{drilldownData.title}</h2>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">
                    {drilldownData.students.length} Registros Encontrados
                  </p>
               </div>
               <button onClick={() => setDrilldownData(null)} className="p-2 hover:bg-surface-container rounded-full transition-colors"><X size={24}/></button>
             </div>
             <div className="p-6 md:p-8 overflow-y-auto space-y-3">
               {drilldownData.students.length > 0 ? drilldownData.students.map(student => (
                  <div 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface-container-low p-4 rounded-2xl hover:bg-surface-container transition-colors cursor-pointer border border-transparent hover:border-outline-variant/50"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                           {student.primerApellido[0]}{student.primerNombre[0]}
                        </div>
                        <div>
                           <p className="font-black text-sm uppercase">{student.primerApellido} {student.segundoApellido} {student.primerNombre}</p>
                           <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-0.5">
                              ID: {student.nroDocumento} • Grado {student.grado}-{student.curso}
                           </p>
                        </div>
                     </div>
                     <span className="text-[10px] font-black text-primary mt-3 sm:mt-0 uppercase flex items-center gap-1">Ver Perfil 360 <ChevronRight size={14}/></span>
                  </div>
               )) : (
                  <div className="py-12 text-center opacity-40">
                     <UserX size={48} className="mx-auto mb-4" />
                     <p className="font-black uppercase tracking-widest text-[10px]">Sin resultados</p>
                  </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* STUDENT PROFILE 360 MODAL */}
      {selectedStudent && (
        <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}

function ShieldCheck({size}: {size: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  );
}
