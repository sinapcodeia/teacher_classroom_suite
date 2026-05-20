"use client";

export const dynamic = 'force-dynamic';

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { useApp } from "@/context/AppContext";
import { 
  Calendar, Clock, FileText, Plus, Search, 
  Filter, CheckCircle2, AlertTriangle, MessageSquare, 
  LayoutGrid, List, Sparkles, CalendarDays, Loader2
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function AgendaPage() {
  const { agendaNotes, addAgendaNote, updateAgendaNote, profile, subjects } = useApp();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");

  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    type: "GENERAL" as "TASK" | "NO_CLASS" | "GENERAL",
    date: new Date().toISOString().split('T')[0],
    course: "GENERAL",
    grade: "",
    subject: "INSTITUCIONAL"
  });

  const filteredNotes = useMemo(() => {
    return agendaNotes
      .filter(n => {
        const matchesSearch = (n.content || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (n.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "ALL" || n.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [agendaNotes, searchTerm, filterType]);

  const handleAddNote = async () => {
    if (!newNote.content.trim()) return alert("Por favor escribe el contenido de la nota.");
    await addAgendaNote({
      ...newNote,
      isCompleted: false
    });
    setIsAdding(false);
    setNewNote({
      title: "",
      content: "",
      type: "GENERAL",
      date: new Date().toISOString().split('T')[0],
      course: "GENERAL",
      grade: "",
      subject: "INSTITUCIONAL"
    });
  };

  const toggleComplete = async (note: any) => {
    await updateAgendaNote(note.id, { ...note, isCompleted: !note.isCompleted });
  };

  if (!mounted) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-surface-container-lowest font-inter">
      <TopAppBar />

      <main className="pt-24 px-4 md:px-8 max-w-6xl mx-auto w-full pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-on-surface tracking-tighter uppercase italic">Agenda Pedagógica</h1>
            <p className="text-[10px] font-black text-on-surface-variant opacity-60 uppercase tracking-[0.4em] flex items-center gap-2 mt-2">
              <CalendarDays size={14} className="text-primary" /> Bitácora de Sesiones y Eventos Especiales
            </p>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-8 py-4 bg-primary text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-all flex items-center gap-3"
          >
            <Plus size={20} /> Registrar Evento o Nota
          </button>
        </div>

        {/* Stats & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
           <div className="md:col-span-3 bg-white p-4 rounded-[2rem] border border-outline-variant shadow-lg flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-40" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar en la bitácora..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full h-14 pl-12 pr-6 bg-surface-container-low rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2 w-full md:w-auto">
                {["ALL", "GENERAL", "NO_CLASS", "TASK"].map(type => (
                  <button 
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`flex-1 min-w-[80px] md:flex-none px-3 md:px-5 py-3 rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-primary text-white shadow-lg' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'}`}
                  >
                    {type === 'ALL' ? 'Todos' : type === 'NO_CLASS' ? 'Excepciones' : type}
                  </button>
                ))}
              </div>
           </div>
           <div className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] flex flex-col justify-center items-center text-center">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Total Registros</p>
              <p className="text-3xl font-black text-on-surface">{filteredNotes.length}</p>
           </div>
        </div>

        {/* Notes Grid/List */}
        <div className="grid grid-cols-1 gap-6">
            {filteredNotes.length === 0 ? (
              <div 
                className="py-20 flex flex-col items-center gap-4 text-on-surface-variant opacity-30 animate-fade-in-up"
              >
                <FileText size={64} strokeWidth={1} />
                <p className="text-sm font-black uppercase tracking-widest italic text-center">No hay registros que coincidan con tu búsqueda</p>
              </div>
            ) : (
              filteredNotes.map((note, idx) => (
                <div 
                  key={note.id || idx}
                  className={`relative bg-white border border-outline-variant p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all group overflow-hidden animate-fade-in-up ${note.isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`absolute top-0 left-0 w-2 h-full ${note.type === 'NO_CLASS' ? 'bg-rose-500' : note.type === 'TASK' ? 'bg-amber-500' : 'bg-primary'}`} />
                  
                  <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
                    <div className="flex-1 space-y-4">
                       <div className="flex flex-wrap items-center gap-3">
                           <span className="text-[10px] font-black bg-surface-container px-3 py-1.5 rounded-lg flex items-center gap-2">
                             <Clock size={12} /> {new Date(note.date + "T12:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${note.type === 'NO_CLASS' ? 'bg-rose-50 text-rose-600' : note.type === 'TASK' ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                             {note.type === 'NO_CLASS' ? 'EXCEPCIÓN DE JORNADA' : note.type === 'TASK' ? 'TAREA PENDIENTE' : 'REGISTRO GENERAL'}
                          </span>
                          <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg uppercase">
                             {note.subject} {note.grade ? `· GRADO ${note.grade}` : ''} {note.course ? `· CURSO ${note.course}` : ''}
                          </span>
                       </div>

                       <p className="text-sm md:text-base font-bold text-on-surface leading-relaxed uppercase">
                          {note.content}
                       </p>
                    </div>

                    <div className="flex gap-2">
                       <button 
                        onClick={() => toggleComplete(note)}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${note.isCompleted ? 'bg-emerald-500 text-white' : 'bg-surface-container hover:bg-emerald-50 text-on-surface-variant hover:text-emerald-600'}`}
                       >
                          <CheckCircle2 size={24} />
                       </button>
                    </div>
                  </div>
                </div>
              ))
            )}
        </div>

        {isAdding && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
              onClick={() => setIsAdding(false)} 
            />
            <div 
              className="relative bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-3xl z-10 overflow-hidden animate-fade-in-up"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles size={120} />
              </div>
              
              <h2 className="text-2xl font-black text-on-surface tracking-tighter uppercase italic mb-8">Registrar en Bitácora</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Tipo de Evento</label>
                    <select 
                      value={newNote.type}
                      onChange={e => setNewNote({...newNote, type: e.target.value as any})}
                      className="w-full h-14 bg-surface-container-low border-2 border-outline-variant rounded-2xl px-5 text-[11px] font-black uppercase outline-none focus:border-primary transition-all"
                    >
                      <option value="GENERAL">NOTA GENERAL / BITÁCORA</option>
                      <option value="NO_CLASS">EXCEPCIÓN (CLASE CANCELADA/CORTA)</option>
                      <option value="TASK">TAREA O ACTIVIDAD PENDIENTE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Fecha</label>
                    <input 
                      type="date"
                      value={newNote.date}
                      onChange={e => setNewNote({...newNote, date: e.target.value})}
                      className="w-full h-14 bg-surface-container-low border-2 border-outline-variant rounded-2xl px-5 text-[11px] font-black outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Materia (Opcional)</label>
                    <select 
                      value={newNote.subject}
                      onChange={e => setNewNote({...newNote, subject: e.target.value})}
                      className="w-full h-14 bg-surface-container-low border-2 border-outline-variant rounded-2xl px-5 text-[11px] font-black uppercase outline-none focus:border-primary transition-all"
                    >
                      <option value="INSTITUCIONAL">TODAS / INSTITUCIONAL</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Grado (Opcional)</label>
                    <input 
                      type="text"
                      placeholder="Ej: 6°"
                      value={newNote.grade || ""}
                      onChange={e => setNewNote({...newNote, grade: e.target.value})}
                      className="w-full h-14 bg-surface-container-low border-2 border-outline-variant rounded-2xl px-5 text-[11px] font-black uppercase outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Curso (Opcional)</label>
                    <input 
                      type="text"
                      placeholder="Ej: 8-3 o TODOS"
                      value={newNote.course}
                      onChange={e => setNewNote({...newNote, course: e.target.value})}
                      className="w-full h-14 bg-surface-container-low border-2 border-outline-variant rounded-2xl px-5 text-[11px] font-black uppercase outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Descripción de la Actividad o Novedad</label>
                  <textarea 
                    rows={4}
                    value={newNote.content}
                    onChange={e => setNewNote({...newNote, content: e.target.value})}
                    placeholder="Describe qué sucedió hoy o qué actividad se realizó fuera del aula..."
                    className="w-full bg-surface-container-low border-2 border-outline-variant rounded-[2rem] p-6 text-sm font-bold outline-none focus:border-primary transition-all uppercase"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 bg-surface-container text-on-surface-variant rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-surface-container-high transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                    onClick={handleAddNote}
                    className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/30 hover:scale-[1.02] transition-all"
                   >
                     Guardar en Agenda
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      <BottomNavBar />
    </div>
  );
}
