"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Papa from "papaparse";
import { 
  Users, Book, GraduationCap, ShieldCheck, 
  Trash2, Upload, ArrowLeft, CheckCircle, X, Baby, Info, RotateCcw,
  BarChart3, LayoutGrid, Key, ShieldAlert, Mail, UserPlus, Fingerprint, Plus, Loader2, Search
} from "lucide-react";
import Link from "next/link";
import StatisticsDashboard from "@/components/admin/StatisticsDashboard";

const excelDateToJS = (serial: any) => {
  if (!serial || isNaN(serial)) return serial || "";
  const date = new Date((parseFloat(serial) - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
};

export default function AdminPage() {
  const { 
    masterData, updateMasterData, students, setStudents, 
    profile, setProfile, allUsers, refreshUsers, updateUserRole, createEmailUser 
  } = useApp();
  
  const [activeTab, setActiveTab] = useState<"teachers" | "subjects" | "grades" | "students" | "stats" | "users">("stats");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", name: "", pass: "", role: "DOCENTE" as any });
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSuperAdmin = profile.isSuperAdmin;

  useEffect(() => {
    if (activeTab === "users" && isSuperAdmin) {
      refreshUsers();
    }
  }, [activeTab, isSuperAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createEmailUser(newUser.email, newUser.pass, newUser.name, newUser.role);
      setShowAddUser(false);
      setNewUser({ email: "", name: "", pass: "", role: "DOCENTE" });
      alert("Usuario creado correctamente.");
    } catch (err: any) {
      alert("Error al crear usuario: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = (id: string) => {
    if (activeTab === "students") {
      setStudents(students.map(s => s.id === id ? { ...s, isActive: false } : s));
    } else if (activeTab !== "stats" && activeTab !== "users") {
      const newList = masterData[activeTab].filter(i => i !== id);
      updateMasterData(activeTab, newList);
    }
  };

  const clearDatabase = () => {
    if (confirm(`¿Está seguro de que desea ARCHIVAR todos los registros de ${activeTab}?`)) {
      if (activeTab === "students") {
        setStudents(students.map(s => ({ ...s, isActive: false })));
      } else if (activeTab !== "stats" && activeTab !== "users") {
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
              avgGrade: Math.random() * 5,
              attendance: "100%",
              present: true
            };
          }).filter(s => s.primerApellido && s.primerNombre);
          
          setStudents([...students, ...newStudents]);
          setImportSummary({ count: newStudents.length, type: "Estudiantes" });
        } else if (activeTab !== "stats" && activeTab !== "users") {
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
      <header className="bg-on-surface text-white p-6 md:px-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ShieldCheck size={180} /></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all shadow-lg"><ArrowLeft size={20} /></Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic">Control Central</h1>
              <p className="text-[10px] font-bold opacity-50 uppercase tracking-[0.4em] mt-0.5">Infraestructura Institucional</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center bg-white/10 rounded-2xl p-1.5 px-4 border border-white/20 shadow-inner">
                <Fingerprint size={16} className="text-primary-container mr-3 opacity-60" />
                <select 
                  value={profile.role}
                  onChange={async (e) => {
                    const newRole = e.target.value as any;
                    setProfile({...profile, role: newRole});
                    const { auth, db } = await import("@/lib/firebase");
                    const { doc, updateDoc } = await import("firebase/firestore");
                    if (auth.currentUser) {
                      try {
                        await updateDoc(doc(db, "users", auth.currentUser.uid), { role: newRole });
                      } catch (err) {
                        console.error("Error al actualizar rol:", err);
                      }
                    }
                  }}
                  className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer"
                >
                  <option value="RECTOR" className="text-black">Rectoría</option>
                  <option value="COORDINADOR" className="text-black">Coordinación</option>
                  <option value="BIENESTAR" className="text-black">Convivencia</option>
                  <option value="DOCENTE" className="text-black">Profesorado</option>
                </select>
             </div>
             
             {profile.role !== "DOCENTE" && activeTab !== "stats" && activeTab !== "users" && (
               <button onClick={clearDatabase} className="px-5 py-3 bg-error text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-error/20 hover:bg-error/90 active:scale-95 transition-all flex items-center gap-2">
                 <RotateCcw size={16} /> <span className="hidden md:inline">Archivar</span>
               </button>
             )}
             
             {activeTab !== "users" && activeTab !== "stats" && (
               <>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                 <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-white text-on-surface rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-white/10 hover:bg-surface-container-low active:scale-95 transition-all flex items-center gap-2">
                   <Upload size={16} /> Importar <span className="hidden md:inline">Dataset</span>
                 </button>
               </>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-12 -mt-10 relative z-20">
        {importSummary && (
          <div className="mb-8 animate-fade-in-up">
            <div className="bg-secondary text-white px-10 py-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between border border-white/20 premium-gradient">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-lg"><CheckCircle size={28} /></div>
                  <div>
                    <p className="font-black uppercase text-sm tracking-widest">Dataset Integrado</p>
                    <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-0.5">{importSummary.count} {importSummary.type} sincronizados con éxito.</p>
                  </div>
               </div>
               <button onClick={() => setImportSummary(null)} className="p-3 hover:bg-white/10 rounded-full transition-all"><X size={20}/></button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-4 shadow-2xl border border-outline-variant/30 flex flex-col gap-2">
              {[
                { id: "stats", label: "Estadísticas", icon: BarChart3 },
                { id: "users", label: "Acceso ID", icon: Key, hidden: !isSuperAdmin },
                { id: "students", label: "Estudiantes", icon: Baby },
                { id: "teachers", label: "Docentes", icon: Users },
                { id: "subjects", label: "Materias", icon: Book },
                { id: "grades", label: "Grados", icon: GraduationCap },
              ].filter(t => !t.hidden).map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? 'bg-on-surface text-white shadow-2xl scale-[1.05]' : 'text-on-surface-variant hover:bg-surface-container-low hover:pl-8'}`}
                >
                  <tab.icon size={20} /> {tab.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="lg:col-span-9 space-y-10 animate-fade-in-up">
            {activeTab === "stats" ? (
              <StatisticsDashboard />
            ) : activeTab === "users" ? (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-outline-variant/30 overflow-hidden min-h-[700px]">
                <div className="bg-on-surface text-white px-10 py-8 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-primary-container"><Key size={28} /></div>
                    <div>
                       <h2 className="text-xl font-black uppercase italic tracking-tighter">Gestión de Identidad</h2>
                       <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.3em]">Directorio Activo IETABA</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAddUser(true)}
                    className="flex items-center gap-2 bg-primary-container text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                  >
                    <Plus size={16} /> Nuevo Usuario
                  </button>
                </div>
                
                <div className="p-6 space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40" size={18} />
                      <input 
                        type="text" 
                        placeholder="BUSCAR POR NOMBRE O CORREO..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full bg-surface-container px-14 py-5 rounded-3xl text-[11px] font-black uppercase outline-none border border-transparent focus:border-primary focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                    <div className="flex gap-4">
                      <select 
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="bg-surface-container px-6 py-5 rounded-3xl text-[10px] font-black uppercase outline-none border border-transparent focus:border-primary cursor-pointer shadow-inner"
                      >
                        <option value="ALL">TODOS LOS ROLES</option>
                        <option value="RECTOR">RECTORES</option>
                        <option value="COORDINADOR">COORDINADORES</option>
                        <option value="BIENESTAR">CONVIVENCIA</option>
                        <option value="DOCENTE">DOCENTES</option>
                      </select>
                      <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-surface-container px-6 py-5 rounded-3xl text-[10px] font-black uppercase outline-none border border-transparent focus:border-primary cursor-pointer shadow-inner"
                      >
                        <option value="ALL">TODOS LOS ESTADOS</option>
                        <option value="ACTIVE">ACTIVOS</option>
                        <option value="PENDING">PENDIENTES</option>
                      </select>
                    </div>
                  </div>

                  {/* Formulario para nuevo usuario */}
                  {showAddUser && (
                    <div className="bg-surface-container p-8 rounded-[2.5rem] border border-primary/20 mb-6 animate-fade-in-up">
                       <div className="flex justify-between items-center mb-6">
                          <h3 className="font-black uppercase text-[12px] tracking-widest text-primary">Crear Acceso Manual</h3>
                          <button onClick={() => setShowAddUser(false)} className="p-2 hover:bg-white/50 rounded-full"><X size={18}/></button>
                       </div>
                       <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input 
                            required
                            type="text" 
                            placeholder="NOMBRE COMPLETO" 
                            className="bg-white rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none border border-outline-variant focus:border-primary"
                            value={newUser.name}
                            onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                          />
                          <input 
                            required
                            type="email" 
                            placeholder="CORREO ELECTRÓNICO" 
                            className="bg-white rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none border border-outline-variant focus:border-primary"
                            value={newUser.email}
                            onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          />
                          <input 
                            required
                            type="password" 
                            placeholder="CONTRASEÑA TEMPORAL" 
                            className="bg-white rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none border border-outline-variant focus:border-primary"
                            value={newUser.pass}
                            onChange={(e) => setNewUser({...newUser, pass: e.target.value})}
                          />
                          <select 
                            className="bg-white rounded-xl px-4 py-3 text-[11px] font-black uppercase outline-none border border-outline-variant focus:border-primary"
                            value={newUser.role}
                            onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                          >
                             <option value="DOCENTE">Docente</option>
                             <option value="COORDINADOR">Coordinador</option>
                             <option value="RECTOR">Rector</option>
                             <option value="BIENESTAR">Bienestar</option>
                          </select>
                          <button 
                            type="submit" 
                            disabled={loading}
                            className="md:col-span-2 py-4 bg-on-surface text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl flex items-center justify-center gap-2"
                          >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><UserPlus size={16} /> Crear Cuenta Oficial</>}
                          </button>
                       </form>
                    </div>
                  )}

                  {allUsers
                    .filter(u => {
                      const matchesSearch = u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) || 
                                          u.email.toLowerCase().includes(userSearch.toLowerCase());
                      const matchesRole = filterRole === "ALL" || u.role === filterRole;
                      const matchesStatus = filterStatus === "ALL" || u.status === filterStatus;
                      return matchesSearch && matchesRole && matchesStatus;
                    })
                    .map((user) => (
                    <div key={user.uid} className="bg-surface-container-low p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 border border-transparent hover:border-primary/20 hover:bg-white transition-all duration-500 group shadow-sm">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-[1.5rem] ${user.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'} flex items-center justify-center font-black text-xl shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                          {user.displayName?.charAt(0) || <Mail size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <p className="font-black text-on-surface tracking-tighter uppercase text-[15px] leading-tight">
                              {user.displayName || "Usuario sin nombre"}
                            </p>
                            {user.status === 'PENDING' && <span className="text-[8px] font-black bg-amber-500 text-white px-3 py-1 rounded-full animate-pulse tracking-widest uppercase">Pendiente</span>}
                            {user.isSuperAdmin && <span className="text-[8px] font-black bg-primary text-white px-3 py-1 rounded-full tracking-widest uppercase">Master</span>}
                          </div>
                          <p className="text-[11px] font-bold text-on-surface-variant opacity-40 tracking-widest mt-1.5 uppercase">{user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="bg-white px-4 py-2 rounded-xl border border-outline-variant/30 shadow-sm flex items-center gap-3">
                           <span className="text-[9px] font-black uppercase opacity-30">Rol:</span>
                           <select 
                             value={user.role}
                             onChange={(e) => updateUserRole(user.uid, e.target.value as any)}
                             className="bg-transparent text-[11px] font-black uppercase outline-none cursor-pointer text-primary"
                           >
                             <option value="RECTOR">Rector</option>
                             <option value="COORDINADOR">Coordinador</option>
                             <option value="BIENESTAR">Bienestar</option>
                             <option value="DOCENTE">Docente</option>
                           </select>
                        </div>
                        {user.status === 'PENDING' && (
                          <button 
                            onClick={() => updateUserRole(user.uid, user.role)}
                            className="w-12 h-12 bg-on-surface text-white rounded-xl hover:bg-primary transition-all shadow-xl flex items-center justify-center group/btn"
                            title="Autorizar acceso"
                          >
                            <UserPlus size={20} className="group-hover/btn:scale-125 transition-transform" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {allUsers.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-48 text-on-surface-variant opacity-10">
                       <Fingerprint size={100} className="mb-6" />
                       <p className="font-black uppercase tracking-[0.6em] text-xl text-center">Buscando identidades...</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[3.5rem] shadow-2xl border border-outline-variant/30 overflow-hidden min-h-[700px]">
                <div className="bg-surface-container-low px-10 py-8 border-b border-outline-variant/30 flex items-center justify-between">
                  <span className="text-[12px] font-black uppercase tracking-[0.4em] text-on-surface-variant flex items-center gap-3">
                    <LayoutGrid size={18} /> {activeTab}
                  </span>
                  <span className="text-[10px] font-black text-white bg-on-surface px-6 py-2.5 rounded-full uppercase tracking-widest">{currentList.length} Entradas</span>
                </div>
                
                <div className="grid grid-cols-1 gap-px bg-outline-variant/10">
                  {currentList.map((item: any, i: number) => {
                    const isStudent = typeof item !== 'string';
                    const name = isStudent ? `${item.primerApellido} ${item.segundoApellido} ${item.primerNombre} ${item.segundoNombre}` : item;
                    
                    return (
                      <div key={isStudent ? item.id : i} className="bg-white p-8 flex items-center justify-between group hover:bg-surface-container-lowest transition-all duration-300">
                        <div className="flex items-center gap-8 overflow-hidden">
                          <div className="w-14 h-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                            {isStudent ? item.grado : i + 1}
                          </div>
                          <div>
                            <p className="font-black text-on-surface tracking-tighter uppercase text-[15px] leading-tight group-hover:text-primary transition-colors">{name}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-[10px] font-bold text-on-surface-variant opacity-40 tracking-widest uppercase">{isStudent ? `${item.tipoDocumento} ${item.nroDocumento}` : 'Registro del Sistema'}</p>
                              {isStudent && (
                                <div className="flex gap-2">
                                  <span className="text-[9px] font-black bg-secondary/10 text-secondary px-3 py-1 rounded-lg uppercase tracking-widest">Curso {item.curso}</span>
                                  <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">{item.fechaNacimiento}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeItem(isStudent ? item.id : item)} className="p-4 text-on-surface-variant hover:text-error opacity-0 group-hover:opacity-100 transition-all hover:bg-error/10 rounded-2xl">
                          <Trash2 size={22} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {currentList.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-48 text-on-surface-variant opacity-10">
                     <Upload size={100} className="mb-6" />
                     <p className="font-black uppercase tracking-[0.6em] text-xl text-center">Cargar dataset maestro</p>
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
