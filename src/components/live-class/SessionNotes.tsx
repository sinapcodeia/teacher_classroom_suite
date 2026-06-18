"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { FileText, Save, History, AlertCircle, Clock } from "lucide-react";
import { useApp } from "@/context/AppContext";

interface SessionNotesProps {
  subject: string;
  course: string;
}

export default function SessionNotes({ subject, course }: SessionNotesProps) {
  const { agendaNotes, addAgendaNote, updateAgendaNote } = useApp();
  const [currentNote, setCurrentNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState<string | null>(null);

  // Buscar si ya existe una nota para hoy, este curso y esta materia
  const todayStr = new Date().toISOString().slice(0, 10);
  
  const existingNote = useMemo(() => {
    return agendaNotes.find(n => 
      n.date === todayStr && 
      n.course === course && 
      n.subject === subject
    );
  }, [agendaNotes, todayStr, course, subject]);

  // Historial de notas para este curso y materia (excluyendo la de hoy)
  const historyNotes = useMemo(() => {
    return agendaNotes
      .filter(n => n.course === course && n.subject === subject && n.date !== todayStr)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, [agendaNotes, course, subject, todayStr]);

  const [isDirty, setIsDirty] = useState(false);
  const prevKey = useRef("");
  const currentKey = `${subject}-${course}-${todayStr}`;

  // Reset dirty lock and load initial note content when class/date changes
  useEffect(() => {
    if (prevKey.current !== currentKey) {
      prevKey.current = currentKey;
      setIsDirty(false);
      const dbContent = existingNote?.content || "";
      setCurrentNote(dbContent);
      setLastSavedContent(dbContent);
    }
  }, [currentKey, existingNote, lastSavedContent]);

  // Sync with Firestore content on initial load, only if user hasn't edited (not dirty)
  useEffect(() => {
    if (!isDirty && existingNote) {
      const dbContent = existingNote.content || "";
      if (dbContent !== currentNote) {
        setCurrentNote(dbContent);
        setLastSavedContent(dbContent);
      }
    }
  }, [existingNote, isDirty, currentNote]);

  const handleSave = async (content: string) => {
    setCurrentNote(content);
    setIsDirty(true);
    setLastSavedContent(content);
    setSaving(true);
    
    try {
      if (existingNote) {
        await updateAgendaNote(existingNote.id, { content });
      } else if (content.trim() !== "") {
        await addAgendaNote({
          date: todayStr,
          course: course,
          subject: subject,
          type: "GENERAL",
          content: content,
          isCompleted: false
        });
      }
    } catch (err) {
      console.error("Error saving note:", err);
    } finally {
      setSaving(false);
    }
  };

  // Debounce for auto-saving
  useEffect(() => {
    const timer = setTimeout(() => {
      const dbVal = existingNote?.content || "";
      if (currentNote !== dbVal) {
        handleSave(currentNote);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentNote, existingNote]);

  return (
    <section className="flex flex-col gap-4">
      <div className="bg-white border border-outline-variant rounded-[2rem] shadow-xl overflow-hidden transition-all">
        <div className="p-6 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm font-black text-on-surface uppercase tracking-tighter italic">Bitácora de Sesión</h2>
              <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-60">Notas acumulativas de hoy</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded-xl transition-all ${showHistory ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            title="Ver Historial"
          >
            <History size={18} />
          </button>
        </div>

        <div className="p-6">
          <textarea 
            value={currentNote}
            onChange={(e) => {
              setCurrentNote(e.target.value);
              setIsDirty(true);
            }}
            className="w-full min-h-[120px] bg-slate-50 border border-outline-variant rounded-2xl p-5 text-xs font-medium focus:ring-2 focus:ring-primary outline-none resize-none mb-4 placeholder:text-slate-400 leading-relaxed shadow-inner" 
            placeholder="Escribe observaciones de la clase, incidentes o recordatorios..."
          ></textarea>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <Save size={14} className={saving ? "animate-pulse text-primary" : ""} />
              <span>{saving ? "Sincronizando..." : "Sincronizado en la nube"}</span>
            </div>
            
            <button 
              onClick={() => {
                const alertText = prompt("Ingresa una alerta rápida (ej: Estudiante nueva no en lista):");
                if (alertText) {
                  const newContent = currentNote ? `${currentNote}\n\n[ALERTA]: ${alertText}` : `[ALERTA]: ${alertText}`;
                  handleSave(newContent);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100 hover:bg-rose-100 transition-all"
            >
              <AlertCircle size={14} />
              Registrar Alerta
            </button>
          </div>
        </div>

        {showHistory && (
          <div className="p-6 bg-slate-50 border-t border-outline-variant animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={16} className="text-slate-400" />
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Historial Reciente ({course})</h3>
            </div>
            
            {historyNotes.length === 0 ? (
              <p className="text-[10px] italic text-slate-400 text-center py-4">No hay registros previos para este grupo.</p>
            ) : (
              <div className="space-y-4">
                {historyNotes.map((note) => (
                  <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black text-primary uppercase">{new Date(note.date + "T12:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                      <span className="text-[8px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{note.type}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
