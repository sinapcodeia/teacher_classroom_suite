"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, Award, AlertTriangle, ShieldCheck, TrendingUp, 
  MessageSquare, FileText, CheckCircle2, ChevronRight, Download, 
  Search, Filter, Sparkles, Phone, AlertCircle, ArrowUpRight,
  Layers, HeartHandshake, Printer, HelpCircle
} from "lucide-react";
import { Student, useApp } from "@/context/AppContext";
import { normalizeGrade } from "@/lib/constants";
import { exportToCSV } from "@/lib/reports";
import GuardianModal from "@/components/students/GuardianModal";
import StudentStatusModal from "@/components/students/StudentStatusModal";
import { Mail, ShieldAlert } from "lucide-react";
import { Edit3 } from "lucide-react";
import Link from "next/link";

interface DirectorGrupoCockpitProps {
  selectedGrado: string;
  selectedCurso: string;
  onSelectStudent?: (studentId: string) => void;
  onPrintActa?: (student: Student) => void;
}

export default function DirectorGrupoCockpit({
  selectedGrado,
  selectedCurso,
  onSelectStudent,
  onPrintActa
}: DirectorGrupoCockpitProps) {
  const { students, subjects, masterData, profile } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState<"p1" | "p2" | "p3">(
    (masterData.activePeriod as "p1" | "p2" | "p3") || "p2"
  );
  const [filterRisk, setFilterRisk] = useState<"all" | "safe" | "warning" | "danger">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"heatmap" | "crm">("heatmap");
  const [selectedGuardianStudent, setSelectedGuardianStudent] = useState<Student | null>(null);
  const [selectedStatusStudent, setSelectedStatusStudent] = useState<Student | null>(null);

  // Filtrar estudiantes pertenecientes al grado y curso seleccionado
  const groupStudents = useMemo(() => {
    return students.filter(s => {
      if (s.isActive === false) return false;
      const gMatch = selectedGrado === "TODOS" || normalizeGrade(s.grado) === normalizeGrade(selectedGrado);
      const cMatch = selectedCurso === "TODOS" || (s.curso || "").toString().trim() === selectedCurso.trim();
      return gMatch && cMatch;
    }).sort((a, b) => {
      const nameA = `${a.primerApellido || ""} ${a.segundoApellido || ""} ${a.primerNombre || ""}`.trim();
      const nameB = `${b.primerApellido || ""} ${b.segundoApellido || ""} ${b.primerNombre || ""}`.trim();
      return nameA.localeCompare(nameB);
    });
  }, [students, selectedGrado, selectedCurso]);

  // Obtener lista de materias activas evaluadas
  const activeSubjects = useMemo(() => {
    return subjects.filter(s => s.name && s.name.trim() !== "");
  }, [subjects]);

  // Helper para calcular la nota definitiva de una materia en el periodo seleccionado
  const getStudentSubjectScore = (student: Student, subjectName: string) => {
    const detailed = student.detailedGrades?.[subjectName]?.[selectedPeriod];
    if (detailed) {
      const getAvg = (arr?: (number | null)[]) => {
        if (!arr || arr.length === 0) return null;
        const valid = arr.filter(v => typeof v === 'number') as number[];
        return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
      };

      const sbAvg = getAvg(detailed.sb);
      const sbhAvg = getAvg(detailed.sbh);
      const srAvg = getAvg(detailed.sr);
      const cvAvg = getAvg(detailed.cv);
      const aut = detailed.aut;

      if (sbAvg === null && sbhAvg === null && srAvg === null && cvAvg === null && aut === null) {
        return null; // En curso / sin calificar
      }

      let finalScore = (
        ((sbAvg ?? 0) * 0.30) +
        ((sbhAvg ?? 0) * 0.40) +
        ((srAvg ?? 0) * 0.20) +
        ((cvAvg ?? 0) * 0.05) +
        ((aut ?? 0) * 0.05)
      );

      // Si tiene recuperación aprobatoria
      if (detailed.rec && detailed.rec >= 3.0 && finalScore < 3.0) {
        finalScore = Math.max(finalScore, detailed.rec);
      }

      return parseFloat(finalScore.toFixed(1));
    }

    // Fallback legacy
    if (student.grades) {
      const gList = student.grades.filter(g => 
        g.periodId === selectedPeriod && 
        g.title?.toUpperCase().includes(`[${subjectName.toUpperCase()}]`) &&
        g.type !== 'participation'
      );
      if (gList.length === 0) return null;
      const avg = gList.reduce((a, b) => a + b.score, 0) / gList.length;
      return parseFloat(avg.toFixed(1));
    }

    return null;
  };

  // Diagnóstico individual de salud académica
  const studentDiagnostics = useMemo(() => {
    return groupStudents.map(student => {
      const subjectScores: Record<string, number | null> = {};
      let totalSum = 0;
      let ratedCount = 0;
      let failingCount = 0;

      activeSubjects.forEach(sub => {
        const score = getStudentSubjectScore(student, sub.name);
        subjectScores[sub.name] = score;
        if (score !== null) {
          totalSum += score;
          ratedCount++;
          if (score < 3.0) failingCount++;
        }
      });

      const average = ratedCount > 0 ? parseFloat((totalSum / ratedCount).toFixed(1)) : null;
      const status: "safe" | "warning" | "danger" = 
        failingCount >= 3 ? "danger" : (failingCount >= 1 ? "warning" : "safe");

      const observadorCount = student.behavioralRecords?.length || 0;
      const felicitaciones = student.behavioralRecords?.filter(b => b.type === "POSITIVA").length || 0;
      const faltas = student.behavioralRecords?.filter(b => b.type !== "POSITIVA").length || 0;

      return {
        student,
        subjectScores,
        average,
        ratedCount,
        failingCount,
        status,
        observadorCount,
        felicitaciones,
        faltas
      };
    });
  }, [groupStudents, activeSubjects, selectedPeriod]);

  // KPIs Grupales
  const kpis = useMemo(() => {
    const total = studentDiagnostics.length;
    if (total === 0) return { promotionRate: 0, groupAverage: 0, dangerCount: 0, warningCount: 0, safeCount: 0, totalFelicitaciones: 0, totalFaltas: 0 };

    const safeCount = studentDiagnostics.filter(d => d.status === "safe").length;
    const warningCount = studentDiagnostics.filter(d => d.status === "warning").length;
    const dangerCount = studentDiagnostics.filter(d => d.status === "danger").length;

    const promotionRate = Math.round((safeCount / total) * 100);

    const validAverages = studentDiagnostics.filter(d => d.average !== null).map(d => d.average as number);
    const groupAverage = validAverages.length > 0 ? parseFloat((validAverages.reduce((a, b) => a + b, 0) / validAverages.length).toFixed(2)) : 0;

    const totalFelicitaciones = studentDiagnostics.reduce((acc, d) => acc + d.felicitaciones, 0);
    const totalFaltas = studentDiagnostics.reduce((acc, d) => acc + d.faltas, 0);

    return {
      promotionRate,
      groupAverage,
      dangerCount,
      warningCount,
      safeCount,
      totalFelicitaciones,
      totalFaltas
    };
  }, [studentDiagnostics]);

  // Filtrado de diagnósticos por búsqueda y riesgo
  const filteredDiagnostics = useMemo(() => {
    return studentDiagnostics.filter(d => {
      if (filterRisk !== "all" && d.status !== filterRisk) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${d.student.primerApellido || ""} ${d.student.segundoApellido || ""} ${d.student.primerNombre || ""}`.toLowerCase();
        return fullName.includes(q) || (d.student.nroDocumento && d.student.nroDocumento.includes(q));
      }
      return true;
    });
  }, [studentDiagnostics, filterRisk, searchQuery]);

  // Exportar Sábana del Salón a CSV
  const handleExportSabanaGrupo = () => {
    const data = studentDiagnostics.map(d => {
      const row: Record<string, string | number> = {
        "Documento": d.student.nroDocumento || "",
        "Estudiante": `${d.student.primerApellido || ""} ${d.student.segundoApellido || ""}, ${d.student.primerNombre || ""}`,
        "Grado": normalizeGrade(d.student.grado),
        "Curso": d.student.curso || "",
        "Periodo": selectedPeriod.toUpperCase(),
        "Promedio": d.average !== null ? d.average : "En Curso",
        "Materias Perdidas": d.failingCount,
        "Estado": d.status === "safe" ? "Aprobando" : (d.status === "warning" ? "En Observación" : "Riesgo Crítico")
      };

      activeSubjects.forEach(s => {
        const sc = d.subjectScores[s.name];
        row[s.name] = sc !== null ? sc : "—";
      });

      return row;
    });

    exportToCSV(data, `Sabana_DireccionGrupo_${selectedGrado}_${selectedCurso}_${selectedPeriod.toUpperCase()}`);
  };

  // Enviar WhatsApp al Acudiente
  const handleSendWhatsApp = (student: Student, failingCount: number, avg: number | null) => {
    const phone = student.acudienteTelefono || "";
    if (!phone) {
      alert(`El estudiante ${student.primerNombre} no tiene número de acudiente registrado.`);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.startsWith("57") ? cleanPhone : `57${cleanPhone}`;

    let msg = `Estimado(a) ${student.acudienteNombre || "Acudiente"}, un cordial saludo de parte de la Dirección de Grupo de la I.E.I.T.A.B. (IETABA).\n\nLe informamos sobre el seguimiento pedagógico del estudiante ${student.primerNombre} ${student.primerApellido} (${selectedGrado}-${selectedCurso}):\n`;

    if (failingCount >= 3) {
      msg += `⚠️ ATENCIÓN: Actualmente presenta ${failingCount} materias con desempeño bajo en el ${selectedPeriod.toUpperCase()}. Solicitamos citación urgente para acordar compromisos pedagógicos y plan de mejoramiento.\n`;
    } else if (failingCount > 0) {
      msg += `📌 Seguimiento: Presenta ${failingCount} materia(s) en nivelación. Acompañemos sus actividades para asegurar la promoción.\n`;
    } else {
      msg += `🌟 Felicitaciones: El estudiante mantiene un excelente rendimiento académico con promedio de ${avg || "Superior"}. ¡Sigamos apoyando su proceso!\n`;
    }

    msg += `\nAtentamente,\nDirección de Grupo · IETABA`;

    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER DEL COCKPIT CON SELECTOR DE PERIODO & ACCIONES ── */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-teal-900/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-xs font-black uppercase tracking-widest border border-teal-400/30">
              <Sparkles size={14} className="text-teal-400" />
              Torre de Control · Dirección de Grupo 360°
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
              {selectedGrado === "TODOS" ? "Todos los Grupos" : `Grado ${selectedGrado} · Curso ${selectedCurso}`}
            </h2>
            <p className="text-slate-300 text-xs md:text-sm font-medium max-w-xl">
              Diagnóstico integral multiasignatura, monitoreo de riesgo de pérdida de año SIEEE y CRM de comunicación con acudientes.
            </p>
          </div>

          {/* Selector de Periodo y Botón Exportar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
              <button
                onClick={() => setSelectedPeriod("p1")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  selectedPeriod === "p1" ? "bg-teal-500 text-slate-950 shadow-md font-black" : "text-slate-300 hover:text-white"
                }`}
              >
                Periodo 1
              </button>
              <button
                onClick={() => setSelectedPeriod("p2")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  selectedPeriod === "p2" ? "bg-teal-500 text-slate-950 shadow-md font-black" : "text-slate-300 hover:text-white"
                }`}
              >
                Periodo 2
              </button>
              <button
                onClick={() => setSelectedPeriod("p3")}
                className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  selectedPeriod === "p3" ? "bg-teal-500 text-slate-950 shadow-md font-black" : "text-slate-300 hover:text-white"
                }`}
              >
                Periodo 3
              </button>
            </div>

            <button
              onClick={handleExportSabanaGrupo}
              className="px-4 py-3 bg-white hover:bg-teal-50 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Download size={14} />
              <span>Sábana (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID DE KPIS GRUPALES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tasa de Promoción */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Tasa Promoción</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900">{kpis.promotionRate}%</span>
            <span className="text-[10px] font-bold text-emerald-600">({kpis.safeCount}/{groupStudents.length})</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Estudiantes sin materias reprobadas</p>
        </div>

        {/* KPI 2: Media del Salón */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Promedio Grupal</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900">{kpis.groupAverage > 0 ? kpis.groupAverage : "—"}</span>
            <span className="text-[10px] font-bold text-slate-400">/ 5.0</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Meta Institucional SIEEE: 3.5</p>
        </div>

        {/* KPI 3: Sentinel de Riesgo Crítico */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600">Riesgo Crítico</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-rose-600">{kpis.dangerCount}</span>
            <span className="text-[10px] font-bold text-amber-600">+{kpis.warningCount} Alerta</span>
          </div>
          <p className="text-[10px] text-rose-700 font-medium">Pierden ≥ 3 materias (Peligro de año)</p>
        </div>

        {/* KPI 4: Salud Convivencial */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2 hover:border-teal-300 transition-all">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider">Convivencia (L.1620)</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <HeartHandshake size={16} />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-slate-900">{kpis.totalFelicitaciones}</span>
            <span className="text-[10px] font-bold text-rose-600">/ {kpis.totalFaltas} Faltas</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Felicitaciones vs Faltas registradas</p>
        </div>
      </div>

      {/* ── BARRA DE CONTROL & FILTROS PROFESIONAL (DISEÑO 2-TIER) ── */}
      <div className="bg-white rounded-[2rem] border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Tier 1: Selector de Modo (Segmented Tabs) + Buscador Rápido */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 border-b border-slate-100 pb-4">
          
          {/* Pestañas Principales */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-full md:w-auto">
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "heatmap" 
                  ? "bg-white text-teal-950 shadow-sm shadow-slate-200/80 font-black" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>🔥 Matriz de Calor Multimateria</span>
            </button>
            <button
              onClick={() => setActiveTab("crm")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "crm" 
                  ? "bg-white text-teal-950 shadow-sm shadow-slate-200/80 font-black" 
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span>📱 CRM Acudientes</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                activeTab === "crm" ? "bg-teal-50 text-teal-700 border border-teal-200/60" : "bg-slate-200 text-slate-600"
              }`}>
                {groupStudents.length}
              </span>
            </button>
          </div>

          {/* Buscador Rápido */}
          <div className="relative w-full md:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar estudiante o doc..."
              className="w-full pl-10 pr-8 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold text-slate-800 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Tier 2: Sentinel Filter Chips & Contadores de Alerta */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1 hidden sm:inline">
              Filtrar por:
            </span>
            <button
              onClick={() => setFilterRisk("all")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filterRisk === "all" 
                  ? "bg-slate-900 text-white shadow-sm shadow-slate-900/10" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                filterRisk === "all" ? "bg-white/20 text-white" : "bg-white text-slate-600"
              }`}>
                {studentDiagnostics.length}
              </span>
            </button>

            <button
              onClick={() => setFilterRisk("danger")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filterRisk === "danger" 
                  ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20" 
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200/60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>≥ 3 Materias</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                filterRisk === "danger" ? "bg-white/20 text-white" : "bg-white text-rose-700"
              }`}>
                {kpis.dangerCount}
              </span>
            </button>

            <button
              onClick={() => setFilterRisk("warning")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filterRisk === "warning" 
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20" 
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100/80 border border-amber-200/60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>1-2 Materias</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                filterRisk === "warning" ? "bg-white/20 text-white" : "bg-white text-amber-800"
              }`}>
                {kpis.warningCount}
              </span>
            </button>

            <button
              onClick={() => setFilterRisk("safe")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                filterRisk === "safe" 
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" 
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200/60"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Al Día</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                filterRisk === "safe" ? "bg-white/20 text-white" : "bg-white text-emerald-800"
              }`}>
                {kpis.safeCount}
              </span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-400">
            Mostrando <span className="font-black text-slate-700">{filteredDiagnostics.length}</span> de <span className="font-black text-slate-700">{studentDiagnostics.length}</span> estudiantes
          </div>
        </div>

      </div>

      {/* ── TAB 1: MATRIZ DE CALOR MULTIMATERIA ── */}
      {activeTab === "heatmap" && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 sticky left-0 bg-slate-900 z-10">Estudiante</th>
                  <th className="p-4 text-center">Promedio</th>
                  <th className="p-4 text-center">Estado SIEEE</th>
                  {activeSubjects.map(sub => (
                    <th key={sub.id} className="p-4 text-center whitespace-nowrap" title={sub.name}>
                      {sub.name}
                    </th>
                  ))}
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDiagnostics.map(diag => {
                  const s = diag.student;
                  return (
                    <tr 
                      key={s.id} 
                      onClick={() => onSelectStudent && onSelectStudent(s.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Nombre y Documento */}
                      <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                            diag.status === "danger" ? "bg-rose-100 text-rose-700" : (diag.status === "warning" ? "bg-amber-100 text-amber-800" : "bg-teal-100 text-teal-800")
                          }`}>
                            {(s.primerApellido || "")[0]}{(s.primerNombre || "")[0]}
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase leading-snug">
                              {s.primerApellido} {s.segundoApellido}, {s.primerNombre}
                            </p>
                            <p className="text-[9px] text-slate-400 font-bold">Doc: {s.nroDocumento}</p>
                          </div>
                        </div>
                      </td>

                      {/* Promedio General */}
                      <td className="p-4 text-center font-black">
                        {diag.average !== null ? (
                          <span className={`px-2.5 py-1 rounded-lg text-[11px] ${
                            diag.average >= 4.6 ? "bg-emerald-100 text-emerald-800" :
                            diag.average >= 4.0 ? "bg-sky-100 text-sky-800" :
                            diag.average >= 3.0 ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-700"
                          }`}>
                            {diag.average.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Estado SIEEE */}
                      <td className="p-4 text-center">
                        {diag.status === "danger" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[9px] font-black uppercase">
                            🔴 Pierde {diag.failingCount} Mat.
                          </span>
                        ) : diag.status === "warning" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[9px] font-black uppercase">
                            🟡 Pierde {diag.failingCount} Mat.
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[9px] font-black uppercase">
                            🟢 Al Día
                          </span>
                        )}
                      </td>

                      {/* Celdas de Materias con Notas */}
                      {activeSubjects.map(sub => {
                        const score = diag.subjectScores[sub.name];
                        return (
                          <td key={sub.id} className="p-4 text-center">
                            {score !== null && score !== undefined ? (
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-block min-w-[36px] ${
                                score >= 4.6 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                                score >= 4.0 ? "bg-sky-50 text-sky-700 border border-sky-200" :
                                score >= 3.0 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                                "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse"
                              }`}>
                                {score.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Acciones Rápidas */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleSendWhatsApp(s, diag.failingCount, diag.average)}
                            className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors border border-green-200"
                            title="Avisar a acudiente por WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </button>
                          {onPrintActa && (
                            <button
                              onClick={() => onPrintActa(s)}
                              className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors border border-teal-200"
                              title="Generar Acta con 4 Firmas"
                            >
                              <FileText size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL ESTANDARIZADO DE ACUDIENTE ── */}
      <GuardianModal 
        isOpen={Boolean(selectedGuardianStudent)} 
        onClose={() => setSelectedGuardianStudent(null)} 
        student={selectedGuardianStudent} 
      />

      <StudentStatusModal
        isOpen={Boolean(selectedStatusStudent)}
        onClose={() => setSelectedStatusStudent(null)}
        student={selectedStatusStudent}
      />

      {/* ── TAB 2: CRM DE ACUDIENTES & CITACIONES ── */}
      {activeTab === "crm" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDiagnostics.map(diag => {
            const s = diag.student;
            return (
              <div 
                key={s.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 hover:border-teal-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase">
                        {s.primerApellido} {s.primerNombre}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-bold">Doc: {s.nroDocumento}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      diag.status === "danger" ? "bg-rose-100 text-rose-700" : (diag.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")
                    }`}>
                      {diag.status === "danger" ? "Riesgo Crítico" : (diag.status === "warning" ? "Alerta" : "Al Día")}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Contacto del Acudiente:</span>
                      {s.acudienteParentesco && (
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 rounded-md text-[8px] font-black uppercase">
                          {s.acudienteParentesco}
                        </span>
                      )}
                    </div>
                    <p className="font-black text-slate-800 flex items-center gap-1.5">
                      <Users size={12} className="text-teal-600 shrink-0" />
                      <span className="truncate">{s.acudienteNombre || "No registrado"}</span>
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-600 flex items-center gap-1.5">
                        <Phone size={12} className="text-teal-600 shrink-0" />
                        <span>{s.acudienteTelefono || "Sin teléfono"}</span>
                      </p>
                      {s.acudienteVereda && (
                        <span className="text-[9px] font-bold text-slate-500 truncate" title={s.acudienteVereda}>
                          📍 {s.acudienteVereda}
                        </span>
                      )}
                    </div>
                    {s.acudienteEmail && (
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <a
                          href={`mailto:${s.acudienteEmail}?subject=${encodeURIComponent(`Seguimiento Institucional IETABA - ${s.primerNombre} ${s.primerApellido}`)}`}
                          className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 truncate"
                        >
                          <Mail size={11} className="shrink-0" />
                          <span className="truncate">{s.acudienteEmail}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedStatusStudent(s)}
                    className="p-2 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-xl transition-all border border-slate-200"
                    title="Gestionar Estado de Matrícula (Activo / Retirado / Fallecido)"
                  >
                    <ShieldAlert size={13} />
                  </button>

                  <button
                    onClick={() => setSelectedGuardianStudent(s)}
                    className="p-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-xl transition-all border border-slate-200"
                    title="Actualizar Datos del Acudiente"
                  >
                    <Edit3 size={13} />
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(s, diag.failingCount, diag.average)}
                    disabled={!s.acudienteTelefono}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </button>

                  {onPrintActa && (
                    <button
                      onClick={() => onPrintActa(s)}
                      className="px-3 py-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-slate-200"
                      title="Acta con 4 firmas"
                    >
                      <Printer size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
