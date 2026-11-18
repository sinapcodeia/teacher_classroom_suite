"use client";

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { useApp, ScheduleBlock } from "@/context/AppContext";
import {
  Calendar, Clock, BookOpen, GraduationCap, ArrowLeft,
  Printer, Download, Upload, Loader2, X, CheckCircle2, AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { parseSpreadsheetFileToObjects, SPREADSHEET_ACCEPT } from "@/lib/spreadsheetUtils";
import {
  downloadScheduleTemplate,
  downloadScheduleNoveltiesCSV,
  parseAndValidateScheduleCSV,
  verifyScheduleCollisionsInFirestore,
  ScheduleValidationIssue,
  ScheduleCollisionItem,
} from "@/lib/scheduleTemplate";
import { normalizeGrade } from "@/lib/constants";
import { printWeeklySchedule } from "@/lib/printService";

const DAYS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"];
const TIME_SLOTS = [
  "07:30 - 08:30",
  "08:30 - 09:30",
  "09:30 - 10:30",
  "10:30 - 11:00", // DESCANSO
  "11:00 - 11:50",
  "11:50 - 12:40",
  "12:40 - 13:30"
];

export default function HorarioPage() {
  const { schedule, profile, updateProfile, masterData, user } = useApp();
  const [mounted, setMounted] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    validBlocks: ScheduleBlock[];
    issues: ScheduleValidationIssue[];
    collisions: ScheduleCollisionItem[];
  } | null>(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (e.target) e.target.value = "";

    try {
      const rows = await parseSpreadsheetFileToObjects(file);
      const parsed = parseAndValidateScheduleCSV(
        rows,
        masterData.subjects
      );
      const collisions = await verifyScheduleCollisionsInFirestore(
        parsed.validBlocks,
        user?.uid || ""
      );
      setPreviewModal({
        validBlocks: parsed.validBlocks,
        issues: parsed.issues,
        collisions,
      });
    } catch (err) {
      console.error("Error leyendo archivo de horario Excel/CSV:", err);
      alert("No se pudo leer el archivo de horario. Sube un archivo Excel (.xlsx) o CSV válido.");
    }
  };

  const handleConfirmScheduleImport = async () => {
    if (
      !previewModal ||
      previewModal.validBlocks.length === 0 ||
      previewModal.issues.length > 0 ||
      previewModal.collisions.length > 0
    ) {
      return;
    }
    setIsSavingSchedule(true);
    try {
      const blocks = previewModal.validBlocks;
      const teachingGrades = [...new Set(blocks.map(b => normalizeGrade(b.grade)))];
      const teachingCourses = [
        ...new Set(
          blocks.map(b => {
            if (!b.course) return normalizeGrade(b.grade || "");
            if (b.course.includes("-")) return b.course;
            const cleanG = normalizeGrade(b.grade || "").replace("°", "").trim();
            return cleanG ? `${cleanG}-${b.course}` : b.course;
          })
        ),
      ].filter(Boolean);
      const teachingSubjectsList = [
        ...new Set(blocks.map(b => (b.subject || "").toUpperCase())),
      ];

      await updateProfile({
        teachingGrades,
        teachingCourses,
        teachingSubjectsList,
        weeklySchedule: blocks,
        isProfileComplete: true,
      });
      setPreviewModal(null);
    } finally {
      setIsSavingSchedule(false);
    }
  };

  if (!mounted) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest font-inter">
      <TopAppBar />
      
      <main className="pt-24 px-6 max-w-7xl mx-auto w-full pb-32">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="flex items-center gap-4">
             <Link href="/" className="p-3 bg-white border border-outline-variant rounded-2xl hover:bg-primary/5 hover:border-primary transition-all group">
                <ArrowLeft size={24} className="text-on-surface-variant group-hover:text-primary" />
             </Link>
             <div>
                <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight uppercase">Horario Institucional</h1>
                <p className="text-[10px] font-black text-on-surface-variant opacity-60 uppercase tracking-[0.3em] flex items-center gap-2">
                  <Calendar size={14} /> Gestión Semanal {profile.institution}
                </p>
             </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
             <button
               onClick={() => downloadScheduleTemplate("example")}
               className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center gap-2"
             >
                <Download size={16} /> Formato Ejemplo
             </button>
             <button
               onClick={() => downloadScheduleTemplate("blank")}
               className="px-4 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
             >
                <Download size={16} /> Formato en Blanco
             </button>
             <button
               onClick={() => downloadScheduleTemplate("current", profile.weeklySchedule || [])}
               className="px-4 py-3 bg-white border border-outline-variant text-on-surface-variant rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-surface-container-low transition-all flex items-center gap-2"
             >
                <Download size={16} /> Exportar Excel
             </button>
             <label className="px-5 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer">
                <Upload size={16} /> Subir Horario Excel
                <input
                  type="file"
                  accept={SPREADSHEET_ACCEPT}
                  className="hidden"
                  onChange={handleCSVUpload}
                />
             </label>
             <button
               onClick={() => printWeeklySchedule(profile.weeklySchedule || [], profile.name)}
               className="px-5 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
             >
                <Printer size={16} /> Imprimir PDF
             </button>
          </div>
        </div>

        {/* Schedule Grid */}
        <div className="bg-white border border-outline-variant rounded-2xl md:rounded-[3rem] shadow-2xl overflow-x-auto w-full max-w-full">
          <table className="w-full border-collapse min-w-[600px] md:min-w-[1000px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em]">
                <th className="px-4 md:px-8 py-4 md:py-6 border-r border-outline-variant/30 text-left w-32 md:w-48">HORA / DÍA</th>
                {DAYS.map(day => (
                  <th key={day} className="px-4 md:px-8 py-4 md:py-6 border-r border-outline-variant/30 text-center">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {TIME_SLOTS.map(slot => {
                const isDescanso = slot === "10:30 - 11:00";
                
                return (
                  <tr key={slot} className={`group ${isDescanso ? 'bg-surface-container-low' : 'hover:bg-surface-container-lowest'}`}>
                    <td className="px-4 md:px-8 py-4 md:py-6 border-r border-outline-variant/30 font-black text-[10px] md:text-[11px] text-on-surface-variant flex items-center gap-2 md:gap-3">
                       <Clock size={14} className="opacity-40" /> {slot}
                    </td>
                    {DAYS.map(day => {
                      if (isDescanso) {
                        return (
                          <td key={day} className="px-4 md:px-8 py-4 md:py-6 border-r border-outline-variant/30 text-center">
                            <span className="text-[10px] font-black text-on-surface-variant/40 uppercase tracking-[0.5em] italic">DESCANSO</span>
                          </td>
                        );
                      }

                      const entry = schedule.find(s => s.day === day && s.time === slot);
                      
                      return (
                        <td key={day} className="p-1 md:p-2 border-r border-outline-variant/30 align-top h-24 md:h-32">
                          {entry ? (
                            <Link 
                              href={`/clase-en-vivo?subject=${encodeURIComponent(entry.subject)}&grado=${encodeURIComponent(entry.grade)}&curso=${encodeURIComponent(entry.group)}`}
                              className={`h-full p-2 md:p-4 rounded-xl border border-black/5 shadow-sm flex flex-col justify-between transition-all hover:shadow-lg block cursor-pointer ${entry.color}`}
                            >
                               <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                     <BookOpen size={14} className="opacity-40" />
                                     <span className="text-[8px] font-black uppercase opacity-60">Grupo {entry.group}</span>
                                  </div>
                                  <p className="font-black text-[11px] leading-tight mt-1">{entry.subject}</p>
                               </div>
                               <div className="flex items-center gap-2 mt-4 pt-3 border-t border-black/5">
                                  <GraduationCap size={14} className="opacity-40" />
                                  <span className="text-[10px] font-black uppercase">
                                    {entry.grade} — {entry.group}
                                  </span>
                               </div>
                            </Link>
                          ) : (
                            <div className="h-full border-2 border-dashed border-outline-variant/20 rounded-2xl flex items-center justify-center">
                               <span className="text-[8px] font-black text-outline-variant uppercase tracking-widest opacity-30">Libre</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Card */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shadow-xl shadow-primary/20">
                 <BookOpen size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Carga Académica</p>
                 <p className="text-2xl font-black text-on-surface">{schedule.length} SESIONES / SEMANA</p>
              </div>
           </div>
           
           <div className="bg-secondary/5 border border-secondary/20 p-8 rounded-[2.5rem] flex items-center gap-6">
              <div className="w-16 h-16 rounded-3xl bg-secondary text-white flex items-center justify-center shadow-xl shadow-secondary/20">
                 <GraduationCap size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Población Estudiantil</p>
                 <p className="text-2xl font-black text-on-surface">11 GRADOS DIFERENTES</p>
              </div>
           </div>

           <div className="bg-white border border-outline-variant p-8 rounded-[2.5rem] flex items-center gap-6 shadow-xl">
              <div className="w-16 h-16 rounded-3xl bg-surface-container-high text-on-surface flex items-center justify-center">
                 <Clock size={32} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Jornada Laboral</p>
                 <p className="text-2xl font-black text-on-surface">07:30 AM — 01:30 PM</p>
              </div>
           </div>
        </div>
      </main>

      {/* Modal de Vista Previa y Validación de Horario CSV */}
      {previewModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] max-w-2xl w-full p-8 shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
                  Formato Estandarizado de Horario
                </span>
                <h3 className="text-xl font-black uppercase italic text-slate-900 mt-1">
                  Confirmar Carga de Horario Semanal
                </h3>
              </div>
              <button
                onClick={() => setPreviewModal(null)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
              {(previewModal.issues.length > 0 || previewModal.collisions.length > 0) && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-black uppercase text-[10px] tracking-wider flex items-center gap-1.5 text-rose-800">
                        <AlertTriangle size={14} /> Regla de Gobernanza Institucional · Carga Bloqueada ({previewModal.issues.length + previewModal.collisions.length} novedad{previewModal.issues.length + previewModal.collisions.length === 1 ? "" : "es"})
                      </p>
                      <p className="text-[11px] font-medium text-rose-700 mt-0.5">
                        No se cargará ningún bloque horario hasta que todas las novedades de formato o cruces de salón sean corregidos en el archivo Excel/CSV.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadScheduleNoveltiesCSV(previewModal.issues, previewModal.collisions)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider hover:bg-rose-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <Download size={12} /> Descargar Novedades Excel
                    </button>
                  </div>

                  {previewModal.issues.length > 0 && (
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {previewModal.issues.map((iss, idx) => (
                        <li key={idx}>
                          <span className="font-black">Fila #{iss.rowNumber} ({iss.day} {iss.slot}){iss.field ? ` [${iss.field}]` : ""}:</span> {iss.message}
                        </li>
                      ))}
                    </ul>
                  )}

                  {previewModal.collisions.length > 0 && (
                    <div className="pt-2 border-t border-rose-200/70 space-y-1">
                      <p className="font-black uppercase text-[10px] tracking-wider text-rose-800">
                        Cruces de salón detectados con otros docentes ({previewModal.collisions.length}):
                      </p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                        {previewModal.collisions.map((c, idx) => (
                          <li key={idx}>
                            <span className="font-black">{c.block.day} {c.block.startTime} – {c.block.endTime} · Salón {c.block.course}:</span> ya asignado a <span className="font-black">{c.conflictWith}</span> ({c.block.subject})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {previewModal.validBlocks.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 font-black uppercase text-[10px] text-slate-600 sticky top-0">
                      <tr>
                        <th className="p-3">Día</th>
                        <th className="p-3">Franja</th>
                        <th className="p-3">Asignatura</th>
                        <th className="p-3 text-center">Grado / Curso</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewModal.validBlocks.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 font-black text-slate-800">{b.day}</td>
                          <td className="p-3 font-mono text-slate-600">{b.startTime} – {b.endTime}</td>
                          <td className="p-3 font-bold text-indigo-700">{b.subject}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{b.grade} · {b.course}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-xs font-bold uppercase text-slate-400">
                  No se encontraron bloques válidos en el archivo. Descarga el Formato Ejemplo para ver la estructura requerida.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setPreviewModal(null)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                disabled={
                  previewModal.validBlocks.length === 0 ||
                  previewModal.issues.length > 0 ||
                  previewModal.collisions.length > 0 ||
                  isSavingSchedule
                }
                onClick={handleConfirmScheduleImport}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                {isSavingSchedule ? (
                  <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                ) : previewModal.issues.length > 0 || previewModal.collisions.length > 0 ? (
                  <><AlertTriangle size={14} /> Corrige las Novedades para Guardar</>
                ) : (
                  <><CheckCircle2 size={14} /> Guardar Horario ({previewModal.validBlocks.length} clases)</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavBar />

      <style jsx global>{`
        @media print {
          .no-print, header, footer, nav, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            max-width: 100% !important;
          }
          .bg-white {
            border: none !important;
            box-shadow: none !important;
          }
          table {
            min-width: 100% !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}
