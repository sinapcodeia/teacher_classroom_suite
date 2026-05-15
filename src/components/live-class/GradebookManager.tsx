"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useApp, DetailedGrades, Student, normalizeGrade, calculateDetailedFinal } from "@/context/AppContext";
import { 
  FileSpreadsheet, Download, Upload, Save, 
  Calculator, CheckCircle, AlertCircle, X, ChevronRight, ChevronLeft, Lock, Unlock
} from "lucide-react";
import Papa from "papaparse";
import GradeImportSummaryModal from "./GradeImportSummaryModal";

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
  const { myStudents, updateDetailedGrades, profile, masterData, togglePeriodStatus } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState(masterData.activePeriod || "p1");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any[] | null>(null);
  const [isTransientOpen, setIsTransientOpen] = useState(false);
  
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
        const matchCurso = course === "TODOS" || s.curso === course;
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
        aut: null
      };
      return {
        ...s,
        grades,
        finalScore: calculateDetailedFinal(grades)
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
        aut: null
      };

      const row: any = {
        CODIGO: s.nroDocumento,
        PRIMER_APELLIDO: s.primerApellido,
        SEGUNDO_APELLIDO: s.segundoApellido || "",
        PRIMER_NOMBRE: s.primerNombre,
        SEGUNDO_NOMBRE: s.segundoNombre || "",
      };

      // Add category columns
      grades.sb.forEach((v, i) => row[`SB${i + 1}`] = v || "");
      grades.sbh.forEach((v, i) => row[`SBH${i + 1}`] = v || "");
      grades.sr.forEach((v, i) => row[`SR${i + 1}`] = v || "");
      grades.cv.forEach((v, i) => row[`CV${i + 1}`] = v || "");
      row["AUT"] = grades.aut || "";
      row["FINAL"] = calculateDetailedFinal(grades);

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

        const parseVal = (v: any) => {
          if (v === "" || v === undefined || v === null) return null;
          const n = parseFloat(String(v).replace(",", "."));
          return isNaN(n) ? null : n;
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

      // 3. Generar resultados para el resumen
      stats.studentResults = importData.map(item => {
        const student = students.find(s => s.id === item.studentId);
        return {
          name: student ? `${student.primerApellido} ${student.primerNombre}` : "N/A",
          p1: calculateDetailedFinal(student?.detailedGrades?.[subject]?.p1 || (targetPeriod === "p1" ? item.detailed : { sb:[], sbh:[], sr:[], cv:[], aut:null })),
          p2: calculateDetailedFinal(student?.detailedGrades?.[subject]?.p2 || (targetPeriod === "p2" ? item.detailed : { sb:[], sbh:[], sr:[], cv:[], aut:null })),
          p3: calculateDetailedFinal(student?.detailedGrades?.[subject]?.p3 || (targetPeriod === "p3" ? item.detailed : { sb:[], sbh:[], sr:[], cv:[], aut:null }))
        };
      });

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

          {masterData.periodStatus[selectedPeriod] === "closed" && !isTransientOpen && (
            <button
              onClick={() => setIsTransientOpen(true)}
              className="px-4 py-2 bg-amber-100 text-amber-700 rounded-xl text-[8px] font-black uppercase tracking-widest border border-amber-200 hover:bg-amber-200 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Lock size={12} /> <span className="hidden sm:inline">Abrir para Corrección</span><span className="sm:hidden text-[7px]">ABRIR</span>
            </button>
          )}

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
              <th className="px-6 py-4 text-center bg-on-surface text-white">Final</th>
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
               <th className="px-6 py-2">DEF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {processedStudents.map(student => {
              const { grades, finalScore } = student;

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
                  {grades.sb.map((v, i) => (
                    <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-blue-600">
                      {v?.toFixed(1) || "—"}
                    </td>
                  ))}
                  {/* SBH Cells */}
                  {grades.sbh.map((v, i) => (
                    <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-emerald-600">
                      {v?.toFixed(1) || "—"}
                    </td>
                  ))}
                  {/* SR Cells */}
                  {grades.sr.map((v, i) => (
                    <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-amber-600">
                      {v?.toFixed(1) || "—"}
                    </td>
                  ))}
                  {/* CV Cells */}
                  {grades.cv.map((v, i) => (
                    <td key={i} className="px-2 py-4 text-center border-r border-outline-variant/5 text-[10px] font-bold text-purple-600">
                      {v?.toFixed(1) || "—"}
                    </td>
                  ))}
                  <td className="px-2 py-4 text-center text-[10px] font-bold text-rose-600">
                    {grades.aut?.toFixed(1) || "—"}
                  </td>
                  <td className={`px-6 py-4 text-center text-xs font-black bg-on-surface/5 ${finalScore < 3 ? 'text-red-600' : 'text-on-surface'}`}>
                    {finalScore.toFixed(1)}
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

      {/* Summary Modal */}
      <GradeImportSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        stats={importStats} 
      />
    </div>
  );
}
