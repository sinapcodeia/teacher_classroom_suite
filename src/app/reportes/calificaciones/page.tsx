"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { normalizeGrade } from "@/context/AppContext";
import { Printer, ArrowLeft, Download, ShieldCheck, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";
import { printGradesTable } from "@/lib/printService";

export default function GradesReportPage() {
  const { students, masterData, profile } = useApp();
  
  const [selectedGrade, setSelectedGrade] = useState("TODOS");
  const [selectedCurso, setSelectedCurso] = useState("TODOS");
  const [selectedSubject, setSelectedSubject] = useState("TECNOLOGÍA");

  // Fix #2: Auto-reset curso when grade changes
  useEffect(() => {
    setSelectedCurso("TODOS");
  }, [selectedGrade]);

  const filteredStudents = useMemo(() => {
    return students.filter(st => {
      // Restricción para docentes: solo sus propios cursos
      if (profile.role === "DOCENTE") {
        const myCourses = profile.teachingCourses || [];
        if (!myCourses.includes(st.curso)) return false;
      }

      if (selectedGrade !== "TODOS" && normalizeGrade(st.grado) !== normalizeGrade(selectedGrade)) return false;
      if (selectedCurso !== "TODOS" && st.curso !== selectedCurso) return false;
      if (st.isActive === false) return false;
      return true;
    }).sort((a, b) => `${a.primerApellido} ${a.segundoApellido}`.localeCompare(`${b.primerApellido} ${b.segundoApellido}`));
  }, [students, selectedGrade, selectedCurso, profile]);

  // Filtrar opciones de dropdown según permisos
  const availableGrades = profile.role === "RECTOR" || profile.role === "COORDINADOR" 
    ? (masterData.grades || []) 
    : (profile.teachingGrades || []);

  // Fix #2: availableCourses depends on selectedGrade
  const availableCourses = useMemo(() => {
    let baseList = students;
    if (selectedGrade !== "TODOS") {
      baseList = baseList.filter(s => normalizeGrade(s.grado) === normalizeGrade(selectedGrade));
    }
    
    const courses = Array.from(new Set(baseList.map(s => s.curso))).sort();
    
    if (profile.role === "DOCENTE") {
      const myCourses = profile.teachingCourses || [];
      return courses.filter(c => myCourses.includes(c));
    }
    return courses;
  }, [students, selectedGrade, profile]);

  const availableSubjects = masterData.subjects || ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"];

  // Fix #1: Mapping function for columns
  const getGradeValue = (studentGrades: any[] | undefined, colType: string, index: number, subject: string) => {
    if (!studentGrades) return "";
    
    // Filter by subject prefix [SUBJECT]
    const subjectGrades = studentGrades.filter(g => g.title?.includes(`[${subject}]`));
    
    let filtered: any[] = [];
    if (colType === "SB") {
      filtered = subjectGrades.filter(g => g.type === "exam");
    } else if (colType === "SBH") {
      filtered = subjectGrades.filter(g => g.type === "activity");
    } else if (colType === "SR") {
      filtered = subjectGrades.filter(g => g.type === "participation");
    } else if (colType === "CV") {
      // If we have more than 5 participation grades, we start filling CV columns
      const allParticipation = subjectGrades.filter(g => g.type === "participation");
      filtered = allParticipation.slice(5);
    } else if (colType === "AUT") {
      filtered = subjectGrades.filter(g => g.title?.toUpperCase().includes("AUTO"));
    }

    const grade = filtered[index];
    return grade ? grade.score.toFixed(1) : "";
  };

  const columns = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SB${i + 1}`, type: "SB", idx: i })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SBH${i + 1}`, type: "SBH", idx: i })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `SR${i + 1}`, type: "SR", idx: i })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `CV${i + 1}`, type: "CV", idx: i })),
    { id: "AUT", type: "AUT", idx: 0 }
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCSV = () => {
    const csvRows: string[] = [];
    const addRow = (row: string[]) => {
      csvRows.push(row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","));
    };

    addRow(["COD_SECCION", "11350", "INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGUE AWA", ...Array(25).fill("")]);
    addRow(["COD_ASIGNATURA", "60", ...Array(26).fill("")]);
    addRow(["SECCION", `${selectedGrade}-${selectedCurso} IETABA`, ...Array(26).fill("")]);
    addRow(["ASIGNATURA", selectedSubject, ...Array(26).fill("")]);
    addRow(["DOCENTE", profile.name, ...Array(26).fill("")]);
    
    addRow([
      "CODIGO", "APELLIDO", "NOMBRE",
      ...columns.map(c => c.id)
    ]);

    filteredStudents.forEach(st => {
      const rowGrades = columns.map(c => getGradeValue(st.grades, c.type, c.idx, selectedSubject));
      addRow([
        st.nroDocumento || "",
        `${st.primerApellido} ${st.segundoApellido}`.trim(),
        `${st.primerNombre} ${st.segundoNombre}`.trim(),
        ...rowGrades
      ]);
    });

    addRow(["", "", "", "CONVENCIONES", ...Array(24).fill("")]);
    const convenciones = [
      ["SB1-8", "SABER (EVALUACIONES)"],
      ["SBH1-8", "SABER-HACER (ACTIVIDADES)"],
      ["SR1-5", "SER (PARTICIPACIÓN)"],
      ["CV1-3", "CONVIVIR"],
      ["AUT", "AUTO-EVALUACION"]
    ];

    convenciones.forEach(conv => {
      addRow([conv[0], conv[1], "", ...Array(25).fill("")]);
    });

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sabana_${selectedSubject}_${selectedGrade}_${selectedCurso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <RoleGuard allowedRoles={["RECTOR", "COORDINADOR", "BIENESTAR", "DOCENTE"]}>
      <div className="min-h-screen bg-surface-container-lowest p-0 md:p-8 font-inter antialiased">
      {/* Controls - Hidden on Print */}
      <div className="max-w-[1200px] mx-auto mb-8 flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-xl border border-outline-variant/30 print:hidden gap-6">
        <div className="flex items-center gap-4">
          <Link href="/estudiantes" className="p-3 hover:bg-surface-container-low rounded-2xl transition-all">
            <ArrowLeft size={24} className="text-primary" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-primary leading-tight">Planilla de Notas</h1>
            <div className="flex gap-4 items-center mt-1">
              <Link href="/reportes/asistencia" className="text-[10px] font-black text-on-surface-variant hover:text-primary transition-all uppercase tracking-widest">Asistencia</Link>
              <span className="w-1 h-1 bg-outline-variant rounded-full" />
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Sábana de Calificaciones</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center">
           <div className="flex flex-col md:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <select 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-transparent border-none font-black text-[10px] uppercase tracking-wider focus:ring-0 cursor-pointer"
              >
                <option value="TODOS">GRADOS: TODOS</option>
                {availableGrades.map(g => <option key={g} value={g}>GRADO {g}</option>)}
              </select>
              <div className="hidden md:block w-px h-6 bg-slate-200" />
              <select 
                value={selectedCurso} 
                onChange={(e) => setSelectedCurso(e.target.value)}
                className="bg-transparent border-none font-black text-[10px] uppercase tracking-wider focus:ring-0 cursor-pointer"
              >
                <option value="TODOS">CURSOS: TODOS</option>
                {availableCourses.map(c => <option key={c} value={c}>CURSO {c}</option>)}
              </select>
              <div className="hidden md:block w-px h-6 bg-slate-200" />
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="bg-transparent border-none font-black text-[10px] uppercase tracking-wider focus:ring-0 cursor-pointer text-primary"
              >
                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
           </div>

           <div className="flex gap-2">
             <button 
               onClick={() => printGradesTable(filteredStudents, { 
                 grade: selectedGrade, 
                 course: selectedCurso, 
                 teacher: profile.name, 
                 subject: selectedSubject 
               })} 
               className="px-6 py-4 bg-secondary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-105 transition-all flex items-center gap-3"
             >
               <Download size={18} /> PDF
             </button>
             <button onClick={handleDownloadCSV} className="p-4 bg-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-green-600/20 hover:scale-105 transition-all flex items-center gap-2">
               <FileSpreadsheet size={16} /> Excel
             </button>
           </div>
        </div>
      </div>

      {/* Formato Oficial Planilla Excel */}
      <div className="bg-white mx-auto w-full max-w-[1400px] p-6 shadow-2xl print:shadow-none print:p-0 overflow-x-auto text-[8px] md:text-[9px] font-sans">
        <table className="w-full border-collapse border border-black table-fixed">
          <tbody>
            {/* Header Rows */}
            <tr>
              <td className="border border-black font-bold text-center w-[12%]" colSpan={2}>COD_SECCION</td>
              <td className="border border-black font-bold text-center w-[18%]">11350</td>
              <td className="border border-black font-bold text-center w-[70%]" colSpan={25}>INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGUE AWA</td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>COD_ASIGNATURA</td>
              <td className="border border-black font-bold text-center">60</td>
              <td className="border border-black px-2" colSpan={25}>FECHA REPORTE: {new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>SECCION</td>
              <td className="border border-black font-bold text-center">{selectedGrade === "TODOS" ? "VARIOS" : selectedGrade}-{selectedCurso === "TODOS" ? "TODOS" : selectedCurso} IETABA</td>
              <td className="border border-black" colSpan={25}></td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>ASIGNATURA</td>
              <td className="border border-black font-bold text-center leading-tight uppercase">{selectedSubject}</td>
              <td className="border border-black" colSpan={25}></td>
            </tr>
            <tr>
              <td className="border border-black font-bold text-center" colSpan={2}>DOCENTE</td>
              <td className="border border-black font-bold text-center leading-tight uppercase">{profile.name}</td>
              <td className="border border-black" colSpan={25}></td>
            </tr>

            {/* Table Headers */}
            <tr className="bg-gray-100 font-bold text-center">
              <td className="border border-black p-0.5">CODIGO</td>
              <td className="border border-black p-0.5">APELLIDO</td>
              <td className="border border-black p-0.5">NOMBRE</td>
              {columns.map((col) => (
                <td key={col.id} className={`border border-black w-[2.8%] p-0.5 break-all leading-tight ${col.type === 'SB' ? 'bg-blue-50' : col.type === 'SBH' ? 'bg-green-50' : col.type === 'SR' ? 'bg-amber-50' : ''}`}>
                  {col.id}
                </td>
              ))}
            </tr>

            {/* Students Data */}
            {filteredStudents.map((st) => (
              <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                <td className="border border-black text-center p-0.5 font-mono opacity-60">{st.nroDocumento}</td>
                <td className="border border-black px-1 uppercase leading-tight font-bold">{st.primerApellido} {st.segundoApellido}</td>
                <td className="border border-black px-1 uppercase leading-tight">{st.primerNombre} {st.segundoNombre}</td>
                {columns.map((col) => {
                  const val = getGradeValue(st.grades, col.type, col.idx, selectedSubject);
                  return (
                    <td key={col.id} className={`border border-black text-center p-0.5 font-bold ${val && Number(val) < 3.0 ? 'text-red-600 bg-red-50' : 'text-on-surface'}`}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {/* Empty Students Rows for fill */}
            {Array.from({ length: Math.max(0, 15 - filteredStudents.length) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td className="border border-black h-4"></td>
                <td className="border border-black h-4"></td>
                <td className="border border-black h-4"></td>
                {columns.map((col) => (
                  <td key={`e-${col.id}`} className="border border-black h-4"></td>
                ))}
              </tr>
            ))}

            {/* Promedios Row */}
            <tr className="bg-slate-900 text-white font-bold">
              <td colSpan={3} className="border border-black text-right px-2 uppercase italic tracking-widest text-[7px]">Promedio del Grupo</td>
              {columns.map((col) => {
                const values = filteredStudents
                  .map(st => getGradeValue(st.grades, col.type, col.idx, selectedSubject))
                  .filter(v => v !== "")
                  .map(v => parseFloat(v));
                
                const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : "";
                
                return (
                  <td key={`avg-${col.id}`} className="border border-black text-center p-0.5">
                    {avg}
                  </td>
                );
              })}
            </tr>

            {/* Convenciones Header */}
            <tr>
              <td colSpan={3} className="border-none h-4"></td>
              <td colSpan={25} className="border border-black font-bold text-center p-0.5 bg-slate-100">CONVENCIONES Y ESCALA DE VALORACIÓN</td>
            </tr>

            {/* Convenciones Legend */}
            {[
              ["SB1-8", "SABER: EVALUACIONES Y EXÁMENES ESCRITOS/ORALES"],
              ["SBH1-8", "SABER-HACER: TRABAJOS, TALLERES Y PRÁCTICAS"],
              ["SR1-5", "SER: ACTITUD, COMPORTAMIENTO Y VALORES"],
              ["CV1-3", "CONVIVIR: TRABAJO EN EQUIPO Y PARTICIPACIÓN"],
              ["AUT", "AUTO-EVALUACIÓN: REFLEXIÓN DEL ESTUDIANTE"]
            ].map((conv, idx) => (
              <tr key={idx}>
                <td className="border border-black font-bold text-center p-0.5" colSpan={1}>{conv[0]}</td>
                <td className="border border-black italic px-2 p-0.5 font-bold" colSpan={2}>{conv[1]}</td>
                {Array.from({ length: 25 }).map((_, i) => (
                  <td key={`cg-${i}`} className="border border-black h-4 opacity-10"></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-4 flex justify-between items-end">
          <div className="text-[7px] text-slate-400 font-bold uppercase tracking-widest">
            Firma del Docente: ___________________________
          </div>
          <div className="text-right text-[6px] text-black font-bold">
            IETABA PREMIUM SUITE · SINAPCODEIA ENTERPRISE INFRASTRUCTURE · {new Date().toLocaleDateString('es-CO')}
          </div>
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
