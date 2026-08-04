"use client";

import { Search, Filter, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Users } from "lucide-react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { useState, useMemo, useEffect } from "react";

interface StudentListProps {
  selectedId: string;
  onSelect: (id: string) => void;
  onFilteredCountChange?: (count: number) => void;
  gradoFilter: string;
  setGradoFilter: (val: string) => void;
  cursoFilter: string;
  setCursoFilter: (val: string) => void;
  materiaFilter: string;
  setMateriaFilter: (val: string) => void;
}

type SortField = "name" | "grade" | "avg";
type SortDir = "asc" | "desc";

// Devuelve colores de performance según avgGrade
function perfColor(avg: number) {
  if (avg >= 4.6) return { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", label: "Superior" };
  if (avg >= 4.0) return { bar: "bg-blue-500",    badge: "bg-blue-50 text-blue-700",    label: "Alto" };
  if (avg >= 3.0) return { bar: "bg-amber-500",   badge: "bg-amber-50 text-amber-700",   label: "Básico" };
  return           { bar: "bg-red-500",    badge: "bg-red-50 text-red-700",    label: "Bajo" };
}

// Helper to calculate specific subject average in current active period
const getSubjectAverage = (st: any, subject: string, periodId: string) => {
  const pid = periodId.toLowerCase();
  
  // 1. Try DetailedGrades
  if (st.detailedGrades?.[subject]?.[pid]) {
    const d = st.detailedGrades[subject][pid];
    const getAvg = (vals: (number | null)[]) => {
      if (!vals) return null;
      const valid = vals.filter(v => typeof v === 'number') as number[];
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    };
    const sbAvg = getAvg(d.sb);
    const sbhAvg = getAvg(d.sbh);
    const srAvg = getAvg(d.sr);
    const cvAvg = getAvg(d.cv);
    const aut = d.aut;

    if (sbAvg === null && sbhAvg === null && srAvg === null && cvAvg === null && aut === null) {
      return 0;
    }

    const final = (
      ((sbAvg ?? 0) * 0.3) +
      ((sbhAvg ?? 0) * 0.4) +
      ((srAvg ?? 0) * 0.2) +
      ((cvAvg ?? 0) * 0.05) +
      ((aut ?? 0) * 0.05)
    );
    return parseFloat(final.toFixed(1));
  }
  
  // 2. Fallback to Legacy grades
  if (st.grades) {
    const subjectGrades = st.grades.filter((g: any) => 
      g.periodId === pid && g.title?.toUpperCase().includes(`[${subject.toUpperCase()}]`)
    );
    if (subjectGrades.length === 0) return 0;
    
    const validScores = subjectGrades.filter((g: any) => g.type !== 'participation').map((g: any) => g.score);
    const baseAvg = validScores.length > 0 ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length : 0;
    const bonus = subjectGrades.filter((g: any) => g.type === 'participation').reduce((a: number, b: any) => a + (b.score * 0.02), 0);
    return parseFloat(Math.min(5.0, baseAvg + bonus).toFixed(1));
  }
  
  return 0;
};

// Genera color de avatar según inicial + grado (determinístico)
const AVATAR_PALETTES = [
  "from-primary to-primary/70",
  "from-secondary to-secondary/70",
  "from-violet-600 to-violet-400",
  "from-rose-600 to-rose-400",
  "from-amber-600 to-amber-400",
  "from-teal-600 to-teal-400",
];
function avatarPalette(name: string) {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_PALETTES[code % AVATAR_PALETTES.length];
}

export default function StudentList({ 
  selectedId, onSelect, onFilteredCountChange,
  gradoFilter, setGradoFilter, cursoFilter, setCursoFilter,
  materiaFilter, setMateriaFilter
}: StudentListProps) {
  const { myStudents, profile, masterData } = useApp();
  const [searchTerm, setSearchTerm]     = useState("");
  const [sortField, setSortField]       = useState<SortField>("name");
  const [sortDir, setSortDir]           = useState<SortDir>("asc");

  // ── Opciones de filtro ───────────────────────────────────────────────────────
  const gradoOptions = useMemo(
    () => [...new Set(myStudents.map(s => normalizeGrade(s.grado)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [myStudents]
  );

  const cursoOptions = useMemo(() => {
    const base = gradoFilter === "TODOS"
      ? myStudents
      : myStudents.filter(s => normalizeGrade(s.grado) === gradoFilter);
    return [...new Set(base.map(s => s.curso))].filter(Boolean).sort();
  }, [myStudents, gradoFilter]);

  const availableSubjects = useMemo(() => {
    return masterData.subjects || ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"];
  }, [masterData.subjects]);

  // ── Filtrado + ordenamiento ──────────────────────────────────────────────────
  const requiresFilter = gradoFilter === "TODOS" && cursoFilter === "TODOS" && searchTerm.trim() === "";

  const filteredStudents = useMemo(() => {
    if (requiresFilter) return [];

    const list = myStudents.filter(s => {
      if (s.isActive === false) return false;
      const fullName = `${s.primerApellido} ${s.segundoApellido} ${s.primerNombre} ${s.segundoNombre}`.toLowerCase();
      const matchSearch = fullName.includes(searchTerm.toLowerCase()) || s.nroDocumento.includes(searchTerm);
      const matchGrado  = gradoFilter === "TODOS" || normalizeGrade(s.grado) === gradoFilter;
      const matchCurso  = cursoFilter === "TODOS" || s.curso === cursoFilter;
      return matchSearch && matchGrado && matchCurso;
    });

    const activePeriod = masterData.activePeriod || "p2";
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = `${a.primerApellido}${a.primerNombre}`.localeCompare(`${b.primerApellido}${b.primerNombre}`);
      } else if (sortField === "grade") {
        cmp = normalizeGrade(a.grado).localeCompare(normalizeGrade(b.grado), undefined, { numeric: true });
      } else {
        const avgA = materiaFilter === "TODAS" ? (a.avgGrade || 0) : getSubjectAverage(a, materiaFilter, activePeriod);
        const avgB = materiaFilter === "TODAS" ? (b.avgGrade || 0) : getSubjectAverage(b, materiaFilter, activePeriod);
        cmp = avgA - avgB;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [myStudents, searchTerm, gradoFilter, cursoFilter, sortField, sortDir, materiaFilter, masterData.activePeriod, requiresFilter]);

  // Sincronizar el conteo con el componente padre para evitar inconsistencias visuales
  useEffect(() => {
    onFilteredCountChange?.(filteredStudents.length);
  }, [filteredStudents.length, onFilteredCountChange]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === "asc"
      ? <ArrowUp size={12} className="text-primary" />
      : <ArrowDown size={12} className="text-primary" />;
  }

  // Reset curso when grade changes
  function handleGradeChange(g: string) {
    setGradoFilter(g);
    setCursoFilter("TODOS");
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-[2rem] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
            <input
              className="w-full h-11 pl-10 pr-10 bg-white border border-primary/20 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-xs font-bold outline-none uppercase placeholder:normal-case placeholder:font-normal placeholder:text-on-surface-variant transition-all shadow-sm hover:border-primary/40"
              placeholder="Buscar estudiante (nombre, apellido, ID)..."
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center bg-surface-container text-on-surface-variant rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"
              >
                <span className="text-[10px] font-black leading-none">✕</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Grado */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={13} />
              <select
                value={gradoFilter}
                onChange={e => handleGradeChange(e.target.value)}
                className="h-11 bg-surface-container-low border-none rounded-xl pl-8 pr-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none"
              >
                <option value="TODOS">Todos los grados</option>
                {gradoOptions.map(g => <option key={g} value={g}>Grado {g}</option>)}
              </select>
            </div>

            {/* Curso */}
            <select
              value={cursoFilter}
              onChange={e => setCursoFilter(e.target.value)}
              className="h-11 bg-surface-container-low border-none rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none"
            >
              <option value="TODOS">Todos los cursos</option>
              {cursoOptions.map(c => <option key={c} value={c}>Curso {c}</option>)}
            </select>

            {/* Materia */}
            <select
              value={materiaFilter}
              onChange={e => setMateriaFilter(e.target.value)}
              className="h-11 bg-surface-container-low border border-primary/20 rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none text-primary"
            >
              <option value="TODAS">Todas las materias</option>
              {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Counter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-xl border border-primary/10">
            <Users size={14} className="text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">
              {filteredStudents.length}<span className="opacity-50">/{myStudents.filter(s => s.isActive !== false).length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-[2rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-[9px] font-black uppercase tracking-[0.18em] border-b border-outline-variant/30">
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    Estudiante <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <button onClick={() => toggleSort("grade")} className="flex items-center gap-1.5 hover:text-primary transition-colors mx-auto">
                    Grado/Curso <SortIcon field="grade" />
                  </button>
                </th>
                <th className="px-4 py-4 text-center">
                  <button onClick={() => toggleSort("avg")} className="flex items-center gap-1.5 hover:text-primary transition-colors mx-auto">
                    Rendimiento <SortIcon field="avg" />
                  </button>
                </th>
                <th className="px-6 py-4 text-right w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {requiresFilter ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-on-surface-variant opacity-40">
                      <Filter size={40} />
                      <p className="text-xs font-black uppercase tracking-widest">Selecciona un filtro</p>
                      <p className="text-[10px] font-bold">Por favor, selecciona un grado, curso o ingresa un nombre para buscar.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-on-surface-variant opacity-40">
                      <Users size={40} />
                      <p className="text-xs font-black uppercase tracking-widest">No se encontraron estudiantes</p>
                      <p className="text-[10px] font-bold">Intenta cambiar los filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => {
                  const activePeriod = masterData.activePeriod || "p2";
                  const displayAvg = materiaFilter === "TODAS"
                    ? (student.avgGrade || 0)
                    : getSubjectAverage(student, materiaFilter, activePeriod);

                  const perf = perfColor(displayAvg);
                  const isSelected = selectedId === student.id;
                  const initials = `${student.primerApellido?.[0] ?? ""}${student.primerNombre?.[0] ?? ""}`;
                  const palette = avatarPalette(initials);
                  const avgPct = Math.min((displayAvg / 5) * 100, 100);

                  return (
                    <tr
                      key={student.id}
                      onClick={() => onSelect(student.id)}
                      className={`transition-all duration-150 cursor-pointer group ${
                        isSelected
                          ? "bg-primary/5 border-l-[3px] border-l-primary"
                          : "hover:bg-surface-container-lowest border-l-[3px] border-l-transparent"
                      }`}
                    >
                      {/* Estudiante */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${palette} text-white flex items-center justify-center font-black text-xs shadow-md group-hover:scale-110 transition-transform shrink-0`}>
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-on-surface uppercase tracking-tight leading-snug truncate">
                              {student.primerApellido} {student.segundoApellido}, {student.primerNombre} {student.segundoNombre}
                            </p>
                            <p className="text-[9px] font-bold text-on-surface-variant opacity-50 uppercase tracking-widest">
                              {student.tipoDocumento}: {student.nroDocumento}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Grado + Curso */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-lg uppercase tracking-tight">
                            {normalizeGrade(student.grado)}
                          </span>
                          <span className="text-[9px] font-bold text-on-surface-variant opacity-60 uppercase">
                            {student.curso}
                          </span>
                        </div>
                      </td>

                      {/* Rendimiento */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-1.5 min-w-[90px]">
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${perf.badge}`}>
                              {perf.label}
                            </span>
                            <span className="text-[11px] font-black text-on-surface">
                              {displayAvg.toFixed(1)}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full ${perf.bar} rounded-full transition-all duration-700`}
                              style={{ width: `${avgPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Chevron */}
                      <td className="px-6 py-4 text-right">
                        <ChevronRight
                          size={18}
                          className={`text-primary transition-all ${isSelected ? "translate-x-1" : "group-hover:translate-x-1 opacity-30 group-hover:opacity-100"}`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
