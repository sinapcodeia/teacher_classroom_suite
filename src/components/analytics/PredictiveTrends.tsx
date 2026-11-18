"use client";

import { useApp, Student } from "@/context/AppContext";
import {
  calculateSubjectPeriodScore,
  DetailedGrades,
  normalizeSubjectKey,
} from "@/lib/gradeUtils";
import { normalizeGrade, matchStudentCourse } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, AreaChart, Area, Cell, PieChart, Pie, LabelList,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";
import {
  TrendingUp, Users, Activity, Filter, Award, BarChart3,
  Lightbulb, Check, RotateCcw, Radar as RadarIcon, AlertTriangle,
  UserX, Clock, Download, FileBarChart2, MessageSquare, ArrowDownRight
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";

const COLORS = ["#059669", "#4f46e5", "#d97706", "#e11d48"];

function getCourseBarGradient(avg: number): string {
  if (avg >= 4.0) return "url(#barEmerald)";
  if (avg >= 3.0) return "url(#barIndigo)";
  return "url(#barRose)";
}

function computeStudentAge(fechaNacimiento?: string): number | null {
  if (!fechaNacimiento) return null;
  const parsed = new Date(fechaNacimiento);
  if (isNaN(parsed.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - parsed.getFullYear();
  const m = today.getMonth() - parsed.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < parsed.getDate())) {
    age--;
  }
  return age >= 3 && age <= 30 ? age : null;
}

function isStudentExtraedad(student: Student): { isExtra: boolean; age: number | null } {
  const age = computeStudentAge(student.fechaNacimiento);
  if (age === null) return { isExtra: false, age: null };
  const gradeNum = parseInt(normalizeGrade(student.grado), 10);
  if (isNaN(gradeNum)) return { isExtra: false, age };
  return { isExtra: age > gradeNum + 8, age };
}

function countStudentAbsences(student: Student): { absent: number; late: number; totalDays: number } {
  const vals = Object.values(student.attendanceRecord || {});
  let absent = 0;
  let late = 0;
  for (const v of vals) {
    if (v === "absent") absent++;
    else if (v === "late") late++;
  }
  return { absent, late, totalDays: vals.length };
}

interface EnrichedStudentBI {
  student: Student;
  displayGrade: number | null;
  absentCount: number;
  lateCount: number;
  totalAttendanceDays: number;
  isExtraedad: boolean;
  age: number | null;
  isFailing: boolean;
  absentAndFailing: boolean;
}

export default function PredictiveTrends() {
  const { myStudents, schedule, masterData, subjects } = useApp();
  const [mounted, setMounted] = useState(false);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("p1");
  const [selectedSubject, setSelectedSubject] = useState<string>("TODAS");
  const [selectedGradeCourse, setSelectedGradeCourse] = useState<string>("TODOS");
  const [chartMode, setChartMode] = useState<"bar" | "area" | "radar">("bar");
  const [copiedSuggestion, setCopiedSuggestion] = useState(false);
  const [biTableFilter, setBiTableFilter] = useState<"ALL" | "ABSENT_FAIL" | "ABSENT" | "EXTRAEDAD" | "FAILING">("ABSENT_FAIL");
  const detailTableRef = useRef<HTMLDivElement | null>(null);

  const jumpToTableFilter = (filter: "ALL" | "ABSENT_FAIL" | "ABSENT" | "EXTRAEDAD" | "FAILING") => {
    setBiTableFilter(filter);
    detailTableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (masterData?.activePeriod) {
      setSelectedPeriod(masterData.activePeriod);
    }
  }, [masterData?.activePeriod]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const availableGradeCourses = useMemo(() => {
    const courses = new Set<string>();
    myStudents.forEach(s => {
      if (s.isActive !== false && s.grado && s.curso) {
        courses.add(`${normalizeGrade(s.grado)}-${String(s.curso).trim().toUpperCase()}`);
      }
    });
    (schedule || []).forEach(b => {
      if (b.grade && b.group) {
        courses.add(`${normalizeGrade(b.grade)}-${String(b.group).trim().toUpperCase()}`);
      }
    });
    return [
      "TODOS",
      ...Array.from(courses).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    ];
  }, [myStudents, schedule]);

  const availableSubjects = useMemo(() => {
    const list = (subjects || []).map(s => s.name);
    if (list.length > 0) {
      return ["TODAS", ...list];
    }
    return ["TODAS", "TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"];
  }, [subjects]);

  const getStudentAvgForFilter = (
    student: Student,
    period: string,
    subjectFilter: string
  ): number | null => {
    const detailed = student.detailedGrades;
    if (!detailed) return student.avgGrade > 0 ? student.avgGrade : null;

    let subjectKeys: string[] = [];
    if (subjectFilter === "TODAS") {
      subjectKeys = Object.keys(detailed);
      if (subjectKeys.length === 0) return student.avgGrade > 0 ? student.avgGrade : null;
    } else {
      const targetNorm = normalizeSubjectKey(subjectFilter);
      const matchedKey = Object.keys(detailed).find(k => normalizeSubjectKey(k) === targetNorm);
      if (!matchedKey) return null;
      subjectKeys = [matchedKey];
    }

    const periodsToEval = period === "acumulado" ? ["p1", "p2", "p3"] : [period];
    let totalScoreSum = 0;
    let scoreCount = 0;

    subjectKeys.forEach(subj => {
      const subjGrades = detailed[subj];
      if (!subjGrades) return;

      periodsToEval.forEach(p => {
        const pBlock = (subjGrades[p] || subjGrades[p.replace("p", "")] || subjGrades[p.toUpperCase()]) as DetailedGrades | undefined;
        const score = calculateSubjectPeriodScore(pBlock);
        if (score !== null) {
          totalScoreSum += score;
          scoreCount++;
        }
      });
    });

    return scoreCount > 0 ? Number((totalScoreSum / scoreCount).toFixed(2)) : null;
  };

  // Base filtrada completa (todos los estudiantes activos del filtro, con o sin nota, para análisis BI real)
  const enrichedStudents = useMemo<EnrichedStudentBI[]>(() => {
    return myStudents
      .filter(s => s.isActive !== false)
      .filter(s => {
        if (selectedGradeCourse === "TODOS") return true;
        const [g, c] = selectedGradeCourse.split("-");
        return (
          normalizeGrade(s.grado) === normalizeGrade(g) &&
          matchStudentCourse(s.curso, c, s.grado, g)
        );
      })
      .map(s => {
        const displayGrade = getStudentAvgForFilter(s, selectedPeriod, selectedSubject);
        const { absent, late, totalDays } = countStudentAbsences(s);
        const { isExtra, age } = isStudentExtraedad(s);
        const isFailing = displayGrade !== null && displayGrade < 3.0;
        const absentAndFailing = absent > 0 && isFailing;
        return {
          student: s,
          displayGrade,
          absentCount: absent,
          lateCount: late,
          totalAttendanceDays: totalDays,
          isExtraedad: isExtra,
          age,
          isFailing,
          absentAndFailing,
        };
      });
  }, [myStudents, selectedPeriod, selectedSubject, selectedGradeCourse]);

  const filteredStudentsWithGrades = useMemo(
    () => enrichedStudents.filter((e): e is EnrichedStudentBI & { displayGrade: number } => e.displayGrade !== null),
    [enrichedStudents]
  );

  // KPIs ejecutivos BI
  const biSummary = useMemo(() => {
    const total = enrichedStudents.length;
    const evaluated = filteredStudentsWithGrades.length;
    const failing = filteredStudentsWithGrades.filter(e => e.isFailing).length;
    const passing = evaluated - failing;
    const approvalRate = evaluated > 0 ? Math.round((passing / evaluated) * 100) : 0;
    const extraedadList = enrichedStudents.filter(e => e.isExtraedad);
    const extraedadRisk = extraedadList.filter(e => e.isFailing || e.absentCount >= 2).length;
    const absentAndFailingList = enrichedStudents.filter(e => e.absentAndFailing);
    const studentsWithAbsences = enrichedStudents.filter(e => e.absentCount > 0).length;
    const totalAbsences = enrichedStudents.reduce((sum, e) => sum + e.absentCount, 0);
    const totalTrackedDays = enrichedStudents.reduce((sum, e) => sum + e.totalAttendanceDays, 0);
    const absenteeismRate = totalTrackedDays > 0 ? Number(((totalAbsences / totalTrackedDays) * 100).toFixed(1)) : 0;

    return {
      total,
      evaluated,
      failing,
      passing,
      approvalRate,
      extraedadCount: extraedadList.length,
      extraedadPct: total > 0 ? Math.round((extraedadList.length / total) * 100) : 0,
      extraedadRisk,
      absentAndFailingCount: absentAndFailingList.length,
      studentsWithAbsences,
      totalAbsences,
      absenteeismRate,
    };
  }, [enrichedStudents, filteredStudentsWithGrades]);

  // 1. Distribución SIEEE
  const performanceData = useMemo(() => {
    const counts = {
      "Superior (4.6 - 5.0)": 0,
      "Alto (4.0 - 4.5)": 0,
      "Básico (3.0 - 3.9)": 0,
      "Bajo (0.0 - 2.9)": 0,
    };
    filteredStudentsWithGrades.forEach(s => {
      const avg = s.displayGrade;
      if (avg >= 4.6) counts["Superior (4.6 - 5.0)"]++;
      else if (avg >= 4.0) counts["Alto (4.0 - 4.5)"]++;
      else if (avg >= 3.0) counts["Básico (3.0 - 3.9)"]++;
      else counts["Bajo (0.0 - 2.9)"]++;
    });
    const total = filteredStudentsWithGrades.length;
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [filteredStudentsWithGrades]);

  // 2. Rendimiento por Aula
  const trendData = useMemo(() => {
    if (filteredStudentsWithGrades.length === 0) return [];
    const courseStats: Record<string, { sum: number; count: number; passing: number }> = {};

    filteredStudentsWithGrades.forEach(s => {
      const key = `${normalizeGrade(s.student.grado)}-${s.student.curso}`;
      if (!courseStats[key]) {
        courseStats[key] = { sum: 0, count: 0, passing: 0 };
      }
      courseStats[key].sum += s.displayGrade;
      courseStats[key].count++;
      if (s.displayGrade >= 3.0) courseStats[key].passing++;
    });

    return Object.entries(courseStats)
      .map(([course, stats]) => ({
        course,
        promedio: parseFloat((stats.sum / stats.count).toFixed(2)),
        evaluados: stats.count,
        aprobados: stats.passing,
        reprobados: stats.count - stats.passing,
        aprobacion: Math.round((stats.passing / stats.count) * 100),
      }))
      .sort((a, b) => a.course.localeCompare(b.course, undefined, { numeric: true }));
  }, [filteredStudentsWithGrades]);

  // 3. Análisis BI por Grado: Ausentismo, Perdieron + No Asistieron y Extraedad
  const gradeBiMetrics = useMemo(() => {
    const byGrade: Record<
      string,
      {
        grade: string;
        total: number;
        totalAbsences: number;
        totalTracked: number;
        studentsWithAbsence: number;
        failing: number;
        absentAndFailing: number;
        extraedad: number;
        normativeAge: number;
        extraedadFailing: number;
      }
    > = {};

    enrichedStudents.forEach(e => {
      const g = normalizeGrade(e.student.grado) || "S/G";
      if (!byGrade[g]) {
        byGrade[g] = {
          grade: g,
          total: 0,
          totalAbsences: 0,
          totalTracked: 0,
          studentsWithAbsence: 0,
          failing: 0,
          absentAndFailing: 0,
          extraedad: 0,
          normativeAge: 0,
          extraedadFailing: 0,
        };
      }
      const bucket = byGrade[g];
      bucket.total++;
      bucket.totalAbsences += e.absentCount;
      bucket.totalTracked += e.totalAttendanceDays;
      if (e.absentCount > 0) bucket.studentsWithAbsence++;
      if (e.isFailing) bucket.failing++;
      if (e.absentAndFailing) bucket.absentAndFailing++;
      if (e.isExtraedad) {
        bucket.extraedad++;
        if (e.isFailing) bucket.extraedadFailing++;
      } else {
        bucket.normativeAge++;
      }
    });

    return Object.values(byGrade)
      .map(b => ({
        ...b,
        absenteeismPct: b.totalTracked > 0 ? Number(((b.totalAbsences / b.totalTracked) * 100).toFixed(1)) : 0,
        extraedadPct: b.total > 0 ? Math.round((b.extraedad / b.total) * 100) : 0,
      }))
      .sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }));
  }, [enrichedStudents]);

  const groupAverage = useMemo(() => {
    if (filteredStudentsWithGrades.length === 0) return 0;
    const sum = filteredStudentsWithGrades.reduce((acc, s) => acc + s.displayGrade, 0);
    return parseFloat((sum / filteredStudentsWithGrades.length).toFixed(2));
  }, [filteredStudentsWithGrades]);

  // Radar SIEEE por los 5 pilares institucionales
  const pillarRadarData = useMemo(() => {
    const totals = { sb: 0, sbh: 0, sr: 0, cv: 0, aut: 0 };
    const counts = { sb: 0, sbh: 0, sr: 0, cv: 0, aut: 0 };
    const periodsToEval = selectedPeriod === "acumulado" ? ["p1", "p2", "p3"] : [selectedPeriod];
    const targetNorm = selectedSubject === "TODAS" ? null : normalizeSubjectKey(selectedSubject);

    const avgArr = (arr?: (number | null)[]) => {
      if (!arr) return null;
      const valid = arr.filter((v): v is number => typeof v === "number" && !isNaN(v));
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };

    filteredStudentsWithGrades.forEach(item => {
      const dg = item.student.detailedGrades || {};
      const keys = targetNorm
        ? Object.keys(dg).filter(k => normalizeSubjectKey(k) === targetNorm)
        : Object.keys(dg);

      keys.forEach(subj => {
        const subjMap = dg[subj];
        if (!subjMap) return;
        periodsToEval.forEach(p => {
          const blk = (subjMap[p] || subjMap[p.replace("p", "")] || subjMap[p.toUpperCase()]) as DetailedGrades | undefined;
          if (!blk) return;
          const vSb = avgArr(blk.sb);
          const vSbh = avgArr(blk.sbh);
          const vSr = avgArr(blk.sr);
          const vCv = avgArr(blk.cv);
          if (vSb !== null) { totals.sb += vSb; counts.sb++; }
          if (vSbh !== null) { totals.sbh += vSbh; counts.sbh++; }
          if (vSr !== null) { totals.sr += vSr; counts.sr++; }
          if (vCv !== null) { totals.cv += vCv; counts.cv++; }
          if (typeof blk.aut === "number" && !isNaN(blk.aut)) { totals.aut += blk.aut; counts.aut++; }
        });
      });
    });

    return [
      { pilar: "Saber (30%)", promedio: counts.sb ? Number((totals.sb / counts.sb).toFixed(2)) : 0, meta: 3.0 },
      { pilar: "Hacer (40%)", promedio: counts.sbh ? Number((totals.sbh / counts.sbh).toFixed(2)) : 0, meta: 3.0 },
      { pilar: "Ser (20%)", promedio: counts.sr ? Number((totals.sr / counts.sr).toFixed(2)) : 0, meta: 3.0 },
      { pilar: "Convivencia (5%)", promedio: counts.cv ? Number((totals.cv / counts.cv).toFixed(2)) : 0, meta: 3.0 },
      { pilar: "Autoeval. (5%)", promedio: counts.aut ? Number((totals.aut / counts.aut).toFixed(2)) : 0, meta: 3.0 },
    ];
  }, [filteredStudentsWithGrades, selectedPeriod, selectedSubject]);

  // Casos prioritarios para tabla BI
  const priorityCases = useMemo(() => {
    const filtered = enrichedStudents.filter(e => {
      if (biTableFilter === "ABSENT_FAIL") return e.absentAndFailing;
      if (biTableFilter === "ABSENT") return e.absentCount > 0;
      if (biTableFilter === "EXTRAEDAD") return e.isExtraedad;
      if (biTableFilter === "FAILING") return e.isFailing;
      return e.absentAndFailing || e.isExtraedad || e.isFailing;
    });
    return filtered.sort((a, b) => {
      if (a.absentAndFailing !== b.absentAndFailing) return a.absentAndFailing ? -1 : 1;
      if (b.absentCount !== a.absentCount) return b.absentCount - a.absentCount;
      return (a.displayGrade ?? 5) - (b.displayGrade ?? 5);
    });
  }, [enrichedStudents, biTableFilter]);

  const aiWorkshopSuggestion = useMemo(() => {
    const avg = groupAverage;
    const sub = selectedSubject.toUpperCase();

    if (filteredStudentsWithGrades.length === 0) {
      return {
        title: "Esperando calificaciones",
        type: "Planificación",
        desc: "Ingresa las primeras notas en la planilla para generar recomendaciones contextuales de talleres.",
        color: "text-slate-600 bg-slate-100 border-slate-200",
      };
    }

    if (avg < 3.5) {
      const type = "Taller de Refuerzo y Nivelación Directa";
      let desc = `Se sugiere un taller de recuperación sobre conceptos clave de ${selectedSubject} con tutorías entre pares.`;
      if (sub.includes("MATEMÁTICAS")) {
        desc = "Se sugiere un taller práctico de fracciones y conteo con materiales del medio (hojas, semillas) para afianzar bases.";
      } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
        desc = "Se sugiere un taller de nivelación en hojas de cálculo con tablas simplificadas de 3 columnas (Cosecha, Consumo, Trueque).";
      } else if (sub.includes("FÍSICA")) {
        desc = "Se sugiere un laboratorio de campo sobre fuerzas simples usando poleas de madera y el principio del trapiche.";
      } else if (sub.includes("ÉTICA")) {
        desc = "Se sugiere un círculo de la palabra enfocado en resolución pacífica de conflictos y compañerismo en el aula.";
      }
      return {
        title: `Nivelación sugerida para ${selectedSubject === "TODAS" ? "todas las materias" : selectedSubject}`,
        type,
        desc,
        color: "text-rose-700 bg-rose-50 border-rose-200",
      };
    }

    if (avg >= 4.2) {
      const type = "Taller de Profundización e Innovación";
      let desc = `Se sugiere un taller de investigación y sustentación oral sobre la aplicación real de ${selectedSubject} en el territorio.`;
      if (sub.includes("MATEMÁTICAS")) {
        desc = "Se sugiere un taller avanzado de geometría y cestería tradicional, aplicando simetría y progresiones espirales.";
      } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
        desc = "Se sugiere un proyecto de prototipado: diseño lógico de un sistema de riego automatizado con materiales del medio.";
      } else if (sub.includes("FÍSICA")) {
        desc = "Se sugiere un taller de termodinámica aplicada: estudio de transferencia de calor en la elaboración de panela.";
      } else if (sub.includes("ÉTICA")) {
        desc = "Se sugiere liderar una minga de pensamiento comunitaria sobre gobernanza y liderazgo estudiantil.";
      }
      return {
        title: `Innovación sugerida para ${selectedSubject === "TODAS" ? "todas las materias" : selectedSubject}`,
        type,
        desc,
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      };
    }

    const type = "Taller de Consolidación Pedagógica";
    let desc = `Se sugiere un taller de aplicación conceptual de ${selectedSubject} en parejas con exposición al cierre.`;
    if (sub.includes("MATEMÁTICAS")) {
      desc = "Se sugiere un taller de resolución de problemas cotidianos sobre presupuestos familiares y mercado veredal.";
    } else if (sub.includes("TECNOLOGÍA") || sub.includes("INFORMÁTICA")) {
      desc = "Se sugiere un taller de tablas de seguimiento para inventario y rendimiento agropecuario en la chagra escolar.";
    } else if (sub.includes("FÍSICA")) {
      desc = "Se sugiere un taller práctico sobre leyes de Newton analizando caudal en quebradas locales y movimiento de poleas.";
    } else if (sub.includes("ÉTICA")) {
      desc = "Se sugiere una dinámica grupal de roles enfocada en valores Awá de solidaridad y minga solidaria.";
    }
    return {
      title: `Práctica sugerida para ${selectedSubject === "TODAS" ? "todas las materias" : selectedSubject}`,
      type,
      desc,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    };
  }, [groupAverage, selectedSubject, filteredStudentsWithGrades.length]);

  const hasCustomFilters =
    selectedSubject !== "TODAS" ||
    selectedGradeCourse !== "TODOS" ||
    selectedPeriod !== (masterData?.activePeriod || "p1");

  const handleResetFilters = () => {
    setSelectedPeriod(masterData?.activePeriod || "p1");
    setSelectedSubject("TODAS");
    setSelectedGradeCourse("TODOS");
  };

  const handleExportBiReportExcel = async () => {
    const { downloadRowsAsExcel } = await import("@/lib/spreadsheetUtils");
    const rows = gradeBiMetrics.map(g => ({
      GRADO: g.grade,
      MATRICULA_ACTIVA: g.total,
      CON_INASISTENCIAS: g.studentsWithAbsence,
      TOTAL_FALLAS: g.totalAbsences,
      TASA_AUSENTISMO_PCT: `${g.absenteeismPct}%`,
      REPROBADOS_MENOR_3_0: g.failing,
      NO_ASISTIERON_Y_PERDIERON: g.absentAndFailing,
      EXTRAEDAD_TOTAL: g.extraedad,
      EXTRAEDAD_PCT: `${g.extraedadPct}%`,
      EXTRAEDAD_EN_RIESGO: g.extraedadFailing,
    }));
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    downloadRowsAsExcel(rows, `INFORME_BI_IETABA_${selectedPeriod.toUpperCase()}_${dateStr}.xlsx`, "Informe BI por Grado");
  };

  if (!mounted) {
    return <div className="h-[360px] w-full bg-slate-100 animate-pulse rounded-3xl" />;
  }

  return (
    <section className="mb-8 space-y-5">
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-lg shadow-slate-200/40">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="text-indigo-600 shrink-0" />
            Centro de Analítica BI 360°
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Rendimiento SIEEE, nivel de ausentismo por grado, extraedad y riesgo académico en tiempo real
          </p>
        </div>

        {/* PANEL DE FILTROS ACCESIBLE */}
        <div className="flex flex-wrap gap-2 items-center bg-slate-50 p-2 rounded-2xl border border-slate-200/70">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase text-slate-500 tracking-wider pl-1.5">
            <Filter size={12} />
            <span>Filtros:</span>
          </div>

          <select
            aria-label="Filtrar por período académico"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="min-h-[40px] bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-50"
          >
            <option value="p1">1° Periodo (Maza)</option>
            <option value="p2">2° Periodo (Pas)</option>
            <option value="p3">3° Periodo (Kutña)</option>
            <option value="acumulado">Promedio Acumulado</option>
          </select>

          <select
            aria-label="Filtrar por asignatura"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="min-h-[40px] bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-50"
          >
            {availableSubjects.map(sub => (
              <option key={sub} value={sub}>{sub === "TODAS" ? "Todas las Materias" : sub}</option>
            ))}
          </select>

          <select
            aria-label="Filtrar por curso"
            value={selectedGradeCourse}
            onChange={(e) => setSelectedGradeCourse(e.target.value)}
            className="min-h-[40px] bg-white border border-slate-200 text-slate-800 rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-50"
          >
            {availableGradeCourses.map(gc => (
              <option key={gc} value={gc}>{gc === "TODOS" ? "Todos los Cursos" : `Curso ${gc}`}</option>
            ))}
          </select>

          {hasCustomFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="min-h-[40px] px-3 py-1.5 bg-slate-200/70 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              title="Restablecer filtros"
            >
              <RotateCcw size={12} /> Restablecer
            </button>
          )}

          <button
            type="button"
            onClick={handleExportBiReportExcel}
            className="min-h-[40px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Descargar informe BI consolidado por grado en Excel"
          >
            <Download size={13} /> Informe Excel
          </button>
        </div>
      </div>

      {/* RESUMEN EJECUTIVO EN LENGUAJE CLARO + 4 KPIs BI */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-white/10 shrink-0">
              <FileBarChart2 size={20} className="text-emerald-400" />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
                Diagnóstico Ejecutivo Automático ({selectedPeriod.toUpperCase()} · {selectedSubject})
              </span>
              <p className="text-xs sm:text-sm text-slate-100 font-medium mt-1 leading-relaxed">
                De <strong>{biSummary.total}</strong> estudiantes activos,{" "}
                <strong>{biSummary.evaluated}</strong> tienen notas registradas con promedio{" "}
                <strong>{groupAverage.toFixed(2)} / 5.0</strong> (<strong>{biSummary.approvalRate}%</strong> aprueba).{" "}
                Se registran <strong>{biSummary.absentAndFailingCount}</strong> estudiante(s) que{" "}
                <strong className="text-rose-300">no asistieron y perdieron la materia</strong>, y{" "}
                <strong>{biSummary.extraedadCount}</strong> caso(s) de{" "}
                <strong className="text-amber-300">extraedad</strong> ({biSummary.extraedadPct}%).
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          <button
            type="button"
            onClick={() => jumpToTableFilter("FAILING")}
            className={`text-left bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3 sm:p-4 transition-all cursor-pointer border ${
              biTableFilter === "FAILING" ? "border-emerald-400 ring-1 ring-emerald-400" : "border-white/10"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-200 flex items-center justify-between">
              <span>Promedio & Aprobación</span>
              <ArrowDownRight size={13} className="text-emerald-300" />
            </p>
            <p className="text-xl sm:text-2xl font-black mt-1">
              {groupAverage.toFixed(2)} <span className="text-xs font-bold text-emerald-300">({biSummary.approvalRate}% apr.)</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">{biSummary.passing} aprobando · {biSummary.failing} reprobando (ver)</p>
          </button>

          <button
            type="button"
            onClick={() => jumpToTableFilter("ABSENT_FAIL")}
            className={`text-left bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3 sm:p-4 transition-all cursor-pointer border ${
              biTableFilter === "ABSENT_FAIL" ? "border-rose-400 ring-1 ring-rose-400" : "border-white/10"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200 flex items-center justify-between">
              <span className="flex items-center gap-1"><UserX size={12} /> No Asistieron y Perdieron</span>
              <ArrowDownRight size={13} className="text-rose-300" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-rose-300 mt-1">{biSummary.absentAndFailingCount}</p>
            <p className="text-[10px] text-slate-300 mt-0.5">
              De {biSummary.failing} reprobados, {biSummary.absentAndFailingCount} tuvieron fallas (ver)
            </p>
          </button>

          <button
            type="button"
            onClick={() => jumpToTableFilter("ABSENT")}
            className={`text-left bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3 sm:p-4 transition-all cursor-pointer border ${
              biTableFilter === "ABSENT" ? "border-sky-400 ring-1 ring-sky-400" : "border-white/10"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-200 flex items-center justify-between">
              <span>Ausentismo Registrado</span>
              <ArrowDownRight size={13} className="text-sky-300" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-sky-300 mt-1">
              {biSummary.absenteeismRate}% <span className="text-xs font-bold">({biSummary.totalAbsences} fallas)</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">{biSummary.studentsWithAbsences} estudiante(s) con fallas (ver)</p>
          </button>

          <button
            type="button"
            onClick={() => jumpToTableFilter("EXTRAEDAD")}
            className={`text-left bg-white/10 hover:bg-white/15 backdrop-blur rounded-2xl p-3 sm:p-4 transition-all cursor-pointer border ${
              biTableFilter === "EXTRAEDAD" ? "border-amber-400 ring-1 ring-amber-400" : "border-white/10"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200 flex items-center justify-between">
              <span className="flex items-center gap-1"><Clock size={12} /> Extraedad (&gt; Grado + 8 años)</span>
              <ArrowDownRight size={13} className="text-amber-300" />
            </p>
            <p className="text-xl sm:text-2xl font-black text-amber-300 mt-1">
              {biSummary.extraedadCount} <span className="text-xs font-bold">({biSummary.extraedadPct}%)</span>
            </p>
            <p className="text-[10px] text-slate-300 mt-0.5">{biSummary.extraedadRisk} en riesgo académico o fallas (ver)</p>
          </button>
        </div>
      </div>

      {/* FILA 1: RENDIMIENTO POR AULA + DONA SIEEE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                <Award size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
                  Promedio por Curso vs. Nota Mínima de Aprobación (3.0)
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {filteredStudentsWithGrades.length} estudiantes evaluados · Verde: ≥ 4.0 · Azul: 3.0–3.9 · Rojo: &lt; 3.0
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setChartMode("bar")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  chartMode === "bar" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <BarChart3 size={13} /> Barras
              </button>
              <button
                type="button"
                onClick={() => setChartMode("area")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  chartMode === "area" ? "bg-white text-primary shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp size={13} /> Curva
              </button>
              <button
                type="button"
                onClick={() => setChartMode("radar")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  chartMode === "radar" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <RadarIcon size={13} /> Radar SIEEE
              </button>
            </div>
          </div>

          <div className="h-[270px] sm:h-[300px] w-full flex items-center justify-center">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === "bar" ? (
                  <BarChart data={trendData} margin={{ top: 22, right: 16, left: -12, bottom: 4 }}>
                    <defs>
                      <linearGradient id="barEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.75} />
                      </linearGradient>
                      <linearGradient id="barIndigo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.75} />
                      </linearGradient>
                      <linearGradient id="barRose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#e11d48" stopOpacity={0.75} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#475569" }} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} />
                    <ReferenceLine
                      y={3.0}
                      stroke="#f59e0b"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ value: "Nota mínima aprobar: 3.0", position: "insideTopRight", fill: "#b45309", fontSize: 10, fontWeight: 800 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload as {
                          course: string;
                          promedio: number;
                          evaluados: number;
                          aprobados: number;
                          reprobados: number;
                          aprobacion: number;
                        };
                        const diff = Number((d.promedio - 3.0).toFixed(2));
                        const nivel = d.promedio >= 4.6 ? "Superior" : d.promedio >= 4.0 ? "Alto" : d.promedio >= 3.0 ? "Básico" : "Bajo (En Riesgo)";
                        return (
                          <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl p-3 shadow-xl text-xs space-y-1 max-w-[240px]">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
                              <span className="font-black text-slate-900">Curso {d.course}</span>
                              <span className="font-black text-indigo-700">{d.promedio.toFixed(2)} / 5.0</span>
                            </div>
                            <p className="font-semibold text-slate-700">Desempeño grupal: <strong>{nivel}</strong></p>
                            <p className="text-slate-600">{d.aprobados} de {d.evaluados} aprueban ({d.aprobacion}%){d.reprobados > 0 ? ` · ${d.reprobados} reprueban` : ""}</p>
                            <p className={`font-bold ${diff >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                              {diff >= 0 ? `+${diff.toFixed(2)} sobre el mínimo (3.0)` : `${diff.toFixed(2)} bajo el mínimo (3.0) — requiere refuerzo`}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="promedio" radius={[12, 12, 4, 4]} maxBarSize={52}>
                      {trendData.map((entry, idx) => (
                        <Cell key={`bar-${idx}`} fill={getCourseBarGradient(entry.promedio)} />
                      ))}
                      <LabelList dataKey="promedio" position="top" formatter={(v: unknown) => Number(v).toFixed(1)} style={{ fill: "#0f172a", fontSize: 11, fontWeight: 800 }} />
                    </Bar>
                  </BarChart>
                ) : chartMode === "radar" ? (
                  <RadarChart cx="50%" cy="50%" outerRadius="72%" data={pillarRadarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="pilar" tick={{ fontSize: 10, fontWeight: 800, fill: "#334155" }} />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <Radar name="Meta 3.0" dataKey="meta" stroke="#f59e0b" strokeDasharray="4 4" fill="#f59e0b" fillOpacity={0.08} />
                    <Radar name="Promedio Grupo" dataKey="promedio" stroke="#4f46e5" strokeWidth={2.5} fill="#6366f1" fillOpacity={0.32} />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(2)} / 5.0`]}
                      contentStyle={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 20px -5px rgb(0 0 0 / 0.12)", fontSize: "11px", fontWeight: 700 }}
                    />
                  </RadarChart>
                ) : (
                  <AreaChart data={trendData} margin={{ top: 10, right: 16, left: -12, bottom: 4 }}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="course" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#475569" }} />
                    <YAxis domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} />
                    <ReferenceLine y={3.0} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth={2} />
                    <Tooltip
                      formatter={(value) => [`${Number(value).toFixed(2)} / 5.0`, "Promedio"]}
                      contentStyle={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 20px -5px rgb(0 0 0 / 0.12)", fontSize: "11px", fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="promedio" stroke="#3b82f6" strokeWidth={3.5} fillOpacity={1} fill="url(#colorAvg)" />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="text-center space-y-2 py-12 px-4">
                <Activity size={40} className="mx-auto text-slate-400" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-700">Sin notas registradas para este filtro</p>
                <p className="text-[11px] font-medium text-slate-500">Registra calificaciones en Clase en Vivo o cambia el período/materia arriba.</p>
              </div>
            )}
          </div>
        </div>

        {/* DONA DE DISTRIBUCIÓN SIEEE */}
        <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <Users size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold tracking-tight text-slate-900">Distribución SIEEE</h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Por nivel de desempeño</p>
              </div>
            </div>

            <div className="h-[190px] w-full mb-4 relative flex items-center justify-center">
              {filteredStudentsWithGrades.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={performanceData} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={5} dataKey="value">
                        {performanceData.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, item) => {
                          const pct = (item?.payload as { percent?: number } | undefined)?.percent ?? 0;
                          return [`${value} est. (${pct}%)`, String(name)];
                        }}
                        contentStyle={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 20px -5px rgb(0 0 0 / 0.12)", fontSize: "11px", fontWeight: 700 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-black text-slate-900 leading-none">{groupAverage.toFixed(1)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">Promedio</span>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <Users size={40} className="mx-auto text-slate-400" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600">Sin alumnos evaluados</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100">
            {performanceData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{item.name}</span>
                </div>
                <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-lg shrink-0">
                  {item.value} ({item.percent}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILA 2 BI: AUSENTISMO + PÉRDIDA POR GRADO & EXTRAEDAD POR GRADO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                <UserX size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
                  Ausentismo y Pérdida Académica por Grado
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Estudiantes con fallas vs reprobados vs quienes no asistieron y perdieron
                </p>
              </div>
            </div>
          </div>

          <div className="h-[260px] w-full flex items-center justify-center">
            {gradeBiMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeBiMetrics} margin={{ top: 18, right: 12, left: -14, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: "#334155" }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value, name, item) => {
                      const p = item?.payload as { absenteeismPct?: number; totalAbsences?: number } | undefined;
                      if (name === "Con Fallas") return [`${value} est. (${p?.totalAbsences ?? 0} fallas · ${p?.absenteeismPct ?? 0}%)`, String(name)];
                      return [`${value} estudiante(s)`, String(name)];
                    }}
                    contentStyle={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 20px -5px rgb(0 0 0 / 0.12)", fontSize: "11px", fontWeight: 700 }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 700 }} />
                  <Bar dataKey="studentsWithAbsence" name="Con Fallas" fill="#0ea5e9" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="studentsWithAbsence" position="top" style={{ fill: "#0369a1", fontSize: 10, fontWeight: 800 }} />
                  </Bar>
                  <Bar dataKey="failing" name="Reprobados (<3.0)" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="failing" position="top" style={{ fill: "#b45309", fontSize: 10, fontWeight: 800 }} />
                  </Bar>
                  <Bar dataKey="absentAndFailing" name="No Asistió y Perdió" fill="#e11d48" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    <LabelList dataKey="absentAndFailing" position="top" style={{ fill: "#be123c", fontSize: 10, fontWeight: 800 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs font-bold text-slate-500">Sin datos suficientes por grado.</p>
            )}
          </div>
        </div>

        {/* EXTRAEDAD POR GRADO */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xl shadow-slate-200/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
                Análisis de Extraedad por Grado
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Edad normativa vs extraedad (&gt; Grado + 8 años)
              </p>
            </div>
          </div>

          <div className="h-[260px] w-full flex items-center justify-center">
            {gradeBiMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeBiMetrics} margin={{ top: 18, right: 12, left: -14, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 800, fill: "#334155" }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: "#64748b" }} />
                  <Tooltip
                    formatter={(value, name, item) => {
                      const p = item?.payload as { extraedadPct?: number; extraedadFailing?: number } | undefined;
                      if (name === "Extraedad") return [`${value} est. (${p?.extraedadPct ?? 0}% · ${p?.extraedadFailing ?? 0} reprueba)`, String(name)];
                      return [`${value} estudiante(s)`, String(name)];
                    }}
                    contentStyle={{ borderRadius: "14px", border: "1px solid #e2e8f0", boxShadow: "0 10px 20px -5px rgb(0 0 0 / 0.12)", fontSize: "11px", fontWeight: 700 }}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 700 }} />
                  <Bar dataKey="normativeAge" name="Edad Normativa" stackId="edad" fill="#cbd5e1" radius={[0, 0, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="extraedad" name="Extraedad" stackId="edad" fill="#f59e0b" radius={[8, 8, 0, 0]} maxBarSize={36}>
                    <LabelList dataKey="extraedad" position="top" style={{ fill: "#b45309", fontSize: 10, fontWeight: 800 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs font-bold text-slate-500">Sin datos de fecha de nacimiento.</p>
            )}
          </div>
        </div>
      </div>

      {/* TABLA EJECUTIVA DE CASOS PRIORITARIOS (CRUCE AUSENTISMO + PÉRDIDA + EXTRAEDAD) */}
      <div ref={detailTableRef} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xl shadow-slate-200/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-rose-600 shrink-0" />
            <div>
              <h3 className="font-display text-base font-bold tracking-tight text-slate-900">
                Detalle de Alerta BI ({priorityCases.length} caso(s))
              </h3>
              <p className="text-xs font-medium text-slate-500">
                Seguimiento focalizado para intervención pedagógica y citación de acudientes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl">
            {[
              { id: "ABSENT_FAIL", label: `No Asistió y Perdió (${biSummary.absentAndFailingCount})` },
              { id: "ABSENT", label: `Con Fallas (${biSummary.studentsWithAbsences})` },
              { id: "FAILING", label: `Reprobados (${biSummary.failing})` },
              { id: "EXTRAEDAD", label: `Extraedad (${biSummary.extraedadCount})` },
              { id: "ALL", label: "Todos en Alerta" },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setBiTableFilter(tab.id as typeof biTableFilter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  biTableFilter === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {priorityCases.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-[11px] border-collapse min-w-[640px]">
              <thead className="bg-slate-50 text-slate-600 font-black uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Estudiante</th>
                  <th className="p-3 text-center">Salón</th>
                  <th className="p-3 text-center">Nota</th>
                  <th className="p-3 text-center">Fallas</th>
                  <th className="p-3 text-center">Edad</th>
                  <th className="p-3">Diagnóstico</th>
                  <th className="p-3 text-center">Citación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priorityCases.slice(0, 25).map(item => {
                  const cleanPhone = (item.student.acudienteTelefono || "").replace(/\D/g, "");
                  const waMessage = `Cordial saludo. Desde la IETABA informamos seguimiento académico de ${item.student.primerNombre} ${item.student.primerApellido} (${normalizeGrade(item.student.grado)}-${item.student.curso}) en ${selectedPeriod.toUpperCase()}: promedio ${item.displayGrade !== null ? item.displayGrade.toFixed(2) : "PE"} y ${item.absentCount} inasistencia(s). Agradecemos comunicarse con la institución.`;
                  return (
                  <tr key={item.student.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-bold text-slate-900 uppercase">
                      {item.student.primerApellido} {item.student.segundoApellido} {item.student.primerNombre} {item.student.segundoNombre}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      {normalizeGrade(item.student.grado)}-{item.student.curso}
                    </td>
                    <td className={`p-3 text-center font-black ${item.isFailing ? "text-rose-600" : "text-slate-800"}`}>
                      {item.displayGrade !== null ? item.displayGrade.toFixed(2) : "PE"}
                    </td>
                    <td className="p-3 text-center font-bold text-sky-700">{item.absentCount}</td>
                    <td className="p-3 text-center font-semibold text-slate-600">
                      {item.age !== null ? `${item.age} años` : "—"}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {item.absentAndFailing && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[9px] uppercase">
                            No asistió y perdió
                          </span>
                        )}
                        {!item.absentAndFailing && item.isFailing && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[9px] uppercase">
                            Bajo desempeño
                          </span>
                        )}
                        {item.isExtraedad && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-black text-[9px] uppercase">
                            Extraedad
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {cleanPhone.length >= 7 ? (
                        <a
                          href={`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(waMessage)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                          title={`Citar acudiente al ${cleanPhone}`}
                        >
                          <MessageSquare size={12} /> Citar
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">Sin tel.</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl">
            No se registran estudiantes en esta categoría para el filtro seleccionado.
          </div>
        )}
      </div>

      {/* SUGERENCIA DE IA CONTEXTUAL DE TALLERES */}
      {filteredStudentsWithGrades.length > 0 && (
        <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border ${aiWorkshopSuggestion.color} flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-md`}>
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0 text-primary">
              <Lightbulb size={22} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded border border-current">
                {aiWorkshopSuggestion.type}
              </span>
              <h4 className="text-sm font-black uppercase tracking-tight mt-1 text-slate-900">
                {aiWorkshopSuggestion.title}
              </h4>
              <p className="text-xs text-slate-700 mt-0.5 font-medium leading-relaxed max-w-4xl">
                {aiWorkshopSuggestion.desc}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(aiWorkshopSuggestion.desc);
              setCopiedSuggestion(true);
              setTimeout(() => setCopiedSuggestion(false), 2000);
            }}
            className="min-h-[44px] px-4 py-2 bg-white text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {copiedSuggestion ? (
              <>
                <Check size={14} className="text-emerald-600" /> ¡Copiado!
              </>
            ) : (
              "Copiar Sugerencia"
            )}
          </button>
        </div>
      )}
    </section>
  );
}
