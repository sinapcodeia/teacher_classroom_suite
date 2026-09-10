"use client";
import { normalizeGrade, parseFlexibleFloat, sanitizeText, matchStudentCourse } from "@/lib/constants";

import { useState, useMemo, useRef, useEffect } from "react";
import { useApp, Student } from "@/context/AppContext";
import { DetailedGrades, calculateDetailedFinal, calculatePeriodGrades } from "@/lib/gradeUtils";
import { 
  FileSpreadsheet, Download, Upload, Save, 
  Calculator, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft, Lock, Unlock
} from "lucide-react";
import Papa from "papaparse";
import GradeImportSummaryModal from "./GradeImportSummaryModal";
import RecoveryPlanModal from "@/components/live-class/RecoveryPlanModal";

interface GradebookManagerProps {
  grade: string;
  course: string;
  subject: string;
}

const PERIODS = [
  { id: "p1", label: "PERIODO 1" },
  { id: "p2", label: "PERIODO 2" },
  { id: "p3", label: "PERIODO 3" },
];

export default function GradebookManager({ grade, course, subject }: GradebookManagerProps) {
  const { myStudents, updateDetailedGrades, importDetailedGrades, profile, masterData, togglePeriodStatus, setActivePeriod, students } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState(masterData.activePeriod || "p1");
  const [recoveryStudent, setRecoveryStudent] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any[] | null>(null);
  const [isTransientOpen, setIsTransientOpen] = useState(false);
  const [showTransientWarningModal, setShowTransientWarningModal] = useState(false);
  const [showAdvancePeriodModal, setShowAdvancePeriodModal] = useState(false);
  const [advanceConfirmed, setAdvanceConfirmed] = useState(false);
  
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    period: "p1",
    modified: [] as string[],
    errors: [] as string[],
    studentResults: [] as any[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EXCEPCIÓN DE SEGURIDAD: FÍSICA 6° ---
  useEffect(() => {
    if (subject === "FÍSICA" && normalizeGrade(grade) === "6") {
      setSelectedPeriod("p1");
    } else {
      setSelectedPeriod(masterData.activePeriod || "p2");
    }
    setIsTransientOpen(false);
  }, [subject, grade, masterData.activePeriod]);
  
  const filteredStudents = useMemo(() => {
    return myStudents
      .filter(s => {
        if (s.isActive === false) return false;
        const matchGrado = grade === "TODOS" || normalizeGrade(s.grado) === normalizeGrade(grade);
        const matchCurso = matchStudentCourse(s.curso, course, s.grado, grade);
        return matchGrado && matchCurso;
      })
      .sort((a, b) => {
        const nameA = `${a.primerApellido} ${a.segundoApellido}, ${a.primerNombre}`.toUpperCase();
        const nameB = `${b.primerApellido} ${b.segundoApellido}, ${b.primerNombre}`.toUpperCase();
        return nameA.localeCompare(nameB);
      });
  }, [myStudents, grade, course]);

  const processedStudents = useMemo(() => {
    return filteredStudents.map(s => {
      const grades = s.detailedGrades?.[subject]?.[selectedPeriod] || {
        sb: Array(8).fill(null),
        sbh: Array(8).fill(null),
        sr: Array(5).fill(null),
        cv: Array(3).fill(null),
          aut: null,
          rec: null
        };
      return {
        ...s,
        grades,
        periodGrades: calculatePeriodGrades(grades)
      };
    });
  }, [filteredStudents, subject, selectedPeriod]);

  const handleExport = () => {
    const csvData = filteredStudents.map(s => {
      const grades = s.detailedGrades?.[subject]?.[selectedPeriod] || {
        sb: Array(8).fill(null),
        sbh: Array(8).fill(null),
        sr: Array(5).fill(null),
        cv: Array(3).fill(null),
          aut: null,
          rec: null
        };

      const row: any = {
        CODIGO: s.nroDocumento,
        PRIMER_APELLIDO: s.primerApellido,
        SEGUNDO_APELLIDO: s.segundoApellido || "",
        PRIMER_NOMBRE: s.primerNombre,
        SEGUNDO_NOMBRE: s.segundoNombre || ""
      };

      const periodNotes = calculatePeriodGrades(grades);

      grades.sb.forEach((v, i)  => row[`SB${i + 1}`]  = v != null ? v : "");
      grades.sbh.forEach((v, i) => row[`SBH${i + 1}`] = v != null ? v : "");
      grades.sr.forEach((v, i)  => row[`SR${i + 1}`]  = v != null ? v : "");
      grades.cv.forEach((v, i)  => row[`CV${i + 1}`]  = v != null ? v : "");
      row["AUT"]     = grades.aut != null ? grades.aut : "";
      row["PARCIAL"] = periodNotes.parcial;
      row["REC"]     = grades.rec != null ? grades.rec : "";
      row["FINAL"]   = periodNotes.definitiva;

      return row;
    });

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Planilla_${subject}_${course}.csv`);
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setPendingImportData(results.data);
        setShowConfirmModal(true);
        if (e.target) e.target.value = "";
      }
    });
  };

  const processImport = async (targetPeriod: string) => {
    if (!pendingImportData) return;
    setIsSaving(true);
    setImportProgress(0);
    
    const rows = pendingImportData;
    const stats = {
      total: rows.length,
      success: 0,
      period: targetPeriod,
      modified: [] as string[],
      errors: [] as string[],
      studentResults: [] as any[]
    };

    const importData: { studentId: string, detailed: DetailedGrades }[] = [];

    try {
      // 1. Preparar datos
      for (const row of rows) {
        if (!row.CODIGO) continue;
        const student = filteredStudents.find(s => s.nroDocumento === row.CODIGO);
        
        if (!student) {
          stats.errors.push(row.CODIGO || "SIN CÓDIGO");
          continue;
        }

        const parseVal = (v: any): number | null => {
          if (v === "" || v === undefined || v === null) return null;
          const n = parseFloat(String(v).replace(",", "."));
          if (isNaN(n)) return null;
          // Clamp estricto de rango institucional 0.0 – 5.0
          return Math.max(0, Math.min(5, n));
        };

        const detailed: DetailedGrades = {
          sb: Array(8).fill(0).map((_, i) => parseVal(row[`SB${i + 1}`])),
          sbh: Array(8).fill(0).map((_, i) => parseVal(row[`SBH${i + 1}`])),
          sr: Array(5).fill(0).map((_, i) => parseVal(row[`SR${i + 1}`])),
          cv: Array(3).fill(0).map((_, i) => parseVal(row[`CV${i + 1}`])),
          aut: parseVal(row["AUT"])
        };

        importData.push({ studentId: student.id, detailed });
        
        const currentGrades = student.detailedGrades?.[subject]?.[targetPeriod];
        if (JSON.stringify(currentGrades) !== JSON.stringify(detailed)) {
          stats.modified.push(`${student.primerApellido} ${student.primerNombre}`);
        }
        
        stats.success++;
      }
      
      setImportProgress(20); // Iniciando carga

      // 2. Ejecutar importación masiva
      await importDetailedGrades(subject, targetPeriod, importData);
      setImportProgress(60); // Procesado en servidor

      // 3. Generar resultados para el resumen usando los datos FRESCOS del batch preparado
      // (no el estado desactualizado de Firestore que todavía no recibió el onSnapshot)
      const freshDataMap = new Map(importData.map(item => [item.studentId, item.detailed]));
      stats.studentResults = importData.map(item => {
        const student = students.find(s => s.id === item.studentId);
        if (!student) return null;
        // Para el período importado usamos los datos frescos; para el resto, el estado actual
        const p1Data = targetPeriod === "p1" ? (freshDataMap.get(item.studentId) || item.detailed)
          : (student.detailedGrades?.[subject]?.p1 || { sb: [], sbh: [], sr: [], cv: [], aut: null });
        const p2Data = targetPeriod === "p2" ? (freshDataMap.get(item.studentId) || item.detailed)
          : (student.detailedGrades?.[subject]?.p2 || { sb: [], sbh: [], sr: [], cv: [], aut: null });
        const p3Data = targetPeriod === "p3" ? (freshDataMap.get(item.studentId) || item.detailed)
          : (student.detailedGrades?.[subject]?.p3 || { sb: [], sbh: [], sr: [], cv: [], aut: null });
        return {
          name: `${student.primerApellido} ${student.primerNombre}`,
          p1: calculateDetailedFinal(p1Data),
          p2: calculateDetailedFinal(p2Data),
          p3: calculateDetailedFinal(p3Data) };
      }).filter(Boolean);

      setImportProgress(100);
      setImportStats(stats);
      setSelectedPeriod(targetPeriod);
      
      // Esperar un momento para que se vea el 100%
      setTimeout(() => {
        setShowConfirmModal(false);
        setShowSummary(true);
        setIsSaving(false);
        setPendingImportData(null);
        
        // AUTO-CLOSE LOGIC
        if (isTransientOpen) {
          togglePeriodStatus(targetPeriod, "closed");
          setIsTransientOpen(false);
        }
      }, 500);

    } catch (err) {
      console.error("Error en importación masiva:", err);
      alert("Error al sincronizar datos.");
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-outline-variant shadow-xl overflow-hidden mt-6 animate-fade-in-up">
      <div className="p-8 border-b border-outline-variant bg-surface-container-lowest flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1.25rem] flex items-center justify-center shadow-inner">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase italic">Planilla de Calificaciones</h2>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-40">IETABA · {subject} · {course}</p>
          </div>
        </div>

        {/* Banner de Advertencia de Periodo Reabierto */}
      {isTransientOpen && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-300 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <AlertCircle size={22} />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                Periodo {PERIODS.find(p => p.id === selectedPeriod)?.label || selectedPeriod} Reabierto para Modificaciones
              </h4>
              <p className="text-[10px] font-bold text-amber-800 leading-tight">
                Recuerda que una vez termines de actualizar las notas debes cerrar el periodo para evitar contratiempos con los consolidados y boletines de secretaría.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              togglePeriodStatus(selectedPeriod, "closed");
              setIsTransientOpen(false);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap active:scale-95"
          >
            <Lock size={14} /> Cerrar Periodo Ahora
          </button>
        </div>
      )}

      {/* Period Selection Tabs & Control */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-2xl border border-outline-variant/30 overflow-x-auto no-scrollbar">
            {PERIODS.map(p => {
              const isActive = masterData.activePeriod === p.id;
              const isClosed = masterData.periodStatus[p.id] === "closed";
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPeriod(p.id);
                    setIsTransientOpen(false);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black transition-all uppercase tracking-widest flex items-center gap-2 whitespace-nowrap ${
                    selectedPeriod === p.id 
                      ? "bg-on-surface text-white shadow-lg" 
                      : "text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  {p.label}
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {isClosed && !isTransientOpen && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  {isClosed && isTransientOpen && selectedPeriod === p.id && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                </button>
              );
            })}
          </div>

          {masterData.activePeriod === selectedPeriod && masterData.periodStatus[selectedPeriod] === "open" && (
              <button
                onClick={() => setShowAdvancePeriodModal(true)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[8px] font-black uppercase tracking-widest border border-blue-200 hover:bg-blue-200 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                <CheckCircle size={12} /> <span className="hidden sm:inline">Finalizar Periodo</span><span className="sm:hidden text-[7px]">CERRAR</span>
              </button>
            )}
            
            {masterData.periodStatus[selectedPeriod] === "closed" && !isTransientOpen && (
              PERIODS.findIndex(p => p.id === selectedPeriod) <= PERIODS.findIndex(p => p.id === (masterData.activePeriod || "p1")) ? (
            <button
              onClick={() => setShowTransientWarningModal(true)}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[8px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-200 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Lock size={12} /> <span className="hidden sm:inline">Abrir para Corrección</span><span className="sm:hidden text-[7px]">ABRIR</span>
              </button>
            ) : (
              <div className="px-4 py-2 bg-slate-100 text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-widest border border-slate-200 flex items-center gap-2 whitespace-nowrap">
                <Lock size={12} /> <span className="hidden sm:inline">Aún no inicia</span><span className="sm:hidden text-[7px]">BLOQUEADO</span>
              </div>
            ))}

          {isTransientOpen && (
            <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[8px] font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-2 animate-pulse whitespace-nowrap">
              <Unlock size={12} /> <span className="hidden sm:inline">Desbloqueado</span><span className="sm:hidden text-[7px]">OPEN</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleExport}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-outline-variant text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Download size={16} /> <span className="hidden sm:inline">Descargar Plantilla</span><span className="sm:hidden">EXPORTAR</span>
          </button>
          
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleImport} accept=".csv" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isSaving || (masterData.periodStatus[selectedPeriod] === "closed" && !isTransientOpen)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-on-surface text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
          >
            {isSaving ? <Calculator size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="hidden sm:inline">Subir Notas</span><span className="sm:hidden">IMPORTAR</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto relative scrollbar-premium">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
              <th className="sticky left-0 z-30 bg-surface-container px-6 py-4 text-left border-r border-outline-variant/30 min-w-[280px]">Estudiante</th>
              
              {/* Category headers */}
              <th colSpan={8} className="px-4 py-4 text-center border-r border-outline-variant/30 bg-blue-50/30 text-blue-800">SB (Saber)</th>
              <th colSpan={8} className="px-4 py-4 text-center border-r border-outline-variant/30 bg-emerald-50/30 text-emerald-800">SBH (Saber-Hacer)</th>
              <th colSpan={5} className="px-4 py-4 text-center border-r border-outline-variant/30 bg-amber-50/30 text-amber-800">SR (Ser)</th>
              <th colSpan={3} className="px-4 py-4 text-center border-r border-outline-variant/30 bg-purple-50/30 text-purple-800">CV</th>
              <th className="px-4 py-4 text-center bg-rose-50/30 text-rose-800">AUT</th>
                <th className="px-4 py-4 text-center bg-slate-100 text-slate-800">Parcial</th>
                <th className="px-4 py-4 text-center bg-amber-50 text-amber-800">Rec.</th>
                <th className="px-6 py-4 text-center bg-on-surface text-white">DEF</th>
            </tr>
            <tr className="bg-surface-container-low text-[8px] font-bold text-on-surface-variant/40 border-b border-outline-variant">
               <th className="sticky left-0 z-30 bg-surface-container-low px-6 py-2 text-left border-r border-outline-variant/30">Datos</th>
               {/* SB 1-8 */}
               {[1,2,3,4,5,6,7,8].map(i => <th key={`sb-${i}`} className="px-2 py-2 border-r border-outline-variant/10">SB{i}</th>)}
               {/* SBH 1-8 */}
               {[1,2,3,4,5,6,7,8].map(i => <th key={`sbh-${i}`} className="px-2 py-2 border-r border-outline-variant/10">SBH{i}</th>)}
               {/* SR 1-5 */}
               {[1,2,3,4,5].map(i => <th key={`sr-${i}`} className="px-2 py-2 border-r border-outline-variant/10">SR{i}</th>)}
               {/* CV 1-3 */}
               {[1,2,3].map(i => <th key={`cv-${i}`} className="px-2 py-2 border-r border-outline-variant/10">CV{i}</th>)}
               <th className="px-2 py-2">AUT</th>
                 <th className="px-4 py-2 border-r border-outline-variant/10">PARC</th>
                 <th className="px-4 py-2 border-r border-outline-variant/10">REC1</th>
                 <th className="px-6 py-2">DEF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {processedStudents.map(student => {
              const { grades, periodGrades } = student;
                const { parcial, rec, definitiva: finalScore } = periodGrades;

                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="sticky left-0 z-20 bg-white group-hover:bg-slate-50 px-6 py-4 border-r border-outline-variant/30 shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center font-black text-[9px] uppercase border border-primary/10">
                           {(student.primerApellido || "")[0] || ""}{(student.primerNombre || "")[0] || ""}
                         </div>
                         <div>
                           <p className="text-[11px] font-black text-on-surface uppercase leading-tight">
                             {student.primerApellido || ""} {student.segundoApellido || ""}{student.primerApellido ? "," : ""} {student.primerNombre || ""} {student.segundoNombre || ""}
                           </p>
                           <p className="text-[8px] font-bold text-on-surface-variant opacity-40 uppercase">{student.nroDocumento}</p>
                         </div>
                      </div>
                    </td>
                    
                    {/* SB Cells */}
                    {grades.sb.map((v: any, i: number) => (
                      <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-blue-600">
                        {v?.toFixed(1) || "-"}
                      </td>
                    ))}
                    {/* SBH Cells */}
                    {grades.sbh.map((v: any, i: number) => (
                      <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-emerald-600">
                        {v?.toFixed(1) || "-"}
                      </td>
                    ))}
                    {/* SR Cells */}
                    {grades.sr.map((v: any, i: number) => (
                      <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-amber-600">
                        {v?.toFixed(1) || "-"}
                      </td>
                    ))}
                    {/* CV Cells */}
                    {grades.cv.map((v: any, i: number) => (
                      <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-purple-600">
                        {v?.toFixed(1) || "-"}
                      </td>
                    ))}
                    <td className="px-2 py-4 text-center text-[10px] font-bold text-rose-600 border-r border-outline-variant/5">
                      {grades.aut?.toFixed(1) || "-"}
                    </td>
                    <td className="px-4 py-4 text-center text-[10px] font-bold text-slate-700 bg-slate-50/50 border-r border-outline-variant/5">
                      {parcial.toFixed(1)}
                    </td>
                    <td className="px-4 py-4 text-center text-[10px] font-bold text-amber-700 bg-amber-50/30 border-r border-outline-variant/5">
                      {rec?.toFixed(1) || "-"}
                    </td>
                    <td className="px-6 py-3 text-center text-xs font-black bg-on-surface/5">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className={finalScore < 3 ? 'text-red-600' : 'text-on-surface'}>
                          {finalScore.toFixed(1)}
                        </span>
                        {finalScore < 3 && (
                        <button
                          onClick={() => setRecoveryStudent({
                            id: student.id,
                            nroDocumento: student.nroDocumento,
                            primerApellido: student.primerApellido || "",
                            segundoApellido: student.segundoApellido || "",
                            primerNombre: student.primerNombre || "",
                            segundoNombre: student.segundoNombre || "",
                            average: finalScore
                          })}
                          className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 text-[8px] font-black uppercase rounded-md tracking-wider transition-all flex items-center gap-0.5 shadow-sm active:scale-95"
                          title="Generar Plan de Nivelación"
                        >
                          🚑 Nivelar
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

      {showSuccess && (
        <div className="m-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 animate-fade-in-up">
           <CheckCircle size={20} />
           <p className="text-xs font-black uppercase tracking-widest">Planilla sincronizada con éxito</p>
        </div>
      )}

      <div className="p-6 bg-surface-container-low border-t border-outline-variant">
         <div className="flex flex-wrap gap-6 items-center justify-center opacity-60">
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">SB: Saber (30%)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">SBH: Saber-Hacer (40%)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-amber-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">SR: Ser (20%)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-purple-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">CV: Convivencia (5%)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-rose-500" />
               <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">AUT: Auto (5%)</span>
            </div>
         </div>
      </div>
      {/* Import Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-md bg-on-surface/60 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                <Upload size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Confirmar Destino</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sincronización de Archivo Maestro</p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              {isSaving ? (
                <div className="py-10 space-y-6 text-center">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-600 mb-2">
                      <span>Sincronizando...</span>
                      <span>{importProgress}%</span>
                   </div>
                   <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                        style={{ width: `${importProgress}%` }}
                      />
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                      Por favor no cierres esta ventana
                   </p>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                    Detectamos una planilla de notas completa. Selecciona el periodo institucional donde deseas consolidar esta información:
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {PERIODS.map(p => {
                      const isClosed = masterData.periodStatus[p.id] === "closed";
                      const isSuggested = masterData.activePeriod === p.id;
                      const isUnlocked = isTransientOpen && selectedPeriod === p.id;
                      
                      return (
                        <button
                          key={p.id}
                          disabled={isClosed && !isUnlocked}
                          onClick={() => processImport(p.id)}
                          className={`flex items-center justify-between px-6 py-4 rounded-2xl border-2 transition-all group ${
                            isSuggested 
                              ? "border-blue-500 bg-blue-50/50" 
                              : "border-outline-variant bg-white hover:border-slate-400"
                          } ${isClosed && !isUnlocked ? 'opacity-50 grayscale' : 'active:scale-95'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${isSuggested ? 'bg-blue-500' : isUnlocked ? 'bg-amber-500' : 'bg-slate-300'}`} />
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{p.label}</span>
                          </div>
                          {isSuggested && <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded-lg">RECOMENDADO</span>}
                          {isClosed && !isUnlocked && <span className="text-[8px] font-black text-rose-600 uppercase bg-rose-100 px-2 py-1 rounded-lg">CERRADO</span>}
                          {isUnlocked && <span className="text-[8px] font-black text-amber-600 uppercase bg-amber-100 px-2 py-1 rounded-lg">DESBLOQUEADO</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {!isSaving && (
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowConfirmModal(false); setPendingImportData(null); }}
                  className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      
      {/* Transient Warning Modal — Ultra-Premium Design */}
      {showTransientWarningModal && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden border border-amber-100 animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 md:p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                  <Unlock size={26} className="text-white" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-amber-200 bg-white/10 px-2.5 py-1 rounded-md">
                    Autorización Extraordinaria
                  </span>
                  <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white mt-1">
                    Reabrir Periodo Cerrado
                  </h3>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5">
              <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200/80 space-y-2">
                <p className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600" /> Periodo Seleccionado: {PERIODS.find(p => p.id === selectedPeriod)?.label || selectedPeriod}
                </p>
                <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                  Vas a habilitar la corrección o adición de notas en este periodo.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <p className="font-black text-[10px] uppercase tracking-widest text-slate-800">
                  ⚠️ Directriz Institucional Obligatoria:
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">
                  Al terminar de realizar los ajustes requeridos, <strong>debes volver a presionar &quot;Cerrar Periodo Ahora&quot;</strong> en el banner superior para garantizar que secretaría académica y coordinación puedan emitir los boletines definitivos sin inconsistencias.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowTransientWarningModal(false)} 
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  ✕ Cancelar
                </button>
                <button 
                  onClick={() => { 
                    setIsTransientOpen(true); 
                    setShowTransientWarningModal(false); 
                  }} 
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Unlock size={14} /> Entendido, Habilitar Edición
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advance Period Modal — Ultra-Premium Executive Design */}
      {showAdvancePeriodModal && (() => {
        const currentPeriodObj = PERIODS.find(p => p.id === selectedPeriod);
        const currIdx = PERIODS.findIndex(p => p.id === selectedPeriod);
        const nextPeriodObj = currIdx < PERIODS.length - 1 ? PERIODS[currIdx + 1] : null;

        return (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-[0_30px_90px_rgba(0,0,0,0.35)] max-w-lg w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col">
              
              {/* Top Banner Gradient */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 md:p-8 text-white relative">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
                      <Lock size={26} className="text-white" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-[0.25em] text-blue-300 bg-white/10 px-2.5 py-1 rounded-md border border-white/10">
                        Seguridad Académica · IETABA
                      </span>
                      <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tight text-white mt-1">
                        Finalizar y Avanzar Periodo
                      </h3>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAdvancePeriodModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-all text-white/60 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 md:p-8 space-y-6">
                
                {/* Period Progression Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-700">Periodo a Bloquear</span>
                    </div>
                    <p className="text-sm font-black text-rose-950 uppercase">{currentPeriodObj?.label || selectedPeriod}</p>
                    <span className="text-[8px] font-bold text-rose-600 block">Quedará cerrado oficialmente</span>
                  </div>

                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700">Nuevo Periodo Activo</span>
                    </div>
                    <p className="text-sm font-black text-emerald-950 uppercase">{nextPeriodObj?.label || "Cierre de Año"}</p>
                    <span className="text-[8px] font-bold text-emerald-600 block">Habilitado para nuevas notas</span>
                  </div>
                </div>

                {/* Scope & Impacts Checklist */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200/70">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Consecuencias del Cierre Oficial:</p>
                  
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                        ✓
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        <strong>Protección de Notas:</strong> Se bloqueará la edición accidental para resguardar las definitivas del periodo.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                        ✓
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        <strong>Consolidación para Secretaría:</strong> Quedan fijados los promedios oficiales requeridos para emisión de boletines.
                      </p>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-black text-[10px]">
                        ✓
                      </div>
                      <p className="text-[11px] leading-relaxed">
                        <strong>Sincronización Multi-dispositivo:</strong> El cierre se aplica inmediatamente en todos los computadores y modo offline.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Safety Confirmation Checkbox */}
                <label className="flex items-center gap-3 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/60 cursor-pointer hover:bg-blue-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={advanceConfirmed}
                    onChange={e => setAdvanceConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 select-none">
                    Confirmo que revisé las notas y deseo proceder con el cierre
                  </span>
                </label>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setShowAdvancePeriodModal(false);
                      setAdvanceConfirmed(false);
                    }} 
                    className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    ✕ Cancelar
                  </button>
                  <button 
                    disabled={!advanceConfirmed}
                    onClick={() => {
                      togglePeriodStatus(selectedPeriod, "closed");
                      if (nextPeriodObj) {
                        setActivePeriod(nextPeriodObj.id);
                      }
                      setShowAdvancePeriodModal(false);
                      setAdvanceConfirmed(false);
                    }} 
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Lock size={14} /> Confirmar Cierre Oficial
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Summary Modal */}
      <GradeImportSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        stats={importStats} 
      />

      {/* Recovery Strategic Plan Modal */}
      <RecoveryPlanModal
        isOpen={!!recoveryStudent}
        onClose={() => setRecoveryStudent(null)}
        student={recoveryStudent}
        subject={subject}
      />
    </div>
  );
}
