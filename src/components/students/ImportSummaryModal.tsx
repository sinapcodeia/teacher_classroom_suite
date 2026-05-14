"use client";

import { 
  CheckCircle2, AlertTriangle, XCircle, 
  ArrowRight, Users, Hash, FileCheck, X
} from "lucide-react";

interface Novelty {
  student: string;
  document: string;
  oldRoom: string;
  newRoom: string;
}

interface ImportSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    total: number;
    success: number;
    novelties: Novelty[];
    errors: string[];
  };
}

export default function ImportSummaryModal({ isOpen, onClose, stats }: ImportSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-on-surface/40 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 flex flex-col max-h-[85vh]">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150"><FileCheck size={140} /></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Resultados de Sincronización</h3>
            <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.3em]">Módulo de Gestión de Datos Maestro</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-full transition-all relative z-10">
            <X size={24} />
          </button>
        </div>

        {/* STATS STRIP */}
        <div className="grid grid-cols-3 border-b border-outline-variant">
          <div className="p-6 text-center border-r border-outline-variant">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Procesados</p>
            <p className="text-3xl font-black text-slate-800">{stats.total}</p>
          </div>
          <div className="p-6 text-center border-r border-outline-variant bg-emerald-50/30">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Vinculados</p>
            <p className="text-3xl font-black text-emerald-600">{stats.success}</p>
          </div>
          <div className="p-6 text-center bg-rose-50/30">
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Errores</p>
            <p className="text-3xl font-black text-rose-600">{stats.errors.length}</p>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* NOVELTIES */}
          {stats.novelties.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={18} />
                </div>
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest">Novedades de Traslado ({stats.novelties.length})</h4>
              </div>
              <div className="space-y-2">
                {stats.novelties.map((n, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-amber-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-[11px] font-black text-on-surface uppercase leading-tight">{n.student}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Doc: {n.document}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{n.oldRoom}</span>
                      <ArrowRight size={12} className="text-slate-300" />
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest">{n.newRoom}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ERRORS */}
          {stats.errors.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <XCircle size={18} />
                </div>
                <h4 className="text-[12px] font-black text-slate-800 uppercase tracking-widest text-rose-600">Estudiantes No Encontrados ({stats.errors.length})</h4>
              </div>
              <div className="p-5 rounded-3xl bg-rose-50 border border-rose-100">
                <p className="text-[10px] text-rose-800 font-medium leading-relaxed">
                  Los siguientes números de documento no existen en la base de datos maestra institucional. Favor contactar a Secretaría Académica.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {stats.errors.map((err, i) => (
                    <span key={i} className="px-3 py-1 bg-white border border-rose-200 text-rose-600 rounded-lg text-[10px] font-bold font-mono">
                      {err}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stats.novelties.length === 0 && stats.errors.length === 0 && (
            <div className="py-12 text-center space-y-4">
               <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200 animate-bounce">
                  <CheckCircle2 size={40} />
               </div>
               <div>
                  <p className="text-sm font-black text-slate-800 uppercase italic">Sincronización Perfecta</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Todos los registros se procesaron sin novedades.</p>
               </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-8 border-t border-outline-variant bg-slate-50 flex justify-between items-center">
          <button 
            onClick={() => {
              const content = `REPORTE DE NOVEDADES DE SINCRONIZACIÓN\n
Total Procesados: ${stats.total}
Éxitos: ${stats.success}
Errores: ${stats.errors.length}\n\n
NOVEDADES DE TRASLADO:\n${stats.novelties.map(n => `- ${n.student} (Doc: ${n.document}): ${n.oldRoom} -> ${n.newRoom}`).join("\n")}\n\n
ERRORES (NO ENCONTRADOS EN BD MAESTRA):\n${stats.errors.join(", ")}\n\n
Generado por: IETABA Enterprise Suite
Fecha: ${new Date().toLocaleString()}`;
              
              const blob = new Blob([content], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `reporte_novedades_${Date.now()}.txt`;
              a.click();
            }}
            className="flex items-center gap-2 px-6 py-4 bg-white border border-outline-variant text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all shadow-sm"
          >
            Descargar Reporte Oficial
          </button>
          <button 
            onClick={onClose}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
