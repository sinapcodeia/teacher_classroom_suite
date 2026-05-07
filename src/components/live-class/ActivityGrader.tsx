"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Save, Plus, Target, Award, FileText, CheckCircle2 } from "lucide-react";

interface ActivityGraderProps {
  course: string;
  subject: string;
}

export default function ActivityGrader({ course, subject }: ActivityGraderProps) {
  const { students, addGrade } = useApp();
  const [activityTitle, setActivityTitle] = useState("");
  const [activityType, setActivityType] = useState<"activity" | "participation">("activity");
  const [grades, setGrades] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const filteredStudents = useMemo(() => {
    return students.filter(s => s.curso === course && s.isActive !== false);
  }, [students, course]);

  const handleGradeChange = (studentId: string, value: string) => {
    // Validar que sea un número entre 0 y 5
    const num = parseFloat(value);
    if (value !== "" && (isNaN(num) || num < 0 || num > 5)) return;
    setGrades(prev => ({ ...prev, [studentId]: value }));
  };

  const handleSaveAll = async () => {
    if (!activityTitle.trim()) return alert("Por favor, ingresa un nombre para la actividad.");
    
    const studentsToGrade = Object.keys(grades).filter(id => grades[id] !== "");
    if (studentsToGrade.length === 0) return alert("No hay notas ingresadas para guardar.");

    setIsSaving(true);
    try {
      const today = new Date().toISOString();
      const promises = studentsToGrade.map(id => 
        addGrade(id, {
          title: activityTitle,
          score: parseFloat(grades[id]),
          type: activityType,
          date: today
        })
      );
      await Promise.all(promises);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setGrades({});
        setActivityTitle("");
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Error al guardar las notas.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="bg-white border border-outline-variant rounded-[2.5rem] shadow-xl overflow-hidden mt-6">
      <div className="p-8 border-b border-outline-variant bg-surface-container-lowest">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <Award size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase italic">Panel de Calificaciones</h2>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Registrar Exámenes, Talleres o Participación</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select 
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as any)}
              className="bg-slate-100 border-none rounded-xl px-4 py-3 font-black text-[10px] uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="activity">Actividad / Taller</option>
              <option value="participation">Participación</option>
            </select>
            <button 
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Guardar Calificaciones"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1 mb-2 block">Nombre de la Actividad / Tema de Evaluación</label>
          <div className="relative">
            <input 
              type="text" 
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              placeholder="Ej: Evaluación de Fraccionarios, Taller de Ortografía..."
              className="w-full bg-slate-50 border border-outline-variant rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary outline-none uppercase"
            />
            <FileText className="absolute right-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
          </div>
        </div>
      </div>

      <div className="p-8">
        {showSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 size={20} />
            <span className="text-xs font-black uppercase tracking-widest">¡Notas guardadas exitosamente en los perfiles!</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map(student => (
            <div key={student.id} className="flex items-center gap-4 p-4 bg-surface-container-lowest border border-outline-variant rounded-2xl hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500 shrink-0">
                {student.primerApellido[0]}{student.primerNombre[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-on-surface uppercase truncate">{student.primerApellido} {student.primerNombre}</p>
                <p className="text-[9px] font-bold text-on-surface-variant uppercase opacity-50">Promedio: {student.avgGrade?.toFixed(1) || "0.0"}</p>
              </div>
              <input 
                type="text"
                placeholder="0.0"
                value={grades[student.id] || ""}
                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                className="w-14 h-12 bg-white border border-outline-variant rounded-xl text-center font-black text-sm focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
