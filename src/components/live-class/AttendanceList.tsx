"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  CheckCircle, XCircle, Clock, Save, Filter, User, 
  BookOpen, BarChart3, GraduationCap, Layers, Cake, MessageSquare, Star, AlertTriangle, BellRing, AlertCircle
} from "lucide-react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import StudentProfileModal from "@/components/shared/StudentProfileModal";

export default function AttendanceList() {
  const { students, subjects, profile, addGrade, saveDailyAttendance, addAgendaNote, agendaNotes, updateAgendaNote } = useApp();
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedGrado, setSelectedGrado] = useState<string>("TODOS");
  const [selectedCurso, setSelectedCurso] = useState<string>("TODOS");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEndClassModal, setShowEndClassModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [endClassNote, setEndClassNote] = useState("");
  const [endClassType, setEndClassType] = useState<"TASK" | "NO_CLASS" | "GENERAL">("GENERAL");
  const [participationModal, setParticipationModal] = useState<{ studentId: string, name: string } | null>(null);
  const [partTitle, setPartTitle] = useState("Participación en Clase");
  const [partScore, setPartScore] = useState("5.0");

  const playAlertSound = () => {
    try {
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
      // Cerrar el contexto después de que el sonido termine para liberar recursos
      setTimeout(() => ctx.close(), 1500);
    } catch (e) {
      console.warn("Audio no soportado o bloqueado por el navegador");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (hasUnsavedChanges) {
      // Activar advertencia si pasan 2 minutos sin guardar cambios
      timeout = setTimeout(() => {
        setShowIdleWarning(true);
        playAlertSound();
      }, 120000); 
    }
    return () => clearTimeout(timeout);
  }, [hasUnsavedChanges, attendance]);

  // Carga automática de información de clase desde la URL (si se navega desde el Horario)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSubject = params.get("subject");
      const urlCurso = params.get("curso");

      if (urlSubject) {
        // Búsqueda robusta (ignorando mayúsculas, tildes y espacios)
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
        const matchedSubject = subjects.find(s => normalize(s.name) === normalize(urlSubject));
        
        if (matchedSubject) {
          setSelectedSubject(matchedSubject.id);
        } else if (subjects.length > 0) {
          setSelectedSubject(subjects[0].id);
        }
      } else if (subjects.length > 0 && !selectedSubject) {
        setSelectedSubject(subjects[0].id);
      }

      if (urlCurso) {
        // "8-3" -> Grado: "8", Curso: "8-3" o "3" dependiendo de cómo se importó
        const parts = urlCurso.split("-");
        const gradePart = parts[0]?.trim();
        const coursePart = parts[1]?.trim();
        
        if (gradePart) setSelectedGrado(normalizeGrade(gradePart));

        // Si el curso importado es "3" en lugar de "8-3", intentamos coincidir
        const allCursos = students.map(s => s.curso);
        if (allCursos.includes(urlCurso)) {
          setSelectedCurso(urlCurso); // ej: "8-3"
        } else if (coursePart && allCursos.includes(coursePart)) {
          setSelectedCurso(coursePart); // ej: "3"
        } else {
          setSelectedCurso(urlCurso); // Fallback
        }
      }
    }
  }, [subjects, students]);

  const gradoOptions = useMemo(() => {
    return [...new Set(students.map(s => normalizeGrade(s.grado)))].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students]);

  const cursoOptions = useMemo(() => {
    const studentsInGrado = selectedGrado === "TODOS" ? students : students.filter(s => normalizeGrade(s.grado) === selectedGrado);
    return [...new Set(studentsInGrado.map(s => s.curso))].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students, selectedGrado]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Ignorar estudiantes eliminados lógicamente
      if (s.isActive === false) return false;

      const matchGrado = selectedGrado === "TODOS" || normalizeGrade(s.grado) === selectedGrado;
      const matchCurso = selectedCurso === "TODOS" || s.curso === selectedCurso;
      return matchGrado && matchCurso;
    });
  }, [students, selectedGrado, selectedCurso]);

  // Efecto para cargar asistencia existente y verificar si ya se guardó
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // 1. Verificar si hay una nota de agenda para esta clase hoy
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "";
    const existingNote = agendaNotes.find(n => 
      n.date === todayStr && 
      n.course === selectedCurso && 
      n.subject === subjectName
    );

    if (existingNote) {
      setIsAlreadySaved(true);
      setExistingNoteId(existingNote.id);
      setEndClassNote(existingNote.content || "");
      setEndClassType(existingNote.type as any || "GENERAL");
    } else {
      setIsAlreadySaved(false);
      setExistingNoteId(null);
    }

    // 2. Cargar asistencia desde los registros de los estudiantes
    const loadedAttendance: Record<string, 'present' | 'absent' | 'late'> = {};
    let hasData = false;

    filteredStudents.forEach(s => {
      const status = s.attendanceRecord?.[todayStr];
      if (status) {
        loadedAttendance[s.id] = status as any;
        hasData = true;
      }
    });

    if (hasData) {
      setAttendance(loadedAttendance);
    } else {
      setAttendance({});
    }
  }, [selectedSubject, selectedCurso, filteredStudents, agendaNotes, subjects]);

  const stats = useMemo(() => ({
    total: filteredStudents.length,
    present: filteredStudents.filter(s => attendance[s.id] === 'present').length,
    absent: filteredStudents.filter(s => attendance[s.id] === 'absent').length,
    late: filteredStudents.filter(s => attendance[s.id] === 'late').length,
    pending: filteredStudents.filter(s => !attendance[s.id]).length
  }), [filteredStudents, attendance]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    setHasUnsavedChanges(true);
    setShowIdleWarning(false);
  };

  const sendWA = (student: any, type: 'absent' | 'birthday' | 'excellence') => {
    const phone = student.acudienteTelefono || "";
    if (!phone) return alert("Sin teléfono registrado.");
    
    let message = "";
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "clase";

    if (type === 'absent') {
      message = `Hola, informamos desde IETABA que el estudiante ${student.primerNombre} ${student.primerApellido} no asistió hoy a la clase de ${subjectName}. Favor confirmar motivo.`;
    } else if (type === 'birthday') {
      message = `¡Hola! IETABA desea un feliz cumpleaños a ${student.primerNombre} ${student.primerApellido}. ¡Que tenga un día maravilloso! 🎂🎉`;
    } else if (type === 'excellence') {
      message = `¡Felicitaciones! IETABA reconoce la EXCELENCIA ACADÉMICA de ${student.primerNombre} ${student.primerApellido} por su excelente desempeño. ¡Sigan así! ⭐👏`;
    }

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-outline-variant rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden no-print">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 relative z-10">
          <div className="lg:col-span-4 space-y-2">
             <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-2 flex items-center gap-2"><User size={14} /> Docente / Materia</label>
             <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full bg-surface-container-low px-5 py-3 rounded-xl border border-outline-variant text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-primary">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             </select>
          </div>
          <div className="lg:col-span-4 space-y-2">
             <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-2 flex items-center gap-2"><GraduationCap size={14} /> Grado</label>
             <select value={selectedGrado} onChange={(e) => { setSelectedGrado(e.target.value); setSelectedCurso("TODOS"); }} className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border border-outline-variant text-[11px] font-black uppercase outline-none">
                <option value="TODOS">TODOS</option>
                {gradoOptions.map(g => <option key={g} value={g}>GRADO {g}</option>)}
              </select>
          </div>
          <div className="lg:col-span-4 space-y-2">
             <label className="text-[10px] font-black text-tertiary uppercase tracking-widest ml-2 flex items-center gap-2"><Layers size={14} /> Curso</label>
             <select value={selectedCurso} onChange={(e) => setSelectedCurso(e.target.value)} className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border border-outline-variant text-[11px] font-black uppercase outline-none">
                <option value="TODOS">TODOS</option>
                {cursoOptions.map(c => <option key={c} value={c}>CURSO {c}</option>)}
              </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-[3rem] overflow-hidden shadow-2xl no-print">
        <div className="bg-surface-container-low px-8 py-5 border-b border-outline-variant flex items-center justify-between">
           <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Panel de Control de Aula</h3>
           <div className="flex items-center gap-3">
             <button onClick={() => { const u = {...attendance}; filteredStudents.forEach(s => u[s.id] = 'present'); setAttendance(u); setHasUnsavedChanges(true); }} className="px-6 py-3 bg-secondary/10 text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-white transition-all flex items-center gap-2"><CheckCircle size={16} /> Todos Presentes</button>
             <button onClick={() => setShowEndClassModal(true)} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"><Save size={16} /> {isAlreadySaved ? "Actualizar Clase" : "Finalizar Clase"}</button>
           </div>
        </div>

        {isAlreadySaved && (
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-900 uppercase">Clase ya registrada</p>
                <p className="text-[9px] font-bold text-amber-700 uppercase">Puedes modificar los datos y guardar los cambios nuevamente.</p>
              </div>
            </div>
            <span className="text-[8px] font-black bg-amber-200/50 text-amber-800 px-2 py-1 rounded-md uppercase">Modo Edición</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] border-b border-outline-variant/30 text-center">
                <th className="px-8 py-5 text-left">Estudiante</th>
                <th className="px-8 py-5">Grado/Curso</th>
                <th className="px-8 py-5">Asistencia</th>
                <th className="px-8 py-5">Alertas Institucionales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredStudents.map((student) => {
                const status = attendance[student.id];
                const isBday = student.fechaNacimiento?.slice(5, 10) === new Date().toISOString().slice(5, 10);
                const isStar = student.avgGrade >= 4.5;

                return (
                  <tr key={student.id} className="hover:bg-surface-container-lowest transition-all group cursor-pointer" onClick={() => setSelectedStudent(student)}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                           <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs border border-primary/10">
                              {student.primerApellido[0]}{student.primerNombre[0]}
                           </div>
                           {isBday && <div className="absolute -top-2 -right-2 bg-secondary text-white p-1 rounded-full animate-bounce"><Cake size={12} /></div>}
                           {isStar && <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-on-surface p-1 rounded-full"><Star size={12} /></div>}
                        </div>
                        <div>
                          <p className="text-[12px] font-black text-on-surface uppercase leading-tight">{student.primerApellido} {student.primerNombre}</p>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase opacity-60">ID: {student.nroDocumento}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className="text-[9px] font-black bg-surface-container px-3 py-1 rounded-lg uppercase">G: {normalizeGrade(student.grado)} | C: {student.curso}</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(student.id, 'present'); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${status === 'present' ? "bg-secondary text-white scale-110" : "bg-surface-container text-on-surface-variant"}`}><CheckCircle size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(student.id, 'absent'); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${status === 'absent' ? "bg-error text-white scale-110" : "bg-surface-container text-on-surface-variant"}`}><XCircle size={18} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleStatusChange(student.id, 'late'); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${status === 'late' ? "bg-tertiary text-white scale-110" : "bg-surface-container text-on-surface-variant"}`}><Clock size={18} /></button>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-wrap gap-2 justify-center">
                        {status === 'absent' && (
                          <button onClick={(e) => { e.stopPropagation(); sendWA(student, 'absent'); }} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-all"><MessageSquare size={12} /> Inasistencia</button>
                        )}
                        {isBday && (
                          <button onClick={(e) => { e.stopPropagation(); sendWA(student, 'birthday'); }} className="px-3 py-1.5 bg-secondary text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-all"><Cake size={12} /> Felicitar</button>
                        )}
                        {isStar && (
                          <button onClick={(e) => { e.stopPropagation(); sendWA(student, 'excellence'); }} className="px-3 py-1.5 bg-yellow-500 text-on-surface rounded-lg text-[8px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-all"><Star size={12} /> Excelencia</button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setParticipationModal({ studentId: student.id, name: `${student.primerNombre} ${student.primerApellido}` }); }} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-[8px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-all">
                          + Participación
                        </button>
                        {!status && !isBday && !isStar && <span className="text-[8px] font-bold opacity-10 uppercase italic">Sin Alertas Activas</span>}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <StudentProfileModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col items-center z-10 text-center animate-in zoom-in-95 duration-200">
             <Save size={48} className="text-primary mb-4" />
             <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Confirmar Guardado</h3>
             <p className="text-xs text-on-surface-variant font-bold mb-6">¿Estás seguro de que deseas guardar el registro de asistencia actual? Esta acción actualizará los reportes.</p>
             <div className="flex w-full gap-3">
               <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl bg-surface-container text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all">Cancelar</button>
               <button onClick={async () => {
                 setShowConfirmModal(false);
                 setIsSaving(true);
                 try {
                   const todayStr = new Date().toISOString().slice(0, 10);
                   await saveDailyAttendance(todayStr, attendance);
                   setHasUnsavedChanges(false);
                   setShowSuccessModal(true);
                 } catch (err) {
                   console.error(err);
                   alert("Error al guardar la asistencia");
                 } finally {
                   setIsSaving(false);
                 }
               }} className="flex-1 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/30 flex justify-center items-center">
                 {isSaving ? "Guardando..." : "Confirmar"}
               </button>
             </div>
          </div>
        </div>
      )}

      {showEndClassModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowEndClassModal(false)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl flex flex-col z-10 animate-in zoom-in-95 duration-200" style={{ border: "4px solid rgba(59,130,246,0.1)" }}>
             
             <div className="flex items-center gap-4 mb-6">
               <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                 <Save size={28} />
               </div>
               <div>
                 <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800">Finalizar Clase</h3>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Guarda la asistencia y reporta tu gestión</p>
               </div>
             </div>

             <div className="space-y-4 mb-8">
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">¿Qué sucedió en la clase de hoy?</label>
                 <div className="grid grid-cols-3 gap-2">
                    <button onClick={() => setEndClassType("GENERAL")} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${endClassType === 'GENERAL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Normal</button>
                    <button onClick={() => setEndClassType("TASK")} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${endClassType === 'TASK' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Dejé Tarea</button>
                    <button onClick={() => setEndClassType("NO_CLASS")} className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${endClassType === 'NO_CLASS' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>No hubo clase</button>
                 </div>
               </div>

               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Bitácora / Notas (Opcional)</label>
                 <textarea 
                   value={endClassNote} 
                   onChange={e => setEndClassNote(e.target.value)}
                   placeholder={endClassType === 'TASK' ? 'Ej: Resolver página 45 del libro...' : endClassType === 'NO_CLASS' ? 'Ej: Ausencia por reunión docente...' : 'Ej: Revisamos el taller de ecuaciones...'}
                   className="w-full h-24 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
                 />
               </div>
             </div>

             <div className="flex w-full gap-3">
               <button onClick={() => setShowEndClassModal(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 transition-all">Volver</button>
               <button onClick={async () => {
                 setIsSaving(true);
                 try {
                   const todayStr = new Date().toISOString().slice(0, 10);
                   await saveDailyAttendance(todayStr, attendance);
                   
                   const noteData = {
                     date: todayStr,
                     course: selectedCurso,
                     subject: subjects.find(s => s.id === selectedSubject)?.name || "Clase",
                     type: endClassType,
                     content: endClassNote || (endClassType === 'NO_CLASS' ? 'Clase cancelada/no dictada' : 'Gestión de clase completada'),
                     isCompleted: false
                   };

                   if (existingNoteId) {
                     await updateAgendaNote(existingNoteId, noteData);
                   } else if (endClassNote.trim() !== "" || endClassType !== "GENERAL") {
                     await addAgendaNote(noteData);
                   }

                   setHasUnsavedChanges(false);
                   setShowEndClassModal(false);
                   setShowSuccessModal(true);
                 } catch (err) {
                   console.error(err);
                   alert("Error al finalizar la clase");
                 } finally {
                   setIsSaving(false);
                 }
               }} className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-blue-600/30 flex justify-center items-center gap-2">
                 {isSaving ? <span className="animate-pulse">Guardando Datos...</span> : <><CheckCircle size={16} /> {isAlreadySaved ? "Actualizar Cambios" : "Guardar y Finalizar"}</>}
               </button>
             </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-emerald-900/40 backdrop-blur-md" onClick={() => setShowSuccessModal(false)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center z-10 text-center animate-in zoom-in-95 duration-300">
             <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
               <CheckCircle size={40} className="text-emerald-500" />
             </div>
             <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800 mb-2">¡Completado!</h3>
             <p className="text-xs text-slate-500 font-bold mb-8">La asistencia y la gestión de la clase han sido guardadas correctamente en la base de datos institucional.</p>
             <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 rounded-2xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-500/30">Continuar</button>
          </div>
        </div>
      )}

      {showIdleWarning && (
        <div className="fixed inset-x-4 bottom-24 z-[150] flex justify-center pointer-events-none animate-in slide-in-from-bottom-10 fade-in duration-500">
          <div className="bg-rose-600 text-white px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-4 pointer-events-auto border-4 border-rose-500/50">
            <BellRing size={24} className="animate-bounce" />
            <div>
              <p className="text-[13px] font-black uppercase tracking-tighter leading-tight">Clase Activa Sin Guardar</p>
              <p className="text-[10px] font-medium opacity-90">Recuerda presionar &quot;Finalizar Clase&quot; para guardar la asistencia.</p>
            </div>
            <button onClick={() => setShowIdleWarning(false)} className="ml-4 w-8 h-8 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/30 transition-all">
               <XCircle size={16} />
            </button>
          </div>
        </div>
      )}

      {participationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setParticipationModal(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl flex flex-col items-center z-10 animate-in zoom-in-95 duration-200">
             <Star size={48} className="text-blue-500 mb-4" />
             <h3 className="text-lg font-black uppercase tracking-tighter mb-1 text-center">Registrar Participación</h3>
             <p className="text-xs text-on-surface-variant font-bold mb-6 text-center">{participationModal.name}</p>
             
             <div className="w-full space-y-4 mb-6">
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Motivo / Descripción</label>
                   <input type="text" value={partTitle} onChange={e => setPartTitle(e.target.value)} className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant text-[11px] font-bold uppercase outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 block">Calificación (0.0 - 5.0)</label>
                   <input type="number" step="0.1" min="0" max="5" value={partScore} onChange={e => setPartScore(e.target.value)} className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant text-lg font-black text-center outline-none focus:ring-2 focus:ring-primary" />
                </div>
             </div>

             <div className="flex w-full gap-3">
               <button onClick={() => setParticipationModal(null)} className="flex-1 py-3 rounded-xl bg-surface-container text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-high transition-all">Cancelar</button>
               <button onClick={() => {
                 addGrade(participationModal.studentId, {
                   title: partTitle,
                   score: parseFloat(partScore),
                   type: 'participation',
                   date: new Date().toISOString()
                 });
                 setParticipationModal(null);
                 setPartTitle("Participación en Clase");
                 setPartScore("5.0");
               }} className="flex-1 py-3 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-500/30">Guardar</button>
             </div>
          </div>
        </div>
      )}

      <style jsx global>{` @media print { .no-print { display: none !important; } } `}</style>
    </div>
  );
}
