"use client";

import { useState, useRef } from "react";
import { useApp } from "@/context/AppContext";
import Papa from "papaparse";
import { 
  Users, Book, GraduationCap, ShieldCheck, 
  Trash2, Upload, ArrowLeft, CheckCircle, X, Baby, Info, RotateCcw,
  BarChart3, LayoutGrid
} from "lucide-react";
import Link from "next/link";
import StatisticsDashboard from "@/components/admin/StatisticsDashboard";

const excelDateToJS = (serial: any) => {
  if (!serial || isNaN(serial)) return serial || "";
  const date = new Date((parseFloat(serial) - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
};

export default function AdminPage() {
  const { masterData, updateMasterData, students, setStudents, profile, setProfile } = useApp();
  const [activeTab, setActiveTab] = useState<"teachers" | "subjects" | "grades" | "students" | "stats">("stats");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removeItem = (id: string) => {
    if (activeTab === "students") {
      // BORRADO LÓGICO: Nunca borramos la data física de la DB, solo la marcamos como inactiva.
      // Así preservamos el historial de calificaciones y asistencia.
      setStudents(students.map(s => s.id === id ? { ...s, isActive: false } : s));
    } else if (activeTab !== "stats") {
      const newList = masterData[activeTab].filter(i => i !== id);
      updateMasterData(activeTab, newList);
    }
  };

  const clearDatabase = () => {
    if (confirm(`¿Está seguro de que desea ARCHIVAR (Borrado Lógico) todos los registros de ${activeTab}?`)) {
      if (activeTab === "students") {
        setStudents(students.map(s => ({ ...s, isActive: false })));
      } else if (activeTab !== "stats") {
        updateMasterData(activeTab, []);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        const startIdx = (rows[0][0]?.toUpperCase().includes("CURSO") || rows[0][4]?.toUpperCase().includes("DOCUMENTO")) ? 1 : 0;
        const dataRows = rows.slice(startIdx);

        if (activeTab === "students") {
          const newStudents = dataRows.map((row, index) => {
            const docNum = row[4]?.trim() || `TMP-${Date.now()}-${index}`;
            return {
              id: `st-${docNum}-${Date.now()}-${index}`, 
              curso: row[0]?.trim() || "1",
              grado: row[2]?.trim() || "0",
              tipoDocumento: row[3]?.trim().toUpperCase() || "T.I.",
              nroDocumento: docNum,
              primerApellido: row[5]?.trim().toUpperCase() || "",
              segundoApellido: row[6]?.trim().toUpperCase() || "",
              primerNombre: row[7]?.trim().toUpperCase() || "",
              segundoNombre: row[8]?.trim().toUpperCase() || "",
              fechaNacimiento: excelDateToJS(row[9]?.trim()),
              genero: row[10]?.trim().toUpperCase() || "F",
              avgGrade: Math.random() * 5, // Simulated for demo
              attendance: "100%",
              present: true
            };
          }).filter(s => s.primerApellido && s.primerNombre);
          
          setStudents([...students, ...newStudents]);
          setImportSummary({ count: newStudents.length, type: "Estudiantes" });
        } else if (activeTab !== "stats") {
          const names = dataRows.map(row => row[0]?.trim().toUpperCase()).filter(n => n);
          updateMasterData(activeTab, Array.from(new Set([...masterData[activeTab], ...names])));
          setImportSummary({ count: names.length, type: activeTab });
        }

        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setImportSummary(null), 5000);
      }
    });
  };

  const getCurrentList = () => {
    if (activeTab === 'students') return students;
    if (activeTab === 'teachers') return masterData.teachers;
    if (activeTab === 'subjects') return masterData.subjects;
    if (activeTab === 'grades') return masterData.grades;
    return [];
  };

  const currentList = getCurrentList();

  return (
    <div className="min-h-screen bg-surface-container-lowest font-inter">
      <header className="bg-on-surface text-white p-6 md:px-12 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldCheck size={180} /></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tighter uppercase italic">Panel Administrativo</h1>
              <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Gestión de Alto Nivel</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
             <div className="flex items-center bg-white/10 rounded-xl p-1 px-2 md:px-3 border border-white/20">
                <span className="text-[8px] font-black uppercase opacity-60 mr-2 hidden md:inline">Rol:</span>
                <select 
                  value={profile.role}
                  onChange={(e) => setProfile({...profile, role: e.target.value as any})}
                  className="bg-transparent text-[9px] md:text-[10px] font-black uppercase outline-none cursor-pointer"
                >
                  <option value="RECTOR" className="text-black">Rectoría</option>
                  <option value="COORDINADOR" className="text-black">Coordinación</option>
                  <option value="BIENESTAR" className="text-black">Convivencia</option>
                  <option value="DOCENTE" className="text-black">Profesorado</option>
                </select>
             </div>
             {/* Only non-DOCENTE roles can delete data */}
             {profile.role !== "DOCENTE" && activeTab !== "stats" && (
               <button onClick={clearDatabase} className="px-4 py-2 bg-error text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-error/90 transition-all flex items-center gap-1.5">
                 <RotateCcw size={14} /> <span className="hidden md:inline">Limpiar</span>
               </button>
             )}
             <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
             <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white text-on-surface rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-surface-container-low active:scale-95 transition-all flex items-center gap-1.5">
               <Upload size={14} /> Importar <span className="hidden md:inline">Datos</span>
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-12 -mt-8 relative z-20">
        {importSummary && (
          <div className="mb-6 animate-in slide-in-from-top-6 fade-in duration-500">
            <div className="bg-secondary text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center justify-between border border-white/20">
               <div className="flex items-center gap-4"><CheckCircle size={28} /><span className="font-black uppercase text-sm tracking-widest">¡Carga Finalizada! {importSummary.count} {importSummary.type} integrados.</span></div>
               <button onClick={() => setImportSummary(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={20}/></button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
          <aside className="lg:col-span-3 space-y-4 md:space-y-6">
            <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-5 shadow-2xl border border-outline-variant/30 grid grid-cols-2 lg:grid-cols-1 gap-2">
              {[
                { id: "stats", label: "Estadísticas", icon: BarChart3 },
                { id: "students", label: "Estudiantes", icon: Baby },
                { id: "teachers", label: "Docentes", icon: Users },
                { id: "subjects", label: "Materias", icon: Book },
                { id: "grades", label: "Grados", icon: GraduationCap },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 md:gap-4 px-4 md:px-6 py-3 md:py-5 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-primary text-white shadow-xl scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                >
                  <tab.icon size={18} /> {tab.label}
                </button>
              ))}
            </div>
            
            <div className="p-8 bg-surface-container rounded-[2rem] border border-outline-variant/50 relative overflow-hidden">
               <h4 className="font-black text-primary text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                 <Info size={14} /> Guía de Importación
               </h4>
               <p className="text-[10px] text-on-surface-variant font-bold leading-relaxed uppercase opacity-70 mb-4">
                 Sube archivos .CSV con las 11 columnas institucionales. El sistema detectará automáticamente los encabezados.
               </p>
               <div className="mt-4 p-4 bg-white/60 rounded-xl border border-outline-variant/30">
                  <p className="text-[9px] font-black text-primary uppercase">Conversión Automática Activa: Serial Excel → Fecha Real</p>
               </div>
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-8">
            {activeTab === "stats" ? (
              <StatisticsDashboard />
            ) : (
              <div className="bg-white rounded-[3rem] shadow-2xl border border-outline-variant/30 overflow-hidden min-h-[600px]">
                <div className="bg-surface-container-low px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Base de Datos: {activeTab}</span>
                  <span className="text-[10px] font-black text-white bg-on-surface px-5 py-2 rounded-full uppercase tracking-[0.1em]">{currentList.length} REGISTROS</span>
                </div>
                
                <div className="grid grid-cols-1 gap-px bg-outline-variant/20">
                  {currentList.map((item: any, i: number) => {
                    const isStudent = typeof item !== 'string';
                    const name = isStudent ? `${item.primerApellido} ${item.segundoApellido} ${item.primerNombre} ${item.segundoNombre}` : item;
                    
                    return (
                      <div key={isStudent ? item.id : i} className="bg-white p-6 flex items-center justify-between group hover:bg-surface-container-lowest transition-all">
                        <div className="flex items-center gap-6 overflow-hidden">
                          <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/10">
                            {isStudent ? item.grado : i + 1}
                          </div>
                          <div>
                            <p className="font-black text-on-surface tracking-tighter uppercase text-[12px] leading-tight">{name}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <p className="text-[9px] font-bold text-on-surface-variant opacity-60 tracking-widest">{isStudent ? `${item.tipoDocumento} ${item.nroDocumento}` : 'SISTEMA'}</p>
                              {isStudent && (
                                <>
                                  <span className="text-[9px] font-black bg-secondary/10 text-secondary px-2 py-0.5 rounded uppercase">CURSO: {item.curso}</span>
                                  <span className="text-[9px] font-black text-primary uppercase ml-2">{item.fechaNacimiento}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeItem(isStudent ? item.id : item)} className="p-3 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all hover:bg-error/10 rounded-xl">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {currentList.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-40 text-on-surface-variant opacity-20">
                     <Upload size={80} className="mb-8" />
                     <p className="font-black uppercase tracking-[0.5em] text-lg text-center">Cargar Base de Datos<br/>Oficial IETABA</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
