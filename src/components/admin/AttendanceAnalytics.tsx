"use client";

import { useMemo, useState } from "react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { 
  Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, 
  Users, UserCheck, Search, ChevronRight, FileSpreadsheet,
  AlertCircle, ShieldAlert, Award, ArrowUpRight, Filter
} from "lucide-react";

interface AttendanceAnalyticsProps {
  onSelectStudent?: (student: any) => void;
}

export default function AttendanceAnalytics({ onSelectStudent }: AttendanceAnalyticsProps) {
  const { students, masterData, allUsers, profile } = useApp();
  
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7)); // YYYY-MM
  const [selectedGradoFilter, setSelectedGradoFilter] = useState<string>("TODOS");
  const [selectedCursoFilter, setSelectedCursoFilter] = useState<string>("TODOS");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const activeStudents = useMemo(() => students.filter(s => s.isActive !== false), [students]);

  // ── MAPPING DE DOCENTES RESPONSABLES POR CURSO Y GRADO ──
  const courseTeachers = useMemo(() => {
    const map: Record<string, string[]> = {};
    
    // Extraer de todos los usuarios
    (allUsers || []).forEach(u => {
      if (u.weeklySchedule && Array.isArray(u.weeklySchedule)) {
        u.weeklySchedule.forEach((b: any) => {
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

    let presentes = 0;
    let ausentes = 0;
    let excusas = 0;
    let retardos = 0;
    let sinRegistro = 0;

    const absentStudentsList: any[] = [];
    const coursesStatus: Record<string, { total: number; presentes: number; ausentes: number; excusas: number; retardos: number; sinRegistro: number; teacher: string }> = {};

    target.forEach(s => {
      const g = normalizeGrade(s.grado);
      const c = s.curso || "N/A";
      const key = `${g}-${c}`;

      if (!coursesStatus[key]) {
        const tList = courseTeachers[key] || [];
        coursesStatus[key] = {
          total: 0, presentes: 0, ausentes: 0, excusas: 0, retardos: 0, sinRegistro: 0,
          teacher: tList.length > 0 ? tList.join(", ") : "Sin Docente Asignado"
        };
      }
      coursesStatus[key].total++;

      const rec = s.attendanceRecord ? s.attendanceRecord[selectedDate] : null;
      if (rec === "P") {
        presentes++;
        coursesStatus[key].presentes++;
      } else if (rec === "A") {
        ausentes++;
        coursesStatus[key].ausentes++;
        absentStudentsList.push({ ...s, recordType: "Ausente (Falta)" });
      } else if (rec === "E") {
        excusas++;
        coursesStatus[key].excusas++;
        absentStudentsList.push({ ...s, recordType: "Excusa Médica / Parental" });
      } else if (rec === "T") {
        retardos++;
        coursesStatus[key].retardos++;
        absentStudentsList.push({ ...s, recordType: "Llegada Tardía" });
      } else {
        sinRegistro++;
        coursesStatus[key].sinRegistro++;
      }
    });

    const evaluados = presentes + ausentes + excusas + retardos;
    const pctAsistencia = evaluados > 0 ? Math.round(((presentes + retardos) / evaluados) * 100) : 100;

    // Detectar Cursos con Baja Productividad / Sin registro de Asistencia Hoy
    const lowProductivityCourses = Object.entries(coursesStatus).filter(([_, data]) => data.sinRegistro === data.total);

    return {
      presentes, ausentes, excusas, retardos, sinRegistro, evaluados,
      total: target.length,
      pctAsistencia,
      absentStudentsList,
      coursesStatus,
      lowProductivityCourses
    };
  }, [activeStudents, selectedDate, selectedGradoFilter, selectedCursoFilter, courseTeachers]);

  // ── 2. HISTÓRICO MENSUAL Y ACUMULADO POR ESTUDIANTE ──
  const monthlyMetrics = useMemo(() => {
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

    const studentMonthlyDetails = target.map(s => {
      const recs = s.attendanceRecord || {};
      let mPresentes = 0;
      let mAusentes = 0;
      let mExcusas = 0;
      let mRetardos = 0;
      const monthDates: { date: string; status: string }[] = [];

      Object.entries(recs).forEach(([date, st]) => {
        if (date.startsWith(selectedMonth)) {
          monthDates.push({ date, status: st });
          if (st === "P") mPresentes++;
          else if (st === "A") mAusentes++;
          else if (st === "E") mExcusas++;
          else if (st === "T") mRetardos++;
        }
      });

      const totalEvaluado = mPresentes + mAusentes + mExcusas + mRetardos;
      const pctMonth = totalEvaluado > 0 ? Math.round(((mPresentes + mRetardos) / totalEvaluado) * 100) : 100;
      const isCritical = mAusentes >= 3;

      return {
        student: s,
        mPresentes, mAusentes, mExcusas, mRetardos, totalEvaluado, pctMonth, isCritical, monthDates
      };
    }).sort((a, b) => b.mAusentes - a.mAusentes);

    return studentMonthlyDetails;
  }, [activeStudents, selectedMonth, selectedGradoFilter, selectedCursoFilter, searchTerm]);

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
                Monitoreo en Tiempo Real e Histórico Mensual por Salón y Estudiante
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Fecha de Hoy / Consulta</label>
              <input 
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Mes de Consulta Histórica</label>
              <input 
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
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
            onChange={e => { setSelectedGradoFilter(e.target.value); setSelectedCursoFilter("TODOS"); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none cursor-pointer"
          >
            <option value="TODOS">TODOS LOS GRADOS</option>
            {Array.from(new Set(activeStudents.map(s => normalizeGrade(s.grado)))).sort().map(g => (
              <option key={g} value={g}>GRADO {g}</option>
            ))}
          </select>

          <select 
            value={selectedCursoFilter}
            onChange={e => setSelectedCursoFilter(e.target.value)}
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
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold outline-none focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* ── TARJETAS DE IMPACTO ASISTENCIA EN TIEMPO REAL ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-emerald-500">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Presentes Hoy</p>
          <p className="text-3xl font-black text-emerald-600 leading-none">{dailyMetrics.presentes}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">{dailyMetrics.pctAsistencia}% Asistencia Global</p>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-rose-500">
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Ausentes (Faltas)</p>
          <p className="text-3xl font-black text-rose-600 leading-none">{dailyMetrics.ausentes}</p>
          <p className="text-[8px] font-bold text-rose-500 uppercase mt-2">Inasistencia del día</p>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-amber-500">
          <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Excusas Médicas</p>
          <p className="text-3xl font-black text-amber-600 leading-none">{dailyMetrics.excusas}</p>
          <p className="text-[8px] font-bold text-amber-600 uppercase mt-2">Permisos Justificados</p>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-blue-500">
          <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Llegadas Tardías</p>
          <p className="text-3xl font-black text-blue-600 leading-none">{dailyMetrics.retardos}</p>
          <p className="text-[8px] font-bold text-blue-600 uppercase mt-2">Retardos de sesión</p>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-outline-variant/30 shadow-sm border-b-4 border-b-slate-400 col-span-2 lg:col-span-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Sin Registro Hoy</p>
          <p className="text-3xl font-black text-slate-700 leading-none">{dailyMetrics.sinRegistro}</p>
          <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">Pendientes por evaluar</p>
        </div>
      </div>

      {/* ── ALERTA DE NOVEDADES Y BAJA PRODUCTIVIDAD DOCENTE (SIN REGISTRO HOY) ── */}
      {dailyMetrics.lowProductivityCourses.length > 0 && (
        <div className="bg-rose-500 text-white p-6 rounded-[2.5rem] shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} className="text-yellow-300 animate-pulse" />
            <div>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-300">Alerta Directiva de Baja Productividad</span>
              <h3 className="text-lg font-black uppercase tracking-tight">Cursos y Salones Sin Registro de Asistencia el día de Hoy</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dailyMetrics.lowProductivityCourses.map(([courseKey, data]) => (
              <div key={courseKey} className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black uppercase text-yellow-300">Curso {courseKey}</span>
                  <span className="text-[9px] font-black bg-rose-700 px-2 py-0.5 rounded-full">{data.total} Alumnos</span>
                </div>
                <p className="text-[11px] font-bold text-white/90">Docente Responsable: <strong className="text-white">{data.teacher}</strong></p>
                <p className="text-[9px] text-white/60 uppercase mt-2">Estado: Sin reporte de asistencia hoy</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TABLA DE ASISTENCIA POR CURSO Y DOCENTE RESPONSABLE ── */}
      <div className="bg-white p-8 rounded-[3rem] border border-outline-variant/30 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-on-surface">
              Asistencia por Salón y Docentes Responsables
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Reporte del Día ({selectedDate})
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                <th className="pb-3">Curso / Salón</th>
                <th className="pb-3">Docente(s) Responsable(s)</th>
                <th className="pb-3 text-center">Matrícula</th>
                <th className="pb-3 text-center">Presentes</th>
                <th className="pb-3 text-center">Ausentes</th>
                <th className="pb-3 text-center">Excusas</th>
                <th className="pb-3 text-center">Estado del Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {Object.entries(dailyMetrics.coursesStatus).map(([key, data]) => {
                const isComplete = data.sinRegistro === 0;
                return (
                  <tr key={key} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 font-black uppercase text-on-surface italic">Grado-Curso {key}</td>
                    <td className="py-4 font-bold text-indigo-700">{data.teacher}</td>
                    <td className="py-4 text-center font-black">{data.total}</td>
                    <td className="py-4 text-center text-emerald-600 font-black">{data.presentes}</td>
                    <td className="py-4 text-center text-rose-600 font-black">{data.ausentes}</td>
                    <td className="py-4 text-center text-amber-600 font-black">{data.excusas}</td>
                    <td className="py-4 text-center">
                      {isComplete ? (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">
                          ✓ Al Día
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black uppercase">
                          ⚠️ Pendiente ({data.sinRegistro})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── TABLA DE HISTÓRICO MENSUAL POR ESTUDIANTE (CON CRÍTICOS Y EXCUSAS) ── */}
      <div className="bg-white p-8 rounded-[3rem] border border-outline-variant/30 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black uppercase italic tracking-tighter text-on-surface">
              Histórico Mensual de Ausentismo por Estudiante ({selectedMonth})
            </h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Registros Acumulados de Faltas (A), Excusas (E) y Tardanzas (T)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] border-b border-slate-100">
                <th className="pb-3">Estudiante</th>
                <th className="pb-3">Grado y Curso</th>
                <th className="pb-3 text-center">Faltas (A)</th>
                <th className="pb-3 text-center">Excusas (E)</th>
                <th className="pb-3 text-center">Retardos (T)</th>
                <th className="pb-3 text-center">% Mes</th>
                <th className="pb-3 text-center">Estado del Alumno</th>
                <th className="pb-3 text-right">Ficha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-bold">
              {monthlyMetrics.length > 0 ? monthlyMetrics.map(({ student, mPresentes, mAusentes, mExcusas, mRetardos, pctMonth, isCritical }) => (
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
                    ) : mAusentes > 0 ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase">
                        Seguimiento
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">
                        Asistencia Perfecta
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => onSelectStudent && onSelectStudent(student)}
                      className="p-2 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-bold italic">
                    No hay registros de asistencia para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
