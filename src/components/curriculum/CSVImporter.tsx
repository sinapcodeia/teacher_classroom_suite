"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, X, Check, Loader2 } from "lucide-react";
import Papa from "papaparse";
import { useApp } from "@/context/AppContext";
import { db } from "@/lib/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";

interface CSVImporterProps {
  grade: string;
  subject: string;
}

export default function CSVImporter({ grade, subject }: CSVImporterProps) {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const { curriculum } = useApp();
  const [isSaving, setIsSaving] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data);
        }
      });
    }
  };

  const handleSave = async () => {
    if (data.length === 0) return;
    setIsSaving(true);
    try {
      const units: any[] = [
        { id: "p1", title: "MAZA T+T – PRIMER PERIODO", order: 1, topics: [] },
        { id: "p2", title: "PAS T+T – SEGUNDO PERIODO", order: 2, topics: [] },
        { id: "p3", title: "KUTÑA T+T – TERCER PERIODO", order: 3, topics: [] }
      ];

      data.forEach((row, idx) => {
        const periodNum = row.Periodo || row.periodo || "1";
        const unitIndex = parseInt(periodNum) - 1;
        const targetUnit = units[unitIndex] || units[0];

        targetUnit.topics.push({
          id: row.ID || row.id || `T${periodNum}-${idx}`,
          status: idx === 0 ? "active" : "not_started",
          title: row["Piankammu Mi"] || row.Piankammu || row.Tema || row.tema || row.title || row.Title || "Sin Título",
          tuhPutkamna: row["Tuh Putkamna"] || row.Putkamna || row.Higra || row.higra || "",
          hijosSaber: row["Hijos del Saber"] || row["HIJOS DEL SABER"] || row.Hijos || row.hijos || row.subtopics || "",
          panapain: row.Panapain || row["Saberes Propios"] || row.propios || "",
          nanpaskas: row.Nanpaskas || row["Saberes Interculturales"] || row.intercultural || "",
          katkinAizpa: row["Katkin Aizpa"] || row.Ayudas || row.ayudas || "",
          satIshkit: row["Sat Ishkit"] || row.Metodologia || row.metodologia || ""
        });
      });

      const firstRow = data[0];
      const detectedGrade = (firstRow.Grado || firstRow.grado || grade || "").trim();
      const detectedSubject = (firstRow.Materia || firstRow.materia || subject || "").trim();

      if (!detectedGrade || !detectedSubject) {
        alert("Error: No se pudo detectar el Grado o la Materia. Asegúrate de seleccionar ambos filtros antes de importar.");
        setIsSaving(false);
        return;
      }

      const deterministicId = `cur-${detectedGrade}-${detectedSubject}`
        .toLowerCase().replace(/\s+/g, '-').replace(/°/g, '');

      // --- PRESERVAR ESTADOS EXISTENTES ---
      const docRef = doc(db, "curriculum", deterministicId);
      const existingSnap = await getDoc(docRef);
      if (existingSnap.exists()) {
        const existingData = existingSnap.data() as any;
        const statusMap: Record<string, { status: string, date?: string }> = {};
        existingData.units?.forEach((u: any) => {
          u.topics?.forEach((t: any) => {
            if (t.id) statusMap[t.id] = { status: t.status, date: t.date };
          });
        });

        units.forEach((u: any) => {
          u.topics.forEach((t: any) => {
            if (statusMap[t.id]) {
              t.status = statusMap[t.id].status;
              if (statusMap[t.id].date) t.date = statusMap[t.id].date;
            }
          });
        });
      }

      const curriculumData = {
        id: deterministicId,
        grade: detectedGrade,
        subjectId: detectedSubject,
        units: units.filter(u => u.topics.length > 0)
      };

      await setDoc(docRef, curriculumData);
      alert("¡Tejidos cargados con éxito para " + detectedSubject + "!");
      setShow(false);
      setData([]);
    } catch (err) {
      console.error("Error al guardar CSV:", err);
      alert("Error al guardar los datos del CSV.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!show) return (
    <button 
      onClick={() => setShow(true)}
      className="flex-1 md:flex-none justify-center items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-2 border-outline-variant rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black text-primary uppercase tracking-widest hover:bg-primary/5 transition-all flex"
    >
      <Upload size={16} />
      Importar CSV
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-primary" />
            <h2 className="text-xl font-bold">Importar Malla Curricular</h2>
          </div>
          <button onClick={() => { setShow(false); setData([]); }}><X /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="border-2 border-dashed border-outline-variant rounded-2xl p-10 flex flex-col items-center justify-center gap-4 hover:border-primary transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFile}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="font-bold text-on-surface">Selecciona tu archivo .csv</p>
              <p className="text-xs text-on-surface-variant">Debe incluir columnas: Piankammu Mi, Hijos del Saber, Tuh Putkamna...</p>
            </div>
          </div>

          {data.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-on-surface uppercase">Vista Previa ({data.length} filas)</p>
              <div className="max-h-48 overflow-y-auto border border-outline-variant rounded-xl text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container sticky top-0">
                    <tr>
                      {Object.keys(data[0]).map(k => <th key={k} className="p-2 border-b border-outline-variant">{k}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v: any, j) => <td key={j} className="p-2 border-b border-outline-variant truncate max-w-[100px]">{v}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <button 
              onClick={() => { setShow(false); setData([]); }}
              className="px-6 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl"
            >
              Cancelar
            </button>
            <button 
              disabled={data.length === 0 || isSaving}
              onClick={handleSave}
              className="px-8 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              Confirmar Carga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
