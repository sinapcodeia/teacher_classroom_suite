"use client";

import React, { useState, useEffect } from "react";
import {
  X, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2,
  Loader2, ArrowUpDown, ShieldAlert, Layers
} from "lucide-react";
import type { Student, ScheduleEntry, SapredRoomMeta, SapredSyncInfo } from "@/context/AppContext";
import {
  analyzeAndFillSapredWorkbook,
  downloadFilledSapredXls,
  downloadSapredNoveltiesExcel,
  exportMultiSheetSapredXls,
  SapredAnalysisResult,
} from "@/lib/sapredConnector";

interface SapredConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  schedule: ScheduleEntry[];
  availableSubjects: string[];
  selectedSubject: string;
  selectedGrade: string;
  selectedCurso: string;
  selectedPeriod: string;
  teacherName: string;
  sapredOrder?: Record<string, string[]>;
  sapredMeta?: Record<string, SapredRoomMeta>;
  sapredLastSync?: SapredSyncInfo;
  onSaveSapredOrder: (
    orders: Record<string, string[]>,
    meta?: Record<string, SapredRoomMeta>,
    syncInfo?: SapredSyncInfo
  ) => void;
  onUpdateStudent?: (id: string, updates: Partial<Student>) => Promise<void>;
  onRemoveStudent?: (id: string) => Promise<void>;
}

export default function SapredConnectorModal({
  isOpen,
  onClose,
  students,
  schedule,
  availableSubjects,
  selectedSubject,
  selectedGrade,
  selectedCurso,
  selectedPeriod,
  teacherName,
  sapredOrder,
  sapredMeta,
  sapredLastSync,
  onSaveSapredOrder,
  onUpdateStudent,
  onRemoveStudent,
}: SapredConnectorModalProps) {
  const [activeTab, setActiveTab] = useState<"fill" | "export">("fill");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isFixingNames, setIsFixingNames] = useState(false);
  const [analysis, setAnalysis] = useState<SapredAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [exportScope, setExportScope] = useState<"current_subject" | "all_teacher">("current_subject");

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const savedOrderCount = sapredOrder ? Object.keys(sapredOrder).length : 0;

  const handleResetFill = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSyncModifiedNamesToDB = async () => {
    if (!analysis || !selectedFile || !onUpdateStudent) return;
    const nameFixes = new Map<string, NonNullable<typeof analysis.novelties[number]["suggestedFix"]>>();
    const codeFixes = new Map<string, NonNullable<typeof analysis.novelties[number]["suggestedCodeFix"]>>();
    analysis.novelties.forEach(n => {
      if (n.type === "DATOS_MODIFICADOS" && n.suggestedFix && !nameFixes.has(n.suggestedFix.studentId)) {
        nameFixes.set(n.suggestedFix.studentId, n.suggestedFix);
      }
      if (n.type === "NO_EXISTE_EN_EDUMANAGER" && n.suggestedCodeFix && !codeFixes.has(n.suggestedCodeFix.studentId)) {
        codeFixes.set(n.suggestedCodeFix.studentId, n.suggestedCodeFix);
      }
    });
    if (nameFixes.size === 0 && codeFixes.size === 0) return;

    setIsFixingNames(true);
    setErrorMsg(null);
    try {
      const mergedUpdates = new Map<string, Partial<Student>>();
      nameFixes.forEach((fix, id) => {
        mergedUpdates.set(id, {
          ...(mergedUpdates.get(id) || {}),
          primerApellido: fix.primerApellido,
          segundoApellido: fix.segundoApellido,
          primerNombre: fix.primerNombre,
          segundoNombre: fix.segundoNombre,
        });
      });
      codeFixes.forEach((fix, id) => {
        mergedUpdates.set(id, {
          ...(mergedUpdates.get(id) || {}),
          nroDocumento: fix.newCodigo,
          ...(fix.primerApellido !== undefined ? { primerApellido: fix.primerApellido } : {}),
          ...(fix.segundoApellido !== undefined ? { segundoApellido: fix.segundoApellido } : {}),
          ...(fix.primerNombre !== undefined ? { primerNombre: fix.primerNombre } : {}),
          ...(fix.segundoNombre !== undefined ? { segundoNombre: fix.segundoNombre } : {}),
        });
      });

      const updatedStudents = students.map(s => {
        const upd = mergedUpdates.get(s.id);
        return upd ? { ...s, ...upd } : s;
      });
      for (const [id, upd] of mergedUpdates.entries()) {
        await onUpdateStudent(id, upd);
      }
      const res = await analyzeAndFillSapredWorkbook(
        selectedFile,
        updatedStudents,
        availableSubjects,
        selectedPeriod
      );
      setAnalysis(res);
      setSuccessMsg(`Se actualizaron ${mergedUpdates.size} estudiante(s) en la BD con los datos oficiales de SAPRED.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar datos en la BD.";
      setErrorMsg(message);
    } finally {
      setIsFixingNames(false);
    }
  };

  const handleRemoveMissingStudent = async (studentId: string, studentName: string, codigo: string) => {
    if (!onRemoveStudent || !selectedFile) return;
    if (!window.confirm(`¿Eliminar definitivamente de la BD a ${studentName} (DOC: ${codigo})?`)) return;
    setIsFixingNames(true);
    setErrorMsg(null);
    try {
      await onRemoveStudent(studentId);
      const remainingStudents = students.filter(s => s.id !== studentId);
      const res = await analyzeAndFillSapredWorkbook(
        selectedFile,
        remainingStudents,
        availableSubjects,
        selectedPeriod
      );
      setAnalysis(res);
      setSuccessMsg(`Estudiante ${studentName} (${codigo}) eliminado de la BD.`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al eliminar estudiante de la BD.";
      setErrorMsg(message);
    } finally {
      setIsFixingNames(false);
    }
  };

  const processFile = async (file: File) => {
    const MAX_FILE_BYTES = 15 * 1024 * 1024;
    if (!/\.(xls|xlsx)$/i.test(file.name)) {
      setErrorMsg("Solo se admiten archivos Excel de SAPRED (.xls o .xlsx).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrorMsg("El archivo supera el límite máximo permitido de 15 MB.");
      return;
    }
    setSelectedFile(file);
    setErrorMsg(null);
    setSuccessMsg(null);
    setAnalysis(null);
    setIsAnalyzing(true);
    try {
      const res = await analyzeAndFillSapredWorkbook(
        file,
        students,
        availableSubjects,
        selectedPeriod
      );
      if (res.totalSheets === 0) {
        setErrorMsg("El archivo seleccionado no contiene hojas válidas de SAPRED.");
        return;
      }
      setAnalysis(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error desconocido al leer el archivo.";
      setErrorMsg(`No se pudo procesar el archivo SAPRED: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadFilled = async () => {
    if (!analysis || !selectedFile || analysis.hasBlockingErrors) return;
    setIsExporting(true);
    setErrorMsg(null);
    try {
      if (Object.keys(analysis.sapredOrders).length > 0) {
        onSaveSapredOrder(analysis.sapredOrders, analysis.sapredMeta, {
          date: new Date().toISOString(),
          teacher: teacherName || "DOCENTE",
          period: selectedPeriod.toUpperCase(),
          sheets: analysis.totalSheets,
          cells: analysis.totalCellsWritten,
        });
      }
      await downloadFilledSapredXls(analysis.workbook, selectedFile.name, selectedPeriod);
      setSuccessMsg(
        `Libro .XLS diligenciado (${analysis.totalCellsWritten} notas en ${analysis.totalSheets} hojas) y orden SAPRED guardado para ${Object.keys(analysis.sapredOrders).length} curso(s).`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al generar el archivo.";
      setErrorMsg(`Error descargando el .xls diligenciado: ${message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMultiSheet = async () => {
    setIsExporting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const sheetsCount = await exportMultiSheetSapredXls({
        students,
        schedule,
        selectedSubject,
        selectedGrade,
        selectedCurso,
        periodId: selectedPeriod,
        teacherName,
        scope: exportScope,
        sapredOrder,
        sapredMeta,
      });
      if (sheetsCount === 0) {
        setErrorMsg("No se encontraron cursos con estudiantes activos para exportar en el alcance seleccionado.");
      } else {
        setSuccessMsg(`Libro SAPRED multi-hoja descargado con ${sheetsCount} hoja(s) en formato .xls (hasta AUT).`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al exportar libro multi-hoja.";
      setErrorMsg(message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sapred-modal-title"
    >
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-[2rem] w-full max-w-3xl p-4 sm:p-6 shadow-2xl border border-slate-200/80 max-h-[92dvh] overflow-y-auto custom-scrollbar space-y-4">
        {/* Cabecera */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-widest">
                Conector SAPRED 360° · BIFF8 (.XLS)
              </span>
              {savedOrderCount > 0 && (
                <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {savedOrderCount} curso(s) con orden SAPRED
                </span>
              )}
              {sapredLastSync && (
                <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                  Última sync: {sapredLastSync.period} · {new Date(sapredLastSync.date).toLocaleDateString("es-CO")}
                </span>
              )}
            </div>
            <h3 id="sapred-modal-title" className="text-xl md:text-2xl font-black text-slate-900 tracking-tight uppercase italic mt-2">
              Sincronización Multi-Hoja SAPRED
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Período activo de exportación: <strong className="text-primary">{selectedPeriod.toUpperCase()}</strong> · Columnas exactas <code className="bg-slate-100 px-1 rounded">CODIGO → AUT</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
            aria-label="Cerrar conector SAPRED"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab("fill"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === "fill"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Upload size={14} /> 1. Llenar Plantilla SAPRED (.XLS)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("export"); setErrorMsg(null); setSuccessMsg(null); }}
            className={`py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              activeTab === "export"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers size={14} /> 2. Exportar .XLS Multi-Hoja
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-xs font-medium">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-emerald-900 text-xs font-semibold">
            <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === "fill" ? (
          <div className="space-y-4">
            {!analysis && !isAnalyzing && (
              <div className="border-2 border-dashed border-slate-300 bg-slate-50/70 rounded-3xl p-8 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">
                    Sube el archivo <code className="bg-white px-1.5 py-0.5 rounded border">.xls</code> descargado desde SAPRED
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-lg mx-auto">
                    Se conservará el orden exacto de estudiantes en todas las hojas, se validarán ingresos/retiros antes de llenar (regla &quot;Todo o Nada&quot;) y se guardará el orden de SAPRED por curso.
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all">
                  <Upload size={14} /> Seleccionar Archivo SAPRED (.xls)
                  <input
                    type="file"
                    accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) processFile(f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            )}

            {isAnalyzing && (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-slate-600">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs font-bold uppercase tracking-wider">Analizando hojas y validando matrícula...</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">{selectedFile?.name}</span>
                    <span className="text-slate-500 ml-2">({analysis.totalSheets} hojas analizadas)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetFill}
                    className="text-[10px] font-black text-red-600 hover:underline uppercase tracking-wider"
                  >
                    Cambiar archivo
                  </button>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-slate-800">{analysis.totalSheets}</p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase">Hojas SAPRED</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-emerald-700">{analysis.totalMatchedStudents}</p>
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Emparejados</p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-center">
                    <p className="text-lg font-black text-indigo-700">{analysis.totalCellsWritten}</p>
                    <p className="text-[9px] font-bold text-indigo-600 uppercase">Notas a Llenar</p>
                  </div>
                  <div className={`border rounded-2xl p-3 text-center ${analysis.hasBlockingErrors ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"}`}>
                    <p className={`text-lg font-black ${analysis.hasBlockingErrors ? "text-red-700" : "text-emerald-700"}`}>
                      {analysis.novelties.filter(n => n.blocking).length}
                    </p>
                    <p className={`text-[9px] font-bold uppercase ${analysis.hasBlockingErrors ? "text-red-600" : "text-emerald-600"}`}>
                      Novedades Bloqueantes
                    </p>
                  </div>
                </div>

                {/* Regla Todo o Nada */}
                {analysis.hasBlockingErrors && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-red-800 font-black text-xs uppercase tracking-wider">
                        <ShieldAlert size={16} className="text-red-600 shrink-0" />
                        Regla de Gobernanza (&quot;Todo o Nada&quot;) · Descarga Bloqueada
                      </div>
                      <div className="flex flex-wrap gap-2 self-start sm:self-auto">
                        {onUpdateStudent && analysis.novelties.some(n => (n.type === "DATOS_MODIFICADOS" && n.suggestedFix) || (n.type === "NO_EXISTE_EN_EDUMANAGER" && n.suggestedCodeFix)) && (
                          <button
                            type="button"
                            disabled={isFixingNames}
                            onClick={handleSyncModifiedNamesToDB}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                          >
                            {isFixingNames ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                            Corregir Nombres/Códigos en BD
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => downloadSapredNoveltiesExcel(analysis.novelties)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <Download size={13} /> Descargar Novedades (.xlsx)
                        </button>
                      </div>
                    </div>
                    <p className="text-[11px] text-red-700 font-medium">
                      Se detectaron diferencias entre el archivo SAPRED y la matrícula de EduManager (ingresos nuevos, retiros o códigos no encontrados). Corrige las novedades para habilitar la exportación.
                    </p>
                    <div className="max-h-44 overflow-y-auto bg-white/90 rounded-xl border border-red-100 divide-y divide-red-100">
                      {analysis.novelties.slice(0, 50).map((nov, i) => (
                        <div key={i} className="p-2.5 text-[10px] flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-2 font-bold text-red-900">
                            <span>[{nov.sheetName}] {nov.studentName || nov.codigo}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {nov.type === "FALTA_EN_SAPRED" && nov.studentId && onRemoveStudent && (
                                <button
                                  type="button"
                                  disabled={isFixingNames}
                                  onClick={() => handleRemoveMissingStudent(nov.studentId!, nov.studentName, nov.codigo)}
                                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer"
                                >
                                  Borrar de BD
                                </button>
                              )}
                              <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px]">{nov.type}</span>
                            </div>
                          </div>
                          <span className="text-red-700">{nov.detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resumen por hoja */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead className="bg-slate-50 font-black text-slate-600 uppercase border-b border-slate-200 sticky top-0">
                        <tr>
                          <th className="p-2.5">Hoja</th>
                          <th className="p-2.5">Salón</th>
                          <th className="p-2.5">Asignatura</th>
                          <th className="p-2.5 text-center">Emparejados</th>
                          <th className="p-2.5 text-center">Notas</th>
                          <th className="p-2.5 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analysis.sheetResults.map((sh) => (
                          <tr key={sh.sheetName} className="hover:bg-slate-50/70">
                            <td className="p-2.5 font-mono font-bold text-slate-800">{sh.sheetName}</td>
                            <td className="p-2.5 font-bold">{sh.roomKey}</td>
                            <td className="p-2.5">{sh.resolvedSubject}</td>
                            <td className="p-2.5 text-center font-bold">{sh.matchedCount}/{sh.totalSapredRows}</td>
                            <td className="p-2.5 text-center font-bold text-indigo-600">{sh.cellsWritten}</td>
                            <td className="p-2.5 text-center">
                              {sh.blockingErrorsCount > 0 ? (
                                <span className="text-red-700 bg-red-50 px-2 py-0.5 rounded-full font-bold">
                                  {sh.blockingErrorsCount} nov.
                                </span>
                              ) : (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                                  OK
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={analysis.hasBlockingErrors || isExporting}
                    onClick={handleDownloadFilled}
                    className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                  >
                    {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                    {analysis.hasBlockingErrors
                      ? "Bloqueado por Novedades"
                      : "Descargar .XLS Diligenciado y Guardar Orden"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <ArrowUpDown className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-slate-900">
                    Generación directa de libro .XLS compatible con SAPRED (hasta AUT)
                  </p>
                  <p>
                    Omite las columnas <code>PARC</code>, <code>REC</code> y <code>DEF</code>, y ordena automáticamente cada curso según el <strong>orden SAPRED guardado</strong> ({savedOrderCount} curso(s) registrados).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                  Alcance del Libro Multi-Hoja
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportScope("current_subject")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      exportScope === "current_subject"
                        ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="font-black text-xs text-slate-900 uppercase">Solo {selectedSubject}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Una hoja por cada grado-curso donde dictas {selectedSubject}.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportScope("all_teacher")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      exportScope === "all_teacher"
                        ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <p className="font-black text-xs text-slate-900 uppercase">Todos Mis Cursos y Materias</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Unifica en un solo .XLS todas las hojas de tu asignación horaria.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={isExporting}
                onClick={handleExportMultiSheet}
                className="min-h-[44px] px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
              >
                {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Descargar Libro .XLS Multi-Hoja (SAPRED)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
