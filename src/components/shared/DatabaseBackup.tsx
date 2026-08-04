"use client";
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export default function DatabaseBackup({ backupData }: { backupData: any }) {
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    setLoading(true);
    try {
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_colegio_memoria_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert("✅ Backup JSON descargado con éxito desde la memoria.");
    } catch (e: any) {
      alert("❌ Error al descargar: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleBackup} 
      disabled={loading}
      className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg transition-all animate-pulse"
      title="Descargar copia de seguridad local (JSON)"
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
      {loading ? "Generando..." : "Descargar Backup DB (JSON)"}
    </button>
  );
}
