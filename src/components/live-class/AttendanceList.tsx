"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  CheckCircle, XCircle, Clock, Save, Filter, User, 
  BookOpen, BarChart3, GraduationCap, Layers, Cake, MessageSquare, Star
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import StudentProfileModal from "@/components/shared/StudentProfileModal";

export default function AttendanceList() {
  const { students, subjects, profile } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedGrado, setSelectedGrado] = useState<string>("TODOS");
  const [selectedCurso, setSelectedCurso] = useState<string>("TODOS");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [isSaving, setIsSaving] = useState(false);

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
        
        if (gradePart) setSelectedGrado(gradePart);

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
    return [...new Set(students.map(s => s.grado))].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students]);

  const cursoOptions = useMemo(() => {
    const studentsInGrado = selectedGrado === "TODOS" ? students : students.filter(s => s.grado === selectedGrado);
    return [...new Set(studentsInGrado.map(s => s.curso))].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [students, selectedGrado]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Ignorar estudiantes eliminados lógicamente
      if (s.isActive === false) return false;

      const matchGrado = selectedGrado === "TODOS" || s.grado === selectedGrado;
      const matchCurso = selectedCurso === "TODOS" || s.curso === selectedCurso;
      return matchGrado && matchCurso;
    });
  }, [students, selectedGrado, selectedCurso]);

  const stats = useMemo(() => ({
    total: filteredStudents.length,
    present: filteredStudents.filter(s => attendance[s.id] === 'present').length,
    absent: filteredStudents.filter(s => attendance[s.id] === 'absent').length,
    late: filteredStudents.filter(s => attendance[s.id] === 'late').length,
    pending: filteredStudents.filter(s => !attendance[s.id]).length
  }), [filteredStudents, attendance]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
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
             <button onClick={() => { const u = {...attendance}; filteredStudents.forEach(s => u[s.id] = 'present'); setAttendance(u); }} className="px-6 py-3 bg-secondary/10 text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-secondary hover:text-white transition-all flex items-center gap-2"><CheckCircle size={16} /> Todos Presentes</button>
             <button onClick={() => { setIsSaving(true); setTimeout(() => { alert("Asistencia Guardada"); setIsSaving(false); }, 1000); }} className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"><Save size={16} /> Guardar Todo</button>
           </div>
        </div>

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
                       <span className="text-[9px] font-black bg-surface-container px-3 py-1 rounded-lg uppercase">G: {student.grado} | C: {student.curso}</span>
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
      <style jsx global>{` @media print { .no-print { display: none !important; } } `}</style>
    </div>
  );
}
