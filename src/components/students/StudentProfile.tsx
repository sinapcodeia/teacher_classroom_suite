"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  User, Calendar, Hash, GraduationCap, MapPin, Star, BookOpen,
  Plus, ClipboardList, Phone, RefreshCw, TrendingUp, AlertTriangle,
  ChevronRight, Activity, Edit, X, Loader2, CheckCircle,
  Sparkles, Target, Brain, ArrowUpRight
} from "lucide-react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import Link from "next/link";

// ── helpers ───────────────────────────────────────────────────────────────────
function formatDate(dateVal: string | number) {
  if (!dateVal) return "No registrado";
  const strVal = String(dateVal);
  if (!isNaN(Number(strVal)) && Number(strVal) > 10000) {
    const date = new Date((Number(strVal) - 25569) * 86400 * 1000);
    return date.toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  }
  try {
    const d = new Date(strVal);
    if (!isNaN(d.getTime())) return d.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
  } catch { /* ignore */ }
  return strVal;
}

function perfConfig(avg: number) {
  if (avg >= 4.6) return { label: "Superior", gradient: "from-emerald-500 to-teal-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", barColor: "bg-emerald-500" };
  if (avg >= 4.0) return { label: "Alto",     gradient: "from-blue-600 to-primary",     badge: "bg-blue-50 text-blue-700 border-blue-200",       barColor: "bg-blue-500" };
  if (avg >= 3.0) return { label: "Básico",   gradient: "from-amber-500 to-orange-400", badge: "bg-amber-50 text-amber-700 border-amber-200",     barColor: "bg-amber-500" };
  return           { label: "Bajo",    gradient: "from-red-600 to-rose-500",    badge: "bg-red-50 text-red-700 border-red-200",         barColor: "bg-red-500" };
}

function gradeTypeConfig(type: string) {
  switch (type) {
    case "exam":          return { icon: <ClipboardList size={13} />, color: "bg-purple-100 text-purple-600", label: "Evaluación" };
    case "participation": return { icon: <Star size={13} />,          color: "bg-amber-100 text-amber-600",   label: "Participación" };
    default:              return { icon: <BookOpen size={13} />,       color: "bg-blue-100 text-blue-600",     label: "Actividad" };
  }
}

// Reales: parsea attendanceRecord y devuelve ausencias y tardanzas del último mes
function parseAttendanceRecord(record?: Record<string, string>) {
  if (!record) return { absences: [], lates: [], presentDays: 0, totalDays: 0 };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const entries = Object.entries(record)
    .filter(([d]) => new Date(d) >= cutoff)
    .sort(([a], [b]) => b.localeCompare(a));

  const absences  = entries.filter(([, v]) => v === "absent");
  const lates     = entries.filter(([, v]) => v === "late");
  const presentDays = entries.filter(([, v]) => v === "present").length;
  return { absences, lates, presentDays, totalDays: entries.length };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function StudentProfile({ id }: { id: string }) {
  const { students, addGrade, profile, updateStudent, masterData } = useApp();
  const [activeTab, setActiveTab] = useState<"ai-diagnostico" | "grades" | "attendance" | "notes">("ai-diagnostico");
  const [selectedSubject, setSelectedSubject] = useState("TECNOLOGÍA");
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [newGrade, setNewGrade] = useState({
    title: "", score: "5.0",
    type: "activity" as "activity" | "participation" | "exam",
  });

  const student = students.find(s => s.id === id);

  // States for observations
  const [obsText, setObsText] = useState("");
  const [isSavingObs, setIsSavingObs] = useState(false);

  // Toast notification system
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  // States for full student editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    grado: "",
    curso: "",
    tipoDocumento: "T.I.",
    nroDocumento: "",
    fechaNacimiento: "",
    genero: "M" as "M" | "F",
    acudienteNombre: "",
    acudienteTelefono: ""
  });

  // Update local observation state and editForm when student changes
  useEffect(() => {
    if (student) {
      setObsText(student.observations || "");
      setEditForm({
        primerNombre: student.primerNombre || "",
        segundoNombre: student.segundoNombre || "",
        primerApellido: student.primerApellido || "",
        segundoApellido: student.segundoApellido || "",
        grado: student.grado || "",
        curso: student.curso || "",
        tipoDocumento: student.tipoDocumento || "T.I.",
        nroDocumento: student.nroDocumento || "",
        fechaNacimiento: student.fechaNacimiento || "",
        genero: (student.genero || "M") as "M" | "F",
        acudienteNombre: student.acudienteNombre || "",
        acudienteTelefono: student.acudienteTelefono || ""
      });
    }
  }, [id, student]);

  // ── Extract subjects dynamically from student grades and detailed structure ──
  const availableSubjects = useMemo(() => {
    if (!student) return [];
    
    const subjectsSet = new Set<string>();
    
    // 1. Gather from detailed grades
    if (student.detailedGrades) {
      Object.keys(student.detailedGrades).forEach(sub => {
        if (sub) subjectsSet.add(sub.toUpperCase());
      });
    }
    
    // 2. Gather from legacy grades titles (format "[MATEMÁTICAS] Actividad...")
    if (student.grades) {
      student.grades.forEach((g: any) => {
        const match = g.title?.match(/\[(.*?)\]/);
        if (match && match[1]) {
          subjectsSet.add(match[1].toUpperCase());
        }
      });
    }

    // 3. Fallback to default school master subjects
    if (subjectsSet.size === 0 && masterData.subjects) {
      masterData.subjects.forEach(s => subjectsSet.add(s.toUpperCase()));
    }

    return Array.from(subjectsSet).sort();
  }, [student, masterData.subjects]);

  // Adjust current selected subject if not present in the dynamic subject list
  useEffect(() => {
    if (availableSubjects.length > 0) {
      if (!availableSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableSubjects[0]);
      }
    }
  }, [availableSubjects, selectedSubject]);

  // ── Memoized Academic Calculation Engines ────────────────────────────────────
  const getPeriodDefinitive = useCallback((subject: string, periodId: string) => {
    if (!student) return null;
    const pid = periodId.toLowerCase();
    
    // 1. Detailed structure check
    if (student.detailedGrades?.[subject]?.[pid]) {
      const d = student.detailedGrades[subject][pid];
      const getAvg = (vals: (number | null)[]) => {
        const valid = vals.filter(v => v !== null) as number[];
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      };
      const sbAvg = getAvg(d.sb);
      const sbhAvg = getAvg(d.sbh);
      const srAvg = getAvg(d.sr);
      const cvAvg = getAvg(d.cv);
      const aut = d.aut;

      if (sbAvg === null && sbhAvg === null && srAvg === null && cvAvg === null && aut === null) {
        return null;
      }

      const final = (
        ((sbAvg ?? 0) * 0.3) +
        ((sbhAvg ?? 0) * 0.4) +
        ((srAvg ?? 0) * 0.2) +
        ((cvAvg ?? 0) * 0.05) +
        ((aut ?? 0) * 0.05)
      );
      return parseFloat(final.toFixed(2));
    }
    
    // 2. Legacy check
    if (student.grades) {
      const subjectGrades = student.grades.filter((g: any) => 
        g.periodId === pid && g.title?.toUpperCase().includes(`[${subject.toUpperCase()}]`)
      );
      if (subjectGrades.length === 0) return null;
      
      const validScores = subjectGrades.filter((g: any) => g.type !== 'participation').map((g: any) => g.score);
      const baseAvg = validScores.length > 0 ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length : 0;
      const bonus = subjectGrades.filter((g: any) => g.type === 'participation').reduce((a: number, b: any) => a + (b.score * 0.02), 0);
      return parseFloat(Math.min(5.0, baseAvg + bonus).toFixed(2));
    }

    return null;
  }, [student]);

  const getSubjectMetrics = useCallback((subject: string) => {
    if (!student) return { exams: 0, activities: 0, participation: 0, convivir: 0, autoeval: 0 };
    
    const activePid = (masterData.activePeriod || "p2").toLowerCase();
    
    let sb: (number | null)[] = Array(8).fill(null);
    let sbh: (number | null)[] = Array(8).fill(null);
    let sr: (number | null)[] = Array(5).fill(null);
    let cv: (number | null)[] = Array(3).fill(null);
    let aut: number | null = null;

    if (student.detailedGrades?.[subject]?.[activePid]) {
      const d = student.detailedGrades[subject][activePid];
      sb = d.sb || sb;
      sbh = d.sbh || sbh;
      sr = d.sr || sr;
      cv = d.cv || cv;
      aut = d.aut;
    }

    const getAvg = (vals: (number | null)[]) => {
      const valid = vals.filter(v => v !== null) as number[];
      return valid.length > 0 ? parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2)) : 0;
    };

    const sbAvg = getAvg(sb);
    const sbhAvg = getAvg(sbh);
    const srAvg = getAvg(sr);
    const cvAvg = getAvg(cv);
    
    // Legacy mapping fallback
    let legacyExamCount = 0, legacyExamSum = 0;
    let legacyActivityCount = 0, legacyActivitySum = 0;
    let legacyPartCount = 0, legacyPartSum = 0;

    if (student.grades) {
      const currentSubjectGrades = student.grades.filter((g: any) => 
        g.periodId === activePid && g.title?.toUpperCase().includes(`[${subject.toUpperCase()}]`)
      );
      currentSubjectGrades.forEach((g: any) => {
        if (g.type === "exam") {
          legacyExamCount++;
          legacyExamSum += g.score;
        } else if (g.type === "activity") {
          legacyActivityCount++;
          legacyActivitySum += g.score;
        } else if (g.type === "participation") {
          legacyPartCount++;
          legacyPartSum += g.score;
        }
      });
    }

    const finalSbAvg = sbAvg > 0 ? sbAvg : (legacyExamCount > 0 ? legacyExamSum / legacyExamCount : 0);
    const finalSbhAvg = sbhAvg > 0 ? sbhAvg : (legacyActivityCount > 0 ? legacyActivitySum / legacyActivityCount : 0);
    const finalSrAvg = srAvg > 0 ? srAvg : (legacyPartCount > 0 ? legacyPartSum / legacyPartCount : 0);
    
    return {
      exams: parseFloat(finalSbAvg.toFixed(1)),
      activities: parseFloat(finalSbhAvg.toFixed(1)),
      participation: parseFloat(finalSrAvg.toFixed(1)),
      convivir: cvAvg > 0 ? parseFloat(cvAvg.toFixed(1)) : 0,
      autoeval: aut !== null ? parseFloat(aut.toFixed(1)) : 0
    };
  }, [student, masterData.activePeriod]);

  const getAIPsychopedagogicalInsight = useCallback((
    metrics: { exams: number; activities: number; participation: number; convivir: number; autoeval: number },
    attendancePct: number | null,
    p1: number | null,
    p2: number | null,
    p3: number | null
  ) => {
    if (!student) return { alerts: [], suggestions: [], priority: "LOW", iconColor: "text-emerald-500", bgColor: "bg-emerald-50/50" };

    const activePid = (masterData.activePeriod || "p2").toUpperCase();
    const grades = [p1, p2, p3].filter(g => g !== null) as number[];
    const currentYearAvg = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;

    const alerts: string[] = [];
    const suggestions: string[] = [];
    let priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    let iconColor = "text-emerald-500";
    let bgColor = "bg-emerald-50/50 border-emerald-200";

    // 1. Attendance Check
    if (attendancePct !== null && attendancePct < 85) {
      priority = "CRITICAL";
      alerts.push(`Inasistencia Crítica de ${attendancePct}%: Alto riesgo de reprobación por deserción escolar.`);
      suggestions.push("Adaptar tiempos de entrega de guías y contactar de inmediato al acudiente vía telefónica.");
    } else if (attendancePct !== null && attendancePct < 90) {
      priority = "HIGH";
      alerts.push(`Asistencia regular del ${attendancePct}%: Se observa pérdida de continuidad en explicaciones.`);
      suggestions.push("Realizar nivelación rápida de bitácoras y verificar comprensión de las últimas actividades.");
    }

    // 2. Academic Pillars Dissonance
    if (metrics.exams >= 3.8 && metrics.activities < 3.0 && metrics.activities > 0) {
      if (priority === "LOW") priority = "MEDIUM";
      alerts.push("Brecha de Aplicación: Alto rendimiento en evaluaciones teóricas pero bajo progreso en talleres del aula (Saber-Hacer).");
      suggestions.push("Monitorear y guiar el trabajo en clase del estudiante para evitar retrasos y procrastinación.");
    } else if (metrics.activities >= 3.8 && metrics.exams < 3.0 && metrics.exams > 0) {
      if (priority === "LOW") priority = "MEDIUM";
      alerts.push("Ansiedad Evaluativa: Excelente ejecución en talleres prácticos cotidianos, pero bloqueos en exámenes escritos (Saber).");
      suggestions.push("Proporcionar estrategias de manejo de estrés o habilitar evaluaciones formativas de carácter oral/gráfico.");
    }

    if (metrics.participation < 3.0 && metrics.participation > 0) {
      if (priority === "LOW") priority = "MEDIUM";
      alerts.push("Retraimiento o Desconexión Afectiva (SER): Bajo puntaje en participación y motivación actitudinal.");
      suggestions.push("Vincular al alumno en dinámicas cooperativas asignándole roles de liderazgo grupal.");
    }

    // Overall Low performance check
    const currentPeriodGrade = getPeriodDefinitive(selectedSubject, masterData.activePeriod || "p2");
    if (currentPeriodGrade !== null && currentPeriodGrade < 3.0) {
      priority = "HIGH";
      alerts.push(`Puntaje de Periodo Bajo: La nota proyectada (${currentPeriodGrade.toFixed(1)}) no alcanza la mínima de aprobación.`);
      suggestions.push("Activar Plan de Apoyo y Nivelación Pedagógica institucional antes del cierre de actas.");
    }

    // Trend check
    if (p1 !== null && p2 !== null && p2 < p1 - 0.5) {
      if (priority !== "CRITICAL") priority = "HIGH";
      alerts.push("Curva de Rendimiento Descendente: Descenso marcado del rendimiento del Periodo 1 al Periodo 2.");
      suggestions.push("Tutoría psicopedagógica para indagar sobre factores extraescolares o cambios socioemocionales.");
    }

    if (alerts.length === 0) {
      if (currentYearAvg !== null && currentYearAvg >= 4.5) {
        priority = "LOW";
        iconColor = "text-indigo-500";
        bgColor = "bg-indigo-50/50 border-indigo-200";
        alerts.push("Trayectoria Sobresaliente: Excelente rendimiento general con promedio superior.");
        suggestions.push("Retar con proyectos avanzados, mentoría de pares y postular para incentivo escolar.");
      } else {
        priority = "LOW";
        alerts.push("Progreso Académico Estable: Trayectoria regular alineada a los estándares pedagógicos esperados.");
        suggestions.push("Mantener el seguimiento continuo en el aula y reforzar las buenas prácticas.");
      }
    }

    if (priority === "CRITICAL" || priority === "HIGH") {
      iconColor = "text-rose-500";
      bgColor = "bg-rose-50/50 border-rose-200";
    } else if (priority === "MEDIUM") {
      iconColor = "text-amber-500";
      bgColor = "bg-amber-50/50 border-amber-200";
    }

    return { alerts, suggestions, priority, iconColor, bgColor };
  }, [student, selectedSubject, getPeriodDefinitive, masterData.activePeriod]);

  // ── Governance: determine what role can edit ──────────────────────────────
  const canEdit =
    profile.isSuperAdmin ||
    profile.role === "RECTOR" ||
    profile.role === "COORDINADOR" ||
    profile.role === "DOCENTE";

  if (!student) {
    return (
      <div className="bg-white border border-outline-variant rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center gap-4 shadow-xl">
        <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center">
          <User size={40} className="text-on-surface-variant opacity-30" />
        </div>
        <div>
          <p className="font-black uppercase tracking-widest text-sm text-on-surface opacity-40">Selecciona un estudiante</p>
          <p className="text-[10px] text-on-surface-variant opacity-30 font-bold mt-1">para ver su perfil completo</p>
        </div>
      </div>
    );
  }

  const perf = perfConfig(student.avgGrade || 0);
  const avgPct = Math.min(((student.avgGrade || 0) / 5) * 100, 100);
  const initials = `${student.primerApellido?.[0] ?? ""}${student.primerNombre?.[0] ?? ""}`;
  const fullName = `${student.primerApellido} ${student.segundoApellido} ${student.primerNombre} ${student.segundoNombre}`.trim();

  const attendance = parseAttendanceRecord(student.attendanceRecord);

  const attendancePct = attendance.totalDays > 0
    ? Math.round((attendance.presentDays / attendance.totalDays) * 100)
    : null;

  const tabs = [
    { key: "ai-diagnostico", label: "Diagnóstico IA", icon: <Sparkles size={13} /> },
    { key: "grades",     label: "Notas",       icon: <TrendingUp size={13} /> },
    { key: "attendance", label: "Asistencia",  icon: <Activity size={13} /> },
    { key: "notes",      label: "Notas doc.",  icon: <ClipboardList size={13} /> },
  ] as const;

  const handleSaveObservation = async () => {
    setIsSavingObs(true);
    try {
      await updateStudent(student.id, { observations: obsText });
      showToast("Observación guardada exitosamente");
    } catch (err) {
      console.error(err);
      showToast("Error al guardar la observación", "error");
    } finally {
      setIsSavingObs(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!student) return;
    setIsSavingEdit(true);
    try {
      const updatedFields = {
        primerNombre: editForm.primerNombre.trim(),
        segundoNombre: editForm.segundoNombre.trim(),
        primerApellido: editForm.primerApellido.trim(),
        segundoApellido: editForm.segundoApellido.trim(),
        grado: normalizeGrade(editForm.grado),
        curso: editForm.curso.trim().toUpperCase(),
        tipoDocumento: editForm.tipoDocumento,
        nroDocumento: editForm.nroDocumento.trim(),
        fechaNacimiento: editForm.fechaNacimiento,
        genero: editForm.genero,
        acudienteNombre: editForm.acudienteNombre.trim(),
        acudienteTelefono: editForm.acudienteTelefono.trim(),
        audit: {
          createdBy: student.audit?.createdBy || "SISTEMA",
          createdAt: student.audit?.createdAt || new Date().toISOString(),
          updatedBy: profile.name || "SISTEMA",
          updatedAt: new Date().toISOString()
        }
      };
      
      await updateStudent(student.id, updatedFields);
      showToast("¡Datos del estudiante actualizados con éxito!");
      setShowEditModal(false);
    } catch (err) {
      console.error("Error al actualizar los datos del estudiante:", err);
      showToast("Ocurrió un error al guardar los cambios en la base de datos.", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="bg-white border border-outline-variant rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 relative">

      {/* Toast notification */}
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300 ${
          toast.type === "success" ? "bg-emerald-500" : "bg-rose-500"
        }`}>
          {toast.type === "success" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className={`relative bg-gradient-to-br ${perf.gradient} p-8 text-white overflow-hidden`}>
        {/* BG decoration */}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10 flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-3xl bg-white/20 border-4 border-white/30 flex items-center justify-center text-3xl font-black shadow-2xl shrink-0 backdrop-blur-sm">
            {initials}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h2 className="text-lg font-black uppercase leading-tight tracking-tight line-clamp-2">{fullName}</h2>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all hover:scale-105 active:scale-95 shrink-0 border border-white/15"
                  title="Editar Datos del Estudiante"
                >
                  <Edit size={14} className="text-white" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/20">
                GRADO {normalizeGrade(student.grado)}
              </span>
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/20">
                CURSO {student.curso}
              </span>
              <span className={`px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-[9px] font-black rounded-lg uppercase tracking-widest border border-white/20`}>
                {perf.label}
              </span>
            </div>
            {/* Average bar */}
            <div className="mt-4 space-y-1">
              <div className="flex justify-between text-[9px] font-black opacity-80">
                <span>Promedio General</span>
                <span>{(student.avgGrade || 0).toFixed(1)} / 5.0</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/80 rounded-full transition-all duration-1000"
                  style={{ width: `${avgPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Meta bar ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant bg-surface-container-lowest">
        {[
          { icon: <Calendar size={14} className="text-primary" />, label: "Nacimiento", value: formatDate(student.fechaNacimiento) },
          { icon: <Hash size={14} className="text-secondary" />,   label: "Género",     value: student.genero === "F" ? "Femenino" : "Masculino" },
          { icon: <MapPin size={14} className="text-tertiary" />,  label: "Doc.",       value: `${student.tipoDocumento} ${student.nroDocumento}` },
        ].map(item => (
          <div key={item.label} className="p-3 flex flex-col items-center gap-0.5 text-center">
            {item.icon}
            <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-tight opacity-50 mt-0.5">{item.label}</span>
            <span className="text-[9px] font-bold uppercase leading-tight line-clamp-1">{item.value}</span>
          </div>
        ))}
      </div>

      {/* ── Acudiente (si existe) ─────────────────────────────────────────────── */}
      {(student.acudienteNombre || student.acudienteTelefono) && (
        <div className="flex items-center justify-between px-6 py-3 bg-primary/5 border-b border-primary/10">
          <div>
            <p className="text-[8px] font-black text-primary uppercase tracking-widest">Acudiente</p>
            <p className="text-[10px] font-bold text-on-surface uppercase">{student.acudienteNombre || "No registrado"}</p>
          </div>
          {student.acudienteTelefono && (
            <a
              href={`tel:${student.acudienteTelefono}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-md shadow-primary/30"
            >
              <Phone size={12} /> {student.acudienteTelefono}
            </a>
          )}
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex border-b border-outline-variant bg-white">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3.5 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab.key ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[420px]">

        {/* IA DIAGNOSTICO TAB */}
        {activeTab === "ai-diagnostico" && (() => {
          const metrics = getSubjectMetrics(selectedSubject);
          const p1 = getPeriodDefinitive(selectedSubject, "p1");
          const p2 = getPeriodDefinitive(selectedSubject, "p2");
          const p3 = getPeriodDefinitive(selectedSubject, "p3");
          const aiInsight = getAIPsychopedagogicalInsight(metrics, attendancePct, p1, p2, p3);

          const periodGrades = [p1, p2, p3].filter(g => g !== null) as number[];
          const currentYearAverage = periodGrades.length > 0 
            ? periodGrades.reduce((a, b) => a + b, 0) / periodGrades.length 
            : 0;

          // Projection calculation
          const sumPeriods = (p1 !== null ? p1 : 0) + (p2 !== null ? p2 : 0) + (p3 !== null ? p3 : 0);
          const completedPeriodsCount = [p1, p2, p3].filter(g => g !== null).length;
          
          let targetMessage = "";
          let targetStatus = "stable";
          if (completedPeriodsCount < 3) {
            const missingToPass = 9.0 - sumPeriods;
            const remainingPeriodsCount = 3 - completedPeriodsCount;
            const requiredGrade = missingToPass / remainingPeriodsCount;

            if (requiredGrade <= 0) {
              targetMessage = "¡Aprobado asegurado! Ya cuenta con los puntos acumulados necesarios.";
              targetStatus = "success";
            } else if (requiredGrade > 5.0) {
              targetMessage = `Requiere un promedio inalcanzable de ${requiredGrade.toFixed(1)} para aprobar el año escolar.`;
              targetStatus = "critical";
            } else {
              targetMessage = `Requiere obtener una nota promedio de ${requiredGrade.toFixed(1)} en el/los periodo(s) restante(s) para aprobar el año.`;
              targetStatus = "warning";
            }
          } else {
            targetMessage = currentYearAverage >= 3.0 
              ? `Año escolar aprobado con un promedio final de ${currentYearAverage.toFixed(1)}.` 
              : `Año escolar reprobado con un promedio final de ${currentYearAverage.toFixed(1)}.`;
            targetStatus = currentYearAverage >= 3.0 ? "success" : "critical";
          }

          // SVG Line coordinates
          const p1Score = p1 !== null ? p1 : 0;
          const p2Score = p2 !== null ? p2 : (p1 !== null ? p1 : 0);
          const p3ScoreForPlot = p3 !== null ? p3 : (completedPeriodsCount > 0 ? currentYearAverage : 3.5);
          
          const getY = (score: number) => 100 - ((score / 5) * 80);
          const y1 = getY(p1Score);
          const y2 = getY(p2Score);
          const y3 = getY(p3ScoreForPlot);

          const pathD = `M 40 ${y1} C 100 ${y1}, 120 ${y2}, 160 ${y2} C 200 ${y2}, 220 ${y3}, 280 ${y3}`;
          const areaD = `${pathD} L 280 110 L 40 110 Z`;

          return (
            <div className="space-y-6">
              
              {/* Dynamic Subject Selector */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">Asignatura:</span>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="bg-transparent border-none font-black text-[11px] uppercase text-primary focus:ring-0 cursor-pointer"
                >
                  {availableSubjects.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Advanced SVG Projection Chart */}
              <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      <TrendingUp size={12} /> Curva Predictiva de Periodos
                    </h5>
                    <p className="text-[8px] text-slate-400 font-medium">Trayectoria académica y proyección del año</p>
                  </div>
                  <span className="px-2 py-0.5 bg-white/10 rounded-md text-[8px] font-black uppercase tracking-widest text-white/80">
                    Año: {new Date().getFullYear()}
                  </span>
                </div>

                <div className="relative h-28 w-full flex justify-center items-center">
                  <svg className="w-full h-full" viewBox="0 0 320 120">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="40" y1="20" x2="280" y2="20" stroke="#334155" strokeWidth="1" strokeDasharray="2" />
                    <line x1="40" y1="52" x2="280" y2="52" stroke="#e11d48" strokeWidth="1" strokeDasharray="3" /> {/* 3.0 Passing threshold */}
                    <line x1="40" y1="100" x2="280" y2="100" stroke="#334155" strokeWidth="1" />

                    <text x="35" y="55" fill="#e11d48" fontSize="6" fontWeight="bold" textAnchor="end">MIN 3.0</text>
                    <text x="35" y="24" fill="#64748b" fontSize="6" fontWeight="bold" textAnchor="end">MAX 5.0</text>

                    {/* Area under curve */}
                    <path d={areaD} fill="url(#chartGradient)" />

                    {/* Bezier line */}
                    <path d={pathD} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />

                    {/* Period points */}
                    {/* Period 1 */}
                    <circle cx="40" cy={y1} r="5" fill={p1 !== null ? "#6366f1" : "#475569"} stroke="#1e293b" strokeWidth="2" />
                    <text x="40" y={y1 - 10} fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">{p1 !== null ? p1.toFixed(1) : "—"}</text>
                    <text x="40" y="115" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">P1</text>

                    {/* Period 2 */}
                    <circle cx="160" cy={y2} r="5" fill={p2 !== null ? "#6366f1" : "#475569"} stroke="#1e293b" strokeWidth="2" />
                    <text x="160" y={y2 - 10} fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">{p2 !== null ? p2.toFixed(1) : "—"}</text>
                    <text x="160" y="115" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">P2</text>

                    {/* Period 3 (Proyectado/Real) */}
                    <circle cx="280" cy={y3} r="5" fill={p3 !== null ? "#10b981" : "#f59e0b"} stroke="#1e293b" strokeWidth="2" strokeDasharray={p3 === null ? "2" : "0"} />
                    <text x="280" y={y3 - 10} fill={p3 !== null ? "#10b981" : "#f59e0b"} fontSize="8" fontWeight="black" textAnchor="middle">
                      {p3 !== null ? p3.toFixed(1) : `${p3ScoreForPlot.toFixed(1)}*`}
                    </text>
                    <text x="280" y="115" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">
                      {p3 !== null ? "P3" : "P3 (Proy)"}
                    </text>
                  </svg>
                </div>
              </div>

              {/* Proyeccion Anual & Sugerencia Target */}
              <div className={`p-5 rounded-3xl border ${
                targetStatus === "success" ? "bg-emerald-50 border-emerald-200" :
                targetStatus === "critical" ? "bg-rose-50 border-rose-200" :
                "bg-amber-50 border-amber-200"
              } flex gap-4 items-start shadow-sm`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  targetStatus === "success" ? "bg-emerald-100 text-emerald-700" :
                  targetStatus === "critical" ? "bg-rose-100 text-rose-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  <Target size={20} />
                </div>
                <div className="space-y-1">
                  <h6 className={`text-[10px] font-black uppercase tracking-wider ${
                    targetStatus === "success" ? "text-emerald-800" :
                    targetStatus === "critical" ? "text-rose-800" :
                    "text-amber-800"
                  }`}>
                    Proyección Definitiva Anual: {currentYearAverage > 0 ? currentYearAverage.toFixed(2) : "0.00"}
                  </h6>
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                    {targetMessage}
                  </p>
                </div>
              </div>

              {/* Metrics Grid (Pillars) */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b pb-2">Rendimiento por Criterio</h4>
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Exams */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex flex-col justify-between h-20">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase text-purple-600 tracking-wider">Exámenes (30%)</span>
                      <span className="text-sm font-black text-slate-900">{metrics.exams.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${(metrics.exams / 5) * 100}%` }} />
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex flex-col justify-between h-20">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase text-blue-600 tracking-wider">Talleres (40%)</span>
                      <span className="text-sm font-black text-slate-900">{metrics.activities.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(metrics.activities / 5) * 100}%` }} />
                    </div>
                  </div>

                  {/* Participation */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex flex-col justify-between h-20">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase text-amber-600 tracking-wider">Participación (20%)</span>
                      <span className="text-sm font-black text-slate-900">{metrics.participation.toFixed(1)}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${(metrics.participation / 5) * 100}%` }} />
                    </div>
                  </div>

                  {/* Attendance */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 flex flex-col justify-between h-20">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider">Asistencia</span>
                      <span className="text-sm font-black text-slate-900">{attendancePct !== null ? `${attendancePct}%` : "100%"}</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${attendancePct !== null ? attendancePct : 100}%` }} />
                    </div>
                  </div>

                </div>
              </div>

              {/* Psychopedagogical Suggestion Box */}
              <div className={`p-5 rounded-3xl border ${aiInsight.bgColor} space-y-3 relative overflow-hidden shadow-sm`}>
                <div className="flex items-center gap-2 border-b border-current/10 pb-2">
                  <Brain size={16} className={aiInsight.iconColor} />
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                    Diagnóstico Psicopedagógico IA
                  </h5>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-1">Hallazgos Clave</span>
                    <ul className="list-disc list-inside text-[9px] font-bold text-slate-700 space-y-1.5">
                      {aiInsight.alerts.map((alt, i) => (
                        <li key={i} className="leading-tight">{alt}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 block mb-1">Estrategias de Apoyo Sugeridas</span>
                    <ul className="list-disc list-inside text-[9px] font-bold text-slate-800 space-y-1.5">
                      {aiInsight.suggestions.map((sug, i) => (
                        <li key={i} className="leading-tight">{sug}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

        {/* NOTAS GENERALES TAB */}
        {activeTab === "grades" && (
          <div className="space-y-4">
            {/* KPI chips */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/50">
                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60 mb-1">Promedio</p>
                <p className="text-3xl font-black text-on-surface leading-none">
                  {(student.avgGrade || 0).toFixed(1)}<span className="text-xs font-bold opacity-40 ml-1">/ 5.0</span>
                </p>
              </div>
              <div className={`rounded-2xl p-4 border ${perf.badge} border-current/20`}>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Rango</p>
                <p className="text-base font-black uppercase leading-tight">{perf.label}</p>
                <div className="h-1.5 bg-current/20 rounded-full mt-2 overflow-hidden">
                  <div className={`h-full ${perf.barColor} rounded-full`} style={{ width: `${avgPct}%` }} />
                </div>
              </div>
            </div>

            {/* Grade list */}
            {student.grades && student.grades.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-2">
                  Historial de Calificaciones ({student.grades.length})
                </h4>
                {[...student.grades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(grade => {
                  const cfg = gradeTypeConfig(grade.type);
                  const scoreColor = grade.score >= 4.0 ? "text-emerald-600" : grade.score >= 3.0 ? "text-amber-600" : "text-red-600";
                  return (
                    <div key={grade.id} className="flex items-center gap-3 bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/50 hover:border-outline-variant transition-colors">
                      <div className={`w-7 h-7 rounded-lg ${cfg.color} flex items-center justify-center shrink-0`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase text-on-surface truncate">{grade.title}</p>
                        <p className="text-[8px] font-bold uppercase text-on-surface-variant opacity-50">
                          {formatDate(grade.date)} · {cfg.label}
                        </p>
                      </div>
                      <span className={`text-base font-black ${scoreColor}`}>{grade.score.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center gap-2 text-on-surface-variant opacity-30">
                <BookOpen size={28} />
                <p className="text-[10px] font-black uppercase tracking-widest">Sin calificaciones registradas</p>
              </div>
            )}

            {/* Add grade */}
            {canEdit && (
              <button
                onClick={() => setShowAddGrade(true)}
                className="w-full py-3.5 bg-surface-container-low border-2 border-dashed border-outline-variant rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/5 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Agregar Calificación
              </button>
            )}
          </div>
        )}

        {/* ASISTENCIA */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Asistencia", value: attendancePct !== null ? `${attendancePct}%` : (student.attendance || "—"), color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Ausencias",  value: attendance.absences.length.toString(), color: "text-red-600",     bg: "bg-red-50"     },
                { label: "Tardanzas",  value: attendance.lates.length.toString(),    color: "text-amber-600",   bg: "bg-amber-50"   },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-2xl p-3 text-center border border-current/10`}>
                  <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                  <p className="text-[8px] font-black uppercase opacity-60">{item.label}</p>
                </div>
              ))}
            </div>

            {/* Real attendance record */}
            {attendance.absences.length > 0 || attendance.lates.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest border-b border-outline-variant pb-2">
                  Incidencias recientes (60 días)
                </h4>
                {[...attendance.absences.map(([d]) => ({ date: d, type: "absent" })), ...attendance.lates.map(([d]) => ({ date: d, type: "late" }))]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 10)
                  .map(inc => (
                    <div key={inc.date} className="flex items-center justify-between px-4 py-2.5 bg-surface-container-lowest rounded-xl border border-outline-variant/50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={13} className={inc.type === "absent" ? "text-red-500" : "text-amber-500"} />
                        <span className="text-[10px] font-bold uppercase text-on-surface">
                          {new Date(inc.date + "T12:00:00").toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase ${inc.type === "absent" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                        {inc.type === "absent" ? "Ausencia" : "Tardanza"}
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center gap-2 text-emerald-600 opacity-50">
                <GraduationCap size={28} />
                <p className="text-[10px] font-black uppercase tracking-widest">Asistencia perfecta registrada</p>
              </div>
            )}

            {/* Link to official report */}
            <Link
              href="/reportes/asistencia"
              className="w-full py-3 bg-surface-container-low border border-outline-variant rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary/5 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              Ver Reporte Oficial de Asistencia <ArrowUpRight size={13} />
            </Link>
          </div>
        )}

        {/* OBSERVACIONES */}
        {activeTab === "notes" && (
          <div className="space-y-4">
            <h4 className="text-[9px] font-black text-on-surface uppercase tracking-[0.2em] border-l-4 border-primary pl-3">
              Observaciones del Docente
            </h4>
            <textarea
              className="w-full p-5 bg-surface-container-low border border-outline-variant rounded-2xl text-xs font-bold uppercase tracking-tight outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none h-36 transition-all"
              placeholder="Escribe aquí novedades sobre el comportamiento o rendimiento del estudiante…"
              value={obsText}
              onChange={e => setObsText(e.target.value)}
            />
            {canEdit && (
              <button
                onClick={handleSaveObservation}
                disabled={isSavingObs}
                className="w-full py-4 bg-on-surface text-white rounded-2xl font-black text-[9px] uppercase tracking-[0.3em] shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSavingObs ? "Guardando..." : "Guardar Observación"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Footer sync indicator ─────────────────────────────────────────────── */}
      <div className="px-6 py-3 bg-surface-container-lowest border-t border-outline-variant shrink-0">
        <p className="text-center text-[9px] text-secondary font-black flex items-center justify-center gap-1.5 uppercase tracking-[0.25em]">
          <RefreshCw size={11} className="animate-spin" />
          Sincronización en tiempo real
        </p>
      </div>

      {/* ── Add grade modal ───────────────────────────────────────────────────── */}
      {showAddGrade && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowAddGrade(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col z-10 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6 text-center">Registrar Calificación</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Tipo de Evaluación</label>
                <select
                  value={newGrade.type}
                  onChange={e => setNewGrade({ ...newGrade, type: e.target.value as typeof newGrade.type })}
                  className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="activity">Actividad / Taller</option>
                  <option value="exam">Evaluación / Examen</option>
                  <option value="participation">Participación Extra</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Título / Descripción</label>
                <input
                  type="text"
                  value={newGrade.title}
                  onChange={e => setNewGrade({ ...newGrade, title: e.target.value })}
                  className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej. Taller N° 1"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Calificación (0.0 – 5.0)</label>
                <input
                  type="number"
                  step="0.1" min="0" max="5"
                  value={newGrade.score}
                  onChange={e => setNewGrade({ ...newGrade, score: e.target.value })}
                  className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant text-2xl font-black text-center outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddGrade(false)}
                className="flex-1 py-3 rounded-xl bg-surface-container text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  addGrade(student.id, {
                    title: newGrade.title || (newGrade.type === "participation" ? "Participación" : newGrade.type === "exam" ? "Evaluación" : "Actividad"),
                    score: parseFloat(newGrade.score) || 0,
                    type: newGrade.type,
                    date: new Date().toISOString(),
                  });
                  setShowAddGrade(false);
                  setNewGrade({ title: "", score: "5.0", type: "activity" });
                }}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/30"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Student Modal ───────────────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 border border-outline-variant/30 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-6 shrink-0">
              <div>
                <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase italic">Editar Estudiante</h3>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Actualización de Registro y Ficha Académica</p>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="w-10 h-10 flex items-center justify-center bg-surface-container hover:bg-error/10 hover:text-error rounded-full transition-colors"
              >
                <X size={20}/>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="space-y-6 overflow-y-auto pr-2 py-1 flex-1">
              
              {/* Names Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-l-4 border-primary pl-2">Nombres y Apellidos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Primer Nombre</label>
                    <input 
                      value={editForm.primerNombre}
                      onChange={(e) => setEditForm({...editForm, primerNombre: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs uppercase" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Segundo Nombre</label>
                    <input 
                      value={editForm.segundoNombre}
                      onChange={(e) => setEditForm({...editForm, segundoNombre: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs uppercase" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Primer Apellido</label>
                    <input 
                      value={editForm.primerApellido}
                      onChange={(e) => setEditForm({...editForm, primerApellido: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs uppercase" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Segundo Apellido</label>
                    <input 
                      value={editForm.segundoApellido}
                      onChange={(e) => setEditForm({...editForm, segundoApellido: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs uppercase" 
                    />
                  </div>
                </div>
              </div>

              {/* Academic Enrollment Section */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-l-4 border-primary pl-2">Información Académica</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Grado</label>
                    <select 
                      value={editForm.grado}
                      onChange={(e) => setEditForm({...editForm, grado: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs appearance-none uppercase"
                    >
                      {masterData.grades.map(g => <option key={g} value={g}>GRADO {g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Curso / Grupo</label>
                    <select 
                      value={editForm.curso}
                      onChange={(e) => setEditForm({...editForm, curso: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs appearance-none uppercase"
                    >
                      {masterData.courses.map(c => <option key={c} value={c}>GRUPO {c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Identification & Personal Details */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-l-4 border-primary pl-2">Datos de Identificación y Ficha</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1 col-span-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Tipo Doc.</label>
                    <select 
                      value={editForm.tipoDocumento}
                      onChange={(e) => setEditForm({...editForm, tipoDocumento: e.target.value})}
                      className="w-full h-12 px-3 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs appearance-none uppercase"
                    >
                      <option value="R.C.">R.C.</option>
                      <option value="T.I.">T.I.</option>
                      <option value="C.C.">C.C.</option>
                      <option value="C.E.">C.E.</option>
                      <option value="P.E.P.">P.E.P.</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Número de Documento</label>
                    <input 
                      value={editForm.nroDocumento}
                      onChange={(e) => setEditForm({...editForm, nroDocumento: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                    <input 
                      type="date"
                      value={editForm.fechaNacimiento}
                      onChange={(e) => setEditForm({...editForm, fechaNacimiento: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Género</label>
                    <select 
                      value={editForm.genero}
                      onChange={(e) => setEditForm({...editForm, genero: e.target.value as "M" | "F"})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs appearance-none uppercase"
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Guardian Section */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] border-l-4 border-primary pl-2">Información del Acudiente</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nombre del Acudiente</label>
                    <input 
                      value={editForm.acudienteNombre}
                      onChange={(e) => setEditForm({...editForm, acudienteNombre: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs uppercase" 
                      placeholder="PADRE, MADRE O TUTOR"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Teléfono del Acudiente</label>
                    <input 
                      value={editForm.acudienteTelefono}
                      onChange={(e) => setEditForm({...editForm, acudienteTelefono: e.target.value})}
                      className="w-full h-12 px-4 rounded-xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs" 
                      placeholder="TELÉFONO DE CONTACTO"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-4 border-t border-outline-variant/30 pt-6 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-4 rounded-2xl bg-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSavingEdit || !editForm.primerNombre || !editForm.primerApellido || !editForm.grado || !editForm.curso}
                className="flex-1 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
              >
                {isSavingEdit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Guardando Cambios...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
