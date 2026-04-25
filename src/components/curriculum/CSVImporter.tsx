"use client";

import { useState } from "react";
import { Upload, FileSpreadsheet, X, Check } from "lucide-react";
import Papa from "papaparse";

export default function CSVImporter() {
  const [show, setShow] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          setData(results.data);
        }
      });
    }
  };

  if (!show) return (
    <button 
      onClick={() => setShow(true)}
      className="flex items-center gap-2 px-4 py-2 border border-outline rounded-xl text-sm font-bold text-primary hover:bg-surface-container transition-colors"
    >
      <Upload size={18} />
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
          <button onClick={() => setShow(false)}><X /></button>
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
              <p className="text-xs text-on-surface-variant">o arrástralo aquí (Máx. 5MB)</p>
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
              onClick={() => setShow(false)}
              className="px-6 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-xl"
            >
              Cancelar
            </button>
            <button 
              disabled={data.length === 0}
              className="px-8 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2"
            >
              <Check size={18} />
              Confirmar Carga
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
