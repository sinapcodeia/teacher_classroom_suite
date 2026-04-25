"use client";

import { useState } from "react";
import { RefreshCw, User, Calendar, Hash, GraduationCap, MapPin } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function StudentProfile({ id }: { id: string }) {
  const { students } = useApp();
  const [activeTab, setActiveTab] = useState<"grades" | "attendance" | "notes">("grades");
  
  const student = students.find(s => s.id === id);

  if (!student) {
    return (
      <div className="bg-white border border-outline-variant rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-on-surface-variant opacity-40 italic">
        <User size={64} className="mb-4" />
        <p className="font-black uppercase tracking-widest text-sm">Selecciona un estudiante</p>
      </div>
    );
  }

  const fullName = `${student.primerApellido} ${student.segundoApellido} ${student.primerNombre} ${student.segundoNombre}`;

  return (
    <div className="bg-white border border-outline-variant rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Profile Header - Premium Style */}
      <div className="p-8 bg-surface-container-high relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><User size={120} /></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-primary text-white flex items-center justify-center text-3xl font-black shadow-2xl shadow-primary/30 border-4 border-white/20">
            {student.primerApellido[0]}{student.primerNombre[0]}
          </div>
          <div>
            <h2 className="text-2xl font-black text-on-surface uppercase tracking-tighter leading-tight">{fullName}</h2>
            <div className="flex flex-wrap items-center gap-3 mt-2">
               <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">GRADO {student.grado}</span>
               <span className="px-3 py-1 bg-secondary/10 text-secondary text-[10px] font-black rounded-lg uppercase tracking-widest">{student.tipoDocumento}: {student.nroDocumento}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Details Bar */}
      <div className="grid grid-cols-3 divide-x divide-outline-variant border-b border-outline-variant bg-surface-container-low">
        <div className="p-4 flex flex-col items-center gap-1">
          <Calendar size={16} className="text-primary" />
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Nacimiento</span>
          <span className="text-[10px] font-bold uppercase">{student.fechaNacimiento}</span>
        </div>
        <div className="p-4 flex flex-col items-center gap-1">
          <Hash size={16} className="text-secondary" />
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Género</span>
          <span className="text-[10px] font-bold uppercase">{student.genero === 'F' ? 'FEMENINO' : 'MASCULINO'}</span>
        </div>
        <div className="p-4 flex flex-col items-center gap-1">
          <MapPin size={16} className="text-tertiary" />
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-tighter">Sede</span>
          <span className="text-[10px] font-bold uppercase">SEDE #01</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant bg-white">
        {(["grades", "attendance", "notes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${
              activeTab === tab 
                ? "text-primary" 
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            {tab === "grades" ? "Notas Académicas" : tab === "attendance" ? "Control Asistencia" : "Observaciones"}
            {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-8 space-y-8 flex-1">
        {activeTab === "grades" && (
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-on-surface uppercase tracking-[0.2em] border-l-4 border-primary pl-3">Calificaciones Vigentes</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-surface-container-low p-6 rounded-[1.5rem] border border-outline-variant/50 group hover:border-primary transition-all">
                <p className="text-[10px] uppercase font-black text-on-surface-variant mb-2 opacity-60">Promedio General</p>
                <div className="flex items-end gap-2">
                   <span className="text-4xl font-black text-primary leading-none">{student.avgGrade.toFixed(1)}</span>
                   <span className="text-[10px] font-bold text-on-surface-variant mb-1 uppercase tracking-widest">/ 5.0</span>
                </div>
              </div>
              <div className="bg-surface-container-low p-6 rounded-[1.5rem] border border-outline-variant/50 group hover:border-secondary transition-all">
                <p className="text-[10px] uppercase font-black text-on-surface-variant mb-2 opacity-60">Rango Actual</p>
                <span className="text-lg font-black text-secondary uppercase tracking-tighter leading-none">Desempeño Alto</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Acción Rápida</label>
              <button className="w-full py-4 bg-surface-container-high border-2 border-dashed border-outline-variant rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                 <Plus size={16} /> Agregar Nueva Nota
              </button>
            </div>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="space-y-6">
             <div className="bg-white border border-outline-variant rounded-[1.5rem] p-6 space-y-4">
              <h3 className="text-[10px] font-black text-on-surface uppercase border-b border-outline-variant pb-4 tracking-widest">Historial Mensual</h3>
              {[
                { date: "HOY", status: "Presente", color: "bg-secondary" },
                { date: "AYER", status: "Presente", color: "bg-secondary" },
                { date: "22 ABRIL", status: "Tarde", color: "bg-tertiary" },
              ].map((entry, i) => (
                <div key={i} className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${entry.color} shadow-lg shadow-${entry.color}/20`}></div>
                    <span className="text-[11px] font-black uppercase">{entry.date}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-surface-container px-3 py-1 rounded-lg">{entry.status}</span>
                </div>
              ))}
            </div>
            <div className="bg-primary/5 p-6 rounded-[1.5rem] border border-primary/20 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">Asistencia Total</p>
                  <p className="text-2xl font-black text-on-surface uppercase leading-tight">{student.attendance}</p>
               </div>
               <GraduationCap size={40} className="text-primary/20" />
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-6">
            <h4 className="text-[11px] font-black text-on-surface uppercase tracking-[0.2em] border-l-4 border-primary pl-3">Observaciones del Docente</h4>
            <textarea 
              className="w-full p-6 bg-surface-container-low border border-outline-variant rounded-[2rem] text-xs font-bold uppercase tracking-tight outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary resize-none h-40 transition-all" 
              placeholder="Escribe aquí novedades sobre el comportamiento o rendimiento del estudiante..."
            ></textarea>
            <button className="w-full py-4 bg-on-surface text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:opacity-90 active:scale-95 transition-all">
              Guardar Observación
            </button>
          </div>
        )}
      </div>

      <div className="p-8 bg-surface-container-lowest border-t border-outline-variant">
          <p className="text-center text-[10px] text-secondary font-black flex items-center justify-center gap-2 uppercase tracking-[0.3em]">
            <RefreshCw size={14} className="animate-spin" />
            Sincronización 360° Activa
          </p>
      </div>
    </div>
  );
}

function Plus({size}: {size: number}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
