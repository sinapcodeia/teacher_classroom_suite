import { Student } from "@/context/AppContext";
import { DetailedGrades, calculatePeriodGrades } from "./gradeUtils";
import { downloadRowsAsExcel } from "./spreadsheetUtils";

export const GRADEBOOK_CSV_COLUMNS = [
  "CODIGO",
  "PRIMER_APELLIDO",
  "SEGUNDO_APELLIDO",
  "PRIMER_NOMBRE",
  "SEGUNDO_NOMBRE",
  "SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7", "SB8",
  "SBH1", "SBH2", "SBH3", "SBH4", "SBH5", "SBH6", "SBH7", "SBH8",
  "SR1", "SR2", "SR3", "SR4", "SR5",
  "CV1", "CV2", "CV3",
  "AUT",
  "PARCIAL",
  "REC",
  "FINAL",
] as const;

export interface GradebookGovernanceNovelty {
  rowNumber: number;
  codigo: string;
  studentName: string;
  column: string;
  valueFound: string;
  reason: string;
}

export interface GradebookRowPreview {
  studentId: string;
  codigo: string;
  studentName: string;
  detailed: DetailedGrades;
  parcial: number;
  rec: number | null;
  definitiva: number;
  isModified: boolean;
}

export interface GradebookValidationSummary {
  validItems: GradebookRowPreview[];
  novelties: GradebookGovernanceNovelty[];
  hasBlockingErrors: boolean;
  passingCount: number;
  riskCount: number;
}

export function buildGradebookRows(
  students: Student[],
  subject: string,
  selectedPeriod: string,
  mode: "current" | "blank" | "example"
): Record<string, any>[] {
  const rows: Record<string, any>[] = [];

  if (mode === "example" && students.length === 0) {
    rows.push({
      CODIGO: "1085900101",
      PRIMER_APELLIDO: "PAI",
      SEGUNDO_APELLIDO: "NASTAR",
      PRIMER_NOMBRE: "YULIANA",
      SEGUNDO_NOMBRE: "ANDREA",
      SB1: 4.2, SB2: 4.0, SB3: 4.5, SB4: "", SB5: "", SB6: "", SB7: "", SB8: "",
      SBH1: 4.5, SBH2: 4.3, SBH3: 4.0, SBH4: "", SBH5: "", SBH6: "", SBH7: "", SBH8: "",
      SR1: 4.8, SR2: 4.5, SR3: "", SR4: "", SR5: "",
      CV1: 5.0, CV2: 4.8, CV3: "",
      AUT: 4.5,
      PARCIAL: 4.4,
      REC: "",
      FINAL: 4.4,
    });
  } else {
    students.forEach((s, idx) => {
      const existing = s.detailedGrades?.[subject]?.[selectedPeriod] || {
        sb: Array(8).fill(null),
        sbh: Array(8).fill(null),
        sr: Array(5).fill(null),
        cv: Array(3).fill(null),
        aut: null,
        rec: null,
      };

      const isExampleRow = mode === "example" && idx === 0;
      const grades: DetailedGrades =
        mode === "blank"
          ? {
              sb: Array(8).fill(null),
              sbh: Array(8).fill(null),
              sr: Array(5).fill(null),
              cv: Array(3).fill(null),
              aut: null,
              rec: null,
            }
          : isExampleRow
          ? {
              sb: [4.2, 4.0, 4.5, null, null, null, null, null],
              sbh: [4.5, 4.3, 4.0, null, null, null, null, null],
              sr: [4.8, 4.5, null, null, null],
              cv: [5.0, 4.8, null],
              aut: 4.5,
              rec: null,
            }
          : existing;

      const row: Record<string, any> = {
        CODIGO: s.nroDocumento,
        PRIMER_APELLIDO: s.primerApellido,
        SEGUNDO_APELLIDO: s.segundoApellido || "",
        PRIMER_NOMBRE: s.primerNombre,
        SEGUNDO_NOMBRE: s.segundoNombre || "",
      };

      const periodNotes = calculatePeriodGrades(grades);

      grades.sb.forEach((v, i) => (row[`SB${i + 1}`] = v != null ? v : ""));
      grades.sbh.forEach((v, i) => (row[`SBH${i + 1}`] = v != null ? v : ""));
      grades.sr.forEach((v, i) => (row[`SR${i + 1}`] = v != null ? v : ""));
      grades.cv.forEach((v, i) => (row[`CV${i + 1}`] = v != null ? v : ""));
      row["AUT"] = grades.aut != null ? grades.aut : "";
      row["PARCIAL"] = mode === "blank" ? "" : periodNotes.parcial;
      row["REC"] = grades.rec != null ? grades.rec : "";
      row["FINAL"] = mode === "blank" ? "" : periodNotes.definitiva;

      rows.push(row);
    });
  }

  return rows;
}

export function downloadGradebookTemplate(
  students: Student[],
  subject: string,
  course: string,
  selectedPeriod: string,
  mode: "current" | "blank" | "example"
): void {
  const rows = buildGradebookRows(students, subject, selectedPeriod, mode);
  const periodLabel = selectedPeriod.toUpperCase();
  const suffix =
    mode === "example"
      ? "Con_Ejemplo"
      : mode === "blank"
      ? "En_Blanco"
      : "Actual";
  downloadRowsAsExcel(
    rows,
    `Planilla_${subject}_${course}_${periodLabel}_${suffix}.xlsx`,
    `Planilla ${periodLabel}`,
    GRADEBOOK_CSV_COLUMNS
  );
}

export function downloadGradebookNoveltiesCSV(
  novelties: GradebookGovernanceNovelty[],
  subject: string,
  course: string
): void {
  const rows = novelties.map(n => ({
    FILA_ARCHIVO: n.rowNumber,
    CODIGO_ESTUDIANTE: n.codigo,
    ESTUDIANTE: n.studentName,
    COLUMNA: n.column,
    VALOR_ENCONTRADO: n.valueFound,
    NOVEDAD_GOBERNANZA: n.reason,
    ACCION_REQUERIDA: "Corregir en el archivo Excel/CSV antes de volver a subir la planilla",
  }));
  downloadRowsAsExcel(
    rows,
    `Reporte_Novedades_Planilla_${subject}_${course}.xlsx`,
    "Novedades Planilla"
  );
}

export function validateGradebookCSV(
  rawRows: any[],
  courseStudents: Student[],
  subject: string,
  targetPeriod: string
): GradebookValidationSummary {
  const validItems: GradebookRowPreview[] = [];
  const novelties: GradebookGovernanceNovelty[] = [];
  const seenCodes = new Map<string, number>();

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2;
    const norm: Record<string, any> = {};
    Object.keys(rawRow || {}).forEach(k => {
      const clean = k.replace(/^\uFEFF/, "").trim().toUpperCase();
      norm[clean] = rawRow[k];
    });

    const allValues = Object.keys(rawRow || {}).map(k => String(rawRow[k] ?? "").trim());
    if (allValues.every(v => v === "")) {
      return; // Skip empty line
    }

    const codigo = String(
      norm["CODIGO"] ?? norm["NRO DOCUMENTO"] ?? norm["DOCUMENTO"] ?? ""
    ).trim();

    const rowName = `${norm["PRIMER_APELLIDO"] || norm["PRIMER APELLIDO"] || ""} ${
      norm["PRIMER_NOMBRE"] || norm["PRIMER NOMBRE"] || ""
    }`.trim();

    if (!codigo) {
      novelties.push({
        rowNumber,
        codigo: "SIN CÓDIGO",
        studentName: rowName || `Fila #${rowNumber}`,
        column: "CODIGO",
        valueFound: "(Vacío)",
        reason: "Falta el CODIGO (Nro. Documento) del estudiante.",
      });
      return;
    }

    if (seenCodes.has(codigo)) {
      novelties.push({
        rowNumber,
        codigo,
        studentName: rowName || `Fila #${rowNumber}`,
        column: "CODIGO",
        valueFound: codigo,
        reason: `Código duplicado en la planilla (ya aparece en la fila #${seenCodes.get(codigo)}).`,
      });
      return;
    }
    seenCodes.set(codigo, rowNumber);

    const student = courseStudents.find(
      s => String(s.nroDocumento).trim() === codigo
    );

    if (!student) {
      novelties.push({
        rowNumber,
        codigo,
        studentName: rowName || "No registrado en el curso",
        column: "CODIGO",
        valueFound: codigo,
        reason: "El documento no pertenece al curso activo o el estudiante está inactivo.",
      });
      return;
    }

    const fullStudentName = `${student.primerApellido} ${student.segundoApellido || ""}, ${student.primerNombre}`
      .replace(/\s+/g, " ")
      .trim();

    let rowHasScoreError = false;

    const parseScore = (colName: string, rawVal: any): number | null => {
      if (rawVal === "" || rawVal === undefined || rawVal === null) return null;
      const str = String(rawVal).trim().replace(",", ".");
      if (!str || str === "-") return null;
      const n = Number(str);
      if (isNaN(n)) {
        novelties.push({
          rowNumber,
          codigo,
          studentName: fullStudentName,
          column: colName,
          valueFound: String(rawVal),
          reason: `Valor no numérico en ${colName} ("${rawVal}"). Usa números entre 1.0 y 5.0.`,
        });
        rowHasScoreError = true;
        return null;
      }
      if (n < 0 || n > 5) {
        novelties.push({
          rowNumber,
          codigo,
          studentName: fullStudentName,
          column: colName,
          valueFound: String(rawVal),
          reason: `Nota fuera de rango institucional SIEEE en ${colName} (${n}). El rango permitido es 0.0 a 5.0.`,
        });
        rowHasScoreError = true;
        return null;
      }
      return Math.round(n * 10) / 10;
    };

    const detailed: DetailedGrades = {
      sb: Array(8)
        .fill(null)
        .map((_, i) => parseScore(`SB${i + 1}`, norm[`SB${i + 1}`])),
      sbh: Array(8)
        .fill(null)
        .map((_, i) => parseScore(`SBH${i + 1}`, norm[`SBH${i + 1}`])),
      sr: Array(5)
        .fill(null)
        .map((_, i) => parseScore(`SR${i + 1}`, norm[`SR${i + 1}`])),
      cv: Array(3)
        .fill(null)
        .map((_, i) => parseScore(`CV${i + 1}`, norm[`CV${i + 1}`])),
      aut: parseScore("AUT", norm["AUT"]),
      rec: parseScore("REC", norm["REC"] ?? norm["REC1"]),
    };

    if (rowHasScoreError) {
      return;
    }

    const currentGrades = student.detailedGrades?.[subject]?.[targetPeriod];
    const isModified = JSON.stringify(currentGrades) !== JSON.stringify(detailed);
    const calc = calculatePeriodGrades(detailed);

    validItems.push({
      studentId: student.id,
      codigo: student.nroDocumento,
      studentName: fullStudentName,
      detailed,
      parcial: calc.parcial,
      rec: calc.rec ?? null,
      definitiva: calc.definitiva,
      isModified,
    });
  });

  if (validItems.length === 0 && novelties.length === 0) {
    novelties.push({
      rowNumber: 1,
      codigo: "—",
      studentName: "Planilla vacía",
      column: "ARCHIVO",
      valueFound: "(Sin filas)",
      reason: "El archivo no contiene registros de calificaciones.",
    });
  }

  const passingCount = validItems.filter(i => i.definitiva >= 3.0).length;
  const riskCount = validItems.filter(i => i.definitiva > 0 && i.definitiva < 3.0).length;

  return {
    validItems,
    novelties,
    hasBlockingErrors: novelties.length > 0 || validItems.length === 0,
    passingCount,
    riskCount,
  };
}
