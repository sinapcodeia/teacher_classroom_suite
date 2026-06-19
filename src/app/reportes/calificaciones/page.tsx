"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { normalizeGrade } from "@/context/AppContext";
import { Printer, ArrowLeft, Download, ShieldCheck, FileSpreadsheet, Loader2 } from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";
import { printGradesTable } from "@/lib/printService";

interface EditableGradeCellProps {
  studentId: string;
  col: any;
  initialVal: string;
  onSave: (studentId: string, col: any, val: string) => Promise<void>;
}

const EditableGradeCell = React.memo(({ studentId, col, initialVal, onSave }: EditableGradeCellProps) => {
  const [val, setVal] = useState(initialVal);

  useEffect(() => {
    setVal(initialVal);
  }, [initialVal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(",", ".");
    if (raw === "" || /^[0-5]?\.?\d*$/.test(raw)) {
      const num = parseFloat(raw);
      if (raw === "" || (!isNaN(num) && num >= 0 && num <= 5)) {
        setVal(raw);
      }
    }
  };

  const handleBlur = () => {
    if (val !== initialVal) {
      onSave(studentId, col, val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const scoreValue = parseFloat(val);
  const isLow = !isNaN(scoreValue) && scoreValue < 3.0;

  return (
    <input
      type="text"
      inputMode="decimal"
      value={val}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="—"
      className={`w-full h-full text-center bg-transparent border-none outline-none font-bold p-0 text-[8px] md:text-[9px] focus:bg-primary/5 focus:ring-1 focus:ring-primary/30 transition-colors ${
        isLow ? "text-red-600 font-extrabold" : "text-on-surface"
      } print:placeholder-transparent`}
    />
  );
});

EditableGradeCell.displayName = "EditableGradeCell";

export default function GradesReportPage() {
  const { students, myStudents, masterData, profile, addGrade, updateSingleDetailedGrade } = useApp();
  
  const [selectedGrade, setSelectedGrade] = useState("TODOS");
  const [selectedCurso, setSelectedCurso] = useState("TODOS");
  const [selectedSubject, setSelectedSubject] = useState("TECNOLOGÍA");
  const [selectedPeriod, setSelectedPeriod] = useState(masterData.activePeriod || "p2");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix #2: Auto-reset curso when grade changes
  useEffect(() => {
    setSelectedCurso("TODOS");
  }, [selectedGrade]);

  const filteredStudents = useMemo(() => {
    return myStudents.filter(st => {
      if (selectedGrade !== "TODOS" && normalizeGrade(st.grado) !== normalizeGrade(selectedGrade)) return false;
      if (selectedCurso !== "TODOS" && st.curso !== selectedCurso) return false;
      if (st.isActive === false) return false;
      return true;
    }).sort((a, b) => {
      const nameA = `${a.primerApellido || ""} ${a.segundoApellido || ""} ${a.primerNombre || ""} ${a.segundoNombre || ""}`.trim().toUpperCase();
      const nameB = `${b.primerApellido || ""} ${b.segundoApellido || ""} ${b.primerNombre || ""} ${b.segundoNombre || ""}`.trim().toUpperCase();
      return nameA.localeCompare(nameB);
    });
  }, [myStudents, selectedGrade, selectedCurso]);

  const availableGrades = useMemo(() => 
    Array.from(new Set(myStudents.map(s => normalizeGrade(s.grado)))).sort()
  , [myStudents]);

  const availableCourses = useMemo(() => {
    let baseList = myStudents;
    if (selectedGrade !== "TODOS") {
      baseList = baseList.filter(s => normalizeGrade(s.grado) === normalizeGrade(selectedGrade));
    }
    return Array.from(new Set(baseList.map(s => s.curso))).sort();
  }, [myStudents, selectedGrade]);

  const availableSubjects = masterData.subjects || ["TECNOLOGÍA", "MATEMÁTICAS", "FÍSICA", "ÉTICA"];

  if (!mounted) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

  // Fix #1: Mapping function for columns
  const getGradeValue = (st: any, colType: string, index: number, subject: string, periodId: string) => {
    const pid = periodId.toLowerCase();
    
    // 1. Try NEW DetailedGrades Structure (High Precision)
    if (st.detailedGrades?.[subject]?.[pid]) {
      const d = st.detailedGrades[subject][pid];
      if (colType === "SB") return d.sb[index] !== null ? d.sb[index].toFixed(1) : "";
      if (colType === "SBH") return d.sbh[index] !== null ? d.sbh[index].toFixed(1) : "";
      if (colType === "SR") return d.sr[index] !== null ? d.sr[index].toFixed(1) : "";
      if (colType === "CV") return d.cv[index] !== null ? d.cv[index].toFixed(1) : "";
      if (colType === "AUT") return d.aut !== null ? d.aut.toFixed(1) : "";
      if (colType === "DEF") {
        const getAvg = (vals: (number | null)[]) => {
          const valid = vals.filter(v => v !== null) as number[];
          return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        };
        const sbAvg = getAvg(d.sb);
        const sbhAvg = getAvg(d.sbh);
        const srAvg = getAvg(d.sr);
        const cvAvg = getAvg(d.cv);
        const aut = d.aut || 0;
        const final = (sbAvg * 0.3) + (sbhAvg * 0.4) + (srAvg * 0.2) + (cvAvg * 0.05) + (aut * 0.05);
        return final > 0 ? final.toFixed(1) : "0.0";
      }
    }

    // 2. Fallback to Legacy st.grades
    if (!st.grades) return "";
    const subjectGrades = st.grades.filter((g: any) => g.title?.includes(`[${subject}]`));

    if (colType === "DEF") {
      const validScores = subjectGrades.filter((g: any) => g.type !== 'participation').map((g: any) => g.score);
      const baseAvg = validScores.length > 0 ? validScores.reduce((a: number, b: number) => a + b, 0) / validScores.length : 0;
      const bonus = subjectGrades.filter((g: any) => g.type === 'participation').reduce((a: number, b: any) => a + (b.score * 0.02), 0);
      const final = Math.min(5.0, baseAvg + bonus);
      return final > 0 ? final.toFixed(1) : "0.0";
    }
    
    let filtered: any[] = [];
    if (colType === "SB") {
      filtered = subjectGrades.filter((g: any) => g.type === "exam");
    } else if (colType === "SBH") {
      filtered = subjectGrades.filter((g: any) => g.type === "activity");
    } else if (colType === "SR") {
      filtered = subjectGrades.filter((g: any) => g.type === "participation");
    } else if (colType === "CV") {
      const allParticipation = subjectGrades.filter((g: any) => g.type === "participation");
      filtered = allParticipation.slice(5);
    } else if (colType === "AUT") {
      filtered = subjectGrades.filter((g: any) => g.title?.toUpperCase().includes("AUTO"));
    }

    const grade = filtered[index];
    return grade ? grade.score.toFixed(1) : "";
  };

  const handleGradeCellChange = async (studentId: string, col: any, rawValue: string) => {
    const value = rawValue.replace(",", ".");
    const score = value === "" ? null : parseFloat(value);
    
    if (value !== "" && (isNaN(score!) || score! < 0 || score! > 5)) return;

    try {
      // 1. Sincronizar planilla oficial
      await updateSingleDetailedGrade(studentId, selectedSubject, selectedPeriod, col.type.toLowerCase() as any, col.idx, score);

      // 2. Historial de sesión (Visibilidad en Consola y sabana)
      const student = myStudents.find(s => s.id === studentId);
      if (student && score !== null) {
        const existingGrade = student.grades?.find(g => 
          g.periodId === selectedPeriod && 
          g.category === col.type.toLowerCase() && 
          g.slotIndex === col.idx
        );

        const cleanTitle = existingGrade 
          ? existingGrade.title 
          : `[${selectedSubject.toUpperCase()}] ${col.id}`;

        await addGrade(studentId, {
          title: cleanTitle,
          score,
          type: col.type === 'SB' ? 'exam' : (col.type === 'SR' ? 'participation' : 'activity'),
          date: new Date().toISOString(),
          periodId: selectedPeriod,
          category: col.type.toLowerCase() as any,
          slotIndex: col.idx
        });
      }
    } catch (err) {
      console.error("Error al actualizar nota desde planilla:", err);
    }
  };

  const columns = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SB${i + 1}`, type: "SB", idx: i })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SBH${i + 1}`, type: "SBH", idx: i })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `SR${i + 1}`, type: "SR", idx: i })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `CV${i + 1}`, type: "CV", idx: i })),
    { id: "AUT", type: "AUT", idx: 0 },
    { id: "DEF", type: "DEF", idx: 0 }
  ];

  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanGrade = selectedGrade.replace('°', '');
    const period = (masterData.activePeriod || "P2").toUpperCase();
    document.title = `SABANA_${cleanGrade}_${selectedCurso}_${selectedSubject}_${period}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
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
      const rowGrades = columns.map(c => getGradeValue(st, c.type, c.idx, selectedSubject, selectedPeriod));
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
      ["AUT", "AUTO-EVALUACION"],
      ["DEF", "DEFINITIVA (CALCULADA CON BONO 2% PARTICIPACION)"]
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
      <div className="max-w-[1200px] mx-auto mb-6 md:mb-8 flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-4 md:p-6 rounded-3xl md:rounded-[2rem] shadow-xl border border-outline-variant/30 print:hidden gap-4 md:gap-6">
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

        <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 items-stretch md:items-center justify-center w-full md:w-auto">
           <div className="w-full xl:w-auto flex flex-wrap items-center justify-center gap-2 md:gap-3 bg-slate-50 p-2 md:p-3 rounded-xl md:rounded-2xl border border-slate-200">
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
              <div className="hidden md:block w-px h-6 bg-slate-200" />
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent border-none font-black text-[10px] uppercase tracking-wider focus:ring-0 cursor-pointer text-secondary"
              >
                <option value="p1">PERIODO 1</option>
                <option value="p2">PERIODO 2</option>
                <option value="p3">PERIODO 3</option>
              </select>
           </div>

           <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
             <button 
               onClick={() => printGradesTable(filteredStudents, { 
                 grade: selectedGrade, 
                 course: selectedCurso, 
                 teacher: profile.name, 
                 subject: selectedSubject,
                 period: selectedPeriod.toUpperCase() 
               })} 
               className="flex-1 md:flex-none justify-center px-4 py-3 md:px-6 md:py-4 bg-secondary text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all flex items-center gap-2 md:gap-3"
             >
               <Download size={16} /> PDF
             </button>
             <button onClick={handleDownloadCSV} className="flex-1 md:flex-none justify-center px-4 py-3 md:p-4 bg-green-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-green-600/20 hover:scale-[1.02] transition-all flex items-center gap-2">
               <FileSpreadsheet size={16} /> Excel
             </button>
           </div>
        </div>
      </div>

      {/* Formato Oficial Planilla Excel */}
      <div className="bg-white mx-auto w-full max-w-[1400px] p-4 md:p-6 shadow-2xl print:shadow-none print:p-0 overflow-x-auto text-[8px] md:text-[9px] font-sans">
        <table className="w-full border-collapse border border-black table-fixed min-w-[800px] md:min-w-0">
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
                <td key={col.id} className={`border border-black w-[2.8%] p-0.5 break-all leading-tight ${col.id === 'DEF' ? 'bg-primary text-white' : col.type === 'SB' ? 'bg-blue-50' : col.type === 'SBH' ? 'bg-green-50' : col.type === 'SR' ? 'bg-amber-50' : ''}`}>
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
                  const val = getGradeValue(st, col.type, col.idx, selectedSubject, selectedPeriod);
                  const scoreValue = parseFloat(val);
                  const isLow = !isNaN(scoreValue) && scoreValue < 3.0;
                  const isDef = col.id === "DEF";
                  return (
                    <td key={col.id} className={`border border-black text-center p-0.5 ${isLow ? 'text-red-600 font-bold' : ''} ${isDef ? 'bg-slate-100 font-black' : ''}`}>
                      {isDef ? (
                        val
                      ) : (
                        <EditableGradeCell
                          studentId={st.id}
                          col={col}
                          initialVal={val}
                          onSave={handleGradeCellChange}
                        />
                      )}
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
                  .map(st => getGradeValue(st, col.type, col.idx, selectedSubject, selectedPeriod))
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
