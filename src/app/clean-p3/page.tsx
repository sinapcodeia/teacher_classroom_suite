"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, deleteField } from "firebase/firestore";
import { useApp } from "@/context/AppContext";

export default function CleanP3() {
  const { students } = useApp();
  const [status, setStatus] = useState("Esperando...");
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const clearLocalStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("edu_students");
      setLogs(prev => [...prev, "✅ Caché local de estudiantes limpiado."]);
    }
  };

  const runCleanup = async () => {
    setStatus("Ejecutando limpieza en Firestore...");
    setLogs([]);
    try {
      const snap = await getDocs(collection(db, "students"));
      let fixedCount = 0;
      let checkedCount = 0;

      for (const studentDoc of snap.docs) {
        const data = studentDoc.data();
        checkedCount++;
        if (!data.detailedGrades) continue;

        const updates: Record<string, ReturnType<typeof deleteField>> = {};
        let hasP3 = false;

        for (const subjectId of Object.keys(data.detailedGrades)) {
          if (data.detailedGrades[subjectId]?.["p3"] !== undefined) {
            updates[`detailedGrades.${subjectId}.p3`] = deleteField();
            hasP3 = true;
          }
        }

        if (hasP3) {
          await updateDoc(doc(db, "students", studentDoc.id), updates);
          fixedCount++;
          const name = `${data.primerNombre || ""} ${data.primerApellido || ""}`.trim();
          setLogs(prev => [...prev, `🗑️ Limpiado P3 de: ${name || studentDoc.id}`]);
        }
      }

      // También limpiar localStorage
      clearLocalStorage();

      setStatus(`✅ Listo. Revisados: ${checkedCount} estudiantes. Corregidos: ${fixedCount}.`);
      setDone(true);
    } catch (e: any) {
      setStatus(`❌ Error: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-10 border border-slate-100">
        <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">
          🧹 Limpieza de Notas P3 Fantasma
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Este proceso elimina definitivamente las calificaciones que se colaron en el Periodo 3 de Firestore y limpia el caché local del navegador.
          Estudiantes cargados desde contexto: <strong>{students.length}</strong>
        </p>
        <div className="flex gap-3 mb-6">
          <button
            onClick={runCleanup}
            disabled={done}
            className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all disabled:opacity-50 shadow-lg shadow-rose-600/20"
          >
            Ejecutar Limpieza
          </button>
          <button
            onClick={clearLocalStorage}
            className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg"
          >
            Solo limpiar caché
          </button>
        </div>
        <p className={`font-mono text-sm mb-4 ${done ? "text-emerald-600" : "text-slate-600"}`}>{status}</p>
        <ul className="mt-2 text-xs font-mono space-y-1 max-h-60 overflow-y-auto">
          {logs.map((l, i) => <li key={i} className="text-slate-600">{l}</li>)}
        </ul>
      </div>
    </div>
  );
}
