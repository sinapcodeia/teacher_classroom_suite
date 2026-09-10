"use client";

import React, { useState, useEffect, useMemo } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import RoleGuard from "@/components/shared/RoleGuard";
import { useApp } from "@/context/AppContext";
import { 
  Building2, Users, Award, Briefcase, BookOpen, 
  Search, Layers, Download, Printer, MessageSquare, 
  Phone, Mail, Copy, Check, RotateCcw, X 
} from "lucide-react";
import { normalizeGrade, normalizePhone } from "@/lib/constants";
import { exportToCSV } from "@/lib/reports";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

interface StaffMember {
  uid: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: "RECTOR" | "COORDINADOR" | "BIENESTAR" | "DOCENTE" | "DOCENTE_DIRECTOR";
  status: "ACTIVE" | "PENDING";
  isSuperAdmin?: boolean;
  isDirectorGrupo?: boolean;
  directorGrado?: string;
  directorCurso?: string;
  teachingGrades?: string[];
  teachingCourses?: string[];
  teachingSubjectsList?: string[];
  weeklySchedule?: any[];
  photoURL?: string;
}

// ── Helper de Tematización Visual por Área del Conocimiento ──────────────────

function getSubjectTheme(subject: string) {
  const s = subject.toUpperCase();
  if (s.includes("TECNO") || s.includes("INFO") || s.includes("SISTEM") || s.includes("COMPU")) {
    return {
      bg: "bg-teal-50/90",
      border: "border-teal-200/80",
      text: "text-teal-900",
      pill: "bg-white text-teal-800 border-teal-200 hover:bg-teal-100/60",
      icon: "💻"
    };
  }
  if (s.includes("MATEM") || s.includes("CALCUL") || s.includes("GEOM") || s.includes("ESTAD")) {
    return {
      bg: "bg-indigo-50/90",
      border: "border-indigo-200/80",
      text: "text-indigo-900",
      pill: "bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-100/60",
      icon: "📐"
    };
  }
  if (s.includes("ÉTIC") || s.includes("VALOR") || s.includes("RELIG") || s.includes("CONVIV") || s.includes("HUMAN")) {
    return {
      bg: "bg-amber-50/90",
      border: "border-amber-200/80",
      text: "text-amber-900",
      pill: "bg-white text-amber-800 border-amber-200 hover:bg-amber-100/60",
      icon: "⚖️"
    };
  }
  if (s.includes("FÍSIC") || s.includes("QUÍMIC") || s.includes("NATUR") || s.includes("BIOL") || s.includes("CIENC")) {
    return {
      bg: "bg-sky-50/90",
      border: "border-sky-200/80",
      text: "text-sky-900",
      pill: "bg-white text-sky-800 border-sky-200 hover:bg-sky-100/60",
      icon: "⚡"
    };
  }
  if (s.includes("LENGUA") || s.includes("ESPAÑOL") || s.includes("INGL") || s.includes("LITER") || s.includes("IDIOM")) {
    return {
      bg: "bg-rose-50/90",
      border: "border-rose-200/80",
      text: "text-rose-900",
      pill: "bg-white text-rose-800 border-rose-200 hover:bg-rose-100/60",
      icon: "📖"
    };
  }
  if (s.includes("SOCIAL") || s.includes("HISTOR") || s.includes("GEOGR") || s.includes("FILOS")) {
    return {
      bg: "bg-emerald-50/90",
      border: "border-emerald-200/80",
      text: "text-emerald-900",
      pill: "bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-100/60",
      icon: "🌍"
    };
  }
  if (s.includes("EDUC") || s.includes("FÍSIC") || s.includes("DEPORT") || s.includes("ARTE") || s.includes("MÚSIC")) {
    return {
      bg: "bg-orange-50/90",
      border: "border-orange-200/80",
      text: "text-orange-900",
      pill: "bg-white text-orange-800 border-orange-200 hover:bg-orange-100/60",
      icon: "🎨"
    };
  }
  return {
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-800",
    pill: "bg-white text-slate-700 border-slate-200 hover:bg-slate-100",
    icon: "📚"
  };
}

// ── Helpers de Formateo y Mapeo Académico ─────────────────────────────────────

function formatCourseFull(grade?: string, course?: string): string {
  if (!course && !grade) return "";
  const cleanC = (course || "").toString().trim();
  const cleanG = normalizeGrade(grade || "").replace("°", "").trim();
  
  if (cleanC.includes("-")) return cleanC;
  if (cleanG && cleanC) return `${cleanG}-${cleanC}`;
  if (cleanG) return cleanG;
  return cleanC;
}

interface SubjectWorkload {
  subject: string;
  rooms: string[];      // ["5-1", "5-2", "6-3", "7-3"]
}

function getStaffWorkload(m: StaffMember): SubjectWorkload[] {
  const map: { [subject: string]: Set<string> } = {};

  if (m.weeklySchedule && Array.isArray(m.weeklySchedule) && m.weeklySchedule.length > 0) {
    m.weeklySchedule.forEach((b: any) => {
      const sub = (b.subject || "OTRA ASIGNATURA").toUpperCase().trim();
      const room = formatCourseFull(b.grade, b.course);
      if (!map[sub]) map[sub] = new Set();
      if (room) map[sub].add(room);
    });
  } else if (m.teachingSubjectsList && m.teachingSubjectsList.length > 0) {
    const courses = (m.teachingCourses || []).map(c => {
      if (c.includes("-")) return c;
      const g = (m.teachingGrades && m.teachingGrades[0]) || "";
      return formatCourseFull(g, c);
    }).filter(Boolean);

    m.teachingSubjectsList.forEach(sub => {
      map[sub.toUpperCase().trim()] = new Set(courses);
    });
  }

  return Object.keys(map).map(sub => {
    const rawRooms = Array.from(map[sub]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return {
      subject: sub,
      rooms: rawRooms,
    };
  });
}

function getAllRoomsForStaff(m: StaffMember): string[] {
  const workload = getStaffWorkload(m);
  const roomsSet = new Set<string>();
  
  workload.forEach(w => {
    w.rooms.forEach(r => roomsSet.add(r));
  });

  if (roomsSet.size === 0 && m.teachingCourses) {
    m.teachingCourses.forEach(c => {
      if (c) roomsSet.add(c.includes("-") ? c : c);
    });
  }

  if (m.isDirectorGrupo && m.directorGrado && m.directorCurso) {
    roomsSet.add(formatCourseFull(m.directorGrado, m.directorCurso));
  }

  return Array.from(roomsSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export default function DirectorioPage() {
  const { profile, masterData } = useApp();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterSubject, setFilterSubject] = useState<string>("ALL");
  const [filterCourse, setFilterCourse] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Cargar lista de funcionarios y docentes desde Firestore con fallback local
  useEffect(() => {
    async function loadStaff() {
      setLoading(true);
      const list: StaffMember[] = [];

      try {
        let usersSnap: any = null;
        try {
          usersSnap = await getDocs(collection(db, "users"));
        } catch {
          try {
            usersSnap = await getDocs(collection(db, "directorio"));
          } catch {
            // Ignorar permisos restringidos de Firestore
          }
        }

        if (usersSnap && usersSnap.docs && usersSnap.docs.length > 0) {
          usersSnap.forEach((docSnap: any) => {
            const data = docSnap.data() as any;
            const isDir = data.role === "DOCENTE_DIRECTOR" || data.isDirectorGrupo === true || Boolean(data.directorGrado && data.directorCurso);
            list.push({
              uid: docSnap.id,
              name: (data.displayName || data.name || "DOCENTE").toUpperCase(),
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              email: data.email || "",
              phone: data.phone || "",
              role: isDir ? "DOCENTE_DIRECTOR" : (data.role || "DOCENTE"),
              status: data.status || "ACTIVE",
              isSuperAdmin: data.isSuperAdmin || false,
              isDirectorGrupo: isDir,
              directorGrado: data.directorGrado || "",
              directorCurso: data.directorCurso || "",
              teachingGrades: data.teachingGrades || [],
              teachingCourses: data.teachingCourses || [],
              teachingSubjectsList: data.teachingSubjectsList || [],
              weeklySchedule: data.weeklySchedule || [],
              photoURL: data.photoURL || ""
            });
          });
        }
      } catch {
        // Fallback silencioso
      }

      // Si la lista no contiene al usuario actual o está vacía, sincronizar con profile
      if (profile) {
        const alreadyInList = list.some(m => m.email?.toLowerCase() === profile.email?.toLowerCase() || m.uid === (profile as any).uid);
        if (!alreadyInList) {
          const isDir = profile.isDirectorGrupo || profile.role === "DOCENTE_DIRECTOR";
          list.push({
            uid: (profile as any).uid || "current-user",
            name: (profile.name || "DOCENTE").toUpperCase(),
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || "",
            phone: profile.phone || "",
            role: isDir ? "DOCENTE_DIRECTOR" : (profile.role as any || "DOCENTE"),
            status: "ACTIVE",
            isSuperAdmin: profile.isSuperAdmin,
            isDirectorGrupo: isDir,
            directorGrado: profile.directorGrado || "",
            directorCurso: profile.directorCurso || "",
            teachingGrades: profile.teachingGrades || [],
            teachingCourses: profile.teachingCourses || [],
            teachingSubjectsList: profile.teachingSubjectsList || [],
            weeklySchedule: profile.weeklySchedule || []
          });
        }
      }

      // Ordenar alfabéticamente
      list.sort((a, b) => a.name.localeCompare(b.name));
      setStaffList(list);
      setLoading(false);
    }

    loadStaff();
  }, [profile]);

  // Lista de todos los salones únicos disponibles para el filtro
  const allAvailableRooms = useMemo(() => {
    const roomsSet = new Set<string>();
    staffList.forEach(m => {
      getAllRoomsForStaff(m).forEach(r => roomsSet.add(r));
    });
    return Array.from(roomsSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [staffList]);

  // Lista de todas las materias únicas disponibles
  const allAvailableSubjects = useMemo(() => {
    const subSet = new Set<string>();
    staffList.forEach(m => {
      getStaffWorkload(m).forEach(w => subSet.add(w.subject));
      (m.teachingSubjectsList || []).forEach(s => subSet.add(s));
    });
    return Array.from(subSet).sort();
  }, [staffList]);

  // Filtrado de Personal
  const filteredStaff = useMemo(() => {
    return staffList.filter((m) => {
      // 1. Búsqueda por texto universal
      const q = searchQuery.toLowerCase().trim();
      const staffRooms = getAllRoomsForStaff(m).join(" ").toLowerCase();
      const workloadText = getStaffWorkload(m).map(w => `${w.subject} ${w.rooms.join(" ")}`).join(" ").toLowerCase();
      
      const matchSearch = 
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        (m.directorGrado && m.directorGrado.toLowerCase().includes(q)) ||
        (m.teachingSubjectsList && m.teachingSubjectsList.some(s => s.toLowerCase().includes(q))) ||
        staffRooms.includes(q) ||
        workloadText.includes(q);

      if (!matchSearch) return false;

      // 2. Filtro por Rol
      if (filterRole === "DIRECTORES") {
        if (!m.isDirectorGrupo && m.role !== "DOCENTE_DIRECTOR") return false;
      } else if (filterRole === "DIRECTIVOS") {
        if (!["RECTOR", "COORDINADOR"].includes(m.role) && !m.isSuperAdmin) return false;
      } else if (filterRole === "BIENESTAR") {
        if (m.role !== "BIENESTAR") return false;
      } else if (filterRole === "DOCENTES") {
        if (["RECTOR", "COORDINADOR", "BIENESTAR"].includes(m.role) && !m.isDirectorGrupo) return false;
      }

      // 3. Filtro por Asignatura
      if (filterSubject !== "ALL") {
        const workload = getStaffWorkload(m);
        const hasSubject = workload.some(w => w.subject.toUpperCase() === filterSubject.toUpperCase()) || 
                          (m.teachingSubjectsList && m.teachingSubjectsList.some(s => s.toUpperCase() === filterSubject.toUpperCase()));
        if (!hasSubject) return false;
      }

      // 4. Filtro por Salón / Grupo (ej: "7-3")
      if (filterCourse !== "ALL") {
        const staffRooms = getAllRoomsForStaff(m);
        const inRooms = staffRooms.some(r => r === filterCourse || r.includes(filterCourse) || filterCourse.includes(r));
        const inDirection = m.directorCurso === filterCourse || formatCourseFull(m.directorGrado, m.directorCurso) === filterCourse;
        if (!inRooms && !inDirection) return false;
      }

      return true;
    });
  }, [staffList, searchQuery, filterRole, filterSubject, filterCourse]);

  // KPIs Institucionales
  const kpis = useMemo(() => {
    const total = staffList.length;
    const directores = staffList.filter(s => s.isDirectorGrupo || s.role === "DOCENTE_DIRECTOR").length;
    const directivos = staffList.filter(s => ["RECTOR", "COORDINADOR"].includes(s.role) || s.isSuperAdmin).length;
    const docentes = staffList.filter(s => s.role === "DOCENTE" || s.role === "DOCENTE_DIRECTOR").length;

    const allSubjects = new Set<string>();
    staffList.forEach(s => {
      getStaffWorkload(s).forEach(w => allSubjects.add(w.subject));
    });

    return { total, directores, directivos, docentes, totalSubjects: allSubjects.size };
  }, [staffList]);

  const hasActiveFilters = searchQuery !== "" || filterRole !== "ALL" || filterSubject !== "ALL" || filterCourse !== "ALL";

  const resetFilters = () => {
    setSearchQuery("");
    setFilterRole("ALL");
    setFilterSubject("ALL");
    setFilterCourse("ALL");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(text);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const data = filteredStaff.map(m => {
      const isDirector = m.isDirectorGrupo || m.role === "DOCENTE_DIRECTOR";
      const dirGrupo = isDirector && m.directorGrado ? `Grado ${m.directorGrado} - Curso ${m.directorCurso || "1"}` : "NO";
      
      const workload = getStaffWorkload(m);
      const workloadStr = workload.map(w => {
        const roomsStr = w.rooms.length > 0 ? `[${w.rooms.join(", ")}]` : "";
        return `${w.subject} ${roomsStr}`;
      }).join(" | ");

      return {
        "NOMBRE COMPLETO": m.name,
        "ROL INSTITUCIONAL": isDirector ? "DOCENTE DIRECTOR" : m.role,
        "CORREO ELECTRÓNICO": m.email,
        "TELÉFONO / WHATSAPP": m.phone || "SIN REGISTRO",
        "DIRECCIÓN DE GRUPO": dirGrupo,
        "CARGA ACADÉMICA (MATERIA Y SALONES)": workloadStr || "NO REGISTRADA",
      };
    });

    exportToCSV(data, `DIRECTORIO_INSTITUCIONAL_IETABA_${new Date().toISOString().slice(0, 10)}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <RoleGuard allowedRoles={["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE"]}>
      <div className="min-h-screen bg-slate-50/60 text-slate-800 pb-24 font-inter antialiased">
        <TopAppBar />

        {/* ── CONTENIDO PRINCIPAL ── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 space-y-5">
          
          {/* HEADER PRINCIPAL Y ACCIONES */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs print:hidden">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-center justify-center text-teal-700 shadow-2xs">
                  <Building2 size={22} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                    Directorio Institucional & Planta Docente
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Consulta centralizada de directivos, docentes, dirección de grupo y asignación de materias
                  </p>
                </div>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 hover:border-slate-300"
                title="Descargar base de datos en Excel / CSV"
              >
                <Download size={14} className="text-teal-700" />
                <span className="hidden sm:inline">Exportar CSV</span>
              </button>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-teal-700/20 flex items-center gap-2"
                title="Imprimir informe oficial del personal"
              >
                <Printer size={14} />
                <span>Imprimir Directorio</span>
              </button>
            </div>
          </div>

          {/* ── BENTO GRID DE KPIS INSTITUCIONALES ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 print:hidden">
            
            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-teal-300 transition-all">
              <div className="p-2.5 bg-teal-50 text-teal-700 rounded-2xl shrink-0">
                <Users size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Funcionarios</p>
                <h3 className="text-lg font-black text-slate-900 leading-tight">{kpis.total}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-amber-300 transition-all">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl shrink-0">
                <Award size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Directores de Grupo</p>
                <h3 className="text-lg font-black text-amber-900 leading-tight">{kpis.directores}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-blue-300 transition-all">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-2xl shrink-0">
                <Briefcase size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Equipo Directivo</p>
                <h3 className="text-lg font-black text-blue-900 leading-tight">{kpis.directivos}</h3>
              </div>
            </div>

            <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:border-emerald-300 transition-all">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Áreas Cubiertas</p>
                <h3 className="text-lg font-black text-emerald-900 leading-tight">{kpis.totalSubjects}</h3>
              </div>
            </div>

          </div>

          {/* ── BARRA DE CONTROL Y BUSCADOR INTELIGENTE ── */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 space-y-3 shadow-xs print:hidden">
            
            {/* Nivel 1: Buscador Universal + Alternador de Vista */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre, materia, salón (ej: 7-3, 8-2), correo o celular..."
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-3 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-200/60 rounded-full px-1.5 py-0.5"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Selector de Vista: Tabla o Cards */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/70 shrink-0">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    viewMode === "table" 
                      ? "bg-white text-teal-900 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Layers size={13} />
                  <span>Tabla</span>
                </button>

                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    viewMode === "cards" 
                      ? "bg-white text-teal-900 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Users size={13} />
                  <span>Tarjetas</span>
                </button>
              </div>
            </div>

            {/* Nivel 2: Filtros por Rol, Asignatura y Salón */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterRole("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    filterRole === "ALL" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
                  }`}
                >
                  Todos ({staffList.length})
                </button>

                <button
                  onClick={() => setFilterRole("DIRECTORES")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    filterRole === "DIRECTORES" 
                      ? "bg-amber-500 text-white shadow-xs" 
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
                  }`}
                >
                  👑 Directores de Grupo ({kpis.directores})
                </button>

                <button
                  onClick={() => setFilterRole("DIRECTIVOS")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    filterRole === "DIRECTIVOS" 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/60"
                  }`}
                >
                  🏛️ Directivos ({kpis.directivos})
                </button>
              </div>

              {/* Selectores Inteligentes de Materia y Salón */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={filterSubject}
                  onChange={e => setFilterSubject(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Todas las Materias</option>
                  {allAvailableSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>

                <select
                  value={filterCourse}
                  onChange={e => setFilterCourse(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                >
                  <option value="ALL">Todos los Salones</option>
                  {allAvailableRooms.map(r => (
                    <option key={r} value={r}>Salón {r}</option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl transition-all"
                    title="Limpiar todos los filtros"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

            </div>

          </div>

          {/* ── CONTENIDO PRINCIPAL: TABLA O TARJETAS ── */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-widest">Cargando Directorio Institucional...</p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-16 text-center space-y-3 shadow-xs">
              <Users size={36} className="mx-auto text-slate-300" />
              <h3 className="text-base font-black text-slate-700 uppercase tracking-tight">No se encontraron docentes ni directivos</h3>
              <p className="text-xs text-slate-400 font-medium max-w-md mx-auto">
                No hay coincidencias con los filtros aplicados.
              </p>
              <button
                onClick={resetFilters}
                className="mt-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Restablecer Filtros
              </button>
            </div>
          ) : viewMode === "table" ? (
            
            /* ══════════════════════════════════════════════════════════════════════
               VISTA 1: TABLA MATRIZ ULTRA-PROFESIONAL (LINEAR / STRIPE STYLE)
               ══════════════════════════════════════════════════════════════════════ */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4 w-72">Funcionario / Docente</th>
                      <th className="p-4 text-center w-36">Rol Institucional</th>
                      <th className="p-4 text-center w-36">Dirección de Grupo</th>
                      <th className="p-4">Carga Académica (Materias y Salones Asignados)</th>
                      <th className="p-4 text-center w-28">Contacto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStaff.map((m) => {
                      const isDirector = m.isDirectorGrupo || m.role === "DOCENTE_DIRECTOR";
                      const cleanPhone = normalizePhone(m.phone);
                      const workload = getStaffWorkload(m);
                      const totalGroups = workload.reduce((acc, curr) => acc + curr.rooms.length, 0);

                      const initials = (m.name || "U")
                        .split(" ")
                        .slice(0, 2)
                        .map(w => w[0])
                        .join("");

                      return (
                        <tr key={m.uid} className="hover:bg-slate-50/70 transition-colors">
                          
                          {/* Col 1: Docente con Avatar y Acceso Directo */}
                          <td className="p-4 align-top">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs border border-slate-700/50">
                                {initials}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-slate-900 uppercase text-xs leading-tight">
                                  {m.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10.5px] text-slate-400 font-medium truncate">
                                    {m.email}
                                  </span>
                                  <button
                                    onClick={() => handleCopy(m.email)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Copiar correo"
                                  >
                                    {copiedEmail === m.email ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                </div>
                                {m.isSuperAdmin && (
                                  <span className="inline-block mt-1 px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-black text-[8px] uppercase">
                                    SUPER ADMINISTRADOR
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Col 2: Rol */}
                          <td className="p-4 text-center align-top">
                            <span className={`px-2.5 py-1 rounded-xl text-[9.5px] font-black uppercase inline-block shadow-2xs ${
                              isDirector ? "bg-amber-100 text-amber-900 border border-amber-200" :
                              m.role === "RECTOR" ? "bg-blue-100 text-blue-900 border border-blue-200" :
                              m.role === "COORDINADOR" ? "bg-purple-100 text-purple-900 border border-purple-200" :
                              "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                              {isDirector ? "👑 DIRECTOR" : m.role}
                            </span>
                          </td>

                          {/* Col 3: Dirección de Grupo */}
                          <td className="p-4 text-center align-top">
                            {isDirector && (m.directorGrado || m.directorCurso) ? (
                              <div className="inline-flex flex-col items-center px-2.5 py-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl text-center shadow-2xs">
                                <span className="text-[8px] font-black uppercase tracking-wider text-amber-800">Tutor Titular</span>
                                <span className="text-[11px] font-black text-amber-950 uppercase">
                                  Salón {m.directorGrado || "5°"}-{m.directorCurso || "1"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-300 font-bold">—</span>
                            )}
                          </td>

                          {/* Col 4: Carga Académica de Alto Nivel con Temas por Área */}
                          <td className="p-4 align-top">
                            {workload.length > 0 ? (
                              <div className="space-y-2">
                                
                                {/* Micro-Badges de Asignación */}
                                <div className="flex flex-wrap gap-2">
                                  {workload.map(item => {
                                    const theme = getSubjectTheme(item.subject);
                                    const isSubjectActive = filterSubject !== "ALL" && item.subject.toUpperCase() === filterSubject.toUpperCase();

                                    return (
                                      <div 
                                        key={item.subject} 
                                        className={`inline-flex items-center gap-1.5 p-1.5 pl-2.5 rounded-xl border transition-all ${
                                          isSubjectActive 
                                            ? "ring-2 ring-teal-500 bg-teal-50/90 border-teal-300 shadow-xs" 
                                            : `${theme.bg} ${theme.border}`
                                        } shadow-2xs`}
                                      >
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <span className="text-xs select-none">{theme.icon}</span>
                                          <span className={`text-[10px] font-black uppercase tracking-tight ${theme.text}`}>
                                            {item.subject}
                                          </span>
                                          <span className="text-[8px] font-black px-1.5 py-0.2 rounded-full bg-white/90 border border-slate-200 text-slate-600 shadow-2xs">
                                            {item.rooms.length}
                                          </span>
                                        </div>

                                        <div className="w-px h-3.5 bg-slate-300/60 mx-0.5" />

                                        <div className="flex flex-wrap gap-1 items-center">
                                          {item.rooms.map(room => {
                                            const isRoomActive = filterCourse !== "ALL" && (room === filterCourse || room.includes(filterCourse));

                                            return (
                                              <span 
                                                key={room} 
                                                className={`px-1.5 py-0.5 rounded-lg text-[9px] font-extrabold uppercase transition-all ${
                                                  isRoomActive 
                                                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400 scale-105" 
                                                    : theme.pill
                                                } border shadow-2xs`}
                                                title={`Salón ${room}`}
                                              >
                                                {room}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 pt-0.5">
                                  <span>{workload.length} {workload.length === 1 ? "Área" : "Áreas"}</span>
                                  <span>•</span>
                                  <span>{totalGroups} {totalGroups === 1 ? "Salón asignado" : "Salones asignados"}</span>
                                </div>

                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Sin asignación registrada en horario</span>
                            )}
                          </td>

                          {/* Col 5: Contacto Rápido */}
                          <td className="p-4 text-center align-top">
                            <div className="flex items-center justify-center gap-1.5">
                              {cleanPhone ? (
                                <a
                                  href={`https://wa.me/57${cleanPhone}?text=${encodeURIComponent("Cordial saludo profesor(a) " + m.name + ", me comunico desde la plataforma institucional IETABA.")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all shadow-2xs hover:scale-105"
                                  title="Enviar WhatsApp"
                                >
                                  <MessageSquare size={14} />
                                </a>
                              ) : null}

                              {m.phone && (
                                <a
                                  href={`tel:${m.phone}`}
                                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all shadow-2xs hover:scale-105"
                                  title="Llamar celular"
                                >
                                  <Phone size={14} />
                                </a>
                              )}

                              {m.email && (
                                <a
                                  href={`mailto:${m.email}?subject=${encodeURIComponent("Comunicación Institucional IETABA")}`}
                                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all shadow-2xs hover:scale-105"
                                  title="Enviar correo"
                                >
                                  <Mail size={14} />
                                </a>
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          ) : (

            /* ══════════════════════════════════════════════════════════════════════
               VISTA 2: GRID DE TARJETAS 360° PREMIUM
               ══════════════════════════════════════════════════════════════════════ */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredStaff.map((m) => {
                const initials = (m.name || "U")
                  .split(" ")
                  .slice(0, 2)
                  .map(w => w[0])
                  .join("");

                const isDirector = m.isDirectorGrupo || m.role === "DOCENTE_DIRECTOR";
                const cleanPhone = normalizePhone(m.phone);
                const workload = getStaffWorkload(m);
                const allRooms = getAllRoomsForStaff(m);

                return (
                  <div 
                    key={m.uid}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-teal-300 transition-all p-5 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3.5">
                      
                      {/* Top Header Card */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm border border-slate-700/50">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <h3 className="text-xs font-black text-slate-900 uppercase truncate">
                              {m.name}
                            </h3>
                            {m.isSuperAdmin && (
                              <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded font-black text-[8px] uppercase shrink-0">
                                MASTER
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              isDirector 
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : m.role === "RECTOR" 
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : m.role === "COORDINADOR"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}>
                              {isDirector ? "👑 DIRECTOR" : m.role}
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 font-medium truncate mt-1">
                            {m.email}
                          </p>
                        </div>
                      </div>

                      {/* Dirección de Grupo Asignada */}
                      {isDirector && (
                        <div className="p-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">👑</span>
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-wider text-amber-800">Tutor(a) de Salón:</p>
                              <p className="text-xs font-black text-amber-950 uppercase">
                                Salón {m.directorGrado || "5°"}-{m.directorCurso || "1"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Asignación Académica: Materias y Salones */}
                      <div className="space-y-2 pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                            <BookOpen size={11} className="text-teal-600" /> Carga Académica:
                          </span>
                          <span className="text-[8.5px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {allRooms.length} {allRooms.length === 1 ? "salón" : "salones"}
                          </span>
                        </div>

                        {workload.length > 0 ? (
                          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                            {workload.map(item => {
                              const theme = getSubjectTheme(item.subject);

                              return (
                                <div key={item.subject} className={`p-2.5 rounded-2xl border ${theme.bg} ${theme.border} space-y-1.5 shadow-2xs`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs">{theme.icon}</span>
                                      <span className={`font-black text-[10px] uppercase ${theme.text}`}>
                                        {item.subject}
                                      </span>
                                    </div>
                                    <span className="text-[8px] font-black bg-white/90 border border-slate-200 px-1.5 py-0.2 rounded-full text-slate-600">
                                      {item.rooms.length} {item.rooms.length === 1 ? "grupo" : "grupos"}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {item.rooms.map(room => (
                                      <span key={room} className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-bold uppercase shadow-2xs ${theme.pill}`}>
                                        {room}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No registrada en horario</span>
                        )}
                      </div>

                    </div>

                    {/* Botones de Contacto Directo */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      {cleanPhone ? (
                        <a
                          href={`https://wa.me/57${cleanPhone}?text=${encodeURIComponent("Cordial saludo profesor(a) " + m.name + ", me comunico con usted desde la plataforma institucional IETABA.")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="flex-1 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold uppercase text-center">
                          Sin WhatsApp
                        </span>
                      )}

                      {m.phone && (
                        <a
                          href={`tel:${m.phone}`}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                          title="Llamar al celular"
                        >
                          <Phone size={13} />
                        </a>
                      )}

                      {m.email && (
                        <a
                          href={`mailto:${m.email}?subject=${encodeURIComponent("Comunicación Institucional IETABA")}`}
                          className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl transition-all"
                          title="Enviar correo institucional"
                        >
                          <Mail size={13} />
                        </a>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </main>

        <BottomNavBar />

        {/* ── HOJA DE IMPRESIÓN OFICIAL CON ENCABEZADO INSTITUCIONAL ── */}
        <div className="hidden print:block p-8 bg-white text-slate-900 font-inter">
          <div className="border-b-2 border-slate-900 pb-4 mb-6 flex items-center justify-between">
            <div className="w-16 h-16 relative">
              <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
            </div>
            <div className="text-center flex-1 px-4">
              <h2 className="text-base font-black uppercase">INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ (IETABA)</h2>
              <p className="text-[10px] font-bold text-slate-600 uppercase">DIRECTORIO GENERAL DE PLANTA DOCENTE Y DIRECTIVA</p>
              <p className="text-[8px] text-slate-400 uppercase">DANE: 252079002045 · NIT: 900.123.456-7 · Vereda El Gran Sábalo</p>
            </div>
            <div className="w-16 h-16 relative">
              <img src="/logo.png" alt="Logo" className="object-contain w-full h-full" />
            </div>
          </div>

          <table className="w-full text-[9px] border-collapse border border-slate-900">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-black uppercase">
                <th className="border border-slate-900 p-2 text-left">Docente / Directivo</th>
                <th className="border border-slate-900 p-2 text-center">Rol</th>
                <th className="border border-slate-900 p-2 text-center">Director Grupo</th>
                <th className="border border-slate-900 p-2 text-left">Carga Académica (Materia [Salones])</th>
                <th className="border border-slate-900 p-2 text-left">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((m, i) => {
                const isDirector = m.isDirectorGrupo || m.role === "DOCENTE_DIRECTOR";
                const workload = getStaffWorkload(m);
                const workloadStr = workload.map(w => `${w.subject} [${w.rooms.join(", ")}]`).join(" | ");

                return (
                  <tr key={i} className="border border-slate-900">
                    <td className="border border-slate-900 p-2 font-bold uppercase">{m.name}</td>
                    <td className="border border-slate-900 p-2 text-center font-semibold">{isDirector ? "DIRECTOR DE GRUPO" : m.role}</td>
                    <td className="border border-slate-900 p-2 text-center">{isDirector ? `${m.directorGrado}-${m.directorCurso}` : "—"}</td>
                    <td className="border border-slate-900 p-2">{workloadStr || "—"}</td>
                    <td className="border border-slate-900 p-2 font-mono text-[8px]">{m.phone || m.email}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="mt-8 pt-4 border-t border-slate-400 text-center text-[8px] text-slate-500 uppercase">
            Generado por el Sistema de Información Escolar IETABA Suite · Fecha: {new Date().toLocaleDateString("es-CO")}
          </div>
        </div>

      </div>
    </RoleGuard>
  );
}
