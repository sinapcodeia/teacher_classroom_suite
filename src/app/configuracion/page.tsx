"use client";

import { useState, useRef } from "react";
import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { useApp } from "@/context/AppContext";
import { 
  User, School, MapPin, Calculator, Book, Trash2, 
  Plus, Camera, CheckCircle, Edit3, Save, ChevronDown, ShieldCheck
} from "lucide-react";

export default function ConfigurationPage() {
  const { profile, setProfile, subjects, addSubject, updateSubject, deleteSubject, masterData } = useApp();
  
  const [activeSection, setActiveSection] = useState("personal");
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formSubject, setFormSubject] = useState({ name: "", courses: "" });

  const personalRef = useRef<HTMLDivElement>(null);
  const institutionRef = useRef<HTMLDivElement>(null);
  const subjectsRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, section: string) => {
    setActiveSection(section);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSaveProfile = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 1000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormSubject({ name: masterData.subjects[0] || "", courses: masterData.grades[0] || "" });
    setShowModal(true);
  };

  const openEditModal = (subject: any) => {
    setEditingId(subject.id);
    setFormSubject({ name: subject.name, courses: subject.courses });
    setShowModal(true);
  };

  const handleSubjectSubmit = () => {
    if (!formSubject.name || !formSubject.courses) return;

    if (editingId) {
      updateSubject(editingId, { 
        name: formSubject.name, 
        courses: formSubject.courses 
      });
    } else {
      addSubject({ 
        name: formSubject.name, 
        courses: formSubject.courses, 
        color: "#00288e" 
      });
    }
    setShowModal(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopAppBar />
      
      <main className="pt-20 px-6 max-w-4xl mx-auto w-full space-y-8 pb-24 md:pb-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-1 tracking-tighter uppercase">Mi Perfil Profesional</h1>
            <p className="text-on-surface-variant text-sm font-medium">Configura tu carga académica utilizando los datos validados por el sistema.</p>
          </div>
          <button onClick={handleSaveProfile} disabled={isSaving} className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
            {isSaving ? <span className="animate-spin text-lg">◌</span> : <Save size={18} />}
            {isSaving ? "Guardando..." : "Guardar Perfil"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <aside className="hidden md:block md:col-span-3 sticky top-24">
            <nav className="flex flex-col gap-2">
              <div className="flex items-center gap-3 p-4 mb-4 bg-surface-container rounded-xl border border-outline-variant/30 shadow-inner">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                  {profile.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-on-surface truncate uppercase">{profile.name}</p>
                  <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-tighter">ID Verificado</p>
                </div>
              </div>
              
              <button onClick={() => scrollTo(personalRef, "personal")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === "personal" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-low"}`}>
                <User size={18} /> Información
              </button>
              <button onClick={() => scrollTo(institutionRef, "institution")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === "institution" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-low"}`}>
                <School size={18} /> Institución
              </button>
              <button onClick={() => scrollTo(subjectsRef, "subjects")} className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === "subjects" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-on-surface-variant hover:bg-surface-container-low"}`}>
                <Calculator size={18} /> Materias
              </button>
            </nav>
          </aside>

          <div className="md:col-span-9 space-y-8">
            <section ref={personalRef} className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">1</div>
                <h3 className="text-lg font-bold text-on-surface uppercase">Validación de Identidad</h3>
              </div>
              
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative group mx-auto md:mx-0">
                  <div className="w-32 h-32 rounded-full bg-surface-container border-2 border-dashed border-outline-variant flex flex-col items-center justify-center overflow-hidden transition-all hover:border-primary">
                    <Camera size={32} className="text-outline-variant group-hover:text-primary" />
                  </div>
                  <button className="absolute bottom-1 right-1 bg-primary text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"><Plus size={16} /></button>
                </div>
                
                <div className="flex-1 w-full space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-primary ml-1 uppercase tracking-widest">Seleccionar Docente (Base de Datos)</label>
                    <div className="relative">
                      <select 
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full h-14 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-bold appearance-none cursor-pointer uppercase"
                      >
                        {masterData.teachers.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={20} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-primary ml-1 uppercase tracking-widest">Correo de Contacto</label>
                    <input 
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full h-14 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium" 
                    />
                  </div>
                </div>
              </div>
            </section>

            <section ref={institutionRef} className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">2</div>
                <h3 className="text-lg font-bold text-on-surface uppercase">Ubicación Institucional</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-primary ml-1 uppercase tracking-widest">Colegio / Institución</label>
                  <input value={profile.institution} disabled className="w-full h-14 px-4 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-sm font-bold opacity-60 uppercase" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-primary ml-1 uppercase tracking-widest">Localidad</label>
                  <input value={profile.location} disabled className="w-full h-14 px-4 rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant text-sm font-bold opacity-60 uppercase" />
                </div>
              </div>
              <p className="mt-4 text-[10px] text-on-surface-variant font-bold uppercase tracking-widest flex items-center gap-1.5 opacity-50">
                 <ShieldCheck size={12} /> Los datos institucionales son gestionados centralmente
              </p>
            </section>

            <section ref={subjectsRef} className="bg-white border border-outline-variant rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-bold">3</div>
                  <h3 className="text-lg font-bold text-on-surface uppercase">Carga Académica</h3>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-95 uppercase tracking-tighter">
                  <Plus size={16} /> Añadir Materia
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {subjects.map((s) => (
                  <div key={s.id} className="group flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-surface-container-low rounded-2xl border border-outline-variant gap-4 hover:bg-surface-container-lowest transition-all">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white text-primary rounded-xl border border-outline-variant/30 shadow-sm">
                        <Book size={22} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface tracking-tight uppercase">{s.name}</p>
                        <p className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md mt-1 w-fit uppercase">{s.courses}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-0 pt-3 md:pt-0 border-outline-variant/30">
                      <button onClick={() => openEditModal(s)} className="p-2.5 text-primary hover:bg-primary/10 rounded-xl transition-colors"><Edit3 size={18} /></button>
                      <button onClick={() => deleteSubject(s.id)} className="p-2.5 text-error hover:bg-error/10 rounded-xl transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-300 border border-outline-variant/30">
            <h3 className="text-2xl font-black text-on-surface tracking-tighter uppercase">{editingId ? "EDITAR MATERIA" : "NUEVA MATERIA"}</h3>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest ml-1">Materia Valida</label>
                <div className="relative">
                  <select 
                    value={formSubject.name}
                    onChange={(e) => setFormSubject({...formSubject, name: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl border border-outline-variant bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary font-bold text-sm appearance-none cursor-pointer uppercase"
                  >
                    {masterData.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={20} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-primary uppercase tracking-widest ml-1">Grado / Curso Valido</label>
                <div className="relative">
                  <select 
                    value={formSubject.courses}
                    onChange={(e) => setFormSubject({...formSubject, courses: e.target.value})}
                    className="w-full h-14 px-4 rounded-2xl border border-outline-variant bg-surface-container-lowest outline-none focus:ring-2 focus:ring-primary font-bold text-sm appearance-none cursor-pointer uppercase"
                  >
                    {masterData.grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none" size={20} />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-on-surface-variant font-black text-xs uppercase tracking-widest">Cancelar</button>
              <button onClick={handleSubjectSubmit} className="flex-1 py-4 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                {editingId ? "Actualizar" : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showToast && (
        <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 md:left-12 md:translate-x-0 z-[110] bg-on-surface text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 border border-white/10">
          <div className="bg-secondary rounded-full p-1.5"><CheckCircle size={20} className="text-white" /></div>
          <div>
            <span className="text-sm font-bold block uppercase tracking-tight">¡Perfil Sincronizado!</span>
            <span className="text-[10px] opacity-60 font-medium uppercase">Tus datos maestros han sido actualizados.</span>
          </div>
        </div>
      )}

      <BottomNavBar />
    </div>
  );
}
