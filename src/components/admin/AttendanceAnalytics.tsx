"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, 
  Users, UserCheck, Search, ChevronRight, FileSpreadsheet,
  AlertCircle, ShieldAlert, Award, ArrowUpRight, Filter,
  ChevronLeft, ArrowRight, UserCheck2, UserX, Sparkles, X
} from "lucide-react";

interface AttendanceAnalyticsProps {
  onSelectStudent?: (student: any) => void;
}

export default function AttendanceAnalytics({ onSelectStudent }: AttendanceAnalyticsProps) {
  const { students, allUsers } = useApp();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [drilldownData, setDrilldownData] = useState<{title: string, students: any[]} | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7)); // YYYY-MM
  const [selectedGradoFilter, setSelectedGradoFilter] = useState<string>("TODOS");
  const [selectedCursoFilter, setSelectedCursoFilter] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  // Segmented Tab Filter: 'critical' (>= 3 faltas) | 'warning' (1-2 faltas) | 'all' (Todos)
  const [activeTab, setActiveTab] = useState<"critical" | "warning" | "all">("critical");
  
  // Paginación
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const activeStudents = useMemo(() => students.filter(s => s.isActive !== false), [students]);

  // ── MAPPING DE DOCENTES RESPONSABLES POR CURSO Y GRADO ──
  const courseTeachers = useMemo(() => {
    const map: Record<string, string[]> = {};
    
    (allUsers || []).forEach(u => {
      const user = u as any;
      if (user.weeklySchedule && Array.isArray(user.weeklySchedule)) {
        user.weeklySchedule.forEach((b: any) => {
          const key = `${normalizeGrade(b.grade)}-${b.course}`;
          if (!map[key]) map[key] = [];
          if (!map[key].includes(u.name || u.email)) {
            map[key].push(u.name || u.email);
          }
        });
      }
    });

    return map;
  }, [allUsers]);

  // ── 1. MÉTRICAS EN TIEMPO REAL (FECHA SELECCIONADA) ──
  const dailyMetrics = useMemo(() => {
    let target = activeStudents;
    if (selectedGradoFilter !== "TODOS") target = target.filter(s => normalizeGrade(s.grado) === selectedGradoFilter);
    if (selectedCursoFilter !== "TODOS") target = target.filter(s => s.curso === selectedCursoFilter);

    let presentes = 0; const presentesList: any[] = [];
    let ausentes = 0; const ausentesList: any[] = [];
    let excusas = 0; const excusasList: any[] = [];
    let retardos = 0; const retardosList: any[] = [];
    let sinRegistro = 0; const sinRegistroList: any[] = [];

    const coursesStatus: Record<string, { total: number; presentes: number; ausentes: number; excusas: number; retardos: number; sinRegistro: number; teacher: string }> = {};

    target.forEach(s => {
      const g = normalizeGrade(s.grado);
      const c = s.curso || "N/A";
      const key = `${g}-${c}`;

      if (!coursesStatus[key]) {
        const tList = courseTeachers[key] || [];
        coursesStatus[key] = {
          total: 0, presentes: 0, ausentes: 0, excusas: 0, retardos: 0, sinRegistro: 0,
          teacher: tList.length > 0 ? tList.join(", ") : "Docente Titular / Por Asignar"
        };
      }
      coursesStatus[key].total++;

      const recRaw = s.attendanceRecord ? s.attendanceRecord[selectedDate] : null;
      const rec = recRaw === 'present' ? 'P' : recRaw === 'absent' ? 'A' : recRaw === 'late' ? 'T' : recRaw === 'excused' ? 'E' : recRaw;

      if (rec === "P") {
        presentes++; presentesList.push(s);
        coursesStatus[key].presentes++;
      } else if (rec === "A") {
        ausentes++; ausentesList.push(s);
        coursesStatus[key].ausentes++;
      } else if (rec === "E") {
        excusas++; excusasList.push(s);
        coursesStatus[key].excusas++;
      } else if (rec === "T") {
        retardos++; retardosList.push(s);
        coursesStatus[key].retardos++;
      } else {
        sinRegistro++; sinRegistroList.push(s);
        coursesStatus[key].sinRegistro++;
      }
    });

    const evaluados = presentes + ausentes + excusas + retardos;
    const pctAsistencia = evaluados > 0 ? Math.round(((presentes + retardos) / evaluados) * 100) : 100;

    const lowProductivityCourses = Object.entries(coursesStatus).filter(([_, data]) => data.sinRegistro === data.total);

    return {
      presentes, presentesList, 
      ausentes, ausentesList, 
      excusas, excusasList, 
      retardos, retardosList, 
      sinRegistro, sinRegistroList, 
      evaluados, total: target.length, pctAsistencia, coursesStatus, lowProductivityCourses
    };
  }, [activeStudents, selectedDate, selectedGradoFilter, selectedCursoFilter, courseTeachers]);

  // ── 2. HISTÓRICO MENSUAL Y GESTIÓN POR EXCEPCIÓN ──
  const allMonthlyMetrics = useMemo(() => {
    let target = activeStudents;
    if (selectedGradoFilter !== "TODOS") target = target.filter(s => normalizeGrade(s.grado) === selectedGradoFilter);
    if (selectedCursoFilter !== "TODOS") target = target.filter(s => s.curso === selectedCursoFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      target = target.filter(s => 
        (s.primerNombre || "").toLowerCase().includes(q) || 
        (s.primerApellido || "").toLowerCase().includes(q) ||
        (s.nroDocumento || "").includes(q)
      );
    }

    return target.map(s => {
      const recs = s.attendanceRecord || {};
      let mPresentes = 0;
      let mAusentes = 0;
      let mExcusas = 0;
      let mRetardos = 0;

      Object.entries(recs).forEach(([date, stRaw]) => {
        if (date.startsWith(selectedMonth)) {
          const st = stRaw === 'present' ? 'P' : stRaw === 'absent' ? 'A' : stRaw === 'late' ? 'T' : stRaw === 'excused' ? 'E' : stRaw;
          if (st === "P") mPresentes++;
          else if (st === "A") mAusentes++;
          else if (st === "E") mExcusas++;
          else if (st === "T") mRetardos++;
        }
      });

      const totalEvaluado = mPresentes + mAusentes + mExcusas + mRetardos;
      const pctMonth = totalEvaluado > 0 ? Math.round(((mPresentes + mRetardos) / totalEvaluado) * 100) : 100;

      return {
        student: s,
        mPresentes, mAusentes, mExcusas, mRetardos, totalEvaluado, pctMonth
      };
    }).sort((a, b) => b.mAusentes - a.mAusentes);
  }, [activeStudents, selectedMonth, selectedGradoFilter, selectedCursoFilter, searchTerm]);

  // Conteo por segmentos
  const criticalCount = useMemo(() => allMonthlyMetrics.filter(m => m.mAusentes >= 3).length, [allMonthlyMetrics]);
  const warningCount = useMemo(() => allMonthlyMetrics.filter(m => m.mAusentes >= 1 && m.mAusentes < 3).length, [allMonthlyMetrics]);

  // Filtrado según Tab activo
  const filteredMonthlyMetrics = useMemo(() => {
    if (activeTab === "critical") {
      return allMonthlyMetrics.filter(m => m.mAusentes >= 3);
    }
    if (activeTab === "warning") {
      return allMonthlyMetrics.filter(m => m.mAusentes >= 1 && m.mAusentes < 3);
    }
    return allMonthlyMetrics;
  }, [allMonthlyMetrics, activeTab]);

  // Paginación de resultados
  const totalPages = Math.ceil(filteredMonthlyMetrics.length / pageSize) || 1;
  const paginatedMetrics = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMonthlyMetrics.slice(start, start + pageSize);
  }, [filteredMonthlyMetrics, currentPage, pageSize]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      
      {/* ── BARRA DE FILTROS SUPERIOR ── */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-outline-variant/40 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg shadow-indigo-600/30">
              <Calendar size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-on-surface">
                Control Institucional de Asistencia & Ausentismo
              </h2>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                Gestión por Excepción, Análisis de Ausentismo e Inteligencia Operativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Fecha de Consulta Hoy</label>
              <input 
                type="date"
                value={selectedDate}
                onChange={e => { setSelectedDate(e.target.value); setCurrentPage(1); }}
                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mes de Consulta Histórica</label>
              <input 
                type="month"
                value={selectedMonth}
                onChange={e => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Filtros por Grado y Curso */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-black uppercase">
            <Filter size={16} /> Filtros:
          </div>

          <select 
            value={selectedGradoFilter}
            onChange={e => { setSelectedGradoFilter(e.target.value); setSelectedCursoFilter("TODOS"); setCurrentPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none cursor-pointer"
          >
            <option value="TODOS">TODOS LOS GRADOS</option>
            {Array.from(new Set(activeStudents.map(s => normalizeGrade(s.grado)))).sort().map(g => (
              <option key={g} value={g}>GRADO {g}</option>
            ))}
          </select>

          <select 
            value={selectedCursoFilter}
            onChange={e => { setSelectedCursoFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none cursor-pointer"
          >
            <option value="TODOS">TODOS LOS CURSOS</option>
            {Array.from(new Set(activeStudents.map(s => s.curso))).sort().map(c => (
              <option key={c} value={c}>CURSO {c}</option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar estudiante por nombre o documento..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── TARJETAS DE IMPACTO ASISTENCIA EN TIEMPO REAL ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div 
          onClick={() => setDrilldownData({title: "Estudiantes Presentes Hoy", students: dailyMetrics.presentesList})}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-emerald-500 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
        >
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-500 transition-colors">Presentes Hoy</p>
          <p className="text-3xl font-black text-emerald-600 leading-none">{dailyMetrics.presentes}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">{dailyMetrics.pctAsistencia}% Asistencia Global</p>
        </div>

        <div 
          onClick={() => setDrilldownData({title: "Estudiantes Ausentes Hoy", students: dailyMetrics.ausentesList})}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-rose-500 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
        >
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1 group-hover:text-rose-600 transition-colors">Ausentes Hoy</p>
          <p className="text-3xl font-black text-rose-600 leading-none">{dailyMetrics.ausentes}</p>
          <p className="text-[8px] font-bold text-rose-500 uppercase mt-2">Inasistencias del día</p>
        </div>

        <div 
          onClick={() => setDrilldownData({title: "Estudiantes con Excusa Hoy", students: dailyMetrics.excusasList})}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-amber-500 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
        >
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1 group-hover:text-amber-700 transition-colors">Excusas Médicas</p>
          <p className="text-3xl font-black text-amber-600 leading-none">{dailyMetrics.excusas}</p>
          <p className="text-[8px] font-bold text-amber-600 uppercase mt-2">Permisos Justificados</p>
        </div>

        <div 
          onClick={() => setDrilldownData({title: "Estudiantes con Retardo Hoy", students: dailyMetrics.retardosList})}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-blue-500 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
        >
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1 group-hover:text-blue-700 transition-colors">Llegadas Tardías</p>
          <p className="text-3xl font-black text-blue-600 leading-none">{dailyMetrics.retardos}</p>
          <p className="text-[8px] font-bold text-blue-600 uppercase mt-2">Retardos de sesión</p>
        </div>

        <div 
          onClick={() => setDrilldownData({title: "Estudiantes Sin Registro Hoy", students: dailyMetrics.sinRegistroList})}
          className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-slate-400 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 transition-all group"
        >
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-slate-600 transition-colors">Sin Registro Hoy</p>
          <p className="text-3xl font-black text-slate-800 leading-none">{dailyMetrics.sinRegistro}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">Pendientes de reporte</p>
        </div>
      </div>

      {/* ── ALERTA DE NOVEDADES Y BAJA PRODUCTIVIDAD DOCENTE (SIN REGISTRO HOY) ── */}
      {dailyMetrics.lowProductivityCourses.length > 0 && (
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl space-y-4 border border-white/10">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} className="text-amber-400 animate-pulse" />
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-400">Novedad Directiva de Seguimiento</span>
              <h3 className="text-lg font-black uppercase tracking-tight text-white">Cursos Sin Registro de Asistencia el Día de Hoy</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dailyMetrics.lowProductivityCourses.map(([courseKey, data]) => (
              <div key={courseKey} className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black uppercase text-amber-300">Curso {courseKey}</span>
                  <span className="text-[9px] font-black bg-white/10 px-2 py-0.5 rounded-full">{data.total} Alumnos</span>
                </div>
                <p className="text-[11px] font-bold text-white/80">Docente Titular: <strong className="text-white">{data.teacher}</strong></p>
                <p className="text-[9px] text-white/50 uppercase mt-2">Estado: Asistencia no reportada</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── HISTÓRICO MENSUAL: GESTIÓN POR EXCEPCIÓN Y PAGINACIÓN PROFESIONAL ── */}
      <div className="bg-white p-8 rounded-[3rem] border border-outline-variant/30 shadow-xl space-y-6">
        
        {/* Header y Selector de Segmento (Gestión por Excepción) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="text-indigo-600" size={18} />
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-on-surface">
                Gestión por Excepción – Registro de Ausentismo ({selectedMonth})
              </h3>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Priorización de casos para intervención directiva sin saturación de listas infinitas
            </p>
          </div>

          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 self-start md:self-auto">
            <button
              onClick={() => { setActiveTab("critical"); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "critical" ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30" : "text-slate-600 hover:text-slate-900"}`}
            >
              🚨 Riesgo Crítico ({criticalCount})
            </button>
            <button
              onClick={() => { setActiveTab("warning"); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "warning" ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30" : "text-slate-600 hover:text-slate-900"}`}
            >
              ⚠️ Con Faltas ({warningCount})
            </button>
            <button
              onClick={() => { setActiveTab("all"); setCurrentPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "all" ? "bg-slate-900 text-white shadow-lg" : "text-slate-600 hover:text-slate-900"}`}
            >
              📋 Todos ({allMonthlyMetrics.length})
            </button>
          </div>
        </div>

        {/* Tabla Paginada y Profesional */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                <th className="pb-3">Estudiante</th>
                <th className="pb-3">Grado y Curso</th>
                <th className="pb-3 text-center">Faltas (A)</th>
                <th className="pb-3 text-center">Excusas (E)</th>
                <th className="pb-3 text-center">Retardos (T)</th>
                <th className="pb-3 text-center">% Asistencia Mes</th>
                <th className="pb-3 text-center">Estado Directivo</th>
                <th className="pb-3 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {paginatedMetrics.length > 0 ? paginatedMetrics.map(({ student, mPresentes, mAusentes, mExcusas, mRetardos, pctMonth }) => {
                const isCritical = mAusentes >= 3;
                const isWarning = mAusentes >= 1 && mAusentes < 3;

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-black uppercase text-on-surface">
                      {student.primerApellido} {student.segundoApellido || ""} {student.primerNombre}
                    </td>
                    <td className="py-4 font-bold text-slate-500 uppercase">
                      Grado {normalizeGrade(student.grado)} - {student.curso}
                    </td>
                    <td className="py-4 text-center text-rose-600 font-black text-sm">{mAusentes}</td>
                    <td className="py-4 text-center text-amber-600 font-black text-sm">{mExcusas}</td>
                    <td className="py-4 text-center text-blue-600 font-black text-sm">{mRetardos}</td>
                    <td className="py-4 text-center font-black">
                      <span className={pctMonth < 85 ? "text-rose-600 font-black" : "text-emerald-600 font-black"}>
                        {pctMonth}%
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {isCritical ? (
                        <span className="px-3 py-1 bg-rose-500 text-white rounded-full text-[9px] font-black uppercase animate-pulse">
                          🚨 Riesgo de Deserción
                        </span>
                      ) : isWarning ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase">
                          ⚠️ Seguimiento
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">
                          ✓ Asistencia Ok
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => onSelectStudent && onSelectStudent(student)}
                        className="p-2 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                        title="Ver Ficha 360°"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold italic">
                    {activeTab === "critical" ? "🎉 ¡Excelente! No hay estudiantes en riesgo crítico por ausentismo este mes." : "No se encontraron registros para esta consulta."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación */}
        {filteredMonthlyMetrics.length > pageSize && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredMonthlyMetrics.length)} de {filteredMonthlyMetrics.length} Casos
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1"
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              <span className="text-xs font-black px-3 py-1 bg-slate-900 text-white rounded-lg">
                Pág. {currentPage} de {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-1"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL DE DRILLDOWN (360 GRADOS) ── */}
      {drilldownData && mounted && document.body && createPortal(
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

            {/* Lista de Estudiantes */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-3 flex-1 bg-slate-50/50">
              {drilldownData.students.length > 0 ? (
                drilldownData.students.map((student) => (
                  <div 
                    key={student.id} 
                    onClick={() => {
                      setDrilldownData(null);
                      if(onSelectStudent) onSelectStudent(student);
                    }}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-sm shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {student.primerApellido?.[0] || "E"}{student.primerNombre?.[0] || "A"}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-on-surface uppercase group-hover:text-indigo-700 transition-colors">
                          {student.primerApellido} {student.segundoApellido || ""} {student.primerNombre} {student.segundoNombre || ""}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            DOC: {student.nroDocumento}
                          </span>
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Grado {normalizeGrade(student.grado)} - Curso {student.curso}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-xl">
                        Ficha 360° <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <UserCheck2 size={48} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold uppercase tracking-widest">No hay estudiantes en esta categoría</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 text-center flex-shrink-0">
              <button
                onClick={() => setDrilldownData(null)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
