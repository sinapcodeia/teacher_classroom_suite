"use client";

import { useState } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import StudentList from "@/components/students/StudentList";
import StudentProfile from "@/components/students/StudentProfile";
import PerformanceStats from "@/components/students/PerformanceStats";
import { FileDown, FileText, UserPlus, X, CheckCircle } from "lucide-react";
import { exportToCSV, exportToPDF } from "@/lib/reports";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";
import { Users } from "lucide-react";

export default function StudentsPage() {
  const { students, addStudent, masterData } = useApp();
  const [selectedId, setSelectedId] = useState(students[0]?.id || "");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    grado: "",
    curso: "",
    documento: ""
  });

  const handleAddStudent = () => {
    if (formData.nombre && formData.grado) {
      const names = formData.nombre.trim().split(" ");
      addStudent({ 
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
    }
  };

  return (
    <RoleGuard allowedRoles={["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE"]}>
      <div className="flex flex-col min-h-screen bg-background text-on-surface">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-[1440px] mx-auto w-full space-y-6 pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase italic">Estudiantes</h1>
            <p className="text-sm text-on-surface-variant font-bold uppercase tracking-widest opacity-70">Gestión de Matrícula y Seguimiento Académico</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/reportes/asistencia"
              className="flex items-center gap-2 px-6 py-3 bg-on-surface text-white rounded-2xl text-[10px] font-black hover:opacity-90 transition-all shadow-xl active:scale-95 uppercase tracking-widest"
            >
              <FileText size={18} className="text-primary-container" /> Asistencia Oficial
            </Link>
            <button 
              onClick={() => exportToPDF("Reporte Institucional de Estudiantes", students)}
              className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-outline-variant rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-low transition-all"
            >
              <FileText size={18} className="text-error" /> Exportar PDF
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95"
            >
              <UserPlus size={18} /> Nueva Matrícula
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-12">
            <PerformanceStats />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <StudentList selectedId={selectedId} onSelect={setSelectedId} />
          </div>
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <StudentProfile id={selectedId} />
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
              disabled={!formData.nombre || !formData.grado}
              className="w-full py-5 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
            >
              Completar Registro Institucional
            </button>
          </div>
        </div>
      )}

      <BottomNavBar />
      </div>
    </RoleGuard>
  );
}
