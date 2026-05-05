"use client";

import { Search, ChevronRight, Filter } from "lucide-react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { useState, useMemo } from "react";

interface StudentListProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function StudentList({ selectedId, onSelect }: StudentListProps) {
  const { students, profile } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrado, setFilterGrado] = useState("TODOS");

  const myStudents = useMemo(() => {
    if (profile.isSuperAdmin) return students;
    // Fallback: si teachingCourses está vacío, extrae cursos del horario semanal
    const effectiveCourses = (profile.teachingCourses?.length ?? 0) > 0
      ? profile.teachingCourses
      : [...new Set((profile.weeklySchedule || []).map(b => b.course))];
    return students.filter(s => effectiveCourses.includes(s.curso));
  }, [students, profile]);

  const gradoOptions = useMemo(() => {
    return [...new Set(myStudents.map(s => normalizeGrade(s.grado)))].sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
  }, [myStudents]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter(s => {
      if (s.isActive === false) return false;
      
      const fullName = `${s.primerApellido} ${s.segundoApellido} ${s.primerNombre} ${s.segundoNombre}`.toLowerCase();
      const matchesSearch = fullName.includes(searchTerm.toLowerCase()) || s.nroDocumento.includes(searchTerm);
      const normalizedGrade = normalizeGrade(s.grado);
      const matchesGrado = filterGrado === "TODOS" || normalizedGrade === filterGrado;
      
      return matchesSearch && matchesGrado;
    });
  }, [myStudents, searchTerm, filterGrado]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-outline-variant rounded-[2rem] p-5 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
          <input 
            className="w-full h-12 pl-12 pr-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-sm font-bold outline-none uppercase placeholder:lowercase" 
            placeholder="Buscar por apellido o documento..." 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={16} />
            <select 
              value={filterGrado}
              onChange={(e) => setFilterGrado(e.target.value)}
              className="h-12 bg-surface-container-low border-none rounded-xl pl-10 pr-6 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none"
            >
              <option value="TODOS">Todos los Grados</option>
              {gradoOptions.map(g => (
                <option key={g} value={g}>GRADO {g}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-surface-container text-on-surface-variant text-[10px] font-black uppercase tracking-[0.2em] border-b border-outline-variant/30">
              <th className="px-8 py-5">Nombre Completo</th>
              <th className="px-6 py-5 text-center">Grado</th>
              <th className="px-6 py-5 text-center">Rendimiento</th>
              <th className="px-8 py-5 text-right">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {filteredStudents.map((student) => (
              <tr 
                key={student.id} 
                onClick={() => onSelect(student.id)}
                className={`transition-all cursor-pointer group ${
                  selectedId === student.id ? "bg-primary-container/10 border-l-4 border-l-primary" : "hover:bg-surface-container-low"
                }`}
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xs shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                      {student.primerApellido[0]}{student.primerNombre[0]}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-on-surface uppercase tracking-tight">
                        {student.primerApellido} {student.segundoApellido} {student.primerNombre} {student.segundoNombre}
                      </p>
                      <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">DOC: {student.nroDocumento}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                   <span className="text-[10px] font-black bg-surface-container-high px-3 py-1 rounded-lg uppercase tracking-tighter">
                     {normalizeGrade(student.grado)}
                   </span>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black ${
                    student.avgGrade >= 4 ? "bg-secondary-container text-on-secondary-container" : 
                    student.avgGrade >= 3 ? "bg-tertiary-container text-on-tertiary-container" :
                    "bg-error-container text-on-error-container"
                  }`}>
                    {student.avgGrade.toFixed(1)}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <ChevronRight size={22} className={`text-primary transition-all ${selectedId === student.id ? 'translate-x-2' : 'group-hover:translate-x-2'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
