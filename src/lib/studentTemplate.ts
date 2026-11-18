import { normalizeGrade } from "./constants";
import { toTitleCase, ParentescoAcudiente, EstadoMatricula } from "@/context/AppContext";
import { downloadRowsAsExcel } from "./spreadsheetUtils";

export interface StandardizedStudentRow {
  grado: string;
  curso: string;
  tipoDocumento: string;
  nroDocumento: string;
  primerApellido: string;
  segundoApellido: string;
  primerNombre: string;
  segundoNombre: string;
  fechaNacimiento: string;
  genero: string;
  acudienteNombres?: string;
  acudienteApellidos?: string;
  acudienteParentesco?: ParentescoAcudiente;
  acudienteTelefono?: string;
  acudienteVereda?: string;
  estadoMatricula?: EstadoMatricula;
}

export interface StudentRowValidationIssue {
  rowNumber: number;
  nroDocumento: string;
  studentName: string;
  field: string;
  level: "error" | "warning";
  message: string;
}

export interface StudentCSVParseResult {
  validRows: StandardizedStudentRow[];
  issues: StudentRowValidationIssue[];
  hasBlockingErrors: boolean;
  totalRawRows: number;
}

export const STUDENT_CSV_HEADERS = [
  "GRADO",
  "CURSO IETABA",
  "TIPO DOC.",
  "NRO DOCUMENTO",
  "PRIMER APELLIDO",
  "SEGUNDO APELLIDO",
  "PRIMER NOMBRE",
  "SEGUNDO NOMBRE",
  "FECHA NACIMIENTO",
  "GENERO",
  "ACUDIENTE NOMBRES",
  "ACUDIENTE APELLIDOS",
  "PARENTESCO",
  "TELEFONO ACUDIENTE",
  "VEREDA / COMUNIDAD",
  "ESTADO MATRICULA",
] as const;

const EXAMPLE_STUDENTS_ROWS = [
  {
    "GRADO": "6°",
    "CURSO IETABA": "1",
    "TIPO DOC.": "T.I.",
    "NRO DOCUMENTO": "1085900101",
    "PRIMER APELLIDO": "PAI",
    "SEGUNDO APELLIDO": "NASTAR",
    "PRIMER NOMBRE": "YULIANA",
    "SEGUNDO NOMBRE": "ANDREA",
    "FECHA NACIMIENTO": "2013-04-15",
    "GENERO": "F",
    "ACUDIENTE NOMBRES": "MARIA ELENA",
    "ACUDIENTE APELLIDOS": "NASTAR PAI",
    "PARENTESCO": "MADRE",
    "TELEFONO ACUDIENTE": "3150001122",
    "VEREDA / COMUNIDAD": "EL DIVISO",
    "ESTADO MATRICULA": "MATRICULADO",
  },
  {
    "GRADO": "6°",
    "CURSO IETABA": "1",
    "TIPO DOC.": "T.I.",
    "NRO DOCUMENTO": "1085900102",
    "PRIMER APELLIDO": "CUASALUZAN",
    "SEGUNDO APELLIDO": "BISBICUS",
    "PRIMER NOMBRE": "JHON",
    "SEGUNDO NOMBRE": "ESTEBAN",
    "FECHA NACIMIENTO": "2013-08-22",
    "GENERO": "M",
    "ACUDIENTE NOMBRES": "SEGUNDO ALBERTO",
    "ACUDIENTE APELLIDOS": "CUASALUZAN",
    "PARENTESCO": "PADRE",
    "TELEFONO ACUDIENTE": "3160003344",
    "VEREDA / COMUNIDAD": "ALTAQUER",
    "ESTADO MATRICULA": "MATRICULADO",
  },
];

export function excelSerialToISODate(serial: any): string | null {
  if (serial === undefined || serial === null) return "";
  const str = String(serial).trim();
  if (!str) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [p1, p2, y] = str.split("/");
    const n1 = Number(p1);
    const n2 = Number(p2);
    const [d, m] = n2 > 12 && n1 <= 12 ? [p2, p1] : [p1, p2];
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(str)) {
    const [p1, p2, yy] = str.split("/");
    const n1 = Number(p1);
    const n2 = Number(p2);
    const [m, d] = n1 > 12 && n2 <= 12 ? [p2, p1] : [p1, p2];
    const fullYear = Number(yy) <= 29 ? `20${yy.padStart(2, "0")}` : `19${yy.padStart(2, "0")}`;
    return `${fullYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const num = Number(str);
  if (!isNaN(num) && num > 10000 && num < 60000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  return null;
}

export function buildStudentTemplateRows(withExamples: boolean): Record<string, any>[] {
  return withExamples
    ? EXAMPLE_STUDENTS_ROWS
    : [
        STUDENT_CSV_HEADERS.reduce((acc, col) => {
          acc[col] = "";
          return acc;
        }, {} as Record<string, string>),
      ];
}

export function downloadStudentTemplate(withExamples: boolean): void {
  const rows = buildStudentTemplateRows(withExamples);
  const filename = withExamples
    ? "Formato_Estudiantes_SIMAT_IETABA_Ejemplo.xlsx"
    : "Formato_Estudiantes_SIMAT_IETABA_EnBlanco.xlsx";
  downloadRowsAsExcel(rows, filename, "Estudiantes SIMAT", STUDENT_CSV_HEADERS);
}

export function downloadStudentNoveltiesCSV(issues: StudentRowValidationIssue[]): void {
  const rows = issues.map(iss => ({
    FILA_ARCHIVO: iss.rowNumber,
    NRO_DOCUMENTO: iss.nroDocumento,
    ESTUDIANTE: iss.studentName,
    CAMPO_CON_NOVEDAD: iss.field,
    DETALLE_NOVEDAD: iss.message,
    ACCION_REQUERIDA: "Corregir en el archivo Excel/CSV antes de volver a cargar",
  }));
  downloadRowsAsExcel(rows, "Reporte_Novedades_Estudiantes_IETABA.xlsx", "Novedades Estudiantes");
}

const VALID_PARENTESCOS: ParentescoAcudiente[] = [
  "MADRE",
  "PADRE",
  "ABUELO(A)",
  "TÍO(A)",
  "HERMANO(A)",
  "TUTOR LEGAL",
  "OTRO",
];

const VALID_ESTADOS: EstadoMatricula[] = [
  "MATRICULADO",
  "RETIRADO",
  "DESERTOR",
  "TRASLADADO",
  "FALLECIDO",
  "SUSPENDIDO",
];

export function parseAndValidateStudentsCSV(rawRows: any[], uppercaseNames = true): StudentCSVParseResult {
  const validRows: StandardizedStudentRow[] = [];
  const issues: StudentRowValidationIssue[] = [];
  const seenDocs = new Map<string, number>();

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 header, +1 1-based
    const s: Record<string, any> = {};
    Object.keys(row || {}).forEach((k, colIdx) => {
      const cleanKey = k
        .replace(/^\uFEFF/, "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[._-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      s[cleanKey] = row[k];
      s[`pos_${colIdx}`] = row[k];
    });

    // Skip completely empty rows
    const allValues = Object.keys(row || {}).map(k => String(row[k] ?? "").trim());
    if (allValues.every(v => v === "")) {
      return;
    }

    const rawDoc = String(
      s["nro documento"] ??
      s["documento"] ??
      s["nrodocumento"] ??
      s["numero documento"] ??
      s["identificacion"] ??
      s["codigo"] ??
      s.pos_3 ??
      ""
    ).trim();

    const rawGrado = String(
      s["grado"] ?? s["nivel"] ?? s.pos_0 ?? ""
    ).trim();

    const rawCursoInput = String(
      s["curso ietaba"] ?? s["curso"] ?? s["grupo"] ?? s.pos_1 ?? ""
    ).trim().toUpperCase();

    const rawTipoDoc = String(
      s["tipo doc"] ?? s["tipo documento"] ?? s["tipodoc"] ?? s["tipo"] ?? s.pos_2 ?? "T.I."
    ).trim().toUpperCase();

    const rawApellido1 = String(
      s["primer apellido"] ?? s["apellido1"] ?? s["primerapellido"] ?? s["apellido"] ?? s.pos_4 ?? ""
    ).trim();
    const rawApellido2 = String(
      s["segundo apellido"] ?? s["apellido2"] ?? s["segundoapellido"] ?? s.pos_5 ?? ""
    ).trim();
    const rawNombre1 = String(
      s["primer nombre"] ?? s["nombre1"] ?? s["primernombre"] ?? s["nombre"] ?? s.pos_6 ?? ""
    ).trim();
    const rawNombre2 = String(
      s["segundo nombre"] ?? s["nombre2"] ?? s["segundonombre"] ?? s.pos_7 ?? ""
    ).trim();

    const formatName = (val: string) =>
      uppercaseNames ? val.toUpperCase() : toTitleCase(val);

    const displayStudentName =
      `${rawApellido1} ${rawApellido2} ${rawNombre1} ${rawNombre2}`.replace(/\s+/g, " ").trim() ||
      `Fila #${rowNumber}`;

    let rowHasError = false;

    if (!rawDoc) {
      issues.push({
        rowNumber,
        nroDocumento: "SIN DOC",
        studentName: displayStudentName,
        field: "NRO DOCUMENTO",
        level: "error",
        message: "Falta el número de documento (NRO DOCUMENTO).",
      });
      rowHasError = true;
    } else if (seenDocs.has(rawDoc)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc,
        studentName: displayStudentName,
        field: "NRO DOCUMENTO",
        level: "error",
        message: `Documento duplicado (${rawDoc}) en el archivo (ya aparece en la fila #${seenDocs.get(rawDoc)}).`,
      });
      rowHasError = true;
    } else {
      seenDocs.set(rawDoc, rowNumber);
    }

    if (!rawGrado) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "GRADO",
        level: "error",
        message: "Falta el GRADO del estudiante.",
      });
      rowHasError = true;
    }

    if (!rawCursoInput) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "CURSO IETABA",
        level: "error",
        message: "Falta el CURSO IETABA (ej: 1, 2 o 6-1).",
      });
      rowHasError = true;
    }

    if (!rawApellido1) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "PRIMER APELLIDO",
        level: "error",
        message: "Falta el PRIMER APELLIDO obligatorio.",
      });
      rowHasError = true;
    }

    if (!rawNombre1) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "PRIMER NOMBRE",
        level: "error",
        message: "Falta el PRIMER NOMBRE obligatorio.",
      });
      rowHasError = true;
    }

    const rawFecha = s["fecha nacimiento"] ?? s["fechanacimiento"] ?? s["fecha nac"] ?? s["nacimiento"] ?? s.pos_8 ?? "";
    const parsedFecha = excelSerialToISODate(rawFecha);
    if (parsedFecha === null) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "FECHA NACIMIENTO",
        level: "error",
        message: `Formato de fecha inválido ("${rawFecha}"). Usa AAAA-MM-DD (ej: 2013-04-15) o DD/MM/AAAA.`,
      });
      rowHasError = true;
    }

    const rawGeneroVal = String(s["genero"] ?? s["sexo"] ?? s.pos_9 ?? "").trim().toUpperCase();
    if (rawGeneroVal && !["M", "F", "MASCULINO", "FEMENINO"].includes(rawGeneroVal)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "GENERO",
        level: "error",
        message: `Género inválido ("${rawGeneroVal}"). Usa 'M' o 'F'.`,
      });
      rowHasError = true;
    }

    const rawParentesco = String(s["parentesco"] ?? s["acudiente parentesco"] ?? "")
      .trim()
      .toUpperCase();
    if (rawParentesco && !VALID_PARENTESCOS.includes(rawParentesco as ParentescoAcudiente)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "PARENTESCO",
        level: "error",
        message: `Parentesco inválido ("${rawParentesco}"). Valores permitidos: ${VALID_PARENTESCOS.join(", ")}.`,
      });
      rowHasError = true;
    }

    const rawEstado = String(s["estado matricula"] ?? s["estado"] ?? "")
      .trim()
      .toUpperCase();
    if (rawEstado && !VALID_ESTADOS.includes(rawEstado as EstadoMatricula)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        studentName: displayStudentName,
        field: "ESTADO MATRICULA",
        level: "error",
        message: `Estado de matrícula inválido ("${rawEstado}"). Valores permitidos: ${VALID_ESTADOS.join(", ")}.`,
      });
      rowHasError = true;
    }

    if (rowHasError) {
      return;
    }

    let rawCurso = rawCursoInput;
    if (rawCurso.includes("-")) {
      const parts = rawCurso.split("-");
      rawCurso = parts[parts.length - 1] || "1";
    }

    const genero = rawGeneroVal.startsWith("F") ? "F" : "M";
    const acudienteNombres = String(
      s["acudiente nombres"] ?? s["nombres acudiente"] ?? s["acudiente"] ?? ""
    ).trim().toUpperCase();
    const acudienteApellidos = String(
      s["acudiente apellidos"] ?? s["apellidos acudiente"] ?? ""
    ).trim().toUpperCase();
    const acudienteParentesco = VALID_PARENTESCOS.find(p => p === rawParentesco);
    const acudienteTelefono = String(
      s["telefono acudiente"] ?? s["celular acudiente"] ?? s["telefono"] ?? ""
    ).trim();
    const acudienteVereda = String(
      s["vereda / comunidad"] ?? s["vereda"] ?? s["comunidad"] ?? ""
    ).trim().toUpperCase();
    const estadoMatricula: EstadoMatricula =
      VALID_ESTADOS.find(e => e === rawEstado) || "MATRICULADO";

    const studentRow: StandardizedStudentRow = {
      grado: normalizeGrade(rawGrado),
      curso: rawCurso || "1",
      tipoDocumento: rawTipoDoc || "T.I.",
      nroDocumento: rawDoc,
      primerApellido: formatName(rawApellido1),
      segundoApellido: formatName(rawApellido2),
      primerNombre: formatName(rawNombre1),
      segundoNombre: formatName(rawNombre2),
      fechaNacimiento: parsedFecha || "",
      genero,
      ...(acudienteNombres ? { acudienteNombres } : {}),
      ...(acudienteApellidos ? { acudienteApellidos } : {}),
      ...(acudienteParentesco ? { acudienteParentesco } : {}),
      ...(acudienteTelefono ? { acudienteTelefono } : {}),
      ...(acudienteVereda ? { acudienteVereda } : {}),
      estadoMatricula,
    };

    validRows.push(studentRow);
  });

  if (validRows.length === 0 && issues.length === 0) {
    issues.push({
      rowNumber: 1,
      nroDocumento: "—",
      studentName: "Archivo vacío",
      field: "ARCHIVO",
      level: "error",
      message: "El archivo no contiene registros de estudiantes. Usa el Formato Ejemplo o Formato en Blanco.",
    });
  }

  return {
    validRows,
    issues,
    hasBlockingErrors: issues.length > 0,
    totalRawRows: rawRows.length,
  };
}
