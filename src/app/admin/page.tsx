"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import Papa from "papaparse";
import { 
  Users, Book, GraduationCap, ShieldCheck, 
  Trash2, Upload, ArrowLeft, CheckCircle, X, Baby, Info, RotateCcw, Clock,
  BarChart3, LayoutGrid, Key, ShieldAlert, Mail, UserPlus, Fingerprint, Plus, Loader2, Search, Pencil
} from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";
import StatisticsDashboard from "@/components/admin/StatisticsDashboard";

const excelDateToJS = (serial: any) => {
  if (!serial || isNaN(serial)) return serial || "";
  const date = new Date((parseFloat(serial) - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
};

export default function AdminPage() {
  const { 
    masterData, updateMasterData, students, setStudents, 
    profile, setProfile, allUsers, refreshUsers, updateUserRole, createEmailUser,
    importStudents, removeStudent, removeMasterItem, updateStudent, updateMasterItem
  } = useApp();

  
  const [activeTab, setActiveTab] = useState<"teachers" | "subjects" | "grades" | "courses" | "students" | "stats" | "users">("stats");
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // Estudiante u objeto maestro
  const [editValue, setEditValue] = useState("");
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

  // Activate a pending user: set status ACTIVE in Firestore
  const activateUser = async (uid: string, role: string) => {
    try {
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", uid), { status: "ACTIVE", role });
      await refreshUsers();
    } catch (err) {
      console.error("Error al activar usuario:", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Política de Seguridad Institucional (Grado Militar)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newUser.pass)) {
      alert("⚠️ ERROR DE SEGURIDAD INSTITUCIONAL:\n\nLa contraseña debe tener al menos 8 caracteres, incluir una mayúscula y un número para garantizar la protección de datos.");
      return;
    }

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

  // Eliminar ítem individual
  const removeItem = (id: string) => {
    if (activeTab === "students") {
      if (!confirm("¿Archivar este estudiante? El registro se conserva en la BD con estado inactivo.")) return;
      removeStudent(id);
    } else if (activeTab === "teachers" || activeTab === "subjects" || activeTab === "grades" || activeTab === "courses") {
      if (!confirm(`¿Confirmar eliminación del elemento "${id}" del listado?\n\nNo afecta registros de estudiantes.`)) return;
      removeMasterItem(activeTab, id);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    if (typeof item === 'string') {
      setEditValue(item);
    }
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    try {
      if (activeTab === "students") {
        await updateStudent(editingItem.id, editingItem);
      } else if (activeTab === "teachers" || activeTab === "subjects" || activeTab === "grades" || activeTab === "courses") {
        updateMasterItem(activeTab, typeof editingItem === 'string' ? editingItem : editingItem, editValue);
      }
      setEditingItem(null);
    } catch (err) {
      alert("Error al guardar cambios");
    }
  };

  // Archivar masivo: SOLO disponible para estudiantes (isActive:false)
  // Para datos maestros está BLOQUEADO por seguridad
  const clearDatabase = () => {
    if (activeTab === "students") {
      if (!confirm("¿Archivar TODOS los estudiantes activos?\n\nTodos quedarán con estado INACTIVO pero SUS DATOS SE CONSERVAN en la base de datos.")) return;
      const archivados = students.map(s => ({ ...s, isActive: false }));
      archivados.forEach(s => removeStudent(s.id));
    } else {
      alert("⚠️ Por seguridad institucional, los datos maestros no se pueden borrar en masa.\n\nPuedes eliminar ítems individuales desde la lista.");
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
              avgGrade: 0,
              attendance: "100%",
              present: true,
              isActive: true,
            };
          }).filter(s => s.primerApellido && s.primerNombre);

          setIsImporting(false);
          // Batch write to Firestore
          importStudents(newStudents).then(() => {
            setImportSummary({ count: newStudents.length, type: "Estudiantes" });
            
            // AUTOMATIC FEED: Extract unique grades and courses from student list
            const uniqueGrades = Array.from(new Set(newStudents.map(s => s.grado.toUpperCase()))).filter(v => v);
            const uniqueCourses = Array.from(new Set(newStudents.map(s => s.curso.toUpperCase()))).filter(v => v);
            
            // Update Master Data without overwriting existing
            updateMasterData("grades", Array.from(new Set([...masterData.grades, ...uniqueGrades])));
            updateMasterData("courses", Array.from(new Set([...masterData.courses, ...uniqueCourses])));
            
          }).catch(err => {
            console.error("Error importando a Firestore:", err);
            setImportSummary({ count: newStudents.length, type: "Estudiantes (solo local)" });
          });
          if (fileInputRef.current) fileInputRef.current.value = "";
          return; 
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
    if (activeTab === 'students') return students || [];
    if (activeTab === 'teachers') return masterData.teachers || [];
    if (activeTab === 'subjects') return masterData.subjects || [];
    if (activeTab === 'grades') return masterData.grades || [];
    if (activeTab === 'courses') return masterData.courses || [];
    return [];
  };

  const currentList = getCurrentList();

  return (
    <RoleGuard allowedRoles={["RECTOR", "COORDINADOR"]}>
      <div className="min-h-screen bg-surface-container-lowest font-inter">
      <header className="bg-on-surface text-white p-8 md:px-16 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
        {/* Background Decorative elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 scale-150 pointer-events-none"><ShieldCheck size={280} /></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <Link href="/" className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[1.5rem] transition-all shadow-2xl backdrop-blur-md group">
              <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black opacity-40 uppercase tracking-[0.5em]">Sistema Operativo IETABA</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic leading-none">
                Consola <span className="text-primary-container">MASTER</span>
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
             {/* SuperAdmin Badge Premium */}
             {isSuperAdmin && (
                <div className="flex items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-xl rounded-[1.5rem] px-6 py-3 shadow-2xl">
                  <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.5)]">
                    <ShieldAlert size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white leading-none">Acceso Total</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      <p className="text-[8px] font-black text-rose-300 uppercase tracking-[0.2em]">Escudo Institucional Activo</p>
                    </div>
                  </div>
                </div>
             )}
             
             <div className="flex gap-3">
               {profile.role !== "DOCENTE" && activeTab !== "stats" && activeTab !== "users" && (
                 <button onClick={clearDatabase} className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-rose-900/40 hover:bg-rose-500 active:scale-95 transition-all flex items-center gap-2 border border-rose-400/20">
                   <RotateCcw size={16} /> <span className="hidden md:inline">Archivar Dataset</span>
                 </button>
               )}
               
               {activeTab !== "users" && activeTab !== "stats" && (
                 <>
                   <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                   <button onClick={() => fileInputRef.current?.click()} className="px-6 py-4 bg-white text-on-surface rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-surface-container-low active:scale-95 transition-all flex items-center gap-2 group">
                     <Upload size={16} className="group-hover:-translate-y-1 transition-transform" /> Importar CSV <span className="hidden md:inline">Maestro</span>
                   </button>
                 </>
               )}
             </div>
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
          <aside className="lg:col-span-3">
            <div className="bg-white rounded-[3rem] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.08)] border border-outline-variant/20 flex flex-col gap-3 sticky top-10">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 px-4">Panel de Control</p>
              {[
                { id: "stats",    label: "Inteligencia", icon: BarChart3, color: "bg-blue-500" },
                { id: "users",    label: "Identidades",  icon: Key,        color: "bg-indigo-500", hidden: !isSuperAdmin },
                { id: "students", label: "Estudiantes", icon: Baby,       color: "bg-emerald-500" },
                { id: "grades",   label: "Grados",      icon: GraduationCap, color: "bg-amber-500" },
                { id: "courses",  label: "Cursos",      icon: LayoutGrid,    color: "bg-orange-500" },
                { id: "subjects", label: "Materias",    icon: Book,       color: "bg-purple-500" },
                { id: "teachers", label: "Docentes",    icon: Users,      color: "bg-rose-500" },
              ].filter(t => !t.hidden).map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-5 px-6 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all duration-500 group relative overflow-hidden ${isActive ? 'bg-on-surface text-white shadow-2xl scale-[1.02]' : 'text-slate-500 hover:bg-slate-50 hover:pl-8'}`}
                  >
                    {isActive && <div className={`absolute left-0 top-0 w-1.5 h-full ${tab.color}`} />}
                    <tab.icon size={20} className={isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                    <span>{tab.label}</span>
                    {isActive && <ArrowLeft size={16} className="ml-auto rotate-180 opacity-40" />}
                  </button>
                );
              })}
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
                          {user.lastLogin && (
                            <div className="flex items-center gap-1.5 mt-2 opacity-40 text-primary">
                              <Clock size={10} />
                              <p className="text-[8px] font-black uppercase tracking-tighter">
                                Conexión: {new Date(user.lastLogin).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Role: hide dropdown for SuperAdmin users */}
                        {user.isSuperAdmin ? (
                          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2">
                            <ShieldAlert size={13} className="text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">MASTER</span>
                          </div>
                        ) : (
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
                        )}
                        {user.status === 'PENDING' && !user.isSuperAdmin && (
                          <button 
                            onClick={() => activateUser(user.uid, user.role)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-xl font-black text-[10px] uppercase tracking-widest"
                            title="Activar acceso"
                          >
                            <UserPlus size={16} /> Activar
                          </button>
                        )}
                        {user.status === 'ACTIVE' && !user.isSuperAdmin && (
                          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase">
                            <CheckCircle size={12}/> Activo
                          </span>
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
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                            title="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => removeItem(isStudent ? item.id : item)}
                            className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                            title="Archivar/Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
          {/* MODAL DE EDICIÓN UNIVERSAL */}
          {editingItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-on-surface/40 animate-fade-in">
              <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 relative border border-white/20">
                <button onClick={() => setEditingItem(null)} className="absolute top-8 right-8 p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={24} />
                </button>

                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface mb-8">
                  Modificar {activeTab === 'students' ? 'Estudiante' : 'Elemento'}
                </h3>

                <div className="space-y-6">
                  {activeTab === 'students' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400">Nombres y Apellidos</label>
                        <div className="grid grid-cols-2 gap-4">
                           <input 
                             type="text" 
                             value={editingItem.primerNombre} 
                             onChange={(e) => setEditingItem({...editingItem, primerNombre: e.target.value.toUpperCase()})}
                             className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary"
                             placeholder="Primer Nombre"
                           />
                           <input 
                             type="text" 
                             value={editingItem.primerApellido} 
                             onChange={(e) => setEditingItem({...editingItem, primerApellido: e.target.value.toUpperCase()})}
                             className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary"
                             placeholder="Primer Apellido"
                           />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400">Grado</label>
                          <input 
                             type="text" 
                             value={editingItem.grado} 
                             onChange={(e) => setEditingItem({...editingItem, grado: e.target.value.toUpperCase()})}
                             className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary"
                           />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-slate-400">Curso</label>
                          <input 
                             type="text" 
                             value={editingItem.curso} 
                             onChange={(e) => setEditingItem({...editingItem, curso: e.target.value.toUpperCase()})}
                             className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold focus:ring-2 ring-primary"
                           />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400">Nombre / Valor</label>
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border-none rounded-2xl p-5 text-lg font-black focus:ring-2 ring-primary"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-10 flex gap-4">
                  <button 
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={saveEdit}
                    className="flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest bg-on-surface text-white hover:shadow-2xl transition-all"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </main>
      </div>
    </RoleGuard>
  );
}
