"use client";

import React, { useState, useEffect } from "react";
import { 
  X, UserCheck, UserX, AlertTriangle, ShieldAlert, 
  CheckCircle2, Loader2, HeartHandshake, History, FileText 
} from "lucide-react";
import { Student, useApp, EstadoMatricula } from "@/context/AppContext";
import { normalizeUpperCaseName } from "@/lib/constants";

interface StudentStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess?: () => void;
}

const STATUS_OPTIONS: {
  value: EstadoMatricula;
  label: string;
  badge: string;
  color: string;
  desc: string;
  icon: string;
  isActive: boolean;
}[] = [
  {
    value: "MATRICULADO",
    label: "Matriculado (Activo)",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    color: "emerald",
    desc: "Estudiante en formación regular. Aparece en el calificador y listas de asistencia.",
    icon: "🟢",
    isActive: true,
  },
  {
    value: "RETIRADO",
    label: "Retirado",
    badge: "bg-orange-100 text-orange-800 border-orange-300",
    color: "orange",
    desc: "Retiro voluntario o solicitado por acudiente. Se oculta del calificador activo.",
    icon: "🟠",
    isActive: false,
  },
  {
    value: "DESERTOR",
    label: "Desertor / No Asiste",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    color: "amber",
    desc: "Inasistencia prolongada sin justificación formal. Registro de alerta SIMAT.",
    icon: "🟡",
    isActive: false,
  },
  {
    value: "TRASLADADO",
    label: "Trasladado",
    badge: "bg-sky-100 text-sky-800 border-sky-300",
    color: "sky",
    desc: "Traslado a otra sede, institución educativa o resguardo indígena.",
    icon: "🔵",
    isActive: false,
  },
  {
    value: "FALLECIDO",
    label: "Fallecido",
    badge: "bg-slate-200 text-slate-800 border-slate-400",
    color: "slate",
    desc: "Novedad luctuosa definitiva. Cierre de hoja de vida institucional.",
    icon: "⚫",
    isActive: false,
  },
  {
    value: "SUSPENDIDO",
    label: "Suspendido Temporal",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    color: "purple",
    desc: "Medida pedagógica temporal según Manual de Convivencia y Ley 1620.",
    icon: "🟣",
    isActive: false,
  },
];

export default function StudentStatusModal({
  isOpen,
  onClose,
  student,
  onSuccess
}: StudentStatusModalProps) {
  const { updateStudent, profile } = useApp();
  
  const [selectedStatus, setSelectedStatus] = useState<EstadoMatricula>("MATRICULADO");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (student) {
      const current = (student.estadoMatricula as EstadoMatricula) || 
        (student.isActive !== false ? "MATRICULADO" : "RETIRADO");
      setSelectedStatus(current);
      setMotivo(student.motivoNovedad || "");
      setToast(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const currentStatusObj = STATUS_OPTIONS.find(s => s.value === selectedStatus) || STATUS_OPTIONS[0];
  const isActivating = selectedStatus === "MATRICULADO";
  const studentFullName = `${student.primerApellido || ""} ${student.segundoApellido || ""} ${student.primerNombre || ""} ${student.segundoNombre || ""}`.trim();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isActivating && !motivo.trim()) {
      setToast({ msg: "Debe registrar un motivo o justificación para la novedad.", ok: false });
      return;
    }

    setSaving(true);
    try {
      await updateStudent(student.id, {
        estadoMatricula: selectedStatus,
        isActive: isActivating,
        motivoNovedad: normalizeUpperCaseName(motivo) || (isActivating ? "REINCORPORACIÓN REGULAR" : "NOVEDAD REGISTRADA"),
        fechaNovedad: new Date().toISOString(),
        docenteNovedad: profile?.name || "DOCENTE",
        audit: {
          createdBy: student.audit?.createdBy || "SISTEMA",
          createdAt: student.audit?.createdAt || new Date().toISOString(),
          updatedBy: profile?.name || "SISTEMA",
          updatedAt: new Date().toISOString()
        }
      });

      setToast({ 
        msg: isActivating 
          ? "¡Estudiante reincorporado como ACTIVO con éxito!" 
          : `¡Estudiante marcado como ${currentStatusObj.label.toUpperCase()} con éxito!`, 
        ok: true 
      });

      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1300);
    } catch (err: any) {
      setToast({ msg: "Error al actualizar estado: " + (err.message || "Intente de nuevo"), ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white p-6 md:p-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>

          <div className="space-y-1.5 pr-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-widest border border-teal-400/30">
              <ShieldAlert size={12} /> Gestión del Ciclo de Vida Escolar (SIMAT)
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              Estado de Matrícula
            </h2>
            <p className="text-xs text-slate-300 font-medium truncate">
              Estudiante: <strong className="text-white">{studentFullName}</strong> ({student.grado} - {student.curso})
            </p>
          </div>
        </div>

        {/* Toast Notificación */}
        {toast && (
          <div className={`px-6 py-3 text-xs font-black flex items-center gap-2 ${
            toast.ok ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200" : "bg-rose-50 text-rose-800 border-b border-rose-200"
          }`}>
            {toast.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6">
          
          {/* Selector de Estado */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Seleccione el Nuevo Estado del Estudiante:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {STATUS_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setSelectedStatus(opt.value)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl text-left border transition-all ${
                    selectedStatus === opt.value
                      ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/20"
                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="text-lg shrink-0 mt-0.5">{opt.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-black uppercase tracking-wider ${
                      selectedStatus === opt.value ? "text-white" : "text-slate-800"
                    }`}>
                      {opt.label}
                    </p>
                    <p className={`text-[10px] line-clamp-2 mt-0.5 ${
                      selectedStatus === opt.value ? "text-slate-300 font-medium" : "text-slate-500 font-normal"
                    }`}>
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Banner Explicativo de Protección de Datos */}
          <div className={`p-4 rounded-2xl border text-xs space-y-1 ${
            isActivating 
              ? "bg-emerald-50 border-emerald-200 text-emerald-900" 
              : "bg-amber-50 border-amber-200 text-amber-900"
          }`}>
            <div className="flex items-center gap-2 font-black uppercase tracking-wider text-[10px]">
              {isActivating ? <UserCheck size={14} className="text-emerald-600" /> : <ShieldAlert size={14} className="text-amber-600" />}
              <span>{isActivating ? "Activación de Operaciones de Aula" : "Protección Anti-Errores de Calificación"}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {isActivating
                ? "Al marcarlo como ACTIVO, el estudiante volverá a figurar en las listas de asistencia, calificaciones y planillas de todos sus docentes con sus notas previas intactas."
                : "Al marcarlo como INACTIVO / RETIRADO, el sistema lo ocultará del Calificador en Vivo y listas diarias para evitar notas por error. Su historial y notas previas NUNCA se borran."
              }
            </p>
          </div>

          {/* Motivo / Justificación */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Motivo o Justificación de la Novedad {isActivating ? "(Opcional)" : "*"}
            </label>
            <textarea
              required={!isActivating}
              rows={2}
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder={isActivating ? "Ej. Reincorporación escolar tras regreso de temporada de cosecha..." : "Ej. Solicitud escrita de retiro por cambio de domicilio a Tumaco..."}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none uppercase"
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-xl border border-slate-200 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-6 py-3 rounded-xl text-white text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95 ${
                isActivating 
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30" 
                  : "bg-slate-900 hover:bg-slate-800 shadow-slate-900/30"
              }`}
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Guardando...</>
              ) : (
                <><CheckCircle2 size={16} /> Confirmar Novedad</>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
