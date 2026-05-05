"use client";

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { normalizeGrade } from "@/context/AppContext";
import { Printer, ArrowLeft, Download, ShieldCheck, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";

export default function GradesReportPage() {
  const { students, masterData, profile } = useApp();
  
  const [selectedGrade, setSelectedGrade] = useState("TODOS");
  const [selectedCurso, setSelectedCurso] = useState("TODOS");

  const filteredStudents = students.filter(st => {
    if (selectedGrade !== "TODOS" && normalizeGrade(st.grado) !== selectedGrade) return false;
    if (selectedCurso !== "TODOS" && st.curso !== selectedCurso) return false;
    if (st.isActive === false) return false;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvRows: string[] = [];
    
    // Helper para escapar valores CSV
    const addRow = (row: string[]) => {
      csvRows.push(row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","));
    };

    // Encabezado Institucional
    addRow(["COD_SECCION", "11350", "INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGUE AWA", ...Array(25).fill("")]);
    addRow(["COD_ASIGNATURA", "60", ...Array(26).fill("")]);
    addRow(["SECCION", `${selectedGrade}-${selectedCurso} IETABA`, ...Array(26).fill("")]);
    addRow(["ASIGNATURA", "TECNOLOGÍA PROPIA E INFORMÁTICA", ...Array(26).fill("")]);
    addRow(["DOCENTE", profile.name, ...Array(26).fill("")]);
    
    // Títulos de Columnas
    addRow([
      "CODIGO", "APELLIDO", "NOMBRE",
      "SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7", "SB8",
      "SBH1", "SBH2", "SBH3", "SBH4", "SBH5", "SBH6", "SBH7", "SBH8",
      "SR1", "SR2", "SR3", "SR4", "SR5",
      "CV1", "CV2", "CV3", "AUT"
    ]);

    // Estudiantes
    filteredStudents.forEach(st => {
      addRow([
        st.nroDocumento || "",
        `${st.primerApellido} ${st.segundoApellido}`.trim(),
        `${st.primerNombre} ${st.segundoNombre}`.trim(),
        ...Array(25).fill("")
      ]);
    });

    // Convenciones
    addRow(["", "", "", "CONVENCIONES", ...Array(24).fill("")]);
    const convenciones = [
      ["SB1", "SABER,"], ["SB2", "SABER,"], ["SB3", "SABER,"], ["SB4", "SABER,"], ["SB5", "SABER,"], ["SB6", "SABER,"], ["SB7", "SABER,"], ["SB8", "SABER,"],
      ["SBH1", "SABER - HACER,"], ["SBH2", "SABER - HACER,"], ["SBH3", "SABER - HACER,"], ["SBH4", "SABER - HACER,"], ["SBH5", "SABER - HACER,"], ["SBH6", "SABER - HACER,"], ["SBH7", "SABER - HACER,"], ["SBH8", "SABER - HACER,"],
      ["SR1", "SER,"], ["SR2", "SER,"], ["SR3", "SER,"], ["SR4", "SER,"], ["SR5", "SER,"],
      ["CV1", "CONVIVIR,"], ["CV2", "CONVIVIR,"], ["CV3", "CONVIVIR,"],
      ["AUT", "AUTO-EVALUACION,"]
    ];

    convenciones.forEach(conv => {
      addRow([conv[0], conv[1], "", ...Array(25).fill("")]);
    });

    // Descargar Archivo (Se usa BOM para compatibilidad con Excel UTF-8)
    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sabana_Notas_${selectedGrade}_${selectedCurso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <RoleGuard allowedRoles={["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE"]}>
      <div className="min-h-screen bg-surface-container-lowest p-0 md:p-8 font-inter antialiased">
      {/* Controls - Hidden on Print */}
      <div className="max-w-[1200px] mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-xl border border-outline-variant/30 print:hidden">
        <div className="flex items-center gap-4">
          <Link href="/estudiantes" className="p-3 hover:bg-surface-container-low rounded-2xl transition-all">
            <ArrowLeft size={24} className="text-primary" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-primary">Generador de Reportes</h1>
            <div className="flex gap-4 items-center mt-2">
              <Link href="/reportes/asistencia" className="text-[10px] font-black text-on-surface-variant hover:text-primary transition-all uppercase tracking-widest">Lista de Asistencia</Link>
              <Link href="/reportes/calificaciones" className="text-[10px] font-black bg-primary text-white px-3 py-1 rounded-full uppercase tracking-widest pointer-events-none">Sábana de Notas</Link>
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center">
           <div className="flex gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-transparent border-none font-black text-[10px] uppercase tracking-wider focus:ring-0"
              >
                <option value="TODOS">TODOS LOS GRADOS</option>
                {(masterData.grades || []).map(g => <option key={g} value={g}>GRADO {g}</option>)}
              </select>
              <div className="w-px h-6 bg-slate-200" />
              <select 
                value={selectedCurso} 
                onChange={(e) => setSelectedCurso(e.target.value)}
                className="bg-transparent border-none font-black text-[10px] uppercase tracking-wider focus:ring-0"
              >
                <option value="TODOS">TODOS LOS CURSOS</option>
                {Array.from(new Set(students.map(s => s.curso))).sort().map(c => <option key={c} value={c}>CURSO {c}</option>)}
              </select>
           </div>

           <button onClick={handlePrint} className="px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3">
             <Printer size={18} /> Imprimir
           </button>
           <button onClick={handleDownloadCSV} className="px-6 py-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-green-600/20 hover:scale-105 transition-all flex items-center gap-3">
             <FileSpreadsheet size={18} /> CSV Excel
           </button>
           <button onClick={handlePrint} className="px-6 py-4 bg-secondary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 transition-all flex items-center gap-3">
             <Download size={18} /> PDF
           </button>
        </div>
      </div>

      {/* Formato Oficial Planilla Excel */}
      <div className="bg-white mx-auto w-full max-w-[1400px] p-4 shadow-2xl print:shadow-none print:p-0 overflow-x-auto text-[8px] md:text-[9px] font-sans">
        <table className="w-full border-collapse border border-black table-fixed">
          {/* Header Rows */}
          <tbody>
            <tr>
              <td className="border border-black font-bold text-center w-[12%]" colSpan={2}>COD_SECCION</td>
              <td className="border border-black font-bold text-center w-[18%]">11350</td>
              <td className="border border-black font-bold text-center w-[70%]" colSpan={25}>INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGUE AWA</td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>COD_ASIGNATURA</td>
              <td className="border border-black font-bold text-center">60</td>
              <td className="border border-black" colSpan={25}></td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>SECCION</td>
              <td className="border border-black font-bold text-center">{selectedGrade}-{selectedCurso} IETABA</td>
              <td className="border border-black" colSpan={25}></td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>ASIGNATURA</td>
              <td className="border border-black font-bold text-center leading-tight">TECNOLOGÍA PROPIA E INFORMÁTICA</td>
              <td className="border border-black" colSpan={25}></td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>DOCENTE</td>
              <td className="border border-black font-bold text-center leading-tight">{profile.name}</td>
              <td className="border border-black" colSpan={25}></td>
            </tr>

            {/* Table Headers */}
            <tr className="bg-gray-100 font-bold text-center">
              <td className="border border-black p-0.5">CODIGO</td>
              <td className="border border-black p-0.5">APELLIDO</td>
              <td className="border border-black p-0.5">NOMBRE</td>
              {["SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7", "SB8",
                "SBH1", "SBH2", "SBH3", "SBH4", "SBH5", "SBH6", "SBH7", "SBH8",
                "SR1", "SR2", "SR3", "SR4", "SR5",
                "CV1", "CV2", "CV3", "AUT"].map((col) => (
                <td key={col} className="border border-black w-[2.8%] p-0.5 break-all leading-tight">{col}</td>
              ))}
            </tr>

            {/* Students Data */}
            {filteredStudents.map((st) => (
              <tr key={st.id}>
                <td className="border border-black text-center p-0.5">{st.nroDocumento}</td>
                <td className="border border-black px-1 uppercase leading-tight">{st.primerApellido} {st.segundoApellido}</td>
                <td className="border border-black px-1 uppercase leading-tight">{st.primerNombre} {st.segundoNombre}</td>
                {Array.from({ length: 25 }).map((_, i) => (
                  <td key={i} className="border border-black text-center p-0.5"></td>
                ))}
              </tr>
            ))}
            
            {/* Empty Students Rows */}
            {Array.from({ length: Math.max(0, 15 - filteredStudents.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black h-4"></td>
                <td className="border border-black h-4"></td>
                <td className="border border-black h-4"></td>
                {Array.from({ length: 25 }).map((_, j) => (
                  <td key={`e-${j}`} className="border border-black h-4"></td>
                ))}
              </tr>
            ))}

            {/* Convenciones Header */}
            <tr>
              <td colSpan={3} className="border-none"></td>
              <td colSpan={25} className="border border-black font-bold text-center p-0.5">CONVENCIONES</td>
            </tr>

            {/* Convenciones Legend */}
            {[
              ["SB1", "SABER,"], ["SB2", "SABER,"], ["SB3", "SABER,"], ["SB4", "SABER,"], ["SB5", "SABER,"], ["SB6", "SABER,"], ["SB7", "SABER,"], ["SB8", "SABER,"],
              ["SBH1", "SABER - HACER,"], ["SBH2", "SABER - HACER,"], ["SBH3", "SABER - HACER,"], ["SBH4", "SABER - HACER,"], ["SBH5", "SABER - HACER,"], ["SBH6", "SABER - HACER,"], ["SBH7", "SABER - HACER,"], ["SBH8", "SABER - HACER,"],
              ["SR1", "SER,"], ["SR2", "SER,"], ["SR3", "SER,"], ["SR4", "SER,"], ["SR5", "SER,"],
              ["CV1", "CONVIVIR,"], ["CV2", "CONVIVIR,"], ["CV3", "CONVIVIR,"],
              ["AUT", "AUTO-EVALUACION,"]
            ].map((conv, idx) => (
              <tr key={idx}>
                <td className="border border-black font-bold text-center p-0.5" colSpan={1}>{conv[0]}</td>
                <td className="border border-black italic px-1 p-0.5 font-bold" colSpan={2}>{conv[1]}</td>
                {Array.from({ length: 25 }).map((_, i) => (
                  <td key={`cg-${i}`} className="border border-black h-4"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-2 text-right text-[6px] text-black font-bold">
          Elaborado por EduManager Suite. {new Date().toLocaleDateString('es-CO')}
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
          }
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      </div>
    </RoleGuard>
  );
}
