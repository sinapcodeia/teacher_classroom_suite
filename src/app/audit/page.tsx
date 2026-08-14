"use client";

import { useApp } from "@/context/AppContext";
import { useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { Database, AlertTriangle, CheckCircle2, Search, Wrench, ShieldCheck, Activity, Zap, Users } from "lucide-react";

export default function AuditPage() {
  const { students, setStudents } = useApp();
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // 1. Escanear la base de datos en memoria (Rápido y Local)
  const auditResults = useMemo(() => {
    let affectedStudents = 0;
    let totalCorruptedGrades = 0;
    const affectedDetails: any[] = [];

    students.forEach(student => {
      if (!student.grades) return;
      
      const corruptedGrades = student.grades.filter((g: any) => {
        const title = (g.title || "").toLowerCase();
        const isTaller = title.includes("taller") || title.includes("guia") || title.includes("guía") || title.includes("actividad") || title.includes("evaluacion") || title.includes("evaluación");
        return isTaller && g.type === "participation";
      });

      if (corruptedGrades.length > 0) {
        affectedStudents++;
        totalCorruptedGrades += corruptedGrades.length;
        affectedDetails.push({ student, corruptedGrades });
      }
    });

    return { affectedStudents, totalCorruptedGrades, affectedDetails };
  }, [students]);

  // 2. Función Offline-First (Optimista)
  const handleFixDatabase = async () => {
    if (!confirm(`¿Iniciar Protocolo de Saneamiento para ${auditResults.totalCorruptedGrades} calificaciones?`)) return;
    setIsFixing(true);
    setFixResult(null);
    setProgress(10);

    try {
      const updatesMap = new Map();

      auditResults.affectedDetails.forEach(({ student }) => {
        const fixedGrades = student.grades.map((g: any) => {
          const title = (g.title || "").toLowerCase();
          const isTaller = title.includes("taller") || title.includes("guia") || title.includes("guía") || title.includes("actividad") || title.includes("evaluacion") || title.includes("evaluación");
          
          if (isTaller && g.type === "participation") {
            return { ...g, type: "activity" };
          }
          return g;
        });

        const validScores = fixedGrades.filter((g:any) => g.type !== 'participation').map((g:any) => g.score);
        let newAvg = validScores.length > 0 ? validScores.reduce((a:number, b:number) => a + b, 0) / validScores.length : 0;
        const bonus = fixedGrades.filter((g:any) => g.type === 'participation').reduce((a:number, b:any) => a + (b.score * 0.02), 0);
        newAvg = Math.min(5.0, newAvg + bonus);
        const newAvgStr = Number(newAvg.toFixed(2));

        updatesMap.set(student.id, { grades: fixedGrades, avgGrade: newAvgStr });
      });

      setProgress(50);

      // Actualizar estado local INMEDIATAMENTE (No necesitamos internet para que la UI reaccione)
      const updatedStudents = students.map((s: any) => {
        if (updatesMap.has(s.id)) {
          return { ...s, ...updatesMap.get(s.id) };
        }
        return s;
      });
      setStudents(updatedStudents as any);

      setProgress(80);

      // Sincronización en segundo plano con Firebase
      if (typeof window !== "undefined" && navigator.onLine) {
        const batch = writeBatch(db);
        updatesMap.forEach((updates, studentId) => {
          batch.update(doc(db, "students", studentId), updates);
        });
        await batch.commit();
      } else {
        // Firebase Firestore JS SDK ya maneja la persistencia offline, así que el update funcionaría igual si se llama.
        // Pero para ser ultra rápidos, confiamos en la caché local.
        const batch = writeBatch(db);
        updatesMap.forEach((updates, studentId) => {
          batch.update(doc(db, "students", studentId), updates);
        });
        batch.commit().catch(e => console.warn("Sincronización en segundo plano pendiente:", e));
      }

      setProgress(100);
      setTimeout(() => {
        setFixResult(`¡Saneamiento exitoso! Las calificaciones de ${auditResults.affectedStudents} estudiantes fueron reparadas y enrutadas a (S/SH).`);
        setIsFixing(false);
      }, 800);
      
    } catch (error: any) {
      console.error(error);
      setFixResult(`Error al reparar: ${error.message}`);
      setIsFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 flex items-center justify-center font-sans overflow-hidden relative">
      {/* Fondo de última generación */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/20 blur-[120px]"></div>
      </div>

      <div className="max-w-5xl w-full z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        <div className="bg-white/10 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/10 relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="p-5 bg-indigo-500/20 text-indigo-400 rounded-3xl backdrop-blur-md border border-indigo-500/30 shadow-inner">
                <Database size={40} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">Auditoría 360°</h1>
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-[0.2em] mt-1">Motor de Integridad (Modo Local/Offline Activo)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            <div className="p-8 bg-slate-900/50 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-indigo-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Users size={100} /></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Población con Errores</p>
              <div className="flex items-baseline gap-2">
                <p className="text-6xl font-black text-rose-500">{auditResults.affectedStudents}</p>
                <span className="text-sm font-bold text-slate-500 uppercase">Estudiantes</span>
              </div>
            </div>
            <div className="p-8 bg-slate-900/50 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-amber-500/50 transition-colors">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Activity size={100} /></div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Talleres Mal Clasificados</p>
              <div className="flex items-baseline gap-2">
                <p className="text-6xl font-black text-amber-500">{auditResults.totalCorruptedGrades}</p>
                <span className="text-sm font-bold text-slate-500 uppercase">Notas</span>
              </div>
            </div>
          </div>

          {auditResults.totalCorruptedGrades > 0 ? (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className="p-6 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-3xl flex gap-5 text-amber-200 shadow-inner">
                <AlertTriangle size={32} className="shrink-0 text-amber-400" />
                <div>
                  <p className="font-black text-sm uppercase tracking-widest text-amber-400">Anomalía Detectada en Historial</p>
                  <p className="text-xs mt-2 font-medium leading-relaxed opacity-90">El algoritmo ha detectado talleres y evaluaciones guardadas accidentalmente como participación. En un entorno institucional, estas deben sumar al (Saber / Saber Hacer). ¿Deseas aplicar la corrección automática en milisegundos?</p>
                </div>
              </div>

              {isFixing ? (
                <div className="p-8 bg-slate-800/80 rounded-3xl border border-indigo-500/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                    <Zap size={40} className="text-indigo-400 animate-bounce" />
                    <p className="text-sm font-black uppercase text-indigo-300 tracking-widest">Saneando Datos ({progress}%)...</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={handleFixDatabase}
                  className="w-full py-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-3xl font-black uppercase tracking-[0.2em] hover:from-indigo-500 hover:to-blue-500 transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3 group"
                >
                  <Wrench size={24} className="group-hover:rotate-45 transition-transform" /> Iniciar Saneamiento Autónomo
                </button>
              )}
            </div>
          ) : (
            <div className="p-12 bg-gradient-to-b from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 rounded-[2.5rem] flex flex-col items-center text-center shadow-[0_0_50px_-15px_rgba(16,185,129,0.3)] animate-in zoom-in-95 duration-500">
              <div className="p-6 bg-emerald-500/20 rounded-full mb-6 relative">
                <div className="absolute inset-0 border-4 border-emerald-400/30 rounded-full animate-ping"></div>
                <ShieldCheck size={64} className="text-emerald-400 relative z-10" />
              </div>
              <p className="font-black text-2xl uppercase tracking-widest text-emerald-400">Base de Datos Saludable</p>
              <p className="text-sm font-bold mt-3 text-emerald-200/60 uppercase tracking-wider max-w-md">Toda la malla de calificaciones está perfecta. Cero corrupciones detectadas en los pilares institucionales.</p>
            </div>
          )}

          {fixResult && (
            <div className="mt-8 p-6 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-3xl font-bold text-sm text-center animate-in slide-in-from-top-4 flex items-center justify-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-400" /> {fixResult}
            </div>
          )}
        </div>

        {/* Detalle de afectados */}
        {auditResults.affectedDetails.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10 shadow-xl">
            <h3 className="text-sm font-black text-indigo-300 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
              <Search size={20} /> Rayos X: Expedientes Afectados
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {auditResults.affectedDetails.map((detail, idx) => (
                <div key={idx} className="p-5 bg-slate-900/60 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-colors group">
                  <p className="font-black text-white text-xs uppercase tracking-wider mb-4">
                    {detail.student.primerApellido} {detail.student.primerNombre} 
                    <span className="block text-indigo-400 font-bold mt-1 text-[10px]">Grado {detail.student.grado}</span>
                  </p>
                  <div className="space-y-2">
                    {detail.corruptedGrades.map((g: any) => (
                      <div key={g.id} className="flex justify-between items-center text-[10px] bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <span className="font-bold text-slate-300 uppercase truncate pr-2">{g.title}</span>
                        <span className="font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg shrink-0">{g.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
