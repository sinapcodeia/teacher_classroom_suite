"use client";
import { useState, useEffect, useMemo } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import nextDynamic from "next/dynamic";
const StudentList = nextDynamic(() => import("@/components/students/StudentList"), { ssr: false });
const StudentProfile = nextDynamic(() => import("@/components/students/StudentProfile"), { ssr: false });
const PerformanceStats = nextDynamic(() => import("@/components/students/PerformanceStats"), { ssr: false });
const ImportSummaryModal = nextDynamic(() => import("@/components/students/ImportSummaryModal"), { ssr: false });
const DirectorGrupoCockpit = nextDynamic(() => import("@/components/students/DirectorGrupoCockpit"), { ssr: false });
import { FileDown, FileText, UserPlus, X, CheckCircle, Loader2, AlertTriangle, ArrowRight, Check, Trash2, Users } from "lucide-react";
import Papa from "papaparse";
import { exportToCSV, exportToPDF } from "@/lib/reports";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";
import { printInstitutionalStudentReport } from "@/lib/printService";
import { normalizeGrade, parseFlexibleFloat, sanitizeText } from "@/lib/constants";
import {
  downloadStudentTemplate,
  downloadStudentNoveltiesCSV,
  parseAndValidateStudentsCSV,
  StudentRowValidationIssue,
} from "@/lib/studentTemplate";
import type { StudentPerfFilter } from "@/components/students/PerformanceStats";

export default function StudentsPage() {
  const { 
    myStudents, addStudent, masterData, profile, importStudents,
    globalGradeFilter: gradoFilter, setGlobalGradeFilter: setGradoFilter,
    globalCursoFilter: cursoFilter, setGlobalCursoFilter: setCursoFilter
  } = useApp();
  
  const [viewMode, setViewMode] = useState<"profile" | "cockpit">("profile");
  const [materiaFilter, setMateriaFilter] = useState("TODAS");
  const [perfFilter, setPerfFilter] = useState<StudentPerfFilter>("ALL");
  const [selectedId, setSelectedId] = useState("");
  // Verificación estricta de Rol: Solo Directores de Grupo, Rectores o Coordinadores tienen acceso al Cockpit Grupal
  const isDirector = 
    profile?.role === "DOCENTE_DIRECTOR" || 
    profile?.isDirectorGrupo === true || 
    Boolean(profile?.directorGrado && profile?.directorCurso) ||
    profile?.isSuperAdmin === true ||
    ["RECTOR", "COORDINADOR"].includes(profile?.role || "");

  // Si el docente es Director de Grupo y tiene grado asignado, autoseleccionarlo por defecto
  useEffect(() => {
    if (isDirector && profile?.directorGrado && gradoFilter === "TODOS") {
      setGradoFilter(profile.directorGrado);
      if (profile.directorCurso) setCursoFilter(profile.directorCurso);
    }
  }, [isDirector, profile?.directorGrado, profile?.directorCurso]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (myStudents.length > 0 && !selectedId) {
      setSelectedId(myStudents[0].id);
    }
  }, [myStudents]);

  const [showModal, setShowModal] = useState(false);
  const [showImportResults, setShowImportResults] = useState(false);
  const [importStats, setImportStats] = useState({
    total: 0,
    success: 0,
    novelties: [] as any[],
    errors: [] as string[]
  });

  // Estados para la Sincronización Interactiva (Carga y Comparación)
  const [syncData, setSyncData] = useState<{
    newStudents: any[];
    modifiedStudents: { student: any; id: string; changes: { field: string; old: string; newVal: string }[] }[];
    missingStudents: any[];
    unchangedStudents: any[];
    issues: StudentRowValidationIssue[];
  } | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [deleteMissing, setDeleteMissing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeSyncTab, setActiveSyncTab] = useState<"new" | "modified" | "missing" | "unchanged" | "issues">("new");

  const [formData, setFormData] = useState({
    nombre: "",
    grado: "",
    curso: "",
    documento: ""
  });

  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [modalToast, setModalToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showModalToast = (msg: string, ok = true) => {
    setModalToast({ msg, ok });
    if (ok) setTimeout(() => setModalToast(null), 3000);
  };

  const handleExportAll = () => {
    const dataToExport = myStudents.map(s => ({
      "GRADO": s.grado || "",
      "CURSO IETABA": s.curso || "",
      "TIPO DOC.": s.tipoDocumento || "T.I.",
      "NRO DOCUMENTO": s.nroDocumento || "",
      "PRIMER APELLIDO": s.primerApellido || "",
      "SEGUNDO APELLIDO": s.segundoApellido || "",
      "PRIMER NOMBRE": s.primerNombre || "",
      "SEGUNDO NOMBRE": s.segundoNombre || "",
      "FECHA NACIMIENTO": s.fechaNacimiento || "",
      "GENERO": s.genero || "M",
      "ACUDIENTE NOMBRES": s.acudienteNombres || "",
      "ACUDIENTE APELLIDOS": s.acudienteApellidos || "",
      "PARENTESCO": s.acudienteParentesco || "",
      "TELEFONO ACUDIENTE": s.acudienteTelefono || "",
      "VEREDA / COMUNIDAD": s.acudienteVereda || "",
      "ESTADO MATRICULA": s.estadoMatricula || "MATRICULADO",
    }));
    exportToCSV(dataToExport, "Estudiantes_Maestro_SIMAT_IETABA");
  };

  const handleApplySync = async () => {
    if (!syncData || syncData.issues.length > 0) return;
    setIsSyncing(true);

    const payload = [
      ...syncData.newStudents,
      ...syncData.modifiedStudents.map(m => m.student),
      ...syncData.unchangedStudents
    ];
    const deleteIds = deleteMissing ? syncData.missingStudents.map(m => m.id) : [];

    try {
      const { novelties, notFound } = await importStudents(payload, deleteIds);
      setImportStats({
        total: payload.length + deleteIds.length,
        success: payload.length,
        novelties,
        errors: notFound
      });
      setIsSyncing(false);
      setShowSyncModal(false);
      setSyncData(null);
      setShowImportResults(true);
    } catch (err) {
      console.error("Error al aplicar la sincronización:", err);
      alert("Error al aplicar la sincronización. Revisa la consola.");
      setIsSyncing(false);
    }
  };

  const handleAddStudent = async () => {
    if (formData.nombre && formData.grado) {
      setIsAddingStudent(true);
      const names = formData.nombre.trim().split(" ");
      try {
        await addStudent({ 
          primerNombre: names[0] || "",
          segundoNombre: names.length > 3 ? names[1] : (names.length === 3 ? "" : ""),
          primerApellido: names.length === 2 ? names[1] : (names.length === 3 ? names[1] : names[2] || ""),
          segundoApellido: names.length === 3 ? names[2] : (names.length > 3 ? names[3] : ""),
          nroDocumento: formData.documento || `TMP-${Date.now()}`,
          tipoDocumento: "T.I.",
          curso: formData.curso || "1",
          grado: formData.grado,
          fechaNacimiento: "",
          genero: "M",
          avgGrade: 0, 
          attendance: "100%",
          isActive: true
        });
        setFormData({ nombre: "", grado: "", curso: "", documento: "" });
        setShowModal(false);
        setModalToast(null);
      } catch (err) {
        console.error("Error al matricular estudiante:", err);
        showModalToast("Error al guardar. Verifica tu conexión e intenta de nuevo.", false);
      } finally {
        setIsAddingStudent(false);
      }
    }
  };

  // Filtrado para el reporte dinámico
  const filteredReportStudents = useMemo(() => {
    return myStudents.filter(s => {
      const matchGrado = gradoFilter === "TODOS" || normalizeGrade(s.grado) === gradoFilter;
      const matchCurso = cursoFilter === "TODOS" || s.curso === cursoFilter;
      return matchGrado && matchCurso;
    });
  }, [myStudents, gradoFilter, cursoFilter]);

  if (!mounted) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <RoleGuard allowedRoles={["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE"]}>
      <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <TopAppBar />
      
      <main className="pt-20 px-4 md:px-6 max-w-[1440px] mx-auto w-full space-y-6 pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-2xl md:text-3xl font-black text-on-surface tracking-tight uppercase">Estudiantes</h1>
            <p className="text-sm text-on-surface-variant font-bold uppercase tracking-widest opacity-70">Gestión de Matrícula y Seguimiento Académico</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/reportes/asistencia"
              className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-3 md:px-6 md:py-3 bg-on-surface text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black hover:opacity-90 transition-all shadow-xl active:scale-95 uppercase tracking-widest min-w-[140px]"
            >
              <FileText size={16} className="text-primary-container" /> Asistencia Oficial
            </Link>
            <button 
              onClick={() => printInstitutionalStudentReport(filteredReportStudents, profile.name)}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-3 md:px-5 md:py-3 bg-white border md:border-2 border-outline-variant rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low transition-all min-w-[140px]"
            >
              <FileText size={16} className="text-error" /> PDF
            </button>
            <button 
              onClick={handleExportAll}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-3 md:px-5 md:py-3 bg-white border md:border-2 border-outline-variant rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low transition-all min-w-[140px]"
            >
              <FileDown size={16} className="text-primary" /> Descargar Todo
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-3 md:px-6 md:py-3 bg-primary text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 min-w-[140px]"
            >
              <UserPlus size={16} /> Nueva Matrícula
            </button>
            <label className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-3 md:px-6 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all cursor-pointer shadow-lg active:scale-95 min-w-[140px]">
              <FileDown size={16} /> Carga Masiva CSV
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                      const rows = results.data as any[];
                      const { validRows: incoming, issues } = parseAndValidateStudentsCSV(rows, true);

                      // Comparar
                      const newStudents: any[] = [];
                      const modifiedStudents: any[] = [];
                      const unchangedStudents: any[] = [];
                      const incomingDocs = new Set(incoming.map(i => i.nroDocumento));

                      incoming.forEach(inc => {
                        const existing = myStudents.find(ex => ex.nroDocumento === inc.nroDocumento);
                        if (!existing) {
                          newStudents.push(inc);
                        } else {
                          const changes: { field: string; old: string; newVal: string }[] = [];
                          const checkField = (label: string, incVal: string | undefined, extVal: string | undefined, optional = false) => {
                            const cleanInc = (incVal || "").trim().toUpperCase();
                            const cleanExt = (extVal || "").trim().toUpperCase();
                            if (optional && !cleanInc) return;
                            if (cleanInc !== cleanExt) {
                              changes.push({ field: label, old: extVal || "—", newVal: incVal || "—" });
                            }
                          };

                          checkField("Primer Nombre", inc.primerNombre, existing.primerNombre);
                          checkField("Segundo Nombre", inc.segundoNombre, existing.segundoNombre);
                          checkField("Primer Apellido", inc.primerApellido, existing.primerApellido);
                          checkField("Segundo Apellido", inc.segundoApellido, existing.segundoApellido);
                          checkField("Grado", inc.grado, existing.grado);
                          checkField("Curso", inc.curso, existing.curso);
                          checkField("Tipo Doc.", inc.tipoDocumento, existing.tipoDocumento);
                          checkField("F. Nacimiento", inc.fechaNacimiento, existing.fechaNacimiento);
                          checkField("Género", inc.genero, existing.genero);
                          checkField("Acudiente Nombres", inc.acudienteNombres, existing.acudienteNombres, true);
                          checkField("Acudiente Apellidos", inc.acudienteApellidos, existing.acudienteApellidos, true);
                          checkField("Parentesco", inc.acudienteParentesco, existing.acudienteParentesco, true);
                          checkField("Tel. Acudiente", inc.acudienteTelefono, existing.acudienteTelefono, true);
                          checkField("Vereda", inc.acudienteVereda, existing.acudienteVereda, true);
                          checkField("Estado Matrícula", inc.estadoMatricula, existing.estadoMatricula || "MATRICULADO", true);

                          if (changes.length > 0) {
                            modifiedStudents.push({ student: inc, id: existing.id, changes });
                          } else {
                            unchangedStudents.push(inc);
                          }
                        }
                      });

                      const missingStudents = myStudents.filter(ex => !incomingDocs.has(ex.nroDocumento));

                      setSyncData({
                        newStudents,
                        modifiedStudents,
                        missingStudents,
                        unchangedStudents,
                        issues,
                      });
                      setDeleteMissing(true);
                      setActiveSyncTab(issues.length > 0 ? "issues" : "new");
                      setShowSyncModal(true);
                      if (e.target) e.target.value = "";
                    }
                  });
                }}
              />
            </label>
            <button 
              onClick={() => downloadStudentTemplate(true)}
              title="Descargar Formato Estandarizado SIMAT / IETABA con filas de ejemplo"
              className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95"
            >
              <FileDown size={16} /> Formato Ejemplo
            </button>
            <button 
              onClick={() => downloadStudentTemplate(false)}
              title="Descargar Formato Estandarizado SIMAT / IETABA en blanco para diligenciar"
              className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
              <FileDown size={16} /> Formato en Blanco
            </button>
          </div>
        </div>

        <ImportSummaryModal 
          isOpen={showImportResults} 
          onClose={() => setShowImportResults(false)} 
          stats={importStats} 
        />
        {/* Barra Interactiva 360°: Ficha Estudiantil, Matriz 360° y Cursos del Docente */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-3 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode("profile")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "profile"
                  ? "bg-white text-slate-900 shadow-md shadow-slate-200/60"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={16} className={viewMode === "profile" ? "text-primary" : "text-slate-400"} />
              <span>Ficha Estudiantil &amp; Calificador de Saberes</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cockpit")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                viewMode === "cockpit"
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="text-amber-400">👑</span>
              <span>{isDirector ? "Cockpit Director de Grupo" : "Matriz 360° del Grupo"}</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded-full font-black border border-emerald-500/30 ml-1">
                360°
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Píldoras rápidas de cursos del docente */}
            {Array.from(new Set(myStudents.filter(s => s.isActive !== false).map(s => `${normalizeGrade(s.grado)}|${s.curso}`)))
              .slice(0, 5)
              .map(pair => {
                const [g, c] = pair.split("|");
                const isCurrent = gradoFilter === g && cursoFilter === c;
                return (
                  <button
                    key={pair}
                    type="button"
                    onClick={() => {
                      if (isCurrent) {
                        setGradoFilter("TODOS");
                        setCursoFilter("TODOS");
                      } else {
                        setGradoFilter(g);
                        setCursoFilter(c);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-primary/40 hover:text-primary"
                    }`}
                    title="Filtrar rápidamente este curso"
                  >
                    {g}° ({c})
                  </button>
                );
              })}

            <Link
              href={`/clase-en-vivo${
                gradoFilter !== "TODOS" || cursoFilter !== "TODOS"
                  ? `?grado=${encodeURIComponent(gradoFilter)}&curso=${encodeURIComponent(cursoFilter)}`
                  : ""
              }`}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
            >
              <span>{isDirector ? "Director de Grupo · Ir a Aula" : "Docente de Asignatura · Ir a Aula"}</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        {viewMode === "cockpit" ? (
          <DirectorGrupoCockpit 
            selectedGrado={gradoFilter}
            selectedCurso={cursoFilter}
            onSelectStudent={(id) => {
              setSelectedId(id);
              setViewMode("profile");
            }}
            onPrintActa={(st) => {
              printInstitutionalStudentReport([st], profile?.name || "Docente IETABA");
            }}
          />
        ) : (
          <>
        <PerformanceStats 
          grado={gradoFilter} 
          curso={cursoFilter} 
          materia={materiaFilter}
          activeFilter={perfFilter}
          onSelectFilter={(nextFilter) => {
            setPerfFilter(nextFilter);
            setViewMode("profile");
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <StudentList 
              selectedId={selectedId} 
              onSelect={setSelectedId} 
              gradoFilter={gradoFilter}
              setGradoFilter={setGradoFilter}
              cursoFilter={cursoFilter}
              setCursoFilter={setCursoFilter}
              materiaFilter={materiaFilter}
              setMateriaFilter={setMateriaFilter}
              perfFilter={perfFilter}
              setPerfFilter={setPerfFilter}
              onFilteredCountChange={(count) => {
                if (count === 0) setSelectedId("");
              }}
            />
          </div>
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              {selectedId ? (
                <StudentProfile id={selectedId} initialSubject={materiaFilter} />
              ) : (
                <div className="bg-white border border-outline-variant rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center gap-4 shadow-xl">
                  <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center">
                    <Users size={40} className="text-on-surface-variant opacity-30" />
                  </div>
                  <div>
                    <p className="font-black uppercase tracking-widest text-sm text-on-surface opacity-40">No hay estudiantes seleccionados</p>
                    <p className="text-[10px] text-on-surface-variant opacity-30 font-bold mt-1">Ajusta los filtros para ver perfiles</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </main>

      {/* New Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-on-surface/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-6">
              <div>
                <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase italic">Nueva Matrícula</h3>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Registro de Ingreso Estudiantil</p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-surface-container hover:bg-error/10 hover:text-error rounded-full transition-colors"><X size={20}/></button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Nombre Completo</label>
                <input 
                  autoFocus
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-sm transition-all" 
                  placeholder="NOMBRES Y APELLIDOS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Grado</label>
                  <select 
                    value={formData.grado}
                    onChange={(e) => setFormData({...formData, grado: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs appearance-none uppercase"
                  >
                    <option value="">Seleccionar...</option>
                    {masterData.grades.map(g => <option key={g} value={g}>GRADO {g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Curso/Grupo</label>
                  <select 
                    value={formData.curso}
                    onChange={(e) => setFormData({...formData, curso: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-xs appearance-none uppercase"
                  >
                    <option value="">Seleccionar...</option>
                    {masterData.courses.map(c => <option key={c} value={c}>GRUPO {c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Nro. Documento</label>
                <input 
                  value={formData.documento}
                  onChange={(e) => setFormData({...formData, documento: e.target.value})}
                  className="w-full h-14 px-5 rounded-2xl border-2 border-outline-variant bg-surface-container-lowest outline-none focus:border-primary font-bold text-sm" 
                  placeholder="IDENTIFICACIÓN"
                />
              </div>
            </div>

            <button 
              onClick={handleAddStudent}
              disabled={!formData.nombre || !formData.grado || isAddingStudent}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isAddingStudent ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  Guardando en base de datos...
                </>
              ) : (
                "Completar Registro Institucional"
              )}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE COMPARACIÓN INTERACTIVO (SyncPreviewModal) */}
      {showSyncModal && syncData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 md:p-10 shadow-2xl space-y-6 border border-slate-200/50 animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            
            {/* Cabecera */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 flex-shrink-0">
              <div>
                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Sincronización Inteligente
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-1.5">
                  Comparación y Sincronización de Estudiantes
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  Analizando base de datos local contra el archivo cargado
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowSyncModal(false);
                  setSyncData(null);
                }}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Pestañas de Grupo */}
            <div className="flex border-b border-slate-100 pb-px gap-1 flex-shrink-0 overflow-x-auto">
              {[
                ...(syncData.issues.length > 0
                  ? [{ id: "issues", label: "Alertas / Validación", count: syncData.issues.length, color: "bg-rose-500 text-white" }]
                  : []),
                { id: "new", label: "Nuevos", count: syncData.newStudents.length, color: "bg-green-500 text-white" },
                { id: "modified", label: "Modificados", count: syncData.modifiedStudents.length, color: "bg-blue-500 text-white" },
                { id: "missing", label: "Faltantes (No en archivo)", count: syncData.missingStudents.length, color: "bg-amber-500 text-white" },
                { id: "unchanged", label: "Sin Cambios", count: syncData.unchangedStudents.length, color: "bg-slate-500 text-white" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSyncTab(tab.id as any)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all ${
                    activeSyncTab === tab.id 
                      ? "border-indigo-600 text-indigo-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${tab.color}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Contenido Dinámico con Scroll */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-4">
              
              {/* Tab VALIDACIÓN / ALERTAS */}
              {activeSyncTab === "issues" && (
                <div className="space-y-4">
                  <div className="p-5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-xs text-rose-900 space-y-2 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-rose-600 text-white px-2.5 py-0.5 rounded-full mb-1">
                          Regla de Gobernanza Institucional · Carga Bloqueada
                        </span>
                        <h4 className="font-black text-sm uppercase text-rose-900 flex items-center gap-1.5">
                          <AlertTriangle size={16} /> Se encontraron {syncData.issues.length} novedad(es) en el archivo
                        </h4>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Por regla de gobernanza institucional, <strong>no se cargará ningún estudiante</strong> hasta que las siguientes novedades sean corregidas en el archivo CSV.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadStudentNoveltiesCSV(syncData.issues)}
                        className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm"
                      >
                        <FileDown size={14} /> Descargar Novedades CSV
                      </button>
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                        <tr>
                          <th className="p-3">Fila CSV</th>
                          <th className="p-3">Documento</th>
                          <th className="p-3">Estudiante</th>
                          <th className="p-3">Campo</th>
                          <th className="p-3">Novedad a Corregir</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {syncData.issues.map((iss, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-slate-500">#{iss.rowNumber}</td>
                            <td className="p-3 font-mono font-bold text-slate-700">{iss.nroDocumento}</td>
                            <td className="p-3 font-semibold text-slate-800">{iss.studentName}</td>
                            <td className="p-3 font-black text-[10px] uppercase text-rose-700">{iss.field}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[10px] ${
                                iss.level === "error" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                              }`}>
                                {iss.message}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Tab NUEVOS */}
              {activeSyncTab === "new" && (
                <div className="space-y-3">
                  {syncData.newStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No se detectaron estudiantes nuevos en el archivo.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                          <tr>
                            <th className="p-3">Identificación</th>
                            <th className="p-3">Nombre</th>
                            <th className="p-3 text-center">Salón (Grado/Curso)</th>
                            <th className="p-3 text-center">Género</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {syncData.newStudents.map((st, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-bold text-slate-700">{st.nroDocumento}</td>
                              <td className="p-3 font-semibold text-slate-800">
                                {`${st.primerApellido} ${st.segundoApellido} ${st.primerNombre} ${st.segundoNombre}`.replace(/\s+/g, " ").trim()}
                              </td>
                              <td className="p-3 text-center font-bold text-indigo-600">
                                {st.grado} - {st.curso}
                              </td>
                              <td className="p-3 text-center font-semibold text-slate-500">{st.genero}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab MODIFICADOS */}
              {activeSyncTab === "modified" && (
                <div className="space-y-4">
                  {syncData.modifiedStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No hay modificaciones pendientes.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {syncData.modifiedStudents.map((item, idx) => (
                        <div key={idx} className="border border-slate-200/60 bg-slate-50/30 rounded-2xl p-4 space-y-3">
                          <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm">
                                {`${item.student.primerApellido} ${item.student.primerNombre}`}
                              </p>
                              <p className="text-[10px] text-slate-400 font-semibold font-mono">Doc: {item.student.nroDocumento}</p>
                            </div>
                            <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                              Modificado
                            </span>
                          </div>
                          
                          <div className="space-y-2">
                            {item.changes.map((change, cIdx) => (
                              <div key={cIdx} className="grid grid-cols-3 items-center text-[10px] font-bold">
                                <span className="text-slate-400 uppercase tracking-wider">{change.field}</span>
                                <span className="text-red-500 line-through truncate pr-2">{change.old}</span>
                                <span className="text-green-600 flex items-center gap-1 font-extrabold truncate">
                                  <ArrowRight size={10} /> {change.newVal}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab FALTANTES */}
              {activeSyncTab === "missing" && (
                <div className="space-y-6">
                  {syncData.missingStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                      Todos los estudiantes del sistema están presentes en el archivo.
                    </div>
                  ) : (
                    <>
                      {/* Alerta explicativa y selectores de acción */}
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <AlertTriangle className="w-6 h-6 animate-pulse" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">Estudiantes faltantes en tu archivo</h4>
                            <p className="text-[10px] text-slate-500 font-semibold">El archivo subido no contiene los registros de {syncData.missingStudents.length} estudiantes activos.</p>
                          </div>
                        </div>

                        {/* Opciones de Borrado/Conservación */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          <button
                            onClick={() => setDeleteMissing(true)}
                            className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                              deleteMissing 
                                ? "border-red-500 bg-red-50/20 shadow-md" 
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <span className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-wider">
                              <Trash2 size={14} /> Desactivar / Borrar (Recomendado)
                            </span>
                            <span className="text-[9.5px] text-slate-500 mt-2 leading-relaxed">
                              Marca a los alumnos ausentes en el archivo como inactivos en el sistema. Ideal para mantener la base sincronizada.
                            </span>
                          </button>

                          <button
                            onClick={() => setDeleteMissing(false)}
                            className={`flex flex-col text-left p-5 rounded-2xl border-2 transition-all ${
                              !deleteMissing 
                                ? "border-indigo-600 bg-indigo-50/20 shadow-md" 
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <span className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-wider">
                              <CheckCircle size={14} /> Conservar en el sistema
                            </span>
                            <span className="text-[9.5px] text-slate-500 mt-2 leading-relaxed">
                              No realiza ningún cambio sobre los ausentes; permanecen activos y solo se agregan o modifican los demás.
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Lista de estudiantes faltantes */}
                      <div className="space-y-2">
                        <h5 className="font-black text-[9px] text-slate-400 uppercase tracking-widest">Estudiantes que se verán afectados</h5>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden">
                          <table className="w-full border-collapse text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                              <tr>
                                <th className="p-3">Identificación</th>
                                <th className="p-3">Nombre</th>
                                <th className="p-3 text-center">Salón Actual</th>
                                <th className="p-3 text-center">Estado Final</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {syncData.missingStudents.map((st, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-3 font-mono text-slate-600">{st.nroDocumento}</td>
                                  <td className="p-3 font-semibold text-slate-700">
                                    {`${st.primerApellido} ${st.segundoApellido} ${st.primerNombre} ${st.segundoNombre}`.replace(/\s+/g, " ").trim()}
                                  </td>
                                  <td className="p-3 text-center text-slate-500">{st.grado} - {st.curso}</td>
                                  <td className="p-3 text-center font-bold">
                                    {deleteMissing ? (
                                      <span className="text-red-600 uppercase text-[9px] tracking-wider bg-red-50 px-2 py-0.5 rounded">Inactivo</span>
                                    ) : (
                                      <span className="text-indigo-600 uppercase text-[9px] tracking-wider bg-indigo-50 px-2 py-0.5 rounded">Sin Cambios</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab SIN CAMBIOS */}
              {activeSyncTab === "unchanged" && (
                <div className="space-y-3">
                  {syncData.unchangedStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No se encontraron registros idénticos sin cambios en el archivo.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full border-collapse text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                          <tr>
                            <th className="p-3">Identificación</th>
                            <th className="p-3">Nombre</th>
                            <th className="p-3 text-center">Salón</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {syncData.unchangedStudents.map((st, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-500">{st.nroDocumento}</td>
                              <td className="p-3 text-slate-600">
                                {`${st.primerApellido} ${st.segundoApellido} ${st.primerNombre} ${st.segundoNombre}`.replace(/\s+/g, " ").trim()}
                              </td>
                              <td className="p-3 text-center text-slate-500">{st.grado} - {st.curso}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Botonera de Acción */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 flex-shrink-0">
              {syncData.issues.length > 0 ? (
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle size={14} /> Carga bloqueada por Regla de Gobernanza ({syncData.issues.length} novedades por corregir)
                </p>
              ) : (
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Validación de Gobernanza aprobada (0 errores)
                </p>
              )}
              <div className="flex justify-end gap-3">
                <button
                  disabled={isSyncing}
                  onClick={() => {
                    setShowSyncModal(false);
                    setSyncData(null);
                  }}
                  className="px-5 py-3 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  disabled={isSyncing || syncData.issues.length > 0}
                  onClick={handleApplySync}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      Sincronizando...
                    </>
                  ) : syncData.issues.length > 0 ? (
                    <>
                      <AlertTriangle size={14} />
                      Bloqueado hasta Corregir Novedades
                    </>
                  ) : (
                    <>
                      <Check size={14} className="stroke-[3]" />
                      Aplicar Sincronización
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <BottomNavBar />
      </div>
    </RoleGuard>
  );
}
