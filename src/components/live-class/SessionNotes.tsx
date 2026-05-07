"use client";

import { useState, useEffect } from "react";
import { FileText, Save } from "lucide-react";

export default function SessionNotes() {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [storageKey, setStorageKey] = useState("edu_session_notes_default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const subject = params.get("subject") || "general";
      const curso = params.get("curso") || "general";
      const key = `edu_notes_${subject}_${curso}`.replace(/\s+/g, "_").toLowerCase();
      setStorageKey(key);
      
      const saved = localStorage.getItem(key);
      if (saved) setNotes(saved);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    setSaving(true);
    localStorage.setItem(storageKey, val);
    
    // Debounce visual feedback
    const timer = setTimeout(() => setSaving(false), 800);
    return () => clearTimeout(timer);
  };

  return (
    <section className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex items-center gap-2">
        <FileText className="text-primary" size={20} />
        <h2 className="text-lg font-bold text-on-surface">Resumen de la Sesión</h2>
      </div>
      <div className="p-4">
        <textarea 
          value={notes}
          onChange={handleChange}
          className="w-full min-h-[150px] bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none resize-none mb-3 placeholder:text-outline" 
          placeholder="Escribe notas de la sesión, observaciones clave o incidentes aquí..."
        ></textarea>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Save size={16} className={saving ? "animate-pulse" : ""} />
          <span>{saving ? "Guardando..." : "Guardado automáticamente en esta clase"}</span>
        </div>
      </div>
    </section>
  );
}

