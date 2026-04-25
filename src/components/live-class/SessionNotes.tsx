"use client";

import { useState, useEffect } from "react";
import { FileText, Save } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function SessionNotes() {
  const { sessionNotes, setSessionNotes } = useApp();
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSessionNotes(e.target.value);
    setSaving(true);
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
          value={sessionNotes}
          onChange={handleChange}
          className="w-full min-h-[150px] bg-surface-container-low border border-outline-variant rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary outline-none resize-none mb-3 placeholder:text-outline" 
          placeholder="Escribe notas de la sesión, observaciones clave o incidentes aquí..."
        ></textarea>
        <div className="flex items-center gap-2 text-xs text-secondary">
          <Save size={16} className={saving ? "animate-pulse" : ""} />
          <span>{saving ? "Guardando..." : "Guardado automáticamente en local"}</span>
        </div>
      </div>
    </section>
  );
}
