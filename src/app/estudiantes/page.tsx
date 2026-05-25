"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import nextDynamic from "next/dynamic";
const StudentList = nextDynamic(() => import("@/components/students/StudentList"), { ssr: false });
const StudentProfile = nextDynamic(() => import("@/components/students/StudentProfile"), { ssr: false });
const PerformanceStats = nextDynamic(() => import("@/components/students/PerformanceStats"), { ssr: false });
const ImportSummaryModal = nextDynamic(() => import("@/components/students/ImportSummaryModal"), { ssr: false });
import { FileDown, FileText, UserPlus, X, CheckCircle, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { exportToCSV, exportToPDF } from "@/lib/reports";
import { useApp, normalizeGrade } from "@/context/AppContext";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";
import { Users } from "lucide-react";
import { printInstitutionalStudentReport } from "@/lib/printService";

export default function StudentsPage() {
  const { myStudents, addStudent, masterData, profile, importStudents } = useApp();
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [gradoFilter, setGradoFilter] = useState("TODOS");
  const [cursoFilter, setCursoFilter] = useState("TODOS");

  const [selectedId, setSelectedId] = useState("");
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

  const [formData, setFormData] = useState({
    nombre: "",
    grado: "",
    curso: "",
    documento: ""
  });

  const [isAddingStudent, setIsAddingStudent] = useState(false);

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
        alert("¡Estudiante matriculado y guardado en el sistema con éxito!");
      } catch (err) {
        console.error("Error al matricular estudiante:", err);
        alert("Ocurrió un error inesperado al guardar la matrícula en el servidor. Por favor, verifica la conexión.");
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
            <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase italic">Estudiantes</h1>
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
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-3 md:px-6 md:py-3 bg-primary text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95 min-w-[140px]"
            >
              <UserPlus size={16} /> Nueva Matrícula
            </button>
            <label className="flex items-center justify-center gap-2 flex-1 md:flex-none px-4 py-3 md:px-6 md:py-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all cursor-pointer shadow-lg active:scale-95 min-w-[140px]">
              <FileDown size={16} /> Carga Masiva
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
                      const dataToImport: any[] = [];
                      
                      for (const row of rows) {
                        // Normalizar llaves y valores (limpiar caracteres invisibles como BOM o espacios extra)
                        const s: any = {};
                        const rawValues = Object.values(row);
                        
                        Object.keys(row).forEach((k, idx) => {
                          const cleanKey = k.replace(/^\uFEFF/, "").toLowerCase().trim();
                          s[cleanKey] = row[k];
                          // Guardar por posición también como fallback (0: Grado, 1: Curso, 2: Documento)
                          s[`pos_${idx}`] = row[k];
                        });

                        // Mapeo inteligente con prioridad institucional IETABA
                        const docNum = s["nro documento"] || s.documento || s.nrodocumento || s.document || s.identificacion || s.pos_3 || s.pos_2;
                        const rawCurso = (s["curso ietaba"] || s.curso || s.grupo || s.pos_1 || s.pos_0 || "1").toString().toUpperCase();
                        const rawGrado = (s.grado || s.nivel || s.pos_0 || s.pos_2 || "").toString();

                        if (docNum && rawGrado) {
                          dataToImport.push({
                            grado: rawGrado.trim(),
                            curso: rawCurso.trim(),
                            nroDocumento: String(docNum).trim(),
                            tipoDocumento: s["tipo doc."] || s.tipodoc || s.pos_2 || "T.I.",
                            primerApellido: s["primer apellido"] || s.primerapellido || s.apellido || s.pos_4 || "",
                            segundoApellido: s["segundo apellido"] || s.segundoapellido || s.pos_5 || "",
                            primerNombre: s["primer nombre"] || s.primernombre || s.nombre || s.pos_6 || "",
                            segundoNombre: s["segundo nombre"] || s.segundonombre || s.pos_7 || "",
                            fechaNacimiento: s["fecha nacimiento"] || s.fechanacimiento || s.pos_8 || "",
                            genero: s.genero || s.pos_9 || "M"
                          });
                        }
                      }

                      if (dataToImport.length > 0) {
                        const { novelties, notFound } = await importStudents(dataToImport);
                        setImportStats({
                          total: dataToImport.length,
                          success: dataToImport.length - notFound.length,
                          novelties,
                          errors: notFound
                        });
                        setShowImportResults(true);
                      } else {
                        alert("No se encontraron datos válidos en el archivo. Revisa que las columnas coincidan con la plantilla.");
                      }
                      if (e.target) e.target.value = "";
                    }
                  });
                }}
              />
            </label>
            <button 
              onClick={() => {
                const headers = "CURSO IETABA,GRADO,TIPO DOC.,NRO DOCUMENTO,PRIMER APELLIDO,SEGUNDO APELLIDO,PRIMER NOMBRE,SEGUNDO NOMBRE,FECHA NACIMIENTO,GENERO\n";
                const example = "1,6,T.I.,123456789,PEREZ,RODRIGUEZ,JUAN,CARLOS,2010-05-20,M";
                const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('hidden', '');
                a.setAttribute('href', url);
                a.setAttribute('download', 'Cargue_Maestro_IETABA.csv');
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
            >
              <FileDown size={18} /> Plantilla
            </button>
          </div>
        </div>

        <ImportSummaryModal 
          isOpen={showImportResults} 
          onClose={() => setShowImportResults(false)} 
          stats={importStats} 
        />

        <PerformanceStats 
          grado={gradoFilter} 
          curso={cursoFilter} 
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
              onFilteredCountChange={(count) => {
                if (count === 0) setSelectedId("");
              }}
            />
          </div>
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              {selectedId ? (
                <StudentProfile id={selectedId} />
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

      <BottomNavBar />
      </div>
    </RoleGuard>
  );
}
