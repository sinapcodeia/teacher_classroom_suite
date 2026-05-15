"use client";

export const dynamic = 'force-dynamic';

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import AttendanceList from "@/components/live-class/AttendanceList";
import TopicSelector from "@/components/live-class/TopicSelector";
import SessionNotes from "@/components/live-class/SessionNotes";
import ActivityGrader from "@/components/live-class/ActivityGrader";
import ClassInsights from "@/components/live-class/ClassInsights";
import GradebookManager from "@/components/live-class/GradebookManager";
import SessionReminders from "@/components/live-class/SessionReminders";
import { ArrowLeft, Plus, CheckCircle, HardDrive, LayoutDashboard, LayoutGrid, FileSpreadsheet, GraduationCap, Layers, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { useEffect, useState, useMemo } from "react";

export default function LiveClassPage() {
  const { subjects, masterData, myStudents, studentsLoading } = useApp();
  const [mounted, setMounted] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedGrado, setSelectedGrado] = useState("TODOS");
  const [selectedCurso, setSelectedCurso] = useState("TODOS");
  const [viewMode, setViewMode] = useState<"live" | "gradebook">("live");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSubject = params.get("subject");
      const urlCurso = params.get("curso");
      
      if (urlSubject) {
        const found = subjects.find(s => s.name.toLowerCase() === urlSubject.toLowerCase());
        if (found) setSelectedSubject(found.id);
      }
      if (urlCurso) {
        setSelectedCurso(urlCurso);
        const parts = urlCurso.split('-');
        if (parts.length > 0) setSelectedGrado(parts[0]);
      }
    }
  }, [subjects]);

  useEffect(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  const currentSubjectName = subjects.find(s => s.id === selectedSubject)?.name || "MATERIA";
  const normalizedGradeForCurriculum = normalizeGrade(selectedGrado === "TODOS" ? "1" : selectedGrado);

  const gradeOptions = useMemo(() => {
    const grades = new Set(myStudents.map(s => normalizeGrade(s.grado)));
    return Array.from(grades).sort();
  }, [myStudents]);

  const cursoOptions = useMemo(() => {
    let base = myStudents;
    if (selectedGrado !== "TODOS") {
      base = base.filter(s => normalizeGrade(s.grado) === selectedGrado);
    }
    const courses = new Set(base.map(s => s.curso));
    return Array.from(courses).sort();
  }, [myStudents, selectedGrado]);

  if (!mounted) return null;

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 md:pb-8">
        
        {/* Filtros Globales de Aula */}
        <div className="lg:col-span-12 mb-2 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-8 rounded-[3rem] border border-outline-variant shadow-2xl relative overflow-hidden mb-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="space-y-2 relative z-10">
              <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-2 flex items-center gap-2"><LayoutGrid size={14} /> Docente / Materia</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border-2 border-outline-variant text-[11px] font-black uppercase outline-none focus:border-primary transition-all appearance-none cursor-pointer">
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div className="space-y-2 relative z-10">
              <label className="text-[10px] font-black text-secondary uppercase tracking-widest ml-2 flex items-center gap-2"><GraduationCap size={14} /> Grado</label>
              <select value={selectedGrado} onChange={(e) => { setSelectedGrado(e.target.value); setSelectedCurso("TODOS"); }} className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border-2 border-outline-variant text-[11px] font-black uppercase outline-none focus:border-secondary transition-all appearance-none cursor-pointer">
                <option value="TODOS">TODOS LOS GRADOS</option>
                {gradeOptions.map(g => <option key={g} value={g}>GRADO {g}</option>)}
              </select>
            </div>

            <div className="space-y-2 relative z-10">
              <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Layers size={14} /> Curso</label>
              <select value={selectedCurso} onChange={(e) => setSelectedCurso(e.target.value)} className="w-full h-14 bg-surface-container-low px-6 rounded-2xl border-2 border-outline-variant text-[11px] font-black uppercase outline-none focus:border-orange-500 transition-all appearance-none cursor-pointer">
                <option value="TODOS">TODOS LOS CURSOS</option>
                {cursoOptions.map(c => <option key={c} value={c}>CURSO {c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mb-6">
            <Link href="/horario" className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all group px-5 py-3 bg-white rounded-2xl border border-outline-variant/30 shadow-lg">
              <LayoutDashboard size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest">Panel de Horario</span>
            </Link>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setViewMode(v => v === "live" ? "gradebook" : "live")}
                className={`flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-[10px] tracking-widest transition-all shadow-xl ${viewMode === "gradebook" ? "bg-primary text-white" : "bg-white text-on-surface-variant border border-outline-variant hover:bg-slate-50"}`}
              >
                <FileSpreadsheet size={18} />
                {viewMode === "live" ? "VER PLANILLA COMPLETA" : "VOLVER A CLASE EN VIVO"}
              </button>
            </div>
          </div>
        </div>

        {studentsLoading ? (
          <div className="lg:col-span-12 py-32 flex flex-col items-center gap-4">
             <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sincronizando Aula...</p>
          </div>
        ) : myStudents.length === 0 && (
          <div className="lg:col-span-12 p-12 bg-amber-50 border-2 border-amber-200 rounded-[3rem] text-center space-y-4 animate-fade-in">
            <AlertCircle size={48} className="mx-auto text-amber-600" />
            <h3 className="text-xl font-black text-amber-900 uppercase">No tienes cursos asignados</h3>
            <p className="text-sm text-amber-800 font-medium max-w-md mx-auto italic">
              Para ver tu lista de estudiantes y tomar asistencia, primero debes configurar tus grados y cursos asignados en tu <strong>Perfil de Docente</strong>.
            </p>
            <Link href="/configuracion" className="inline-block px-8 py-4 bg-amber-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-700 transition-all shadow-xl shadow-amber-200">
              CONFIGURAR MI PERFIL
            </Link>
          </div>
        )}

        {myStudents.length > 0 && (viewMode === "live" ? (
          <>
            <div className="lg:col-span-8 flex flex-col gap-8">
              <AttendanceList 
                subjectId={selectedSubject}
                grade={selectedGrado}
                course={selectedCurso}
              />
              <ActivityGrader 
                subject={currentSubjectName}
                course={selectedCurso}
                grade={selectedGrado}
              />
            </div>

            <aside className="lg:col-span-4 flex flex-col gap-8">
              <SessionReminders course={selectedCurso} subject={currentSubjectName} />
              <ClassInsights course={selectedCurso} subject={currentSubjectName} />
              <TopicSelector subjectId={currentSubjectName} grade={normalizedGradeForCurriculum} />
              <SessionNotes subject={currentSubjectName} course={selectedCurso} />
              
              <div className="p-8 bg-surface-container rounded-[3rem] border border-outline-variant relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                  <HardDrive size={100} />
                </div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                       <HardDrive size={24} className="text-on-surface" />
                    </div>
                    <span className="text-[12px] font-black text-on-surface uppercase tracking-widest">Sincronización</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-black px-4 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">PROTECCIÓN ACTIVA</span>
                </div>
                <div className="w-full bg-outline-variant h-4 rounded-full overflow-hidden relative z-10 shadow-inner">
                  <div className="bg-emerald-500 h-full w-[94%] rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                </div>
                <p className="mt-8 text-xs text-on-surface-variant font-bold leading-relaxed relative z-10 opacity-70">
                  Respaldo automático local activo. Cada nota y asistencia se guarda instantáneamente.
                </p>
              </div>
            </aside>
          </>
        ) : (
          <div className="lg:col-span-12">
            <GradebookManager grade={selectedGrado} course={selectedCurso} subject={currentSubjectName} />
          </div>
        ))}
      </main>

      <BottomNavBar />
    </div>
  );
}

