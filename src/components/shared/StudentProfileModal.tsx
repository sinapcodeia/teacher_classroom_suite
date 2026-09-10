"use client";

import { normalizeGrade, parseFlexibleFloat, sanitizeText } from "@/lib/constants";
import { createPortal } from "react-dom";
import { useState, useEffect, useMemo } from "react";
import { 
  X, User, BarChart3, Cake, Phone, Calendar, BookOpen, 
  ShieldAlert, Plus, Trash2, FileText, CheckCircle2, 
  AlertTriangle, Award, Scale, Sparkles, Send
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { printStudentProfileReport, printStudentCommitmentAgreement } from "@/lib/printService";

export default function StudentProfileModal({ student, onClose }: { student: any; onClose: () => void }) {
  const { profile, masterData, students, addBehavioralRecord, deleteBehavioralRecord } = useApp();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"academic" | "behavioral">("academic");
  const [showAddObservation, setShowAddObservation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for new behavioral record
  const [obsType, setObsType] = useState<"LEVE" | "GRAVE" | "GRAVISIMA" | "POSITIVA">("LEVE");
  const [obsCategory, setObsCategory] = useState<"PUNTUALIDAD" | "RESPETO" | "MATERIALES" | "PARTICIPACION" | "CONVIVENCIA" | "UNIFORME" | "OTRO">("CONVIVENCIA");
  const [obsTitle, setObsTitle] = useState("");
  const [obsDescription, setObsDescription] = useState("");
  const [obsDefense, setObsDefense] = useState("");
  const [obsActions, setObsActions] = useState("");
  const [obsCommitments, setObsCommitments] = useState("");
  const [obsDemerit, setObsDemerit] = useState<number>(0.5);
  const [obsMerit, setObsMerit] = useState<number>(0.5);
  const [obsApplyGrade, setObsApplyGrade] = useState(false);
  const [obsTargetDimension, setObsTargetDimension] = useState<"CV" | "SR">("CV");
  const [obsSubject, setObsSubject] = useState("");

  // Modal for custom notes on commitment agreement
  const [showCommitmentModal, setShowCommitmentModal] = useState(false);
  const [customCommitmentNotes, setCustomCommitmentNotes] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get freshest student data from context
  const currentStudent = useMemo(() => {
    if (!student) return null;
    return students.find(s => s.id === student.id) || student;
  }, [students, student]);

  const absentRecords = useMemo(() => {
    if (!currentStudent || !currentStudent.attendanceRecord) return [];
    return Object.entries(currentStudent.attendanceRecord)
      .map(([date, status]) => {
        const st = (status as string) === 'present' ? 'P' : (status as string) === 'absent' ? 'A' : (status as string) === 'late' ? 'T' : (status as string) === 'excused' ? 'E' : status as string;
        return { date, status: st };
      })
      .filter(r => r.status !== 'P')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [currentStudent]);

  const behavioralRecords = useMemo(() => {
    return currentStudent?.behavioralRecords || [];
  }, [currentStudent]);

  if (!currentStudent || !mounted || typeof window === "undefined" || typeof document === "undefined") return null;

  const formatExcelDate = (dateVal: string | number) => {
    if (!dateVal) return "NO REGISTRADO";
    const strVal = String(dateVal);
    if (!isNaN(Number(strVal)) && Number(strVal) > 10000) {
      const date = new Date((Number(strVal) - 25569) * 86400 * 1000);
      return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    try {
      const date = new Date(strVal);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch {}
    return strVal;
  };

  const formattedDate = formatExcelDate(currentStudent.fechaNacimiento);

  const handleSaveObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!obsTitle.trim() || !obsDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const activeSubject = obsSubject || masterData?.subjects?.[0] || "TECNOLOGÍA";
      await addBehavioralRecord(currentStudent.id, {
        date: new Date().toISOString().split("T")[0],
        periodId: masterData?.activePeriod || "1",
        type: obsType,
        category: obsCategory,
        title: obsTitle.trim(),
        description: obsDescription.trim(),
        studentDefense: obsDefense.trim() || undefined,
        actionsTaken: obsActions.trim(),
        commitments: obsCommitments.trim(),
        teacherName: profile?.name || "Docente Titular",
        demeritPoints: obsType !== "POSITIVA" ? Number(obsDemerit) : 0,
        meritPoints: obsType === "POSITIVA" ? Number(obsMerit) : 0,
        targetDimension: obsApplyGrade ? obsTargetDimension : "NONE",
        appliedToGrades: obsApplyGrade,
        subject: obsApplyGrade ? activeSubject : undefined,
      });

      // Reset form
      setObsTitle("");
      setObsDescription("");
      setObsDefense("");
      setObsActions("");
      setObsCommitments("");
      setObsDemerit(0.5);
      setObsMerit(0.5);
      setObsApplyGrade(false);
      setShowAddObservation(false);
    } catch (err) {
      console.error("Error al registrar observación:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteObservation = async (recId: string) => {
    if (confirm("¿Está seguro de eliminar esta anotación del observador?")) {
      await deleteBehavioralRecord(currentStudent.id, recId);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 md:p-6 student-modal-portal">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md no-print" onClick={onClose} />

      {/* Main Container */}
      <div className="relative bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl flex flex-col md:flex-row overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh]">
        
        {/* Left Sidebar Profile Summary */}
        <div className="md:w-[240px] shrink-0 bg-slate-900 text-white p-6 flex flex-col items-center justify-between relative overflow-hidden">
          <div className="w-full flex flex-col items-center">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-3xl bg-teal-600/30 border-2 border-teal-400/40 flex items-center justify-center text-3xl font-black text-teal-300 shadow-inner mb-4">
              {currentStudent.primerApellido?.[0]}{currentStudent.primerNombre?.[0]}
            </div>
            
            <h3 className="text-sm font-black text-center uppercase leading-tight text-slate-100">
              {currentStudent.primerNombre} {currentStudent.segundoNombre || ''}<br />
              <span className="text-teal-400">{currentStudent.primerApellido} {currentStudent.segundoApellido || ''}</span>
            </h3>
            
            <span className="text-[8px] font-black uppercase tracking-widest text-teal-300/70 mt-1">IETABA · AWÁ</span>
            
            <div className="mt-4 w-full grid grid-cols-2 gap-2">
              <div className="bg-slate-800/80 rounded-xl p-2.5 text-center border border-slate-700/60">
                <p className="text-[7px] uppercase text-slate-400 font-black">Grado</p>
                <p className="text-xs font-black text-slate-100">{normalizeGrade(currentStudent.grado)}</p>
              </div>
              <div className="bg-slate-800/80 rounded-xl p-2.5 text-center border border-slate-700/60">
                <p className="text-[7px] uppercase text-slate-400 font-black">Curso</p>
                <p className="text-xs font-black text-slate-100">{currentStudent.curso || '1'}</p>
              </div>
            </div>

            {/* Quick SIEEE Badge */}
            <div className="mt-3 w-full bg-slate-800/60 rounded-xl p-2.5 text-center border border-slate-700/50">
              <p className="text-[7px] uppercase text-slate-400 font-black">Promedio Periodo Activo</p>
              <p className={`text-base font-black ${(currentStudent.avgGrade || 0) >= 3.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {(currentStudent.avgGrade || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Institutional Actions in Sidebar */}
          <div className="w-full space-y-2 mt-4 pt-4 border-t border-slate-800">
            <button
              onClick={() => printStudentProfileReport(currentStudent, profile, masterData, undefined, students)}
              className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <FileText size={13} /> Dossier 360° (PDF)
            </button>
            <button
              onClick={() => setShowCommitmentModal(true)}
              className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-amber-500/30"
            >
              <Scale size={13} /> Acta Compromiso
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
          
          {/* Header with Tabs & Close */}
          <div className="bg-white px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("academic")}
                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeTab === "academic"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <BarChart3 size={13} /> Diagnóstico Académico
              </button>
              <button
                onClick={() => setActiveTab("behavioral")}
                className={`px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center gap-2 relative ${
                  activeTab === "behavioral"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ShieldAlert size={13} /> Observador & Convivencia (Ley 1620)
                {behavioralRecords.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                    {behavioralRecords.length}
                  </span>
                )}
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeTab === "academic" && (
              <>
                {/* Personal Info Grid */}
                <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <User size={14} className="text-teal-600" /> Información General & Acudiente
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase">Documento</p>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{currentStudent.tipoDocumento} {currentStudent.nroDocumento}</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase">Género</p>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{currentStudent.genero === "M" ? "Masculino" : "Femenino"}</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase">Fecha Nacimiento</p>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{formattedDate}</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase">Acudiente Principal</p>
                      <p className="text-[11px] font-black text-slate-800 uppercase">{currentStudent.acudienteNombre || "No registrado"}</p>
                    </div>
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase">Teléfono de Contacto</p>
                      {currentStudent.acudienteTelefono ? (
                        <a href={`tel:${currentStudent.acudienteTelefono}`} className="text-[11px] font-black text-teal-600 hover:underline flex items-center gap-1">
                          <Phone size={11} /> {currentStudent.acudienteTelefono}
                        </a>
                      ) : (
                        <p className="text-[11px] font-black text-slate-400 uppercase">No registrado</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase">Estado Matrícula</p>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-black border border-emerald-200 uppercase">
                        {currentStudent.isActive !== false ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                </section>

                {/* SIEEE Performance & Absenteeism */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <BarChart3 size={14} className="text-teal-600" /> Rendimiento SIEEE
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[9.5px] font-black uppercase mb-1">
                          <span className="text-slate-500">Promedio General</span>
                          <span className="text-slate-800">{(currentStudent.avgGrade || 0).toFixed(2)} / 5.0</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${(currentStudent.avgGrade || 0) >= 3.0 ? 'bg-teal-600' : 'bg-rose-500'}`} 
                            style={{ width: `${Math.min(100, ((currentStudent.avgGrade || 0) / 5) * 100)}%` }} 
                          />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 italic">
                        {(currentStudent.avgGrade || 0) >= 4.6 ? "🌟 Desempeño Superior" : (currentStudent.avgGrade || 0) >= 4.0 ? "✨ Desempeño Alto" : (currentStudent.avgGrade || 0) >= 3.0 ? "👍 Desempeño Básico" : "⚠️ Desempeño Bajo (Requiere Refuerzo)"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-teal-800 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Calendar size={14} className="text-teal-600" /> Registro de Asistencia
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-[9.5px] font-black uppercase mb-1">
                          <span className="text-slate-500">Porcentaje de Asistencia</span>
                          <span className="text-slate-800">{currentStudent.attendance || "100%"}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${parseInt(currentStudent.attendance?.replace('%', '') || "100")}%` }} 
                          />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500">
                        {absentRecords.length === 0 ? "Sin inasistencias registradas." : `${absentRecords.length} novedades de asistencia.`}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Absenteeism Log */}
                {absentRecords.length > 0 && (
                  <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-rose-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <AlertTriangle size={14} /> Detalle de Novedades de Asistencia
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {absentRecords.map(record => {
                        const label = record.status === 'A' ? 'Inasistencia Injustificada' : record.status === 'E' ? 'Excusa Justificada' : record.status === 'T' ? 'Llegada Tarde' : record.status;
                        const badgeColor = record.status === 'A' ? 'bg-rose-50 text-rose-700 border-rose-200' : record.status === 'E' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200';
                        return (
                          <div key={record.date} className="flex justify-between items-center bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-black uppercase text-slate-700">{record.date}</span>
                            <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeColor}`}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === "behavioral" && (
              <div className="space-y-4">
                {/* Header & Add Button */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                  <div>
                    <h4 className="text-[11px] font-black text-slate-900 uppercase">Observador de Convivencia Escolar</h4>
                    <p className="text-[9px] text-slate-500">Tipificación conforme a la Ley 1620 de 2013 y Manual Institucional Awá</p>
                  </div>
                  <button
                    onClick={() => setShowAddObservation(!showAddObservation)}
                    className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Plus size={13} /> {showAddObservation ? "Cancelar" : "Nueva Observación"}
                  </button>
                </div>

                {/* Add Observation Form */}
                {showAddObservation && (
                  <form onSubmit={handleSaveObservation} className="bg-white p-5 rounded-2xl border-2 border-teal-500/30 shadow-md space-y-4 animate-in fade-in-50 duration-200">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      <Sparkles size={14} className="text-teal-600" />
                      <h5 className="text-[10px] font-black text-teal-900 uppercase">Registro Pedagógico / Anotación Formativa</h5>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-500 mb-1">Tipo de Falta / Reconocimiento</label>
                        <select
                          value={obsType}
                          onChange={(e: any) => setObsType(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="LEVE">🟡 Falta Leve (Tipo I) - Medida Formativa</option>
                          <option value="GRAVE">🟠 Falta Grave (Tipo II) - Remisión Comité</option>
                          <option value="GRAVISIMA">🔴 Falta Gravísima (Tipo III) - Proceso Especial</option>
                          <option value="POSITIVA">🟢 Felicitación / Reconocimiento (Mérito)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-500 mb-1">Categoría</label>
                        <select
                          value={obsCategory}
                          onChange={(e: any) => setObsCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="CONVIVENCIA">Convivencia y Trato Fraternal</option>
                          <option value="PUNTUALIDAD">Puntualidad y Asistencia</option>
                          <option value="RESPETO">Respeto a Docentes y Pares</option>
                          <option value="MATERIALES">Cuidado de Materiales y Aula</option>
                          <option value="UNIFORME">Presentación Personal / Uniforme</option>
                          <option value="PARTICIPACION">Participación y Rendimiento</option>
                          <option value="OTRO">Otro Motivo Institucional</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-500 mb-1">Título / Asunto</label>
                      <input
                        type="text"
                        placeholder="Ej: Interrupción reiterada de clase / Felicitación por liderazgo"
                        value={obsTitle}
                        onChange={e => setObsTitle(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] font-black uppercase text-slate-500 mb-1">Descripción de los Hechos</label>
                      <textarea
                        rows={2}
                        placeholder="Detalle claro y objetivo de la situación presentada..."
                        value={obsDescription}
                        onChange={e => setObsDescription(e.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[8px] font-black uppercase text-teal-700 mb-1">Descargos del Estudiante (Debido Proceso)</label>
                      <textarea
                        rows={2}
                        placeholder="Manifestación o versión libre dada por el estudiante..."
                        value={obsDefense}
                        onChange={e => setObsDefense(e.target.value)}
                        className="w-full bg-teal-50/50 border border-teal-200 rounded-xl px-3 py-2 text-[10px] font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-500 mb-1">Acción Formativa / Pedagógica</label>
                        <input
                          type="text"
                          placeholder="Ej: Diálogo reflexivo, taller formativo, servicio comunitario"
                          value={obsActions}
                          onChange={e => setObsActions(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-black uppercase text-slate-500 mb-1">Compromiso Adquirido</label>
                        <input
                          type="text"
                          placeholder="Ej: Mantener actitud constructiva y puntualidad diaria"
                          value={obsCommitments}
                          onChange={e => setObsCommitments(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Opción 1: Impacto Pedagógico en Calificación de Convivencia / Ser */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={obsApplyGrade}
                          onChange={e => setObsApplyGrade(e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-[9.5px] font-black uppercase text-slate-800">
                          ⚖️ Aplicar impacto pedagógico en la calificación del periodo
                        </span>
                      </label>

                      {obsApplyGrade && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200 animate-in fade-in-50 duration-150">
                          <div>
                            <label className="block text-[7.5px] font-black uppercase text-slate-500 mb-0.5">Dimensión Formativa</label>
                            <select
                              value={obsTargetDimension}
                              onChange={(e: any) => setObsTargetDimension(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[9.5px] font-bold text-slate-800"
                            >
                              <option value="CV">Convivencia (CV - 5%)</option>
                              <option value="SR">Ser / Actitud (SR - 20%)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[7.5px] font-black uppercase text-slate-500 mb-0.5">Asignatura</label>
                            <select
                              value={obsSubject || masterData?.subjects?.[0] || "TECNOLOGÍA"}
                              onChange={e => setObsSubject(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[9.5px] font-bold text-slate-800"
                            >
                              {(masterData?.subjects || ["TECNOLOGÍA"]).map(sub => (
                                <option key={sub} value={sub}>{sub}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[7.5px] font-black uppercase text-slate-500 mb-0.5">
                              {obsType === "POSITIVA" ? "Bonificación (+ pts)" : "Demérito (- pts)"}
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="3.0"
                              value={obsType === "POSITIVA" ? obsMerit : obsDemerit}
                              onChange={e => {
                                const val = parseFloat(e.target.value) || 0;
                                if (obsType === "POSITIVA") setObsMerit(val);
                                else setObsDemerit(val);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[9.5px] font-bold text-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAddObservation(false)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9.5px] uppercase tracking-wider hover:bg-slate-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1.5 shadow-md disabled:opacity-50"
                      >
                        <Send size={12} /> {isSubmitting ? "Guardando..." : "Registrar en Observador"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Observations Timeline */}
                <div className="space-y-3">
                  {behavioralRecords.length > 0 ? (
                    behavioralRecords.map((rec: any) => {
                      const isPositive = rec.type === "POSITIVA";
                      const isLeve = rec.type === "LEVE";
                      const isGrave = rec.type === "GRAVE";
                      const isGravisima = rec.type === "GRAVISIMA";

                      const badgeStyle = isPositive
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : isLeve
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : isGrave
                        ? "bg-orange-50 text-orange-800 border-orange-200"
                        : "bg-rose-50 text-rose-800 border-rose-200";

                      return (
                        <div key={rec.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative group">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-black border uppercase ${badgeStyle}`}>
                                {isPositive ? "✨ Reconocimiento" : isLeve ? "🟡 Falta Leve (I)" : isGrave ? "🟠 Falta Grave (II)" : "🔴 Falta Gravísima (III)"}
                              </span>
                              <span className="text-[10.5px] font-black text-slate-800 uppercase">{rec.title}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[8.5px] font-bold text-slate-400">{rec.date}</span>
                              <button
                                onClick={() => handleDeleteObservation(rec.id)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                title="Eliminar observación"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          <p className="text-[9.5px] text-slate-700 mb-2 leading-relaxed">{rec.description}</p>

                          {rec.studentDefense && (
                            <div className="bg-teal-50/60 border border-teal-100 rounded-xl p-2.5 mb-2 text-[9px] text-teal-900">
                              <span className="font-black uppercase text-[7.5px] text-teal-700 block mb-0.5">Descargos del Estudiante (Debido Proceso)</span>
                              {rec.studentDefense}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 text-[8.5px] text-slate-500 pt-2 border-t border-slate-100">
                            {rec.actionsTaken && (
                              <span className="bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                <strong>Medida:</strong> {rec.actionsTaken}
                              </span>
                            )}
                            {rec.commitments && (
                              <span className="bg-blue-50 text-blue-800 px-2 py-1 rounded-md border border-blue-100">
                                <strong>Compromiso:</strong> {rec.commitments}
                              </span>
                            )}
                            <span className="ml-auto text-slate-400 font-bold">Docente: {rec.teacherName}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                      <Award size={28} className="mx-auto text-teal-500 opacity-60" />
                      <p className="text-[11px] font-black text-slate-700 uppercase">Sin novedades convivenciales</p>
                      <p className="text-[9px] text-slate-400 max-w-sm mx-auto">
                        El estudiante mantiene una conducta ejemplar acorde a los principios de convivencia de la comunidad Awá.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Footer Bottom Actions */}
          <div className="bg-white px-6 py-3 border-t border-slate-200 flex flex-wrap gap-2 items-center justify-between">
            <span className="text-[8px] font-black uppercase text-slate-400">
              IETABA EduManager Suite · v2.0
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => printStudentProfileReport(currentStudent, profile, masterData, undefined, students)}
                className="py-2 px-3.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm"
              >
                <FileText size={13} /> Imprimir Dossier 360° (PDF)
              </button>
              <button
                onClick={() => setShowCommitmentModal(true)}
                className="py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl font-black text-[9.5px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm border border-amber-400/30"
              >
                <Scale size={13} /> Generar Acta de Compromiso (4 Firmas)
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Modal for Custom Commitment Notes */}
      {showCommitmentModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50 duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-black text-slate-900 uppercase flex items-center gap-1.5">
                <Scale size={15} className="text-amber-600" /> Acta de Compromiso Formativo
              </h4>
              <button onClick={() => setShowCommitmentModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <p className="text-[9.5px] text-slate-600 leading-relaxed">
              El sistema generará el acta legal y pedagógica formal con las 4 firmas institucionales (Estudiante, Padre/Acudiente, Docente, Coordinación). Si lo desea, puede añadir una observación específica:
            </p>

            <div>
              <label className="block text-[8px] font-black uppercase text-slate-500 mb-1">Observación Específica del Docente (Opcional)</label>
              <textarea
                rows={3}
                placeholder="Ej: Se acuerda refuerzo especial en matemáticas los días martes de 2 a 3 PM y entrega de guía el próximo viernes..."
                value={customCommitmentNotes}
                onChange={e => setCustomCommitmentNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCommitmentModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-black text-[9.5px] uppercase"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  printStudentCommitmentAgreement(currentStudent, profile, masterData, customCommitmentNotes);
                  setShowCommitmentModal(false);
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-black text-[9.5px] uppercase flex items-center gap-1.5 shadow-md"
              >
                <FileText size={13} /> Generar e Imprimir Acta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  return createPortal(modal, document.body);
}
