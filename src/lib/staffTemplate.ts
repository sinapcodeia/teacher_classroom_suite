import { normalizeGrade } from "./constants";
import { downloadRowsAsExcel } from "./spreadsheetUtils";

export type StaffRole =
  | "RECTOR"
  | "COORDINADOR"
  | "BIENESTAR"
  | "DOCENTE"
  | "DOCENTE_DIRECTOR";

export const STAFF_EXCEL_HEADERS = [
  "TIPO DOC.",
  "NRO DOCUMENTO",
  "PRIMER APELLIDO",
  "SEGUNDO APELLIDO",
  "PRIMER NOMBRE",
  "SEGUNDO NOMBRE",
  "CORREO ELECTRONICO",
  "TELEFONO / WHATSAPP",
  "ROL INSTITUCIONAL",
  "ES DIRECTOR DE GRUPO",
  "GRADO DIRECTOR",
  "CURSO DIRECTOR",
  "ASIGNATURAS",
  "CURSOS ASIGNADOS",
  "SEDE / AREA",
  "ESTADO",
] as const;

export interface StandardizedStaffRow {
  tipoDocumento: string;
  nroDocumento: string;
  primerApellido: string;
  segundoApellido: string;
  primerNombre: string;
  segundoNombre: string;
  email: string;
  phone: string;
  role: StaffRole;
  isDirectorGrupo: boolean;
  directorGrado: string;
  directorCurso: string;
  teachingSubjectsList: string[];
  teachingCourses: string[];
  teachingGrades: string[];
  sedeArea: string;
  estado: "ACTIVO" | "INACTIVO";
}

export interface StaffValidationIssue {
  rowNumber: number;
  nroDocumento: string;
  staffName: string;
  field: string;
  level: "error" | "warning";
  message: string;
}

export interface StaffParseResult {
  validRows: StandardizedStaffRow[];
  issues: StaffValidationIssue[];
  hasBlockingErrors: boolean;
  totalRawRows: number;
}

export const EXAMPLE_STAFF_ROWS: Record<string, string>[] = [
  {
    "TIPO DOC.": "C.C.",
    "NRO DOCUMENTO": "1085911223",
    "PRIMER APELLIDO": "RODRIGUEZ",
    "SEGUNDO APELLIDO": "BURGOS",
    "PRIMER NOMBRE": "JESUS",
    "SEGUNDO NOMBRE": "ANTONIO",
    "CORREO ELECTRONICO": "docente.tecnologia@ietaba.edu.co",
    "TELEFONO / WHATSAPP": "3151234567",
    "ROL INSTITUCIONAL": "DOCENTE",
    "ES DIRECTOR DE GRUPO": "NO",
    "GRADO DIRECTOR": "",
    "CURSO DIRECTOR": "",
    "ASIGNATURAS": "TECNOLOGÍA, FÍSICA",
    "CURSOS ASIGNADOS": "5-1, 5-2, 6-3",
    "SEDE / AREA": "Sede Principal · Tecnología e Informática",
    "ESTADO": "ACTIVO",
  },
  {
    "TIPO DOC.": "C.C.",
    "NRO DOCUMENTO": "1085922334",
    "PRIMER APELLIDO": "NASTAR",
    "SEGUNDO APELLIDO": "PAI",
    "PRIMER NOMBRE": "MARIA",
    "SEGUNDO NOMBRE": "ELENA",
    "CORREO ELECTRONICO": "maria.nastar@ietaba.edu.co",
    "TELEFONO / WHATSAPP": "3162345678",
    "ROL INSTITUCIONAL": "DOCENTE_DIRECTOR",
    "ES DIRECTOR DE GRUPO": "SI",
    "GRADO DIRECTOR": "6°",
    "CURSO DIRECTOR": "1",
    "ASIGNATURAS": "MATEMÁTICAS",
    "CURSOS ASIGNADOS": "6-1, 6-2, 7-1",
    "SEDE / AREA": "Sede Principal · Matemáticas",
    "ESTADO": "ACTIVO",
  },
  {
    "TIPO DOC.": "C.C.",
    "NRO DOCUMENTO": "1085933445",
    "PRIMER APELLIDO": "TAICUS",
    "SEGUNDO APELLIDO": "BISBICUS",
    "PRIMER NOMBRE": "CARLOS",
    "SEGUNDO NOMBRE": "ALBERTO",
    "CORREO ELECTRONICO": "coordinacion@ietaba.edu.co",
    "TELEFONO / WHATSAPP": "3173456789",
    "ROL INSTITUCIONAL": "COORDINADOR",
    "ES DIRECTOR DE GRUPO": "NO",
    "GRADO DIRECTOR": "",
    "CURSO DIRECTOR": "",
    "ASIGNATURAS": "",
    "CURSOS ASIGNADOS": "",
    "SEDE / AREA": "Sede Principal · Coordinación Académica",
    "ESTADO": "ACTIVO",
  },
];

function normalizeHeaderKey(key: string): string {
  return key
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeStaffRole(raw: string): StaffRole | null {
  const clean = raw
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!clean) return null;
  if (clean === "RECTOR" || clean === "RECTORIA" || clean === "RECTOR(A)") return "RECTOR";
  if (clean === "COORDINADOR" || clean === "COORDINADORA" || clean === "COORDINACION") return "COORDINADOR";
  if (
    clean === "BIENESTAR" ||
    clean === "ORIENTADOR" ||
    clean === "ORIENTADORA" ||
    clean === "PSICOORIENTADOR" ||
    clean === "PSICOLOGO"
  ) {
    return "BIENESTAR";
  }
  if (
    clean === "DOCENTE DIRECTOR" ||
    clean === "DIRECTOR DE GRUPO" ||
    clean === "DIRECTOR GRUPO" ||
    clean === "DOCENTE_DIRECTOR"
  ) {
    return "DOCENTE_DIRECTOR";
  }
  if (clean === "DOCENTE" || clean === "PROFESOR" || clean === "PROFESORA" || clean === "DOCENTE DE AULA") {
    return "DOCENTE";
  }
  return null;
}

function splitListTokens(raw: string): string[] {
  if (!raw) return [];
  return Array.from(
    new Set(
      raw
        .split(/[,;|]+/)
        .map(item => item.trim().toUpperCase())
        .filter(Boolean)
    )
  );
}

/**
 * Descarga la plantilla oficial Excel (.xlsx) para cargar la base de datos de docentes y directorio.
 */
export function downloadStaffTemplateExcel(includeExamples = true): void {
  const rows: Record<string, string>[] = includeExamples
    ? EXAMPLE_STAFF_ROWS
    : [
        STAFF_EXCEL_HEADERS.reduce((acc, header) => {
          acc[header] = "";
          return acc;
        }, {} as Record<string, string>),
      ];

  const filename = includeExamples
    ? "Formato_Directorio_Docentes_IETABA.xlsx"
    : "Formato_Directorio_Docentes_IETABA_blanco.xlsx";

  downloadRowsAsExcel(rows, filename, "Directorio Docentes", STAFF_EXCEL_HEADERS);
}

/**
 * Descarga el reporte Excel (.xlsx) con las novedades bloqueantes o advertencias detectadas.
 */
export function downloadStaffNoveltiesExcel(issues: StaffValidationIssue[]): void {
  const rows = issues.map(iss => ({
    FILA_ARCHIVO: iss.rowNumber,
    NRO_DOCUMENTO: iss.nroDocumento,
    FUNCIONARIO: iss.staffName,
    CAMPO: iss.field,
    SEVERIDAD: iss.level === "error" ? "BLOQUEANTE" : "ADVERTENCIA",
    DETALLE_NOVEDAD: iss.message,
    ACCION_REQUERIDA:
      iss.level === "error"
        ? "Corregir en el archivo Excel/CSV antes de volver a cargar"
        : "Verificar dato de contacto",
  }));

  const dateTag = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  downloadRowsAsExcel(
    rows,
    `Novedades_Directorio_Docentes_${dateTag}.xlsx`,
    "Novedades Docentes"
  );
}

/**
 * Detecta si un arreglo de filas leídas corresponde al formato estructurado de directorio docente
 * (en lugar de un listado simple de una sola columna NOMBRE).
 */
export function isStructuredStaffRows(rawRows: Record<string, unknown>[]): boolean {
  if (!rawRows || rawRows.length === 0) return false;
  const firstKeys = Object.keys(rawRows[0] || {}).map(normalizeHeaderKey);
  return firstKeys.some(
    k =>
      k === "nro documento" ||
      k === "documento" ||
      k === "correo electronico" ||
      k === "correo" ||
      k === "email" ||
      k === "primer apellido" ||
      k === "rol institucional"
  );
}

/**
 * Parsea y valida filas de docentes/funcionarios bajo la Regla de Gobernanza Institucional ("Todo o Nada").
 */
export function parseAndValidateStaffSpreadsheet(
  rawRows: Record<string, unknown>[]
): StaffParseResult {
  const validRows: StandardizedStaffRow[] = [];
  const issues: StaffValidationIssue[] = [];
  const seenDocs = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  let totalRawRows = 0;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2;
    const s: Record<string, unknown> = {};
    Object.keys(rawRow || {}).forEach((k, colIdx) => {
      const cleanKey = normalizeHeaderKey(k);
      s[cleanKey] = rawRow[k];
      s[`pos_${colIdx}`] = rawRow[k];
    });

    const allValues = Object.keys(rawRow || {}).map(k => String(rawRow[k] ?? "").trim());
    if (allValues.every(v => v === "")) {
      return;
    }
    totalRawRows++;

    const rawTipoDoc = String(
      s["tipo doc"] ?? s["tipo documento"] ?? s["tipodoc"] ?? s.pos_0 ?? "C.C."
    )
      .trim()
      .toUpperCase() || "C.C.";

    const rawDoc = String(
      s["nro documento"] ??
        s["documento"] ??
        s["numero documento"] ??
        s["cedula"] ??
        s["identificacion"] ??
        s.pos_1 ??
        ""
    )
      .trim()
      .replace(/\.0+$/, "")
      .replace(/\s+/g, "");

    const rawApellido1 = String(
      s["primer apellido"] ?? s["apellido1"] ?? s["primerapellido"] ?? s.pos_2 ?? ""
    )
      .trim()
      .toUpperCase();

    const rawApellido2 = String(
      s["segundo apellido"] ?? s["apellido2"] ?? s["segundoapellido"] ?? s.pos_3 ?? ""
    )
      .trim()
      .toUpperCase();

    const rawNombre1 = String(
      s["primer nombre"] ?? s["nombre1"] ?? s["primernombre"] ?? s.pos_4 ?? ""
    )
      .trim()
      .toUpperCase();

    const rawNombre2 = String(
      s["segundo nombre"] ?? s["nombre2"] ?? s["segundonombre"] ?? s.pos_5 ?? ""
    )
      .trim()
      .toUpperCase();

    const rawEmail = String(
      s["correo electronico"] ??
        s["correo"] ??
        s["email"] ??
        s["e mail"] ??
        s.pos_6 ??
        ""
    )
      .trim()
      .toLowerCase();

    const rawPhoneInput = String(
      s["telefono whatsapp"] ??
        s["telefono"] ??
        s["celular"] ??
        s["whatsapp"] ??
        s.pos_7 ??
        ""
    ).trim();

    const rawRole = String(
      s["rol institucional"] ?? s["rol"] ?? s["cargo"] ?? s.pos_8 ?? ""
    ).trim();

    const rawIsDirector = String(
      s["es director de grupo"] ?? s["director de grupo"] ?? s.pos_9 ?? ""
    )
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const rawGradoDirector = String(
      s["grado director"] ?? s["grado"] ?? s.pos_10 ?? ""
    ).trim();

    const rawCursoDirector = String(
      s["curso director"] ?? s["curso"] ?? s["grupo"] ?? s.pos_11 ?? ""
    )
      .trim()
      .toUpperCase();

    const rawAsignaturas = String(
      s["asignaturas"] ?? s["materias"] ?? s["area"] ?? s.pos_12 ?? ""
    ).trim();

    const rawCursos = String(
      s["cursos asignados"] ?? s["cursos"] ?? s["salones"] ?? s.pos_13 ?? ""
    ).trim();

    const rawSede = String(
      s["sede area"] ?? s["sede"] ?? s.pos_14 ?? ""
    ).trim();

    const rawEstado = String(
      s["estado"] ?? s.pos_15 ?? "ACTIVO"
    )
      .trim()
      .toUpperCase() || "ACTIVO";

    const displayStaffName =
      `${rawApellido1} ${rawApellido2} ${rawNombre1} ${rawNombre2}`
        .replace(/\s+/g, " ")
        .trim() || `Fila #${rowNumber}`;

    let rowHasError = false;

    if (!rawDoc) {
      issues.push({
        rowNumber,
        nroDocumento: "SIN DOC",
        staffName: displayStaffName,
        field: "NRO DOCUMENTO",
        level: "error",
        message: "El NRO DOCUMENTO es obligatorio.",
      });
      rowHasError = true;
    } else if (seenDocs.has(rawDoc)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc,
        staffName: displayStaffName,
        field: "NRO DOCUMENTO",
        level: "error",
        message: `Documento duplicado en el archivo (ya aparece en la fila #${seenDocs.get(rawDoc)}).`,
      });
      rowHasError = true;
    } else {
      seenDocs.set(rawDoc, rowNumber);
    }

    if (!rawApellido1) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "PRIMER APELLIDO",
        level: "error",
        message: "El PRIMER APELLIDO es obligatorio.",
      });
      rowHasError = true;
    }

    if (!rawNombre1) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "PRIMER NOMBRE",
        level: "error",
        message: "El PRIMER NOMBRE es obligatorio.",
      });
      rowHasError = true;
    }

    if (!rawEmail) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "CORREO ELECTRONICO",
        level: "error",
        message: "El CORREO ELECTRONICO es obligatorio.",
      });
      rowHasError = true;
    } else if (!emailRegex.test(rawEmail)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "CORREO ELECTRONICO",
        level: "error",
        message: `Formato de correo inválido: "${rawEmail}".`,
      });
      rowHasError = true;
    } else if (seenEmails.has(rawEmail)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "CORREO ELECTRONICO",
        level: "error",
        message: `Correo duplicado en el archivo (ya aparece en la fila #${seenEmails.get(rawEmail)}).`,
      });
      rowHasError = true;
    } else {
      seenEmails.set(rawEmail, rowNumber);
    }

    const normalizedRole = normalizeStaffRole(rawRole);
    if (!normalizedRole) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "ROL INSTITUCIONAL",
        level: "error",
        message: `Rol inválido "${rawRole || "(vacío)"}". Valores válidos: RECTOR, COORDINADOR, BIENESTAR, DOCENTE o DOCENTE_DIRECTOR.`,
      });
      rowHasError = true;
    }

    const flagDirector = ["SI", "S", "YES", "TRUE", "1", "X"].includes(rawIsDirector);
    const isDirectorGrupo = flagDirector || normalizedRole === "DOCENTE_DIRECTOR";
    const finalRole: StaffRole =
      normalizedRole === "DOCENTE" && isDirectorGrupo
        ? "DOCENTE_DIRECTOR"
        : normalizedRole || "DOCENTE";

    const directorGrado = rawGradoDirector ? normalizeGrade(rawGradoDirector) : "";
    const directorCurso = rawCursoDirector;

    if (isDirectorGrupo && (!directorGrado || !directorCurso)) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: !directorGrado ? "GRADO DIRECTOR" : "CURSO DIRECTOR",
        level: "error",
        message:
          "Cuando el funcionario es Director de Grupo, GRADO DIRECTOR y CURSO DIRECTOR son obligatorios.",
      });
      rowHasError = true;
    }

    const cleanPhone = rawPhoneInput.replace(/\D/g, "");
    if (rawPhoneInput && cleanPhone.length < 7) {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "TELEFONO / WHATSAPP",
        level: "warning",
        message: `Teléfono "${rawPhoneInput}" tiene menos de 7 dígitos; verifica si es correcto.`,
      });
    }

    if (rawEstado !== "ACTIVO" && rawEstado !== "INACTIVO") {
      issues.push({
        rowNumber,
        nroDocumento: rawDoc || "SIN DOC",
        staffName: displayStaffName,
        field: "ESTADO",
        level: "error",
        message: `Estado inválido "${rawEstado}". Usa ACTIVO o INACTIVO.`,
      });
      rowHasError = true;
    }

    if (rowHasError) return;

    const teachingSubjectsList = splitListTokens(rawAsignaturas);
    const teachingCourses = splitListTokens(rawCursos);
    const gradesSet = new Set<string>();
    teachingCourses.forEach(courseToken => {
      const m = courseToken.match(/^(\d{1,2})/);
      if (m) gradesSet.add(normalizeGrade(m[1]));
    });
    if (isDirectorGrupo && directorGrado) {
      gradesSet.add(directorGrado);
    }

    validRows.push({
      tipoDocumento: rawTipoDoc,
      nroDocumento: rawDoc,
      primerApellido: rawApellido1,
      segundoApellido: rawApellido2,
      primerNombre: rawNombre1,
      segundoNombre: rawNombre2,
      email: rawEmail,
      phone: cleanPhone,
      role: finalRole,
      isDirectorGrupo,
      directorGrado,
      directorCurso,
      teachingSubjectsList,
      teachingCourses,
      teachingGrades: Array.from(gradesSet).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true })
      ),
      sedeArea: rawSede,
      estado: rawEstado === "INACTIVO" ? "INACTIVO" : "ACTIVO",
    });
  });

  const hasBlockingErrors = issues.some(i => i.level === "error");

  return {
    validRows,
    issues,
    hasBlockingErrors,
    totalRawRows,
  };
}

/**
 * Construye el documento listo para persistir en la colección `/directorio` de Firestore.
 */
export function buildStaffFirestoreDoc(row: StandardizedStaffRow) {
  const lastName = `${row.primerApellido} ${row.segundoApellido}`.replace(/\s+/g, " ").trim();
  const firstName = `${row.primerNombre} ${row.segundoNombre}`.replace(/\s+/g, " ").trim();
  const fullName = `${lastName} ${firstName}`.replace(/\s+/g, " ").trim();

  return {
    uid: `staff-${row.nroDocumento}`,
    tipoDocumento: row.tipoDocumento,
    nroDocumento: row.nroDocumento,
    firstName,
    lastName,
    name: fullName,
    displayName: fullName,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.estado === "INACTIVO" ? ("PENDING" as const) : ("ACTIVE" as const),
    isDirectorGrupo: row.isDirectorGrupo,
    directorGrado: row.directorGrado,
    directorCurso: row.directorCurso,
    teachingGrades: row.teachingGrades,
    teachingCourses: row.teachingCourses,
    teachingSubjectsList: row.teachingSubjectsList,
    sedeArea: row.sedeArea,
    source: "EXCEL_IMPORT",
    updatedAt: new Date().toISOString(),
  };
}
