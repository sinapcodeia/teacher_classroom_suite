"use client";

import { useMemo, useState, memo } from "react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { 
  Users, UserCheck, UserX, Cake, Award, 
  BarChart3, PieChart, TrendingDown, MapPin, 
  ChevronRight, AlertCircle, Calendar, X, GraduationCap,
  Sparkles, FileText, CheckCircle2, AlertTriangle, ShieldCheck,
  Building2, Briefcase, HeartHandshake, Eye, ArrowRight, User
} from "lucide-react";
import StudentProfileModal from "@/components/shared/StudentProfileModal";

const StatisticsDashboard = memo(function StatisticsDashboard() {
  const { students } = useApp();
  const [drilldownData, setDrilldownData] = useState<{title: string, students: any[]} | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [activeRoleView, setActiveRoleView] = useState<"rector" | "coordinador" | "apoyo">("rector");

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

    // --- ANÁLISIS DE POBLACIÓN ADULTA (18+ AÑOS) ---
    const adults = ageDemographics.adultos;
    const adultsByGrade: Record<string, { total: number; m: number; f: number; riskCount: number; students: any[] }> = {};
    
    adults.forEach(s => {
      const g = normalizeGrade(s.grado);
      if (!adultsByGrade[g]) {
        adultsByGrade[g] = { total: 0, m: 0, f: 0, riskCount: 0, students: [] };
      }
      adultsByGrade[g].total++;
      adultsByGrade[g].students.push(s);
      if (s.genero === "M") adultsByGrade[g].m++;
      if (s.genero === "F") adultsByGrade[g].f++;
      if (s.avgGrade && s.avgGrade < 3.0) adultsByGrade[g].riskCount++;
    });

    const sortedAdultsGrades = Object.entries(adultsByGrade).sort((a, b) => {
      if (a[0] === "PREESCOLAR") return -1;
      if (b[0] === "PREESCOLAR") return 1;
      const ga = parseInt(a[0]);
      const gb = parseInt(b[0]);
      if (isNaN(ga)) return 1;
      if (isNaN(gb)) return -1;
      return ga - gb;
    });

    const adultMenCount = adults.filter(s => s.genero === "M").length;
    const adultWomenCount = adults.filter(s => s.genero === "F").length;
    const adultRiskCount = adults.filter(s => s.avgGrade < 3.0).length;

    // --- NIVEL ACADÉMICO (Primaria vs Bachillerato) ---
    const primaria = activeStudents.filter(s => {
      const normalized = normalizeGrade(s.grado);
      if (normalized === "PREESCOLAR") return true;
      const n = parseInt(normalized);
      return !isNaN(n) && n <= 5;
    });
    const bachillerato = activeStudents.filter(s => {
      const normalized = normalizeGrade(s.grado);
      if (normalized === "PREESCOLAR") return false;
      const n = parseInt(normalized);
      return !isNaN(n) && n > 5;
    });

    const primariaStats = {
      total: primaria.length,
      m: primaria.filter(s => s.genero === "M").length,
      f: primaria.filter(s => s.genero === "F").length
    };
    const bachilleratoStats = {
      total: bachillerato.length,
      m: bachillerato.filter(s => s.genero === "M").length,
      f: bachillerato.filter(s => s.genero === "F").length
    };

    // Detalle por Grado Individual
    const gradeDetails: Record<string, { total: number, m: number, f: number, students: any[] }> = {};
    activeStudents.forEach(s => {
      const g = normalizeGrade(s.grado);
      if (!gradeDetails[g]) gradeDetails[g] = { total: 0, m: 0, f: 0, students: [] };
      gradeDetails[g].total++;
      gradeDetails[g].students.push(s);
      if (s.genero === "M") gradeDetails[g].m++;
      if (s.genero === "F") gradeDetails[g].f++;
    });

    const sortedGrades = Object.entries(gradeDetails).sort((a, b) => {
      if (a[0] === "PREESCOLAR") return -1;
      if (b[0] === "PREESCOLAR") return 1;
      const ga = parseInt(a[0]);
      const gb = parseInt(b[0]);
      if (isNaN(ga)) return 1;
      if (isNaN(gb)) return -1;
      return ga - gb;
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

    // Curso con mayor población femenina
    const courseStats: Record<string, any[]> = {};
    activeStudents.forEach(s => {
      const c = s.curso || "N/A";
      if (!courseStats[c]) courseStats[c] = [];
      courseStats[c].push(s);
    });
    
    let topFemaleCourse = { course: "N/A", ratio: 0, count: 0, students: [] as any[] };
    Object.entries(courseStats).forEach(([course, stList]) => {
      const women = stList.filter(s => s.genero === "F");
      const ratio = stList.length ? women.length / stList.length : 0;
      if (ratio > topFemaleCourse.ratio || (ratio === topFemaleCourse.ratio && women.length > topFemaleCourse.count)) {
        topFemaleCourse = { course, ratio, count: women.length, students: women };
      }
    });

    return {
      activeStudents, total, 
      menList, womenList, 
      avgAge: avgAge.toFixed(1), 
      majorities: ageDemographics.adultos,
      adultMenCount, adultWomenCount, adultRiskCount,
      sortedAdultsGrades,
      primariaStats, bachilleratoStats, 
      sortedGrades,
      topFemaleCourse, ageDemographics, 
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

      {/* ── NAVEGACIÓN DE VISTAS POR ROL DIRECTIVO (MODERNO & DIDÁCTICO) ── */}
      <div className="bg-white p-3 rounded-[2.5rem] border border-outline-variant/40 shadow-lg flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-2 px-4 py-2">
          <Sparkles className="text-amber-500 animate-pulse" size={20} />
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Analítica Directiva Asistida por IA</span>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-[2rem] border border-slate-200/60">
          <button
            onClick={() => setActiveRoleView("rector")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRoleView === "rector" ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 scale-[1.02]" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Building2 size={16} /> Rectoría & Gerencia
          </button>
          <button
            onClick={() => setActiveRoleView("coordinador")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRoleView === "coordinador" ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 scale-[1.02]" : "text-slate-600 hover:text-slate-900"}`}
          >
            <Briefcase size={16} /> Coordinación Académica
          </button>
          <button
            onClick={() => setActiveRoleView("apoyo")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRoleView === "apoyo" ? "bg-rose-600 text-white shadow-xl shadow-rose-600/30 scale-[1.02]" : "text-slate-600 hover:text-slate-900"}`}
          >
            <HeartHandshake size={16} /> Personal de Apoyo
          </button>
        </div>
      </div>

      {/* ── TOP KPI STATS - REDISEÑO PROFESIONAL & SIMÉTRICO (SIN TRUNCAZONAS) ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
        {/* CARD 1: Población Total */}
        <div 
          onClick={() => setDrilldownData({title: "Población Estudiantil Activa", students: stats.activeStudents})}
          className="bg-white p-6 rounded-[2rem] border border-outline-variant/40 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer border-b-4 border-b-blue-500"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500"><Users size={70} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Población Total</p>
          <p className="text-3xl lg:text-4xl font-black text-on-surface leading-none">{stats.total}</p>
          <div className="mt-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Activos en Firestore</span>
          </div>
        </div>

        {/* CARD 2: Equidad de Género (Layout Resiliente y Nítido) */}
        <div 
          onClick={() => setDrilldownData({title: "Distribución Completa por Género", students: [...stats.womenList, ...stats.menList]})}
          className="bg-white p-6 rounded-[2rem] border border-outline-variant/40 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer border-b-4 border-b-indigo-500"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500"><UserCheck size={70} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Equidad de Género</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl lg:text-3xl font-black text-blue-600">{stats.menList.length}</span>
              <span className="text-[10px] font-black text-blue-500 uppercase">H</span>
            </div>
            <span className="text-slate-300 font-light text-xl">/</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl lg:text-3xl font-black text-rose-600">{stats.womenList.length}</span>
              <span className="text-[10px] font-black text-rose-500 uppercase">M</span>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            <span className="text-[8px] font-black text-indigo-600 uppercase tracking-widest">Distribución por Sexo</span>
          </div>
        </div>

        {/* CARD 3: Mayores de Edad (18+) */}
        <div 
          onClick={() => setDrilldownData({title: "Alumnos Mayores de Edad (18+ Años)", students: stats.majorities})}
          className="bg-white p-6 rounded-[2rem] border border-outline-variant/40 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer border-b-4 border-b-amber-500"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.05] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500"><Award size={70} /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2">Mayores de Edad (18+)</p>
          <p className="text-3xl lg:text-4xl font-black text-on-surface leading-none">{stats.majorities.length}</p>
          <div className="mt-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Población Adulta</span>
          </div>
        </div>

        {/* CARD 4: Riesgo Académico */}
        <div 
          onClick={() => setDrilldownData({title: "Alumnos con Riesgo Académico", students: stats.performance.riesgo})}
          className="bg-rose-50/40 p-6 rounded-[2rem] border border-rose-200/60 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer border-b-4 border-b-rose-500"
        >
          <div className="absolute top-0 right-0 p-4 opacity-[0.08] group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500"><TrendingDown size={70} /></div>
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.15em] mb-2">Riesgo Académico</p>
          <p className="text-3xl lg:text-4xl font-black text-rose-600 leading-none">{stats.lowPerformance}</p>
          <div className="mt-5 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[8px] font-black text-rose-600 uppercase tracking-widest">Promedio &lt; 3.0</span>
          </div>
        </div>
      </div>

      {/* ── VISTA DETALLADA: RECTORÍA & GERENCIA ── */}
      {activeRoleView === "rector" && (
        <div className="space-y-10 animate-in fade-in duration-500">
          
          {/* BOLETÍN EJECUTIVO ASISTIDO POR IA */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-[2.5rem] border border-white/10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest rounded-full">Boletín Inteligente</span>
                <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Resumen Gerencial del Día</span>
              </div>

              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight italic">
                EduAI Data Analyst Bulletin – Informe Directivo Institucional
              </h2>

              <p className="text-sm text-white/80 leading-relaxed max-w-4xl font-medium">
                Actualmente la institución cuenta con <strong className="text-amber-300">{stats.total} estudiantes activos</strong>. 
                De estos, <strong className="text-amber-300">{stats.majorities.length} son adultos mayores de 18 años</strong> ({((stats.majorities.length / stats.total) * 100).toFixed(1)}% de la matrícula total), 
                con una distribución de <strong className="text-blue-300">{stats.adultMenCount} Hombres</strong> y <strong className="text-pink-300">{stats.adultWomenCount} Mujeres</strong> adultos. 
                Se registran <strong className="text-rose-400">{stats.lowPerformance} estudiantes en riesgo académico</strong> que requieren acompañamiento pedagógico inmediato.
              </p>

              <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold">
                <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-2">
                  <UserCheck size={16} className="text-emerald-400" />
                  <span>Índice de Paridad Global: {((Math.min(stats.menList.length, stats.womenList.length) / Math.max(stats.menList.length, stats.womenList.length, 1)) * 100).toFixed(0)}%</span>
                </div>
                <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/10 flex items-center gap-2">
                  <GraduationCap size={16} className="text-indigo-400" />
                  <span>Edad Promedio Institucional: {stats.avgAge} Años</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABLA EJECUTIVA DETALLADA DE POBLACIÓN ADULTA (18+ AÑOS) */}
          <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-outline-variant/30 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    <Award size={20} />
                  </div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-on-surface">
                    Población de Estudiantes Adultos (18+ Años) por Grado
                  </h3>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Desglose por Grado, Sexo y Estado de Riesgo Académico para Gestión Gerencial
                </p>
              </div>

              <button
                onClick={() => setDrilldownData({title: "Listado de Alumnos Adultos (18+ Años)", students: stats.majorities})}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 self-start md:self-auto"
              >
                <Eye size={16} /> Ver Listado Completo de Adultos ({stats.majorities.length})
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                    <th className="pb-4">Grado Escolar</th>
                    <th className="pb-4 text-center">Total Adultos</th>
                    <th className="pb-4 text-center">Hombres (M)</th>
                    <th className="pb-4 text-center">Mujeres (F)</th>
                    <th className="pb-4 text-center">En Riesgo (&lt; 3.0)</th>
                    <th className="pb-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-bold">
                  {stats.sortedAdultsGrades.length > 0 ? stats.sortedAdultsGrades.map(([grado, data]) => (
                    <tr key={grado} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 font-black uppercase text-on-surface italic">Grado {grado}</td>
                      <td className="py-4 text-center">
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-black">{data.total}</span>
                      </td>
                      <td className="py-4 text-center text-blue-600 font-black">{data.m}</td>
                      <td className="py-4 text-center text-rose-600 font-black">{data.f}</td>
                      <td className="py-4 text-center">
                        {data.riskCount > 0 ? (
                          <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase">
                            ⚠️ {data.riskCount} Alumno(s)
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-600 uppercase">Sin Riesgo</span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => setDrilldownData({title: `Adultos (18+) en Grado ${grado}°`, students: data.students})}
                          className="px-4 py-2 bg-slate-100 hover:bg-on-surface hover:text-white rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 ml-auto"
                        >
                          Ver Estudiantes <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium italic">
                        No hay estudiantes mayores de edad registrados en los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* PIRÁMIDE DEMOGRÁFICA Y POBLACIÓN POR GRADO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[3rem] border border-outline-variant/30 shadow-xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-lg">
                  <GraduationCap size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-on-surface">Sección Primaria (Pre-5°)</h3>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total: {stats.primariaStats.total} Alumnos</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <p className="text-[9px] font-black text-blue-700 uppercase">Hombres</p>
                  <p className="text-3xl font-black text-blue-900">{stats.primariaStats.m}</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl">
                  <p className="text-[9px] font-black text-rose-700 uppercase">Mujeres</p>
                  <p className="text-3xl font-black text-rose-900">{stats.primariaStats.f}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-outline-variant/30 shadow-xl space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
                  <Award size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-on-surface">Secundaria / Bachillerato (6°-11°)</h3>
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total: {stats.bachilleratoStats.total} Alumnos</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-2xl">
                  <p className="text-[9px] font-black text-blue-700 uppercase">Hombres</p>
                  <p className="text-3xl font-black text-blue-900">{stats.bachilleratoStats.m}</p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl">
                  <p className="text-[9px] font-black text-rose-700 uppercase">Mujeres</p>
                  <p className="text-3xl font-black text-rose-900">{stats.bachilleratoStats.f}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA DETALLADA: COORDINACIÓN ACADÉMICA ── */}
      {activeRoleView === "coordinador" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Balance de Rendimiento</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-amber-800">Excelencia (≥ 4.5)</span>
                    <span className="text-lg font-black text-amber-900">{stats.performance.excelencia.length}</span>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-blue-800">Promedio (3.0 - 4.4)</span>
                    <span className="text-lg font-black text-blue-900">{stats.performance.promedio.length}</span>
                  </div>
                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase text-rose-800">Riesgo Académico (&lt; 3.0)</span>
                    <span className="text-lg font-black text-rose-900">{stats.performance.riesgo.length}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-xl">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6">Población por Grado Individual</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black uppercase text-slate-400 tracking-widest border-b">
                      <th className="pb-3">Grado</th>
                      <th className="pb-3 text-center">Total</th>
                      <th className="pb-3 text-center">Hombres</th>
                      <th className="pb-3 text-center">Mujeres</th>
                      <th className="pb-3 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs font-bold">
                    {stats.sortedGrades.map(([grado, data]) => (
                      <tr key={grado}>
                        <td className="py-3 font-black uppercase italic">Grado {grado}</td>
                        <td className="py-3 text-center font-black">{data.total}</td>
                        <td className="py-3 text-center text-blue-600">{data.m}</td>
                        <td className="py-3 text-center text-rose-600">{data.f}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => setDrilldownData({title: `Estudiantes Grado ${grado}°`, students: data.students})}
                            className="px-3 py-1 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-lg text-[9px] font-black uppercase transition-all"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VISTA DETALLADA: PERSONAL DE APOYO & CONVIVENCIA ── */}
      {activeRoleView === "apoyo" && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <Cake className="text-rose-500" size={24} />
                <h3 className="text-sm font-black uppercase tracking-widest">Pedagogía del Afecto (Cumpleaños Hoy)</h3>
              </div>

              {stats.birthdaysToday.length > 0 ? (
                <div className="space-y-3">
                  {stats.birthdaysToday.map((s, i) => (
                    <div key={i} className="p-4 bg-rose-50 rounded-2xl border border-rose-100 flex items-center justify-between">
                      <div>
                        <p className="font-black text-xs uppercase text-rose-900">{s.primerNombre} {s.primerApellido}</p>
                        <p className="text-[9px] font-bold text-rose-700 uppercase">Grado {normalizeGrade(s.grado)} - {s.curso}</p>
                      </div>
                      <span className="text-[9px] font-black bg-rose-500 text-white px-3 py-1 rounded-full uppercase">Hoy</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-bold italic text-center py-8">No hay cumpleañeros registrados para el día de hoy.</p>
              )}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/30 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-amber-500" size={24} />
                <h3 className="text-sm font-black uppercase tracking-widest">Atención por Ausentismo Recurrente</h3>
              </div>

              <div className="space-y-3">
                {stats.attendanceRisk.map((s, i) => (
                  <div key={i} className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                    <div>
                      <p className="font-black text-xs uppercase text-amber-900">{s.primerNombre} {s.primerApellido}</p>
                      <p className="text-[9px] font-bold text-amber-700 uppercase">Grado {normalizeGrade(s.grado)} - {s.curso}</p>
                    </div>
                    <span className="text-[9px] font-black bg-amber-500 text-white px-3 py-1 rounded-full uppercase">{s.attNum}% Asistencia</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE DRILLDOWN (TOTALMENTE REDISEÑADO & SIN DESBORDAMIENTO) ── */}
      {drilldownData && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-outline-variant/40 overflow-hidden">
            
            {/* Header del Modal */}
            <div className="p-6 md:p-8 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400">Detalle de Población Estudiantil</span>
                <h2 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white mt-0.5">{drilldownData.title}</h2>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">
                  {drilldownData.students.length} Estudiante(s) Registrado(s)
                </p>
              </div>
              <button 
                onClick={() => setDrilldownData(null)} 
                className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Lista de Estudiantes con Scroll */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
              {drilldownData.students.length > 0 ? (
                drilldownData.students.map((student) => (
                  <div 
                    key={student.id} 
                    onClick={() => setSelectedStudent(student)}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-sm shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {student.primerApellido?.[0] || "E"}{student.primerNombre?.[0] || "A"}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase text-slate-900">
                          {student.primerApellido} {student.segundoApellido || ""} {student.primerNombre} {student.segundoNombre || ""}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <span>Doc: {student.nroDocumento || "N/A"}</span>
                          <span>•</span>
                          <span>Grado {normalizeGrade(student.grado)} - Curso {student.curso}</span>
                          <span>•</span>
                          <span className={student.genero === "M" ? "text-blue-600 font-black" : "text-rose-600 font-black"}>
                            {student.genero === "M" ? "Hombre (M)" : "Mujer (F)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {student.avgGrade && (
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black ${student.avgGrade < 3.0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          Prom: {Number(student.avgGrade).toFixed(1)}
                        </span>
                      )}
                      <span className="text-[10px] font-black text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1 uppercase">
                        Ficha 360° <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-slate-400 font-bold italic">
                  No se encontraron estudiantes para este filtro.
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className="p-4 bg-white border-t border-slate-200 text-center flex-shrink-0">
              <button
                onClick={() => setDrilldownData(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL FICHA 360 DEL ESTUDIANTE */}
      {selectedStudent && (
        <StudentProfileModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

    </div>
  );
});

export default StatisticsDashboard;
