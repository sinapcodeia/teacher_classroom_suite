"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, X, Check, Loader2, Download, AlertTriangle, Info } from "lucide-react";
import Papa from "papaparse";
import { db } from "@/lib/firebase";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { normalizeRows, rowToTopic, downloadTemplate, downloadTejidoNoveltiesCSV, PERIOD_TITLES, TEJIDO_COLUMNS, type ParsedTejido } from "@/lib/tejidoTemplate";

interface CSVImporterProps {
  grade: string;
  subject: string;
}

/**
 * Carga estandarizada del Tejido de Aprendizaje.
 * Cada fila = una Higra del Conocimiento de un periodo, con sus hilos SABER / HACER / SER.
 * Solo se reemplazan los periodos incluidos en el archivo; los demás se conservan.
 */
export default function CSVImporter({ grade, subject }: CSVImporterProps) {
  const [show, setShow] = useState(false);
  const [parsed, setParsed] = useState<ParsedTejido | null>(null);
  const [fileName, setFileName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => { setParsed(null); setFileName(""); };
  const close = () => { setShow(false); reset(); };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      delimitersToGuess: [";", ",", "\t", "|"],
      transformHeader: h => h.replace(/^\uFEFF/, "").trim(),
      complete: results => setParsed(normalizeRows(results.data as any[])),
      error: () => setParsed({ rows: [], errors: ["No se pudo leer el archivo. Guárdalo como CSV (UTF-8)."], warnings: [], unknownHeaders: [] }),
    });
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!parsed || parsed.errors.length) return;
    setIsSaving(true);
    try {
      const first = parsed.rows[0];
      const detectedGrade = (first.grado || (grade !== "TODOS" ? grade : "")).trim();
      const detectedSubject = (first.materia || subject || "").trim().toUpperCase();
      if (!detectedGrade || !detectedSubject) {
        alert("No se pudo identificar el grado o la materia. Revisa las columnas Grado y Materia.");
        return;
      }

      const byPeriod: Record<number, any[]> = {};
      parsed.rows.forEach(r => {
        const p = parseInt(r.periodo, 10);
        (byPeriod[p] ||= []).push(rowToTopic(r, byPeriod[p]?.length || 0));
      });

      const deterministicId = `cur-${detectedGrade}-${detectedSubject.normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`
        .toLowerCase().replace(/\s+/g, "-").replace(/°/g, "");
      const docRef = doc(db, "curriculum", deterministicId);
      const existingSnap = await getDoc(docRef);
      const existing: any = existingSnap.exists() ? existingSnap.data() : null;

      // Conservar el avance (estado/fecha) de las higras que ya existían
      const statusMap: Record<string, { status: string; date?: string }> = {};
      existing?.units?.forEach((u: any) => u.topics?.forEach((t: any) => {
        if (t.id) statusMap[t.id] = { status: t.status, date: t.date };
        if (t.title) statusMap[`${u.id}::${t.title.toLowerCase()}`] = { status: t.status, date: t.date };
      }));

      const units = [1, 2, 3].map(p => {
        const unitId = `p${p}`;
        if (byPeriod[p]) {
          const topics = byPeriod[p].map((t, i) => {
            const prev = statusMap[t.id] || statusMap[`${unitId}::${t.title.toLowerCase()}`];
            return { ...t, status: prev?.status || (i === 0 && p === 1 ? "active" : "not_started"), ...(prev?.date ? { date: prev.date } : {}) };
          });
          return { id: unitId, title: PERIOD_TITLES[p], order: p, semanas: byPeriod[p][0]?.semanas || "", topics };
        }
        return existing?.units?.find((u: any) => u.id === unitId) || null;
      }).filter(u => u && u.topics?.length);

      await setDoc(docRef, { ...(existing || {}), id: deterministicId, grade: detectedGrade, subjectId: detectedSubject, units, updatedAt: new Date().toISOString(), formatVersion: 2 });
      const periods = Object.keys(byPeriod).sort().join(", ");
      alert(`Tejido cargado: ${detectedSubject} · Grado ${detectedGrade}\n${parsed.rows.length} higra(s) en el/los periodo(s) ${periods}.`);
      close();
    } catch (err) {
      console.error("Error al guardar tejido:", err);
      alert("Error al guardar el tejido. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!show) return (
    <button
      id="open-tejido-importer"
      onClick={() => setShow(true)}
      className="flex-1 md:flex-none justify-center items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-2 border-outline-variant rounded-xl md:rounded-2xl text-[9px] md:text-xs font-black text-primary uppercase tracking-widest hover:bg-primary/5 transition-all flex"
    >
      <Upload size={16} />
      Cargar Tejido
    </button>
  );

  const canSave = parsed && parsed.rows.length > 0 && parsed.errors.length === 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={close}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-t-3xl md:rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-primary" />
            <div>
              <h2 className="text-lg font-bold">Cargar Tejido de Aprendizaje</h2>
              <p className="text-[11px] text-on-surface-variant">{subject || "Materia"} · {grade && grade !== "TODOS" ? `Grado ${grade}` : "Selecciona un grado"}</p>
            </div>
          </div>
          <button onClick={close} aria-label="Cerrar"><X /></button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Paso 1: formato */}
          <section className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-primary">1. Descarga el formato</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Cada <b>fila</b> es una <b>Higra del Conocimiento</b> (lo que se dicta en el periodo). De ella salen los
              <b> Hilos del Saber: SABER, HACER y SER</b>, y sobre la higra se preparan las clases.
              Escribe los temas de la higra separados por <code>|</code>. Ábrelo en Excel y guárdalo como <b>CSV UTF-8</b>.
            </p>
            <div className="flex flex-wrap gap-2">
              <button id="download-tejido-template" onClick={() => downloadTemplate(grade, subject, false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:opacity-90">
                <Download size={14} /> Formato en blanco
              </button>
              <button id="download-tejido-example" onClick={() => downloadTemplate(grade, subject, true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary text-primary text-xs font-bold hover:bg-primary/5">
                <Download size={14} /> Formato con ejemplo
              </button>
            </div>
            <details className="text-[11px] text-on-surface-variant">
              <summary className="cursor-pointer font-bold">Ver columnas del formato</summary>
              <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-1">
                {TEJIDO_COLUMNS.map(c => (
                  <li key={c.key}><b>{c.label}</b>{c.required ? " *" : ""} — {c.help}</li>
                ))}
              </ul>
            </details>
          </section>

          {/* Paso 2: subir */}
          <section className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-on-surface">2. Sube el archivo diligenciado</p>
            <div className="border-2 border-dashed border-outline-variant rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-primary transition-colors cursor-pointer relative">
              <input id="tejido-file-input" type="file" accept=".csv,text/csv" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer" />
              <Upload size={28} className="text-primary" />
              <p className="font-bold text-sm text-on-surface">{fileName || "Selecciona tu archivo .csv"}</p>
              <p className="text-[11px] text-on-surface-variant">Un archivo por grado y materia</p>
            </div>
          </section>

          {parsed && parsed.errors.length > 0 && (
            <div className="p-5 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 text-xs space-y-3 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-200 pb-2.5">
                <div>
                  <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-red-600 text-white px-2.5 py-0.5 rounded-full mb-1">
                    Regla de Gobernanza Institucional · Carga Bloqueada
                  </span>
                  <p className="font-black text-sm flex items-center gap-2 text-red-800">
                    <AlertTriangle size={16} /> Se detectaron {parsed.errors.length} novedad(es) en el archivo
                  </p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    No se cargará ningún registro a la base de datos hasta que todas las novedades sean corregidas en el archivo CSV.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => downloadTejidoNoveltiesCSV(parsed.errors, fileName || "Tejido")}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                >
                  <Download size={13} /> Descargar Novedades CSV
                </button>
              </div>
              <ul className="space-y-1 max-h-48 overflow-y-auto pr-1 font-semibold">
                {parsed.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            </div>
          )}
          {parsed && (parsed.warnings.length > 0 || parsed.unknownHeaders.length > 0) && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <p className="font-black flex items-center gap-2"><Info size={14} /> Avisos</p>
              {parsed.unknownHeaders.length > 0 && <p>• Columnas no reconocidas (se ignoran): {parsed.unknownHeaders.join(", ")}</p>}
              {parsed.warnings.slice(0, 5).map((w, i) => <p key={i}>• {w}</p>)}
            </div>
          )}

          {/* Paso 3: vista previa */}
          {parsed && parsed.rows.length > 0 && (
            <section className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wider text-on-surface">3. Revisa la vista previa ({parsed.rows.length} higras)</p>
              <div className="space-y-3">
                {parsed.rows.map((r, i) => (
                  <div key={i} className="border border-outline-variant rounded-xl overflow-hidden text-xs">
                    <div className="px-3 py-2 bg-sky-50 flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-lime-200 text-lime-900">Periodo {r.periodo}</span>
                      <span className="font-black text-sky-900">{r.higra}</span>
                      {r.semanas && <span className="text-[10px] text-slate-500">{r.semanas} semanas</span>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-outline-variant">
                      <div className="p-3"><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Temas</p><p className="whitespace-pre-line">{r.ejes.split("|").map(s => s.trim()).filter(Boolean).map(s => `• ${s}`).join("\n") || "—"}</p></div>
                      <div className="p-3"><p className="text-[9px] font-black text-emerald-700 uppercase mb-1">Saber</p><p>{r.saber || "—"}</p></div>
                      <div className="p-3"><p className="text-[9px] font-black text-blue-700 uppercase mb-1">Hacer</p><p>{r.hacer || "—"}</p></div>
                      <div className="p-3"><p className="text-[9px] font-black text-violet-700 uppercase mb-1">Ser</p><p>{r.ser || "—"}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant flex gap-3 justify-end bg-white">
          <button onClick={close} className="px-6 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl">Cancelar</button>
          <button id="confirm-tejido-import" disabled={!canSave || isSaving} onClick={handleSave} className="px-8 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
            Confirmar carga
          </button>
        </div>
      </div>
    </div>
  );
}
