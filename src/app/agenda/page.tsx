"use client";

export const dynamic = 'force-dynamic';

import TopAppBar from "@/components/layout/TopAppBar";
import BottomNavBar from "@/components/layout/BottomNavBar";
import { useApp } from "@/context/AppContext";
import { 
  Calendar, Clock, FileText, Plus, Search, 
  Filter, CheckCircle2, AlertTriangle, MessageSquare, 
  LayoutGrid, List, Sparkles, CalendarDays, Loader2,
  TrendingUp, CheckCircle, Circle, ChevronRight, Bookmark, 
  FolderKanban, Kanban, Activity, HelpCircle, User, BookOpen
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

type ViewMode = "timeline" | "kanban" | "weekly";

export default function AgendaPage() {
  const { agendaNotes, addAgendaNote, updateAgendaNote, clearAllAgendaNotes, clearPendingTasks, clearAllTasks, profile, subjects } = useApp();
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>("ALL"); // "ALL", "TODAY", "WEEK", "MONTH"
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("ALL"); // "ALL" or specific grade
  const [showCompletedTimeline, setShowCompletedTimeline] = useState<boolean>(false);

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

  // Calculate unique grades present in notes for filtering
  const uniqueGrades = useMemo(() => {
    const grades = new Set<string>();
    agendaNotes.forEach(n => {
      if (n.grade) grades.add(n.grade.trim().toUpperCase());
    });
    return Array.from(grades).sort();
  }, [agendaNotes]);

  // Sincronización y filtrado de notas avanzado
  const filteredNotes = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return agendaNotes
      .filter(n => {
        // Buscador de texto
        const matchesSearch = (n.content || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (n.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (n.course || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (n.grade || "").toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filtro por tipo de evento
        const matchesType = filterType === "ALL" || n.type === filterType;
        
        // Filtro por Grado
        const matchesGrade = selectedGradeFilter === "ALL" || 
                             (n.grade && n.grade.trim().toUpperCase() === selectedGradeFilter);

        // Filtro por rango de fecha
        let matchesDate = true;
        if (selectedDateFilter !== "ALL") {
          const noteDate = new Date(n.date + "T12:00:00");
          noteDate.setHours(0,0,0,0);
          
          if (selectedDateFilter === "TODAY") {
            matchesDate = noteDate.getTime() === today.getTime();
          } else if (selectedDateFilter === "WEEK") {
            const diffTime = Math.abs(today.getTime() - noteDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            matchesDate = diffDays <= 7;
          } else if (selectedDateFilter === "MONTH") {
            matchesDate = noteDate.getMonth() === today.getMonth() && noteDate.getFullYear() === today.getFullYear();
          }
        }
        
        return matchesSearch && matchesType && matchesGrade && matchesDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [agendaNotes, searchTerm, filterType, selectedGradeFilter, selectedDateFilter]);

  // Dividir notas filtradas para el Timeline (Activas vs Ejecutadas)
  const activeTimelineNotes = useMemo(() => {
    return filteredNotes.filter(n => n.type !== "TASK" || !n.isCompleted);
  }, [filteredNotes]);

  const completedTimelineTasks = useMemo(() => {
    return filteredNotes.filter(n => n.type === "TASK" && n.isCompleted);
  }, [filteredNotes]);

  // Estadísticas del mes / periodo
  const stats = useMemo(() => {
    const total = agendaNotes.length;
    const tasks = agendaNotes.filter(n => n.type === "TASK");
    const completedTasks = tasks.filter(n => n.isCompleted);
    const exceptions = agendaNotes.filter(n => n.type === "NO_CLASS").length;
    const general = agendaNotes.filter(n => n.type === "GENERAL").length;
    
    return {
      total,
      tasksCount: tasks.length,
      tasksPending: tasks.length - completedTasks.length,
      tasksCompleted: completedTasks.length,
      exceptions,
      general,
      taskCompletionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 100
    };
  }, [agendaNotes]);

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
    <div className="flex flex-col min-h-screen bg-slate-50/50 text-slate-800 font-inter antialiased">
      <TopAppBar />

      <main className="pt-28 px-4 md:px-8 max-w-7xl mx-auto w-full pb-36">
        
        {/* Modern Startup Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 rounded-[2.5rem] p-8 md:p-12 shadow-2xl mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group">
          {/* Neon Background Blobs */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/10 animate-pulse">
              <Sparkles size={12} className="text-yellow-300" /> Agenda Inteligente
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none italic uppercase">
              Bitácora & Tareas
            </h1>
            <p className="text-white/80 text-xs md:text-sm font-medium max-w-xl">
              Plataforma institucional para el seguimiento pedagógico de novedades, tareas asignadas y excepciones académicas de la mallas de la comunidad Awá.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 flex-wrap justify-end">
            {agendaNotes.filter(n => n.type === "TASK" && !n.isCompleted).length > 0 && (
              <button 
                onClick={async () => {
                  if (confirm("¿Estás seguro de que deseas eliminar TODAS las tareas pendientes? Esta acción es irreversible.")) {
                    await clearPendingTasks();
                  }
                }}
                className="px-6 py-4.5 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 border border-amber-500/30 backdrop-blur-md cursor-pointer"
              >
                Eliminar Pendientes
              </button>
            )}
            {agendaNotes.filter(n => n.type === "TASK").length > 0 && (
              <button 
                onClick={async () => {
                  if (confirm("¿Estás seguro de que deseas eliminar ABSOLUTAMENTE TODAS LAS TAREAS (pendientes y completadas)? Esta acción es irreversible.")) {
                    await clearAllTasks();
                  }
                }}
                className="px-6 py-4.5 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 border border-rose-500/30 backdrop-blur-md cursor-pointer"
              >
                Eliminar Todas las Tareas
              </button>
            )}
            {agendaNotes.length > 0 && (
              <button 
                onClick={async () => {
                  if (confirm("¿Estás seguro de que deseas limpiar todo el historial de la agenda (incluyendo bitácoras y excepciones)? Esta acción es irreversible.")) {
                    await clearAllAgendaNotes();
                  }
                }}
                className="px-6 py-4.5 bg-white/10 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md cursor-pointer"
              >
                Limpiar Todo
              </button>
            )}
            <button 
              onClick={() => setIsAdding(true)}
              className="px-8 py-4.5 bg-white text-blue-700 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-white"
            >
              <Plus size={18} strokeWidth={3} /> Registrar Evento o Nota
            </button>
          </div>
        </div>

        {/* Premium SaaS Metrics Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tareas Pendientes</span>
              <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><Clock size={16} /></div>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-800">{stats.tasksPending}</p>
              <p className="text-[9px] text-amber-600 font-bold uppercase mt-1">Por completar en el aula</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa de Entrega</span>
              <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><TrendingUp size={16} /></div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black tracking-tight text-slate-800">{stats.taskCompletionRate}%</p>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.taskCompletionRate}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clases Canceladas</span>
              <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><AlertTriangle size={16} /></div>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-800">{stats.exceptions}</p>
              <p className="text-[9px] text-rose-500 font-bold uppercase mt-1">Jornadas Especiales</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Registros</span>
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"><FileText size={16} /></div>
            </div>
            <div>
              <p className="text-3xl font-black tracking-tight text-slate-800">{stats.total}</p>
              <p className="text-[9px] text-blue-600 font-bold uppercase mt-1">En historial completo</p>
            </div>
          </div>
        </div>

        {/* View Switches & Advanced Filters Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-lg mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
            
            {/* View Mode Toggle Button Group */}
            <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200/60 shrink-0">
              <button
                onClick={() => setViewMode("timeline")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${viewMode === "timeline" ? "bg-white text-slate-800 shadow-md scale-102" : "text-slate-500 hover:text-slate-800"}`}
              >
                <List size={14} /> Línea de Tiempo
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${viewMode === "kanban" ? "bg-white text-slate-800 shadow-md scale-102" : "text-slate-500 hover:text-slate-800"}`}
              >
                <Kanban size={14} /> Vista Tablero (SaaS)
              </button>
            </div>

            {/* Main Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por descripción, materia, curso o grado..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-11 pr-5 bg-slate-50 rounded-2xl border-none text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Quick-filter Pills Row */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-2">Tipo:</span>
              {[
                { type: "ALL", label: "Todos" },
                { type: "GENERAL", label: "Bitácora / General" },
                { type: "TASK", label: "Tareas" },
                { type: "NO_CLASS", label: "Excepciones" }
              ].map(item => (
                <button 
                  key={item.type}
                  onClick={() => setFilterType(item.type)}
                  className={`px-4 py-2 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${filterType === item.type ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Date Filters */}
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-1">Rango:</span>
                <select
                  value={selectedDateFilter}
                  onChange={e => setSelectedDateFilter(e.target.value)}
                  className="bg-slate-100 border-none outline-none rounded-xl px-3 py-2 text-[9px] font-black uppercase text-slate-600 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">Todo el Historial</option>
                  <option value="TODAY">Hoy</option>
                  <option value="WEEK">Últimos 7 días</option>
                  <option value="MONTH">Este Mes</option>
                </select>
              </div>

              {/* Grade Filters */}
              {uniqueGrades.length > 0 && (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider mr-1">Grado:</span>
                  <select
                    value={selectedGradeFilter}
                    onChange={e => setSelectedGradeFilter(e.target.value)}
                    className="bg-slate-100 border-none outline-none rounded-xl px-3 py-2 text-[9px] font-black uppercase text-slate-600 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ALL">Todos los Grados</option>
                    {uniqueGrades.map(g => (
                      <option key={g} value={g}>Grado {g}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic View Section */}
        {filteredNotes.length === 0 ? (
          <div className="py-24 bg-white border border-slate-200/80 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 text-slate-400 shadow-md">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center animate-bounce">
              <FileText size={28} />
            </div>
            <div className="text-center space-y-1 max-w-sm px-4">
              <p className="text-sm font-black uppercase tracking-widest text-slate-700 italic">Sin registros coincidentes</p>
              <p className="text-xs text-slate-500 font-medium">Prueba a ajustar tus filtros rápidos o el término de búsqueda para ver otras notas de la agenda.</p>
            </div>
          </div>
        ) : viewMode === "timeline" ? (
          
          /* ==============================================================
             TIMELINE VIEW (Premium SaaS Changelog Feed)
             ============================================================== */
          <div className="space-y-10">
            {/* Active & Pending Agenda Items Timeline */}
            {activeTimelineNotes.length === 0 ? (
              <div className="py-12 bg-white border border-slate-200/80 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-slate-400 shadow-md text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-pulse" />
                <p className="text-xs font-black uppercase text-slate-700 tracking-wider">¡Todo al día!</p>
                <p className="text-[10px] text-slate-500 max-w-xs font-medium">No tienes bitácoras activas ni tareas pendientes para este filtro.</p>
              </div>
            ) : (
              <div className="relative pl-6 md:pl-10 space-y-8 before:absolute before:top-4 before:left-2 md:before:left-4 before:w-[3px] before:h-[95%] before:bg-gradient-to-b before:from-blue-600 before:via-indigo-500 before:to-slate-200 animate-in fade-in duration-300">
                {activeTimelineNotes.map((note, idx) => {
                  const noteDate = new Date(note.date + "T12:00:00");
                  const isTask = note.type === "TASK";
                  const isNoClass = note.type === "NO_CLASS";
                  
                  return (
                    <div 
                      key={note.id || idx}
                      className="relative group transition-all duration-300"
                    >
                      {/* Timeline bullet element */}
                      <span className={`absolute -left-[30px] md:-left-[46px] top-1.5 w-[15px] h-[15px] rounded-full border-[3px] bg-white transition-all duration-300 group-hover:scale-125 z-10 ${
                        isNoClass ? 'border-rose-500 ring-4 ring-rose-50' : 
                        isTask ? 'border-amber-500 ring-4 ring-amber-50' : 
                        'border-blue-600 ring-4 ring-blue-50'
                      }`} />

                      {/* Card content container */}
                      <div className="bg-white border border-slate-200/80 p-6 md:p-8 rounded-[2rem] shadow-md hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col md:flex-row justify-between gap-6 items-start relative overflow-hidden">
                        
                        {/* Background glows */}
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-10 pointer-events-none ${
                          isNoClass ? 'bg-rose-500' : isTask ? 'bg-amber-500' : 'bg-blue-600'
                        }`} />

                        <div className="flex-1 space-y-4">
                          {/* Meta badge line */}
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-200/50">
                              <Calendar size={12} className="text-slate-400" />
                              {noteDate.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider border ${
                              isNoClass ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                              isTask ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                              'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                              {isNoClass ? 'Excepción de Jornada' : isTask ? 'Tarea Pendiente' : 'Registro Bitácora'}
                            </span>

                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl uppercase border border-indigo-100">
                              {note.subject}
                            </span>

                            {(note.grade || note.course) && (
                              <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-xl uppercase border border-slate-200/50">
                                {note.grade ? `Grado ${note.grade}` : ''} {note.course ? `· ${note.course}` : ''}
                              </span>
                            )}
                          </div>

                          {/* Main agenda description */}
                          <p className="text-[13px] sm:text-[14px] md:text-[15px] font-bold text-slate-800 leading-relaxed uppercase select-text">
                            {note.content}
                          </p>
                        </div>

                        {/* Interactive Completion Trigger */}
                        {isTask && (
                          <div className="shrink-0 flex items-center self-stretch justify-end md:justify-center">
                            <button 
                              onClick={() => toggleComplete(note)}
                              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-wider transition-all duration-300 border-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                            >
                              <Circle size={14} strokeWidth={3} className="text-slate-400 group-hover:scale-110 transition-transform" /> Marcar Ejecutada
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Collapsible Completed Tasks Section */}
            {completedTimelineTasks.length > 0 && (
              <div className="border border-slate-200/60 bg-slate-100/30 rounded-[2.5rem] overflow-hidden transition-all duration-300 shadow-inner">
                <button
                  onClick={() => setShowCompletedTimeline(!showCompletedTimeline)}
                  className="w-full px-8 py-5 flex items-center justify-between hover:bg-slate-100/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm"><CheckCircle size={16} /></div>
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Historial de Tareas Ejecutadas</span>
                    <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">{completedTimelineTasks.length}</span>
                  </div>
                  <ChevronRight size={16} className={`text-slate-400 transition-transform duration-300 ${showCompletedTimeline ? 'rotate-90' : ''}`} />
                </button>

                {showCompletedTimeline && (
                  <div className="px-8 pb-8 pt-2 space-y-4 border-t border-slate-200/50 bg-white/50 animate-in slide-in-from-top-2 duration-300">
                    {completedTimelineTasks.map((note, idx) => {
                      const noteDate = new Date(note.date + "T12:00:00");
                      return (
                        <div key={note.id || idx} className="flex justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm opacity-75 hover:opacity-100 transition-all duration-200">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                                {noteDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="text-[8px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded uppercase">
                                {note.subject}
                              </span>
                              {note.grade && (
                                <span className="text-[8px] font-bold text-slate-400">
                                  Grado {note.grade} · {note.course}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-500 line-through uppercase">{note.content}</p>
                          </div>
                          <button
                            onClick={() => toggleComplete(note)}
                            className="h-max self-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={12} /> Deshacer
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          
          /* ==============================================================
             KANBAN BOARD VIEW (Startup Trello/Linear 4-column Board)
             ============================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-start animate-in fade-in duration-300">
            
            {/* Column 1: General Bitácoras */}
            <div className="bg-slate-100/60 p-5 rounded-[2rem] border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <Bookmark size={16} className="text-blue-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Bitácoras</h3>
                </div>
                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {filteredNotes.filter(n => n.type === "GENERAL").length}
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                {filteredNotes.filter(n => n.type === "GENERAL").map((note, idx) => (
                  <div key={note.id || idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:scale-101 transition-all duration-300 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {note.date}
                      </span>
                      <span className="text-[8px] font-black text-blue-600 uppercase">
                        {note.subject}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase leading-snug">
                      {note.content}
                    </p>
                    {note.grade && (
                      <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase block w-max">
                        Grado {note.grade} · {note.course}
                      </span>
                    )}
                  </div>
                ))}
                {filteredNotes.filter(n => n.type === "GENERAL").length === 0 && (
                  <div className="py-10 text-center text-[10px] text-slate-400 font-bold uppercase">Sin registros generales</div>
                )}
              </div>
            </div>

            {/* Column 2: Tareas Pendientes */}
            <div className="bg-slate-100/60 p-5 rounded-[2rem] border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <FolderKanban size={16} className="text-amber-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Tareas Pendientes</h3>
                </div>
                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse">
                  {filteredNotes.filter(n => n.type === "TASK" && !n.isCompleted).length}
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                {filteredNotes.filter(n => n.type === "TASK" && !n.isCompleted).map((note, idx) => (
                  <div key={note.id || idx} className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm hover:shadow-md hover:scale-101 transition-all duration-300 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {note.date}
                      </span>
                      <span className="text-[8px] font-black text-amber-600 uppercase">
                        {note.subject}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-700 uppercase leading-snug">
                      {note.content}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      {note.grade ? (
                        <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">
                          G: {note.grade} · C: {note.course}
                        </span>
                      ) : <span />}
                      <button 
                        onClick={() => toggleComplete(note)}
                        className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-all flex items-center gap-1"
                      >
                        <Circle size={10} /> Completar
                      </button>
                    </div>
                  </div>
                ))}
                {filteredNotes.filter(n => n.type === "TASK" && !n.isCompleted).length === 0 && (
                  <div className="py-10 text-center text-[10px] text-slate-400 font-bold uppercase">Sin tareas pendientes</div>
                )}
              </div>
            </div>

            {/* Column 3: Tareas Completadas / Ejecutadas */}
            <div className="bg-slate-100/60 p-5 rounded-[2rem] border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-emerald-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Tareas Ejecutadas</h3>
                </div>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  {filteredNotes.filter(n => n.type === "TASK" && n.isCompleted).length}
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                {filteredNotes.filter(n => n.type === "TASK" && n.isCompleted).map((note, idx) => (
                  <div key={note.id || idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm opacity-75 hover:opacity-100 transition-all duration-300 space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {note.date}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">
                        {note.subject}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 line-through uppercase leading-snug">
                      {note.content}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      {note.grade ? (
                        <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded uppercase">
                          G: {note.grade} · C: {note.course}
                        </span>
                      ) : <span />}
                      <button 
                        onClick={() => toggleComplete(note)}
                        className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase bg-emerald-500 text-white transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <CheckCircle2 size={10} /> Completada
                      </button>
                    </div>
                  </div>
                ))}
                {filteredNotes.filter(n => n.type === "TASK" && n.isCompleted).length === 0 && (
                  <div className="py-10 text-center text-[10px] text-slate-400 font-bold uppercase">Sin tareas ejecutadas</div>
                )}
              </div>
            </div>

            {/* Column 4: Excepciones de Jornada */}
            <div className="bg-slate-100/60 p-5 rounded-[2rem] border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <h3 className="text-[11px] font-black uppercase text-slate-600 tracking-wider">Excepciones</h3>
                </div>
                <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {filteredNotes.filter(n => n.type === "NO_CLASS").length}
                </span>
              </div>

              <div className="space-y-4 overflow-y-auto max-h-[600px] pr-1">
                {filteredNotes.filter(n => n.type === "NO_CLASS").map((note, idx) => (
                  <div key={note.id || idx} className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm hover:shadow-md hover:scale-101 transition-all duration-300 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {note.date}
                      </span>
                      <span className="text-[8px] font-black text-rose-600 uppercase">
                        {note.subject}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-rose-700 uppercase leading-snug">
                      {note.content}
                    </p>
                    {note.grade && (
                      <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase block w-max">
                        Grado {note.grade} · {note.course}
                      </span>
                    )}
                  </div>
                ))}
                {filteredNotes.filter(n => n.type === "NO_CLASS").length === 0 && (
                  <div className="py-10 text-center text-[10px] text-slate-400 font-bold uppercase">Sin novedades</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Agregar Registro a la Bitácora */}
        {isAdding && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div 
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" 
              onClick={() => setIsAdding(false)} 
            />
            <div 
              className="relative bg-white w-full max-w-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-300"
              style={{ border: "1px solid rgba(226,232,240,0.8)" }}
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Sparkles size={120} />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic mb-6">Registrar en Bitácora</h2>
              
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Evento</label>
                    <select 
                      value={newNote.type}
                      onChange={e => setNewNote({...newNote, type: e.target.value as any})}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-slate-600"
                    >
                      <option value="GENERAL">NOTA GENERAL / BITÁCORA</option>
                      <option value="NO_CLASS">EXCEPCIÓN (CLASE CANCELADA/CORTA)</option>
                      <option value="TASK">TAREA O ACTIVIDAD PENDIENTE</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                    <input 
                      type="date"
                      value={newNote.date}
                      onChange={e => setNewNote({...newNote, date: e.target.value})}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-[11px] font-black outline-none focus:border-blue-500 transition-all text-slate-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Materia</label>
                    <select 
                      value={newNote.subject}
                      onChange={e => setNewNote({...newNote, subject: e.target.value})}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:border-blue-500 transition-all text-slate-600"
                    >
                      <option value="INSTITUCIONAL">TODAS / INSTITUCIONAL</option>
                      {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grado</label>
                    <input 
                      type="text"
                      placeholder="Ej: 6°"
                      value={newNote.grade || ""}
                      onChange={e => setNewNote({...newNote, grade: e.target.value})}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-[11px] font-black uppercase outline-none focus:border-blue-500 transition-all text-slate-600 placeholder-slate-300"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curso</label>
                    <input 
                      type="text"
                      placeholder="Ej: 8-3 o TODOS"
                      value={newNote.course}
                      onChange={e => setNewNote({...newNote, course: e.target.value})}
                      className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 text-[11px] font-black uppercase outline-none focus:border-blue-500 transition-all text-slate-600 placeholder-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción de la Actividad o Novedad</label>
                  <textarea 
                    rows={4}
                    value={newNote.content}
                    onChange={e => setNewNote({...newNote, content: e.target.value})}
                    placeholder="Describe qué sucedió hoy o qué actividad se realizó fuera del aula..."
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-xs font-bold outline-none focus:border-blue-500 transition-all uppercase text-slate-700 placeholder-slate-300 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                   <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                    onClick={handleAddNote}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-98 transition-all"
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
