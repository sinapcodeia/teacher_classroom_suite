"use client";

import { Search, Filter, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Users } from "lucide-react";
import { useApp, normalizeGrade } from "@/context/AppContext";
import { useState, useMemo } from "react";

interface StudentListProps {
  selectedId: string;
  onSelect: (id: string) => void;
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

export default function StudentList({ selectedId, onSelect }: StudentListProps) {
  const { students, profile } = useApp();
  const [searchTerm, setSearchTerm]     = useState("");
  const [filterGrado, setFilterGrado]   = useState("TODOS");
  const [filterCurso, setFilterCurso]   = useState("TODOS");
  const [sortField, setSortField]       = useState<SortField>("name");
  const [sortDir, setSortDir]           = useState<SortDir>("asc");

  // ── Governance ──────────────────────────────────────────────────────────────
  const myStudents = useMemo(() => {
    const isAdmin =
      profile.isSuperAdmin ||
      profile.role === "RECTOR" ||
      profile.role === "COORDINADOR" ||
      profile.role === "BIENESTAR";
    if (isAdmin) return students;
    const effectiveCourses =
      (profile.teachingCourses?.length ?? 0) > 0
        ? profile.teachingCourses
        : [...new Set((profile.weeklySchedule || []).map(b => b.course))];
    return students.filter(s => effectiveCourses.includes(s.curso));
  }, [students, profile]);

  // ── Opciones de filtro ───────────────────────────────────────────────────────
  const gradoOptions = useMemo(
    () => [...new Set(myStudents.map(s => normalizeGrade(s.grado)))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    [myStudents]
  );

  const cursoOptions = useMemo(() => {
    const base = filterGrado === "TODOS"
      ? myStudents
      : myStudents.filter(s => normalizeGrade(s.grado) === filterGrado);
    return [...new Set(base.map(s => s.curso))].filter(Boolean).sort();
  }, [myStudents, filterGrado]);

  // ── Filtrado + ordenamiento ──────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const list = myStudents.filter(s => {
      if (s.isActive === false) return false;
      const fullName = `${s.primerApellido} ${s.segundoApellido} ${s.primerNombre} ${s.segundoNombre}`.toLowerCase();
      const matchSearch = fullName.includes(searchTerm.toLowerCase()) || s.nroDocumento.includes(searchTerm);
      const matchGrado  = filterGrado === "TODOS" || normalizeGrade(s.grado) === filterGrado;
      const matchCurso  = filterCurso === "TODOS" || s.curso === filterCurso;
      return matchSearch && matchGrado && matchCurso;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") {
        cmp = `${a.primerApellido}${a.primerNombre}`.localeCompare(`${b.primerApellido}${b.primerNombre}`);
      } else if (sortField === "grade") {
        cmp = normalizeGrade(a.grado).localeCompare(normalizeGrade(b.grado), undefined, { numeric: true });
      } else {
        cmp = (a.avgGrade || 0) - (b.avgGrade || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [myStudents, searchTerm, filterGrado, filterCurso, sortField, sortDir]);

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
    setFilterGrado(g);
    setFilterCurso("TODOS");
  }

  return (
    <div className="space-y-4">
      {/* ── Filter bar ────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-outline-variant rounded-[2rem] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[180px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
            <input
              className="w-full h-11 pl-10 pr-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-xs font-bold outline-none uppercase placeholder:normal-case placeholder:font-normal"
              placeholder="Buscar por apellido o documento…"
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Grado */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" size={13} />
              <select
                value={filterGrado}
                onChange={e => handleGradeChange(e.target.value)}
                className="h-11 bg-surface-container-low border-none rounded-xl pl-8 pr-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none"
              >
                <option value="TODOS">Todos los grados</option>
                {gradoOptions.map(g => <option key={g} value={g}>Grado {g}</option>)}
              </select>
            </div>

            {/* Curso */}
            <select
              value={filterCurso}
              onChange={e => setFilterCurso(e.target.value)}
              className="h-11 bg-surface-container-low border-none rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer appearance-none"
            >
              <option value="TODOS">Todos los cursos</option>
              {cursoOptions.map(c => <option key={c} value={c}>Curso {c}</option>)}
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
              {filteredStudents.length === 0 ? (
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
                  const perf = perfColor(student.avgGrade || 0);
                  const isSelected = selectedId === student.id;
                  const initials = `${student.primerApellido?.[0] ?? ""}${student.primerNombre?.[0] ?? ""}`;
                  const palette = avatarPalette(initials);
                  const avgPct = Math.min(((student.avgGrade || 0) / 5) * 100, 100);

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
                              {(student.avgGrade || 0).toFixed(1)}
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
