"use client";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc, deleteField } from "firebase/firestore";

export default function CleanP3() {
  const [status, setStatus] = useState("Idle");
  const [logs, setLogs] = useState<string[]>([]);

  const runCleanup = async () => {
    setStatus("Running...");
    try {
      const snap = await getDocs(collection(db, "students"));
      let fixedCount = 0;
      for (const studentDoc of snap.docs) {
        const data = studentDoc.data();
        if (!data.detailedGrades) continue;
        
        const updates: any = {};
        let hasP3 = false;
        
        for (const subjectId of Object.keys(data.detailedGrades)) {
          if (data.detailedGrades[subjectId] && data.detailedGrades[subjectId]["p3"]) {
            updates[`detailedGrades.${subjectId}.p3`] = deleteField();
            hasP3 = true;
          }
        }
        
        if (hasP3) {
          await updateDoc(doc(db, "students", studentDoc.id), updates);
          fixedCount++;
          setLogs(prev => [...prev, `Fixed student: ${data.primerNombre} ${data.primerApellido}`]);
        }
      }
      setStatus(`Done! Fixed ${fixedCount} students.`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-10 font-sans">
      <h1 className="text-2xl font-bold mb-4">P3 Ghost Grades Cleanup</h1>
      <button 
        onClick={runCleanup} 
        className="px-4 py-2 bg-rose-600 text-white rounded font-bold mb-4"
      >
        Run Cleanup
      </button>
      <p className="font-mono">{status}</p>
      <ul className="mt-4 text-sm font-mono">
        {logs.map((l, i) => <li key={i}>{l}</li>)}
      </ul>
    </div>
  );
}
