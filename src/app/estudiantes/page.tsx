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

export default function StudentsPage() {
  const { students, addStudent } = useApp();
  const [selectedId, setSelectedId] = useState(students[0]?.id || "");
  const [showModal, setShowModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");

  const handleAddStudent = () => {
    if (newStudentName) {
      const names = newStudentName.split(" ");
      addStudent({ 
        primerNombre: names[0] || "",
        primerApellido: names[1] || "",
        segundoApellido: names[2] || "",
        segundoNombre: names[3] || "",
        nroDocumento: `TMP-${Date.now()}`,
        tipoDocumento: "T.I.",
        curso: "1",
        grado: "0",
        fechaNacimiento: "",
        genero: "M",
        avgGrade: 0, 
        attendance: "100%",
        isActive: true
      });
      setNewStudentName("");
      setShowModal(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-[1440px] mx-auto w-full space-y-6 pb-24 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-on-surface">Estudiantes</h1>
            <p className="text-sm text-on-surface-variant font-medium">Gestión dinámica de alumnos y reportes 360°</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/reportes/asistencia"
              className="flex items-center gap-2 px-6 py-2.5 bg-on-surface text-white rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-xl active:scale-95 uppercase tracking-tighter"
            >
              <FileText size={18} className="text-secondary" /> Reporte Mensual (OFICIAL)
            </Link>
            <button 
              onClick={() => exportToPDF("Reporte de Estudiantes", students)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-xl text-[10px] font-black uppercase hover:bg-surface-container-low transition-colors"
            >
              <FileText size={16} className="text-error" /> PDF
            </button>
            <button 
              onClick={() => exportToCSV(students, "estudiantes_reporte")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-outline-variant rounded-xl text-[10px] font-black uppercase hover:bg-surface-container-low transition-colors"
            >
              <FileDown size={16} className="text-secondary" /> CSV
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase hover:opacity-90 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              <UserPlus size={16} /> Nuevo
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
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-on-surface">Nuevo Estudiante</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-surface-container rounded-full"><X size={20}/></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest ml-1">Nombre Completo</label>
                <input 
                  autoFocus
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary font-bold text-sm" 
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <p className="text-[10px] text-on-surface-variant leading-relaxed">Se generará automáticamente un ID único y un historial académico vacío para este alumno.</p>
            </div>
            <button 
              onClick={handleAddStudent}
              className="w-full py-4 bg-primary text-white font-bold rounded-2xl text-sm shadow-lg shadow-primary/10 hover:opacity-90 active:scale-95 transition-all"
            >
              Registrar Estudiante
            </button>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
