"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { X, User, BarChart3, Cake, Phone } from "lucide-react";

export default function StudentProfileModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!student || !mounted) return null;

  const formatExcelDate = (dateVal: string | number) => {
    if (!dateVal) return "NO REGISTRADO";
    const strVal = String(dateVal);
    // Si es un número serial de Excel (ej. 42437)
    if (!isNaN(Number(strVal)) && Number(strVal) > 10000) {
      const date = new Date((Number(strVal) - 25569) * 86400 * 1000);
      return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    // Si ya es una fecha (ej. 2006-03-09)
    try {
      const date = new Date(strVal);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch {}
    return strVal; // Fallback al texto crudo si falla todo
  };

  const formattedDate = formatExcelDate(student.fechaNacimiento);

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden z-10 animate-in zoom-in-95 duration-300">
        {/* Left sidebar */}
        <div className="md:w-[200px] shrink-0 bg-primary text-white p-8 flex flex-col items-center gap-4 relative overflow-hidden">
          <div className="w-20 h-20 rounded-3xl bg-white/20 border-4 border-white/30 flex items-center justify-center text-3xl font-black relative z-10">
            {student.primerApellido?.[0]}{student.primerNombre?.[0]}
          </div>
          <h3 className="text-sm font-black text-center uppercase leading-snug relative z-10">
            {student.primerNombre}<br />{student.primerApellido}
          </h3>
          <span className="text-[8px] font-black uppercase opacity-60 tracking-widest relative z-10">IETABA</span>
          <div className="mt-auto w-full space-y-2 relative z-10">
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
              <p className="text-[7px] uppercase opacity-60 font-black">Grado</p>
              <p className="text-xs font-black">{student.grado}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center border border-white/10">
              <p className="text-[7px] uppercase opacity-60 font-black">Curso</p>
              <p className="text-xs font-black">{student.curso}</p>
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[85vh]">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-surface-container-low rounded-full transition-all z-20 text-on-surface-variant">
            <X size={20} />
          </button>

          <div className="space-y-8 mt-4 md:mt-0">
            {/* Personal Info */}
            <section>
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                <User size={13} /> Información Personal
              </h4>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                {[
                  { label: "Documento", value: `${student.tipoDocumento} ${student.nroDocumento}` },
                  { label: "Género", value: student.genero === "M" ? "Masculino" : "Femenino" },
                  { label: "Fecha Nacimiento", value: formattedDate.toUpperCase() },
                  { label: "Acudiente", value: student.acudienteNombre || "No registrado" },
                  { label: "Teléfono", value: student.acudienteTelefono || "No registrado", isPhone: true },
                ].map(item => (
                  <div key={item.label} className="space-y-0.5">
                    <p className="text-[7px] font-black text-on-surface-variant uppercase opacity-60">{item.label}</p>
                    {(item as any).isPhone ? (
                      <a href={`tel:${item.value}`} className="text-[11px] font-black uppercase text-primary hover:underline">{item.value}</a>
                    ) : (
                      <p className="text-[11px] font-black uppercase">{item.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Academic */}
            <section>
              <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                <BarChart3 size={13} /> Rendimiento Académico
              </h4>
              <div className="space-y-4">
                {[
                  { label: "Promedio General", value: (student.avgGrade || 0).toFixed(1), max: 5, pct: ((student.avgGrade || 0) / 5) * 100, color: "bg-secondary" },
                  { label: "Asistencia", value: "95%", max: 100, pct: 95, color: "bg-primary" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[9px] font-black uppercase mb-1.5">
                      <span className="text-on-surface-variant">{item.label}</span>
                      <span>{item.value}</span>
                    </div>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-outline-variant">
              <button className="flex-1 py-3 bg-surface-container text-on-surface-variant rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-surface-container-high transition-all">
                Descargar Ficha
              </button>
              <button className="flex-1 py-3 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg">
                Ver Boletín
              </button>
              {student.acudienteTelefono && (
                <a href={`tel:${student.acudienteTelefono}`} className="flex-1 py-3 bg-secondary text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg text-center flex items-center justify-center gap-1">
                  <Phone size={13} /> Llamar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
