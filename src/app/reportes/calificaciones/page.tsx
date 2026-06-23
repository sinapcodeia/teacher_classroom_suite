"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { normalizeGrade } from "@/context/AppContext";
import { 
  Printer, ArrowLeft, Download, ShieldCheck, FileSpreadsheet, 
  Loader2, AlertTriangle, FileWarning, ClipboardCheck, 
  Upload, X, Check, FileText 
} from "lucide-react";
import Link from "next/link";
import RoleGuard from "@/components/shared/RoleGuard";
import { printGradesTable, printMissingGradesReport } from "@/lib/printService";
import Papa from "papaparse";

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
      const msg = val === ""
        ? `¿Desea borrar la nota de la columna ${col.id} de este estudiante para dejarla en blanco?`
        : `¿Desea guardar la nota de "${val}" para la columna ${col.id} de este estudiante?`;
      
      if (window.confirm(msg)) {
        onSave(studentId, col, val);
      } else {
        setVal(initialVal);
      }
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
  const { 
    students, myStudents, masterData, profile, addGrade, 
    updateSingleDetailedGrade, importDetailedGrades 
  } = useApp();
  
  const [selectedGrade, setSelectedGrade] = useState("TODOS");
  const [selectedCurso, setSelectedCurso] = useState("TODOS");
  const [selectedSubject, setSelectedSubject] = useState("TECNOLOGÍA");
  const [selectedPeriod, setSelectedPeriod] = useState(masterData.activePeriod || "p2");
  const [mounted, setMounted] = useState(false);

  // Estados del importador de calificaciones
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importStats, setImportStats] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-reset curso cuando cambia el grado
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

  const columns = [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SB${i + 1}`, type: "SB", idx: i })),
    ...Array.from({ length: 8 }, (_, i) => ({ id: `SBH${i + 1}`, type: "SBH", idx: i })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `SR${i + 1}`, type: "SR", idx: i })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `CV${i + 1}`, type: "CV", idx: i })),
    { id: "AUT", type: "AUT", idx: 0 },
    { id: "DEF", type: "DEF", idx: 0 }
  ];

  const getGradeValue = (st: any, colType: string, index: number, subject: string, periodId: string) => {
    const pid = periodId.toLowerCase();
    
    // 1. Nueva estructura DetailedGrades
    if (st.detailedGrades?.[subject]?.[pid]) {
      const d = st.detailedGrades[subject][pid];
      if (colType === "SB") return (d.sb && typeof d.sb[index] === 'number') ? d.sb[index].toFixed(1) : "";
      if (colType === "SBH") return (d.sbh && typeof d.sbh[index] === 'number') ? d.sbh[index].toFixed(1) : "";
      if (colType === "SR") return (d.sr && typeof d.sr[index] === 'number') ? d.sr[index].toFixed(1) : "";
      if (colType === "CV") return (d.cv && typeof d.cv[index] === 'number') ? d.cv[index].toFixed(1) : "";
      if (colType === "AUT") return typeof d.aut === 'number' ? d.aut.toFixed(1) : "";
      if (colType === "DEF") {
        const getAvg = (vals: (number | null)[]) => {
          if (!vals) return 0;
          const valid = vals.filter(v => typeof v === 'number') as number[];
          return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
        };
        const sbAvg = getAvg(d.sb);
        const sbhAvg = getAvg(d.sbh);
        const srAvg = getAvg(d.sr);
        const cvAvg = getAvg(d.cv);
        const aut = typeof d.aut === 'number' ? d.aut : 0;
        const final = (sbAvg * 0.3) + (sbhAvg * 0.4) + (srAvg * 0.2) + (cvAvg * 0.05) + (aut * 0.05);
        return final > 0 ? final.toFixed(1) : "0.0";
      }
    }

    // 2. Compatibilidad con calificaciones legadas st.grades
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

  const activeCols = useMemo(() => {
    return columns.filter(col => {
      if (col.id === "DEF") return false;
      return filteredStudents.some(st => {
        const val = getGradeValue(st, col.type, col.idx, selectedSubject, selectedPeriod);
        return val !== "";
      });
    });
  }, [filteredStudents, selectedSubject, selectedPeriod]);

  const studentsWithAlerts = useMemo(() => {
    return filteredStudents.map(st => {
      const missingExams: string[] = [];
      const missingTasks: string[] = [];
      let totalActiveCount = 0;
      let filledActiveCount = 0;

      activeCols.forEach(col => {
        totalActiveCount++;
        const val = getGradeValue(st, col.type, col.idx, selectedSubject, selectedPeriod);
        if (val !== "") {
          filledActiveCount++;
        } else {
          if (col.type === "SB") {
            missingExams.push(col.id);
          } else {
            missingTasks.push(col.id);
          }
        }
      });

      const isTotallyEmpty = totalActiveCount > 0 && filledActiveCount === 0;
      const hasMissingExams = missingExams.length > 0;
      const hasMissingTasks = missingTasks.length > 0;

      let alertType: "COMPLETO" | "SIN_NOTAS" | "EXAMEN_PENDIENTE" | "TAREA_PENDIENTE" = "COMPLETO";
      if (totalActiveCount > 0) {
        if (isTotallyEmpty) alertType = "SIN_NOTAS";
        else if (hasMissingExams) alertType = "EXAMEN_PENDIENTE";
        else if (hasMissingTasks) alertType = "TAREA_PENDIENTE";
      }

      return {
        student: st,
        isTotallyEmpty,
        hasMissingExams,
        hasMissingTasks,
        missingExams,
        missingTasks,
        alertType
      };
    });
  }, [filteredStudents, activeCols, selectedSubject, selectedPeriod]);

  const alertStats = useMemo(() => {
    const empty = studentsWithAlerts.filter(sa => sa.alertType === "SIN_NOTAS");
    const exams = studentsWithAlerts.filter(sa => sa.alertType === "EXAMEN_PENDIENTE");
    const tasks = studentsWithAlerts.filter(sa => sa.alertType === "TAREA_PENDIENTE");
    return {
      empty,
      exams,
      tasks,
      totalCount: empty.length + exams.length + tasks.length
    };
  }, [studentsWithAlerts]);

  const handleGradeCellChange = async (studentId: string, col: any, rawValue: string) => {
    const value = rawValue.replace(",", ".");
    const score = value === "" ? null : parseFloat(value);
    
    if (value !== "" && (isNaN(score!) || score! < 0 || score! > 5)) return;

    try {
      await updateSingleDetailedGrade(studentId, selectedSubject, selectedPeriod, col.type.toLowerCase() as any, col.idx, score);

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

  const handleDownloadCSV = () => {
    const csvRows: string[] = [];
    const addRow = (row: string[]) => {
      csvRows.push(row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(";"));
    };

    addRow(["COD_SECCION", "11350", "INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGUE AWA", ...Array(25).fill("")]);
    addRow(["COD_ASIGNATURA", "60", ...Array(26).fill("")]);
    addRow(["SECCION", `${selectedGrade === "TODOS" ? "5-1" : selectedGrade.replace("°", "")}-${selectedCurso === "TODOS" ? "1" : selectedCurso} IETABA`, ...Array(26).fill("")]);
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
    link.setAttribute("download", `Planilla_${selectedSubject}_${selectedGrade}_${selectedCurso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lógica de lectura y parseo del cargador de CSV
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processCSVFile(file);
  };

  const processCSVFile = (file: File) => {
    setImportFile(file);
    setImportError(null);
    setImportSuccess(false);
    setImportStats(null);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data as string[][];
          if (rows.length === 0) {
            setImportError("El archivo seleccionado está vacío.");
            return;
          }

          // 1. Detectar grado y curso desde los metadatos de cabecera del CSV
          let targetGrade = selectedGrade;
          let targetCurso = selectedCurso;
          
          const seccionRow = rows.find(r => r[0] && r[0].toString().toUpperCase().trim() === "SECCION");
          if (seccionRow && seccionRow[1]) {
            const cleanSec = seccionRow[1].replace(" IETABA", "").trim();
            const secParts = cleanSec.split("-");
            if (secParts.length >= 1) {
              targetGrade = normalizeGrade(secParts[0]);
              if (secParts.length >= 2) {
                targetCurso = secParts[1].trim().toUpperCase();
              }
            }
          }

          // 2. Localizar la fila de encabezados que contiene el campo "CODIGO"
          const headerRowIdx = rows.findIndex(row => 
            row.some(cell => cell && cell.toString().toUpperCase().trim() === "CODIGO")
          );

          if (headerRowIdx === -1) {
            setImportError("Estructura inválida. No se encontró la columna de cabecera con el campo 'CODIGO'. Asegúrate de usar la plantilla exportada.");
            return;
          }

          // Normalizar delimitador: PapaParse auto-detecta, pero a veces mezcla campos
          // Si el header tiene un solo elemento con separador, lo dividimos manualmente
          let headers = rows[headerRowIdx].map(h => (h || "").toString().trim().toUpperCase());
          let isSemicolonSplit = false;
          if (headers.length === 1 && headers[0].includes(";")) {
            headers = headers[0].split(";");
            isSemicolonSplit = true;
          }

          const colCodigoIdx = headers.indexOf("CODIGO");
          const colApellidoIdx = headers.indexOf("APELLIDO");
          const colNombreIdx = headers.indexOf("NOMBRE");

          if (colCodigoIdx === -1) {
            setImportError("Falta la columna 'CODIGO' en el archivo cargado.");
            return;
          }

          // Filtrar columnas de evaluación disponibles
          const evalCols = columns.filter(c => c.id !== "DEF").map(col => {
            const idx = headers.indexOf(col.id.toUpperCase());
            return { ...col, csvIdx: idx };
          }).filter(c => c.csvIdx !== -1);

          if (evalCols.length === 0) {
            setImportError("No se encontraron columnas de calificaciones (SB1-SB8, SBH1-8, SR1-5, CV1-3, AUT) para importar.");
            return;
          }

          const parsedData: any[] = [];
          const novelties: string[] = [];
          const roomChanges: any[] = [];
          const unmatched: string[] = [];
          let totalGradesRead = 0;

          // Recorrer las filas de estudiantes
          for (let i = headerRowIdx + 1; i < rows.length; i++) {
            let row = rows[i];
            if (!row || row.length === 0) continue;

            if (isSemicolonSplit && row.length === 1) {
              row = row[0].split(";");
            }

            const firstCell = (row[0] || "").toString().trim().toUpperCase();
            if (firstCell === "CONVENCIONES" || firstCell === "CONVENCIONES Y ESCALA DE VALORACIÓN" || firstCell === "") {
              break; // Detener lectura en la zona de leyendas
            }

            const rawCodigo = row[colCodigoIdx];
            if (!rawCodigo) continue;

            const codigo = rawCodigo.toString().replace(".0", "").trim();
            if (!codigo || codigo === "CODIGO") continue;

            // Cruce con la base de datos de estudiantes
            const student = students.find(s => 
              s.nroDocumento === codigo || 
              s.id === `st-${codigo}-1` || 
              s.id === `st-${codigo}`
            );

            const rawApellido = colApellidoIdx !== -1 ? (row[colApellidoIdx] || "").toString().trim() : "";
            const rawNombre = colNombreIdx !== -1 ? (row[colNombreIdx] || "").toString().trim() : "";

            const apParts = rawApellido.split(/\s+/).filter(Boolean);
            const primerApellido = apParts.length > 0 ? apParts[0].toUpperCase() : "";
            const segundoApellido = apParts.length > 1 ? apParts.slice(1).join(" ").toUpperCase() : "";

            const nmParts = rawNombre.split(/\s+/).filter(Boolean);
            const primerNombre = nmParts.length > 0 ? nmParts[0].toUpperCase() : "";
            const segundoNombre = nmParts.length > 1 ? nmParts.slice(1).join(" ").toUpperCase() : "";

            const sName = rawApellido || rawNombre
              ? `${rawApellido} ${rawNombre}`.replace(/\s+/g, " ").trim().toUpperCase()
              : `Estudiante ${codigo}`;

            if (!student) {
              unmatched.push(`${sName} (ID: ${codigo})`);
              continue;
            }

            // Mapear notas
            const detailed: any = {
              sb: Array(8).fill(null),
              sbh: Array(8).fill(null),
              sr: Array(5).fill(null),
              cv: Array(3).fill(null),
              aut: null
            };

            const existingDetailed = student.detailedGrades?.[selectedSubject]?.[selectedPeriod.toLowerCase()];
            if (existingDetailed) {
              if (existingDetailed.sb) detailed.sb = [...existingDetailed.sb];
              if (existingDetailed.sbh) detailed.sbh = [...existingDetailed.sbh];
              if (existingDetailed.sr) detailed.sr = [...existingDetailed.sr];
              if (existingDetailed.cv) detailed.cv = [...existingDetailed.cv];
              detailed.aut = existingDetailed.aut;
            }

            evalCols.forEach(col => {
              const cellVal = row[col.csvIdx];
              if (cellVal !== undefined && cellVal !== null && cellVal !== "") {
                const score = parseFloat(cellVal.toString().replace(",", "."));
                if (!isNaN(score) && score >= 0 && score <= 5) {
                  if (col.type === "SB") detailed.sb[col.idx] = score;
                  else if (col.type === "SBH") detailed.sbh[col.idx] = score;
                  else if (col.type === "SR") detailed.sr[col.idx] = score;
                  else if (col.type === "CV") detailed.cv[col.idx] = score;
                  else if (col.type === "AUT") detailed.aut = score;
                  totalGradesRead++;
                } else if (cellVal.toString().trim() !== "" && cellVal.toString().trim() !== "—") {
                  novelties.push(`Nota "${cellVal}" omitida por estar fuera de rango (0.0 - 5.0) para ${sName} en ${col.id}.`);
                }
              }
            });

            // Validar traslados de Grado/Curso
            const currentGradoNormalized = normalizeGrade(student.grado);
            const targetGradeNormalized = normalizeGrade(targetGrade);
            const isDifferentRoom = currentGradoNormalized !== targetGradeNormalized || student.curso !== targetCurso;

            if (isDifferentRoom) {
              roomChanges.push({
                nombre: `${student.primerApellido} ${student.primerNombre}`,
                documento: student.nroDocumento,
                antes: `${student.grado}-${student.curso}`,
                ahora: `${targetGrade}-${targetCurso}`
              });
            }

            parsedData.push({
              studentId: student.id,
              nombre: `${primerApellido} ${segundoApellido} ${primerNombre} ${segundoNombre}`.replace(/\s+/g, " ").trim() || `${student.primerApellido} ${student.primerNombre}`,
              documento: student.nroDocumento,
              detailed,
              grado: targetGrade,
              curso: targetCurso,
              primerNombre,
              segundoNombre,
              primerApellido,
              segundoApellido
            });
          }

          if (parsedData.length === 0) {
            setImportError("No se encontraron registros de estudiantes válidos en el archivo.");
            return;
          }

          setImportStats({
            totalRows: parsedData.length,
            targetGrade,
            targetCurso,
            matchedCount: parsedData.length,
            unmatched,
            roomChanges,
            updatedGradesCount: totalGradesRead,
            novelties,
            payload: parsedData
          });

        } catch (e: any) {
          console.error(e);
          setImportError(`Error de lectura: ${e.message}`);
        }
      },
      error: (err) => {
        setImportError(`Error en el lector de archivos CSV: ${err.message}`);
      }
    });
  };

  const handleApplyImport = async () => {
    if (!importStats || !importStats.payload) return;
    
    setIsImporting(true);
    setImportError(null);

    try {
      await importDetailedGrades(selectedSubject, selectedPeriod, importStats.payload);
      setImportSuccess(true);
      setTimeout(() => {
        setIsImportOpen(false);
        setImportFile(null);
        setImportStats(null);
        setImportSuccess(false);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setImportError(`No se pudo guardar la información en Firestore: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      processCSVFile(file);
    } else {
      setImportError("Solo se admiten archivos en formato CSV (.csv).");
    }
  };

  if (!mounted) return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary animate-spin" />
    </div>
  );

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
               className="flex-1 md:flex-none justify-center px-4 py-3 md:px-5 md:py-4 bg-secondary text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
             >
               <Download size={15} /> PDF
             </button>
             <button onClick={handleDownloadCSV} className="flex-1 md:flex-none justify-center px-4 py-3 md:p-4 bg-green-600 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-green-600/20 hover:scale-[1.02] transition-all flex items-center gap-2">
               <FileSpreadsheet size={15} /> Excel
             </button>
             <button onClick={() => setIsImportOpen(true)} className="flex-1 md:flex-none justify-center px-4 py-3 md:p-4 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all flex items-center gap-2">
               <Upload size={15} /> Subir Notas
             </button>
           </div>
        </div>
      </div>

      {/* Centro de Control de Alertas y Novedades de Calificaciones */}
      {alertStats.totalCount > 0 ? (
        <div className="max-w-[1200px] mx-auto mb-6 md:mb-8 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200 p-4 md:p-6 rounded-3xl shadow-lg print:hidden animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-md">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight leading-tight">
                  CENTRO DE ALERTAS DE NOTAS INCOMPLETAS
                </h3>
                <p className="text-[10px] md:text-xs text-slate-600 font-medium mt-0.5">
                  Se han detectado {alertStats.totalCount} estudiantes con pendientes de evaluación en {selectedSubject} ({selectedPeriod.toUpperCase()}).
                </p>
              </div>
            </div>
            <button
              onClick={() => printMissingGradesReport(filteredStudents, {
                grade: selectedGrade,
                course: selectedCurso,
                teacher: profile.name,
                subject: selectedSubject,
                period: selectedPeriod
              })}
              className="w-full md:w-auto px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest shadow-lg shadow-amber-600/25 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <FileWarning size={15} /> Generar Reporte de Pendientes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Sin notas */}
            <div className="bg-white/80 backdrop-blur border border-red-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-bold text-[10px] text-red-700 bg-red-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Sin Calificaciones
                </span>
                <span className="font-extrabold text-sm text-red-600">{alertStats.empty.length}</span>
              </div>
              {alertStats.empty.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-medium">Ningún estudiante sin notas.</p>
              ) : (
                <div className="max-h-[120px] overflow-y-auto space-y-1.5 scrollbar-thin">
                  {alertStats.empty.map(sa => (
                    <div key={sa.student.id} className="text-[9.5px] font-bold text-slate-700 leading-tight border-b border-slate-100 pb-1 last:border-b-0">
                      • {sa.student.primerApellido} {sa.student.primerNombre}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 2: Examen pendiente */}
            <div className="bg-white/80 backdrop-blur border border-amber-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-bold text-[10px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Exámenes Faltantes
                </span>
                <span className="font-extrabold text-sm text-amber-600">{alertStats.exams.length}</span>
              </div>
              {alertStats.exams.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-medium">Ningún examen pendiente.</p>
              ) : (
                <div className="max-h-[120px] overflow-y-auto space-y-1.5 scrollbar-thin">
                  {alertStats.exams.map(sa => (
                    <div key={sa.student.id} className="text-[9.5px] text-slate-700 leading-tight border-b border-slate-100 pb-1 last:border-b-0">
                      <span className="font-bold">• {sa.student.primerApellido} {sa.student.primerNombre}</span>
                      <div className="text-[8.5px] text-amber-600 font-semibold mt-0.5 ml-2">
                        Falta: {sa.missingExams.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3: Tareas pendientes */}
            <div className="bg-white/80 backdrop-blur border border-blue-100 rounded-2xl p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2.5">
                <span className="font-bold text-[10px] text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Tareas / Talleres
                </span>
                <span className="font-extrabold text-sm text-blue-600">{alertStats.tasks.length}</span>
              </div>
              {alertStats.tasks.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-medium">Ninguna actividad pendiente.</p>
              ) : (
                <div className="max-h-[120px] overflow-y-auto space-y-1.5 scrollbar-thin">
                  {alertStats.tasks.map(sa => (
                    <div key={sa.student.id} className="text-[9.5px] text-slate-700 leading-tight border-b border-slate-100 pb-1 last:border-b-0">
                      <span className="font-bold">• {sa.student.primerApellido} {sa.student.primerNombre}</span>
                      <div className="text-[8.5px] text-blue-600 font-semibold mt-0.5 ml-2">
                        Falta: {sa.missingTasks.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-[1200px] mx-auto mb-6 md:mb-8 bg-green-50 border border-green-200 p-4 rounded-3xl shadow-sm flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-5 h-5 text-green-600" />
            <span className="text-[10px] md:text-xs text-green-800 font-bold">
              ¡Planilla al día! Todos los alumnos cuentan con sus notas completas para las columnas activas.
            </span>
          </div>
          <button
            onClick={() => printMissingGradesReport(filteredStudents, {
              grade: selectedGrade,
              course: selectedCurso,
              teacher: profile.name,
              subject: selectedSubject,
              period: selectedPeriod
            })}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-[8.5px] uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm shadow-green-600/10"
          >
            <Printer size={13} /> Imprimir Estado
          </button>
        </div>
      )}

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
              <td className="border border-black font-bold text-center">{selectedGrade === "TODOS" ? "5-1" : selectedGrade.replace("°", "")}-{selectedCurso === "TODOS" ? "1" : selectedCurso} IETABA</td>
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
            {filteredStudents.map((st) => {
              const alertInfo = studentsWithAlerts.find(sa => sa.student.id === st.id);
              const alertBadge = alertInfo ? (
                alertInfo.alertType === "SIN_NOTAS" ? (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-600 ml-1.5 align-middle cursor-help print:hidden animate-pulse" title="Sin Calificaciones Registradas" />
                ) : alertInfo.alertType === "EXAMEN_PENDIENTE" ? (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-1.5 align-middle cursor-help print:hidden" title={`Examen pendiente: ${alertInfo.missingExams.join(', ')}`} />
                ) : alertInfo.alertType === "TAREA_PENDIENTE" ? (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 ml-1.5 align-middle cursor-help print:hidden" title={`Tareas pendientes: ${alertInfo.missingTasks.join(', ')}`} />
                ) : null
              ) : null;

              return (
                <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                  <td className="border border-black text-center p-0.5 font-mono opacity-60">{st.nroDocumento}</td>
                  <td className="border border-black px-1 uppercase leading-tight font-bold">
                    {st.primerApellido} {st.segundoApellido}
                    {alertBadge}
                  </td>
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
            );
            })}
            
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

      {/* MODAL DE IMPORTACIÓN PREMIUM DE NOTAS (STARTUP STYLE) */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 md:p-10 shadow-2xl space-y-6 border border-slate-200/50 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            
            {/* Cabecera Modal */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Carga Inteligente
                </span>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic mt-1.5">
                  Subir Planilla de Calificaciones
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  Asignatura: {selectedSubject} | Periodo: {selectedPeriod.toUpperCase()}
                </p>
              </div>
              <button 
                onClick={() => {
                  setIsImportOpen(false);
                  setImportFile(null);
                  setImportStats(null);
                  setImportError(null);
                  setImportSuccess(false);
                }} 
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido / Dropzone */}
            {!importStats && !importError && !importSuccess && (
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 transition-all duration-200 ${
                  dragOver 
                    ? "border-primary bg-primary/5 scale-[1.01]" 
                    : "border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400"
                }`}
              >
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner">
                  <Upload className="w-8 h-8 text-primary animate-bounce" />
                </div>
                <div>
                  <p className="font-extrabold text-slate-800 text-sm">Arrastra tu planilla exportada aquí</p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-1">O selecciona el archivo desde tu dispositivo (.csv)</p>
                </div>
                
                <label className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all active:scale-95 shadow-lg shadow-slate-950/20">
                  Seleccionar Archivo
                  <input 
                    type="file" 
                    accept=".csv" 
                    className="hidden" 
                    onChange={handleCSVUpload}
                  />
                </label>
              </div>
            )}

            {/* Errores */}
            {importError && (
              <div className="bg-red-50 border border-red-200 p-6 rounded-3xl flex flex-col items-center text-center gap-3 animate-in slide-in-from-bottom-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center shadow-inner">
                  <X size={24} className="stroke-[3]" />
                </div>
                <h4 className="font-black text-red-800 text-xs uppercase tracking-wider">Error en la Validación del Archivo</h4>
                <p className="text-[10px] text-red-700 font-medium leading-relaxed max-w-md">{importError}</p>
                <button 
                  onClick={() => {
                    setImportError(null);
                    setImportFile(null);
                  }}
                  className="px-5 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[9px] font-black uppercase tracking-wider mt-2 transition-all"
                >
                  Intentar con otro archivo
                </button>
              </div>
            )}

            {/* Éxito */}
            {importSuccess && (
              <div className="bg-green-50 border border-green-200 p-8 rounded-3xl flex flex-col items-center text-center gap-3 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 animate-pulse">
                  <Check size={36} className="stroke-[3]" />
                </div>
                <h4 className="font-black text-green-800 text-sm uppercase tracking-wider">¡Planilla Importada con Éxito!</h4>
                <p className="text-[10px] text-green-700 font-medium max-w-sm">
                  Las calificaciones del primer periodo y las novedades del curso se han cargado y sincronizado exitosamente con Firestore.
                </p>
              </div>
            )}

            {/* Previsualización y Estadísticas */}
            {importStats && !importSuccess && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="text-primary w-5 h-5" />
                    <div>
                      <p className="font-bold text-slate-800 text-[11px] truncate max-w-[250px]">{importFile?.name}</p>
                      <p className="text-[9px] text-slate-400 font-medium">Tamaño: {(importFile?.size || 0 / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setImportFile(null);
                      setImportStats(null);
                    }}
                    className="text-[9px] font-black text-red-600 hover:underline uppercase tracking-wider"
                  >
                    Cambiar archivo
                  </button>
                </div>

                {/* Métricas de Carga */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                    <p className="text-xs font-black text-slate-800">{importStats.totalRows}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1">Estudiantes Leídos</p>
                  </div>
                  <div className="bg-green-50 border border-green-150 rounded-2xl p-3 text-center">
                    <p className="text-xs font-black text-green-700">{importStats.updatedGradesCount}</p>
                    <p className="text-[8px] text-green-600 font-bold uppercase tracking-wider mt-1">Notas Cargadas</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-center">
                    <p className="text-xs font-black text-amber-700">{importStats.roomChanges.length}</p>
                    <p className="text-[8px] text-amber-600 font-bold uppercase tracking-wider mt-1">Traslados de Salón</p>
                  </div>
                  <div className="bg-red-50 border border-red-150 rounded-2xl p-3 text-center">
                    <p className="text-xs font-black text-red-700">{importStats.unmatched.length}</p>
                    <p className="text-[8px] text-red-600 font-bold uppercase tracking-wider mt-1">No Encontrados</p>
                  </div>
                </div>

                {/* Alerta de Traslados de Salón */}
                {importStats.roomChanges.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 max-h-[160px] overflow-y-auto">
                    <h5 className="font-extrabold text-[10px] text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle size={13} /> TRASLADOS DE SALÓN DETECTADOS (Se actualizará grado/curso en la BD)
                    </h5>
                    <div className="space-y-1 pl-1">
                      {importStats.roomChanges.map((change: any, idx: number) => (
                        <p key={idx} className="text-[9px] text-amber-700 font-semibold leading-tight">
                          • {change.nombre} (ID: {change.documento}): Se moverá de {change.antes} a {change.ahora}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alerta de no emparejados */}
                {importStats.unmatched.length > 0 && (
                  <div className="bg-red-50 border border-red-150 rounded-2xl p-4 space-y-2 max-h-[140px] overflow-y-auto">
                    <h5 className="font-extrabold text-[10px] text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                      <X size={13} className="stroke-[3]" /> ESTUDIANTES OMITIDOS (No existen en la base de datos local)
                    </h5>
                    <div className="space-y-1 pl-1">
                      {importStats.unmatched.map((unm: string, idx: number) => (
                        <p key={idx} className="text-[9px] text-red-700 font-medium">• {unm}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Novedades / Advertencias de Notas */}
                {importStats.novelties.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1.5 max-h-[120px] overflow-y-auto">
                    <h5 className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wider">
                      ADVERTENCIAS DE FORMATO
                    </h5>
                    <div className="space-y-1 pl-1">
                      {importStats.novelties.map((nov: string, idx: number) => (
                        <p key={idx} className="text-[9px] text-slate-600 font-medium">• {nov}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previsualización del Lote */}
                <div className="space-y-2">
                  <h5 className="font-black text-[10px] text-slate-700 uppercase tracking-wider">Previsualización del Lote de Carga</h5>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-[9px]">
                      <thead className="bg-slate-50 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2 text-slate-600">Estudiante</th>
                          <th className="p-2 text-slate-600 text-center">Salón Actual</th>
                          <th className="p-2 text-slate-600 text-center">Salón Nuevo</th>
                          <th className="p-2 text-slate-600 text-center">Calificaciones Leídas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importStats.payload.slice(0, 3).map((item: any, idx: number) => {
                          const originalSt = students.find(s => s.id === item.studentId);
                          const counts = [
                            ...item.detailed.sb,
                            ...item.detailed.sbh,
                            ...item.detailed.sr,
                            ...item.detailed.cv,
                            item.detailed.aut
                          ].filter(v => typeof v === 'number').length;

                          return (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="p-2 font-semibold text-slate-800">{item.nombre}</td>
                              <td className="p-2 text-center text-slate-500 font-medium">{originalSt?.grado}-{originalSt?.curso}</td>
                              <td className={`p-2 text-center font-bold ${originalSt?.grado !== item.grado || originalSt?.curso !== item.curso ? 'text-amber-600' : 'text-slate-500'}`}>
                                {item.grado}-{item.curso}
                              </td>
                              <td className="p-2 text-center text-indigo-600 font-bold">{counts} notas definidas</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {importStats.payload.length > 3 && (
                      <p className="text-center p-2 bg-slate-50 text-[8.5px] text-slate-400 font-bold border-t border-slate-200 uppercase tracking-wider">
                        y {importStats.payload.length - 3} estudiantes más en el lote...
                      </p>
                    )}
                  </div>
                </div>

                {/* Acciones del Modal */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    disabled={isImporting}
                    onClick={() => {
                      setImportFile(null);
                      setImportStats(null);
                    }}
                    className="px-5 py-3 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-50 transition-all"
                  >
                    Volver a Cargar
                  </button>
                  <button 
                    disabled={isImporting}
                    onClick={handleApplyImport}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Sincronizando Firestore...
                      </>
                    ) : (
                      "Aplicar Actualización Masiva"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
