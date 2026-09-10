"use client";

import React, { useState, useEffect } from "react";
import { 
  X, Phone, User, Users, Heart, MapPin, Mail, 
  MessageSquare, CheckCircle2, ShieldCheck, AlertCircle, 
  Sparkles, Save, Loader2 
} from "lucide-react";
import { Student, useApp, ParentescoAcudiente } from "@/context/AppContext";
import { 
  normalizeUpperCaseName, 
  normalizeEmail, 
  isValidEmail, 
  normalizePhone, 
  isValidPhone, 
  formatPhoneDisplay 
} from "@/lib/constants";

interface GuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess?: () => void;
}

const PARENTESCO_OPTIONS: { value: ParentescoAcudiente; label: string; icon: string }[] = [
  { value: "MADRE", label: "Madre", icon: "👩" },
  { value: "PADRE", label: "Padre", icon: "👨" },
  { value: "ABUELO(A)", label: "Abuelo / Abuela", icon: "👵" },
  { value: "TÍO(A)", label: "Tío / Tía", icon: "🧑‍🤝‍🧑" },
  { value: "HERMANO(A)", label: "Hermano / Hermana", icon: "👦" },
  { value: "TUTOR LEGAL", label: "Tutor(a) Legal / Custodio", icon: "⚖️" },
  { value: "OTRO", label: "Otro Familiar / Acudiente", icon: "👤" },
];

export default function GuardianModal({
  isOpen,
  onClose,
  student,
  onSuccess
}: GuardianModalProps) {
  const { updateStudent, profile } = useApp();
  
  const [parentesco, setParentesco] = useState<ParentescoAcudiente>("MADRE");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [telefonoSec, setTelefonoSec] = useState("");
  const [email, setEmail] = useState("");
  const [vereda, setVereda] = useState("");
  const [observaciones, setObservaciones] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (student) {
      const currentFull = (student.acudienteNombre || "").trim();
      let defaultNombres = student.acudienteNombres || "";
      let defaultApellidos = student.acudienteApellidos || "";

      if (!defaultNombres && !defaultApellidos && currentFull) {
        const parts = currentFull.split(" ");
        if (parts.length >= 2) {
          defaultNombres = parts.slice(0, Math.ceil(parts.length / 2)).join(" ");
          defaultApellidos = parts.slice(Math.ceil(parts.length / 2)).join(" ");
        } else {
          defaultNombres = currentFull;
        }
      }

      setParentesco((student.acudienteParentesco as ParentescoAcudiente) || "MADRE");
      setNombres(defaultNombres);
      setApellidos(defaultApellidos);
      setTelefono(student.acudienteTelefono || "");
      setTelefonoSec(student.acudienteTelefonoSec || "");
      setEmail(student.acudienteEmail || "");
      setVereda(student.acudienteVereda || "");
      setObservaciones(student.acudienteObservaciones || "");
      setToast(null);
    }
  }, [student, isOpen]);

  if (!isOpen || !student) return null;

  const studentFullName = `${student.primerApellido || ""} ${student.segundoApellido || ""} ${student.primerNombre || ""} ${student.segundoNombre || ""}`.trim();
  const cleanPhone = normalizePhone(telefono);
  const isPhoneValid = isValidPhone(cleanPhone);
  const cleanEmail = normalizeEmail(email);
  const isEmailValid = cleanEmail ? isValidEmail(cleanEmail) : true;

  const handleTestWhatsApp = () => {
    if (!cleanPhone) {
      alert("Por favor ingrese un número de celular primero.");
      return;
    }
    const formatted = cleanPhone.startsWith("57") ? cleanPhone : `57${cleanPhone}`;
    const testMsg = `Cordial saludo ${nombres || "Acudiente"}, nos comunicamos de la IETABA respecto al seguimiento escolar de ${student.primerNombre} ${student.primerApellido}.`;
    window.open(`https://wa.me/${formatted}?text=${encodeURIComponent(testMsg)}`, "_blank");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNombres = normalizeUpperCaseName(nombres);
    const cleanApellidos = normalizeUpperCaseName(apellidos);

    if (!cleanNombres) {
      setToast({ msg: "El nombre del acudiente es obligatorio.", ok: false });
      return;
    }

    if (cleanEmail && !isValidEmail(cleanEmail)) {
      setToast({ msg: "El formato de correo electrónico no es válido (ej: acudiente@gmail.com).", ok: false });
      return;
    }

    setSaving(true);
    try {
      const fullDisplay = `${cleanNombres} ${cleanApellidos}`.trim();

      await updateStudent(student.id, {
        acudienteNombres: cleanNombres,
        acudienteApellidos: cleanApellidos,
        acudienteParentesco: parentesco,
        acudienteNombre: fullDisplay,
        acudienteTelefono: cleanPhone ? formatPhoneDisplay(cleanPhone) : "",
        acudienteTelefonoSec: normalizePhone(telefonoSec),
        acudienteEmail: cleanEmail,
        acudienteVereda: normalizeUpperCaseName(vereda),
        acudienteObservaciones: observaciones.trim(),
        acudienteUltimaActualizacion: {
          fecha: new Date().toISOString(),
          docente: profile?.name || "DOCENTE"
        }
      });

      setToast({ msg: "¡Información del acudiente estandarizada y guardada con éxito!", ok: true });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setToast({ msg: "Error al guardar: " + (err.message || "Intente de nuevo"), ok: false });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[130] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        
        {/* Header con gradiente institucional */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-6 md:p-8 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
          >
            <X size={18} />
          </button>

          <div className="space-y-1.5 pr-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-black uppercase tracking-widest border border-teal-400/30">
              <Users size={12} /> CRM de Acudientes & Familia IETABA
            </div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              Ficha del Acudiente
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
            {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{toast.msg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-6 md:p-8 space-y-5">
          
          {/* Parentesco */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Parentesco con el Estudiante *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PARENTESCO_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setParentesco(opt.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-left border ${
                    parentesco === opt.value
                      ? "bg-teal-50 border-teal-500 text-teal-900 font-black shadow-xs ring-2 ring-teal-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Nombres del Acudiente * (Mayúsculas)
              </label>
              <input
                required
                type="text"
                value={nombres}
                onChange={e => setNombres(e.target.value.toUpperCase())}
                placeholder="Ej. MARÍA ELENA"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Apellidos del Acudiente
              </label>
              <input
                type="text"
                value={apellidos}
                onChange={e => setApellidos(e.target.value.toUpperCase())}
                placeholder="Ej. PAI NASTACUAS"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
              />
            </div>
          </div>

          {/* Celular Principal & Correo Electrónico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Celular */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                  Celular / WhatsApp *
                </label>
                {cleanPhone && (
                  <button
                    type="button"
                    onClick={handleTestWhatsApp}
                    className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-1 uppercase tracking-wider"
                  >
                    <MessageSquare size={11} /> Probar
                  </button>
                )}
              </div>
              <div className="relative">
                <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="300 000 0000"
                  className={`w-full pl-9 pr-3 py-3 bg-slate-50 border rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 ${
                    cleanPhone && !isPhoneValid 
                      ? "border-amber-300 focus:ring-amber-500 text-amber-900" 
                      : "border-slate-200 focus:ring-teal-500 text-slate-800"
                  }`}
                />
              </div>
              {cleanPhone && !isPhoneValid && (
                <p className="text-[9px] font-bold text-amber-600">Recomendado: 10 dígitos (ej. 312 345 6789)</p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Correo Electrónico (Minúsculas)
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value.toLowerCase())}
                  placeholder="acudiente@ejemplo.com"
                  className={`w-full pl-9 pr-3 py-3 bg-slate-50 border rounded-xl font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 lowercase ${
                    cleanEmail && !isEmailValid
                      ? "border-rose-300 focus:ring-rose-500 text-rose-900"
                      : "border-slate-200 focus:ring-teal-500 text-slate-800"
                  }`}
                />
              </div>
              {cleanEmail && !isEmailValid && (
                <p className="text-[9px] font-bold text-rose-600">Formato de correo no válido</p>
              )}
            </div>
          </div>

          {/* Celular Secundario y Vereda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Teléfono Alternativo
              </label>
              <input
                type="tel"
                value={telefonoSec}
                onChange={e => setTelefonoSec(e.target.value)}
                placeholder="Opcional"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                Vereda / Comunidad Awá
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={vereda}
                  onChange={e => setVereda(e.target.value.toUpperCase())}
                  placeholder="Ej. EL DIVISO / CUAMBÍ"
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                />
              </div>
            </div>
          </div>

          {/* Observaciones */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              Observaciones Pedagógicas / Disponibilidad de Contacto
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Ej. Habla idioma Awapit, llamar en horas de la tarde, persona autorizada para retiros..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Botones de Acción */}
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
              className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/30 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
            >
              {saving ? (
                <><Loader2 size={16} className="animate-spin" /> Guardando...</>
              ) : (
                <><Save size={16} /> Guardar Acudiente</>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
