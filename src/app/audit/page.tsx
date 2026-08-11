"use client";

import { useApp } from "@/context/AppContext";
import { useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { Database, AlertTriangle, CheckCircle2, Search, Wrench } from "lucide-react";

export default function AuditPage() {
  const { students, setStudents } = useApp();
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<string | null>(null);

  // 1. Escanear la base de datos en memoria
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

  // 2. Función para reparar masivamente en Firestore
  const handleFixDatabase = async () => {
    if (!confirm(`¿Estás seguro de reparar ${auditResults.totalCorruptedGrades} calificaciones?`)) return;
    setIsFixing(true);
    setFixResult(null);

    try {
      const batch = writeBatch(db);
      const updatesMap = new Map();

      auditResults.affectedDetails.forEach(({ student }) => {
        // Clonar y reparar notas
        const fixedGrades = student.grades.map((g: any) => {
          const title = (g.title || "").toLowerCase();
          const isTaller = title.includes("taller") || title.includes("guia") || title.includes("guía") || title.includes("actividad") || title.includes("evaluacion") || title.includes("evaluación");
          
          if (isTaller && g.type === "participation") {
            return { ...g, type: "activity" };
          }
          return g;
        });

        // Recalcular el promedio base simple (sin el bonus erróneo)
        const validScores = fixedGrades.filter((g:any) => g.type !== 'participation').map((g:any) => g.score);
        let newAvg = validScores.length > 0 ? validScores.reduce((a:number, b:number) => a + b, 0) / validScores.length : 0;
        const bonus = fixedGrades.filter((g:any) => g.type === 'participation').reduce((a:number, b:any) => a + (b.score * 0.02), 0);
        newAvg = Math.min(5.0, newAvg + bonus);

        const newAvgStr = Number(newAvg.toFixed(2));

        batch.update(doc(db, "students", student.id), { 
          grades: fixedGrades,
          avgGrade: newAvgStr
        });

        updatesMap.set(student.id, { grades: fixedGrades, avgGrade: newAvgStr });
      });

      await batch.commit();

      // Actualizar estado local
      setStudents(prev => prev.map(s => {
        if (updatesMap.has(s.id)) {
          return { ...s, ...updatesMap.get(s.id) };
        }
        return s;
      }));

      setFixResult(`¡Éxito! Se han reparado ${auditResults.totalCorruptedGrades} notas y recalculado los promedios de ${auditResults.affectedStudents} estudiantes.`);
    } catch (error: any) {
      console.error(error);
      setFixResult(`Error al reparar: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
              <Database size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Centro de Auditoría de Datos</h1>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Escáner de Integridad de Calificaciones</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estudiantes Afectados</p>
              <p className="text-4xl font-black text-rose-600">{auditResults.affectedStudents}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Notas Corruptas (Talleres etiquetados como Participación)</p>
              <p className="text-4xl font-black text-amber-500">{auditResults.totalCorruptedGrades}</p>
            </div>
          </div>

          {auditResults.totalCorruptedGrades > 0 ? (
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-4 text-amber-800">
                <AlertTriangle className="shrink-0" />
                <div>
                  <p className="font-bold text-sm uppercase">Se detectaron inconsistencias</p>
                  <p className="text-xs mt-1">El sistema ha encontrado talleres y guías que fueron guardados con la etiqueta incorrecta. Esto está afectando el cálculo de promedios de estos estudiantes.</p>
                </div>
              </div>

              <button 
                onClick={handleFixDatabase}
                disabled={isFixing}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFixing ? "Reparando Base de Datos..." : <><Wrench size={18} /> Reparar Todas las Notas Ahora</>}
              </button>
            </div>
          ) : (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center text-emerald-600 text-center">
              <CheckCircle2 size={48} className="mb-4" />
              <p className="font-black text-lg uppercase tracking-widest">Base de Datos Saludable</p>
              <p className="text-sm font-bold mt-2">No se encontraron talleres guardados como participación. Todo está perfecto.</p>
            </div>
          )}

          {fixResult && (
            <div className="mt-6 p-4 bg-slate-800 text-white rounded-2xl font-bold text-sm text-center">
              {fixResult}
            </div>
          )}
        </div>

        {/* Detalle de afectados */}
        {auditResults.affectedDetails.length > 0 && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Search size={16} /> Detalle de Registros Afectados
            </h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4">
              {auditResults.affectedDetails.map((detail, idx) => (
                <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-slate-50">
                  <p className="font-black text-slate-800 text-sm uppercase">
                    {detail.student.primerApellido} {detail.student.primerNombre} <span className="text-slate-400 font-bold ml-2">(Grado {detail.student.grado})</span>
                  </p>
                  <div className="mt-3 space-y-2">
                    {detail.corruptedGrades.map((g: any) => (
                      <div key={g.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-600 uppercase">{g.title}</span>
                        <span className="font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md">Nota: {g.score}</span>
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
