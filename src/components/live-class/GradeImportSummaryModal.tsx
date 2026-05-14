"use client";

import { 
  CheckCircle2, AlertTriangle, XCircle, 
  FileCheck, X, RefreshCw, UserCheck, AlertCircle, Calculator
} from "lucide-react";

interface GradeImportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    total: number;
    success: number;
    modified: string[]; // List of student names whose grades were updated
    errors: string[];   // List of document numbers not found
    studentResults?: any[];
  };
}

export default function GradeImportSummaryModal({ isOpen, onClose, stats }: GradeImportSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-on-surface/40 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
        
        {/* HEADER - Premium Dark Style */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150"><FileCheck size={140} /></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Resultados de Sincronización</h3>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.3em]">Módulo de Calificaciones Académicas</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all relative z-10">
            <X size={24} />
          </button>
        </div>

        {/* STATS STRIP - Startup Dashboard Style */}
        <div className="grid grid-cols-3 border-b border-outline-variant">
          <div className="p-6 text-center border-r border-outline-variant">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Filas</p>
            <p className="text-3xl font-black text-slate-800">{stats.total}</p>
          </div>
          <div className="p-6 text-center border-r border-outline-variant bg-blue-50/30">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Modificados</p>
            <div className="flex items-center justify-center gap-2">
              <RefreshCw size={20} className="text-blue-400" />
              <p className="text-3xl font-black text-blue-600">{stats.modified.length}</p>
            </div>
          </div>
          <div className="p-6 text-center bg-rose-50/30">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Inconsistencias</p>
            <p className="text-3xl font-black text-rose-600">{stats.errors.length}</p>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
          
          {/* MODIFICATIONS - What changed */}
          {stats.modified.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                  <UserCheck size={18} />
                </div>
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Registros Actualizados ({stats.modified.length})</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {stats.modified.slice(0, 10).map((name, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{name}</span>
                  </div>
                ))}
                {stats.modified.length > 10 && (
                  <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">+ {stats.modified.length - 10} registros más</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ERRORS - What went wrong */}
          {stats.errors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <AlertCircle size={18} />
                </div>
                <h4 className="text-[12px] font-black text-rose-600 uppercase tracking-widest">Inconsistencias Detectadas ({stats.errors.length})</h4>
              </div>
              <div className="p-5 rounded-[2rem] bg-rose-50 border border-rose-100 space-y-4">
                <p className="text-[10px] text-rose-800 font-bold uppercase tracking-wider opacity-60">
                  Los siguientes documentos no coinciden con la lista actual del curso:
                </p>
                <div className="flex flex-wrap gap-2">
                  {stats.errors.map((err, i) => (
                    <span key={i} className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black font-mono shadow-sm">
                      {err}
                    </span>
                  ))}
                </div>
                <p className="text-[9px] text-rose-600/60 font-medium italic mt-2">
                  * Verifique que esté subiendo la plantilla correspondiente a este Grado y Curso.
                </p>
              </div>
            </div>
          )}

          {/* DEFINITIVE REPORT - Startup Style Table */}
          {stats.studentResults && stats.studentResults.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <Calculator size={18} />
                </div>
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Reporte de Definitivas por Periodo</h4>
              </div>
              <div className="overflow-hidden border border-outline-variant rounded-3xl bg-white shadow-sm">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                      <th className="px-4 py-3 text-left">Estudiante</th>
                      <th className="px-4 py-3 text-center border-l border-white/10">P1</th>
                      <th className="px-4 py-3 text-center border-l border-white/10">P2</th>
                      <th className="px-4 py-3 text-center border-l border-white/10">P3</th>
                      <th className="px-4 py-3 text-center border-l border-white/10 bg-emerald-600">Final</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30">
                    {stats.studentResults.map((res, i) => {
                      const finalYear = Number(((res.p1 + res.p2 + res.p3) / 3).toFixed(1));
                      return (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 text-[10px] font-bold text-slate-700 uppercase truncate max-w-[200px]">{res.name}</td>
                          <td className={`px-4 py-2.5 text-center text-[10px] font-black ${res.p1 < 3 ? 'text-rose-600' : 'text-slate-400'}`}>{res.p1 || '-'}</td>
                          <td className={`px-4 py-2.5 text-center text-[10px] font-black ${res.p2 < 3 ? 'text-rose-600' : 'text-slate-400'}`}>{res.p2 || '-'}</td>
                          <td className={`px-4 py-2.5 text-center text-[10px] font-black ${res.p3 < 3 ? 'text-rose-600' : 'text-slate-400'}`}>{res.p3 || '-'}</td>
                          <td className={`px-4 py-2.5 text-center text-[10px] font-black bg-emerald-50/50 ${finalYear < 3 ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {finalYear || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUCCESS STATE (only if no errors and no results) */}
          {stats.errors.length === 0 && (!stats.studentResults || stats.studentResults.length === 0) && (
            <div className="py-12 text-center space-y-4">
               <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200/50 animate-in zoom-in duration-500">
                  <CheckCircle2 size={48} />
               </div>
               <div>
                  <p className="text-lg font-black text-slate-800 uppercase italic tracking-tighter">Sincronización Exitosa</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Base de datos actualizada correctamente.</p>
               </div>
            </div>
          )}
        </div>

        {/* FOOTER - Actionable */}
        <div className="p-8 border-t border-outline-variant bg-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-95"
          >
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
