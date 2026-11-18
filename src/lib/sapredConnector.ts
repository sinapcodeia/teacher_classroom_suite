import type * as XLSXType from "xlsx";
import type { Student, ScheduleEntry, SapredRoomMeta } from "@/context/AppContext";
import { normalizeGrade, matchStudentCourse } from "./constants";
import { normalizeSubjectKey, PeriodId } from "./gradeUtils";
import { downloadRowsAsExcel } from "./spreadsheetUtils";

export const SAPRED_GRADE_COLUMNS = [
  "SB1", "SB2", "SB3", "SB4", "SB5", "SB6", "SB7", "SB8",
  "SBH1", "SBH2", "SBH3", "SBH4", "SBH5", "SBH6", "SBH7", "SBH8",
  "SR1", "SR2", "SR3", "SR4", "SR5",
  "CV1", "CV2", "CV3",
  "AUT",
] as const;

export const SAPRED_HEADERS = [
  "CODIGO",
  "APELLIDO",
  "NOMBRE",
  ...SAPRED_GRADE_COLUMNS,
] as const;

export type SapredNoveltyType =
  | "NO_EXISTE_EN_EDUMANAGER"
  | "FALTA_EN_SAPRED"
  | "CAMBIO_DE_SALON"
  | "DATOS_MODIFICADOS"
  | "CODIGO_DUPLICADO"
  | "CODIGO_VACIO"
  | "ASIGNATURA_NO_RECONOCIDA"
  | "SECCION_NO_RECONOCIDA"
  | "SIN_COLUMNAS_NOTAS";

export interface SapredNovelty {
  sheetName: string;
  roomKey: string;
  subject: string;
  rowNumber: number;
  type: SapredNoveltyType;
  blocking: boolean;
  codigo: string;
  studentName: string;
  detail: string;
  studentId?: string;
  suggestedFix?: {
    studentId: string;
    primerApellido: string;
    segundoApellido: string;
    primerNombre: string;
    segundoNombre: string;
  };
  suggestedCodeFix?: {
    studentId: string;
    oldCodigo: string;
    newCodigo: string;
    primerApellido?: string;
    segundoApellido?: string;
    primerNombre?: string;
    segundoNombre?: string;
  };
}

export interface SapredSheetSummary {
  sheetName: string;
  roomKey: string;
  grade: string;
  course: string;
  sapredSubjectRaw: string;
  resolvedSubject: string;
  codSeccion: string;
  codAsignatura: string;
  totalSapredRows: number;
  matchedCount: number;
  cellsWritten: number;
  blockingErrorsCount: number;
}

export interface SapredAnalysisResult {
  workbook: XLSXType.WorkBook;
  sheetResults: SapredSheetSummary[];
  novelties: SapredNovelty[];
  hasBlockingErrors: boolean;
  totalSheets: number;
  totalMatchedStudents: number;
  totalCellsWritten: number;
  sapredOrders: Record<string, string[]>;
  sapredMeta: Record<string, SapredRoomMeta>;
}

const KNOWN_SUBJECT_ALIASES: { match: RegExp; targetKeywords: string[] }[] = [
  { match: /^(TPI|60|TECNOLOG)/i, targetKeywords: ["TECNOLOGIA", "INFORMATICA", "TPI"] },
  { match: /^(FIS|36|FISICA)/i, targetKeywords: ["FISICA"] },
  { match: /^(MATE|4|MATEMATIC)/i, targetKeywords: ["MATEMATICAS", "MATEMATICA"] },
  { match: /^(ETIC|9|ETICA)/i, targetKeywords: ["ETICA", "VALORES"] },
];

const SUBJECT_TO_SAPRED_META: { keywords: string[]; suffix: string; codAsig: string; sapredName: string }[] = [
  { keywords: ["TECNOLOGIA", "INFORMATICA"], suffix: "TPI", codAsig: "60", sapredName: "TECNOLOGÍA PROPIA E INFORMÁTICA" },
  { keywords: ["FISICA"], suffix: "FIS", codAsig: "36", sapredName: "FÍSICA" },
  { keywords: ["MATEMATIC"], suffix: "MATE", codAsig: "4", sapredName: "MATEMÁTICAS" },
  { keywords: ["ETICA"], suffix: "ETIC", codAsig: "9", sapredName: "ÉTICA Y VALORES" },
];

const DEFAULT_SAPRED_COD_SECCION: Record<string, string> = {
  "5-1": "11350",
  "5-2": "11183",
  "6-3": "11187",
  "6-6": "11425",
  "7-2": "11191",
  "7-3": "11192",
  "7-4": "11193",
  "8-2": "11195",
  "8-3": "11196",
  "9-2": "11198",
};

/**
 * Repara cadenas UTF-8 que SAPRED exporta en BIFF8 con doble codificación Latin1.
 */
export function fixSapredMojibake(raw: string): string {
  const s = String(raw || "").trim();
  if (!s) return "";
  // Reemplazos comunes de mojibake UTF-8 interpretado como Latin1/Windows-1252
  return s
    .replace(/Ã\u0083Â\u0081|Ã\u0081|Ã\uFFFD/g, "Á")
    .replace(/Ã‰|Ã\u0089/g, "É")
    .replace(/Ã\u008d|Ã\uFFFD/g, "Í")
    .replace(/Ã“|Ã\u0093/g, "Ó")
    .replace(/Ãš|Ã\u009a/g, "Ú")
    .replace(/Ã‘|Ã\u0091/g, "Ñ")
    .replace(/Ã¡/g, "á")
    .replace(/Ã©/g, "é")
    .replace(/Ã­/g, "í")
    .replace(/Ã³/g, "ó")
    .replace(/Ãº/g, "ú")
    .replace(/Ã±/g, "ñ")
    .replace(/\uFFFD/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanSapredCodigo(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const str = String(raw).trim();
  if (!str) return "";
  return str.replace(/\.0+$/, "").trim();
}

export function parseSapredRoomFromSheet(
  sheetName: string,
  seccionCell: string
): { grade: string; course: string; roomKey: string } | null {
  // 1. Intentar desde celda SECCION ("5-1 IETABA", "7-2-IETABA")
  const secClean = String(seccionCell || "").toUpperCase().replace(/IETABA/g, "").trim();
  const secMatch = secClean.match(/(\d{1,2})\s*[-–_\s]\s*([A-Z0-9]+)/i);
  if (secMatch) {
    const grade = normalizeGrade(secMatch[1]);
    const course = secMatch[2].trim().toUpperCase();
    const gradeNum = grade.replace("°", "");
    return { grade, course, roomKey: `${gradeNum}-${course}` };
  }

  // 2. Fallback desde el nombre de la hoja ("5-1__TPI", "6-6__MATE")
  const sheetBase = sheetName.split("__")[0] || sheetName;
  const sheetMatch = sheetBase.match(/(\d{1,2})\s*[-–_\s]\s*([A-Z0-9]+)/i);
  if (sheetMatch) {
    const grade = normalizeGrade(sheetMatch[1]);
    const course = sheetMatch[2].trim().toUpperCase();
    const gradeNum = grade.replace("°", "");
    return { grade, course, roomKey: `${gradeNum}-${course}` };
  }

  return null;
}

export function resolveSapredSubject(
  rawSubject: string,
  sheetName: string,
  codAsignatura: string,
  availableSubjects: string[]
): string | null {
  const cleanedRaw = fixSapredMojibake(rawSubject);
  const normRaw = normalizeSubjectKey(cleanedRaw);
  const sheetSuffix = (sheetName.split("__")[1] || "").trim().toUpperCase();
  const cod = String(codAsignatura || "").trim();

  // 1. Match directo contra availableSubjects
  for (const subj of availableSubjects) {
    const normSubj = normalizeSubjectKey(subj);
    if (normSubj === normRaw) return subj;
    if (normRaw && (normRaw.includes(normSubj) || normSubj.includes(normRaw))) return subj;
  }

  // 2. Match por alias conocidos (sufijo hoja, código asignatura o prefijo texto)
  const candidates = [sheetSuffix, cod, normRaw].filter(Boolean);
  for (const alias of KNOWN_SUBJECT_ALIASES) {
    if (candidates.some(c => alias.match.test(c))) {
      for (const subj of availableSubjects) {
        const normSubj = normalizeSubjectKey(subj);
        if (alias.targetKeywords.some(kw => normSubj.includes(kw))) {
          return subj;
        }
      }
    }
  }

  return null;
}

/**
 * Obtiene el valor numérico de una columna SAPRED (SB1..AUT) para un estudiante,
 * sujeto y período específico. Preserva el 0.0 real.
 */
export function getStudentSapredGradeCellValue(
  student: Student,
  colId: string,
  subject: string,
  periodId: string
): number | "" {
  const pid = (periodId || "p1").toLowerCase();
  const dg = student.detailedGrades || {};
  const normTarget = normalizeSubjectKey(subject);
  const subjKey = dg[subject]
    ? subject
    : Object.keys(dg).find(k => normalizeSubjectKey(k) === normTarget);

  const pShort = pid.replace("p", "");
  const subjMap = subjKey ? (dg[subjKey] as Record<string, any> | undefined) : undefined;
  const pBlock = subjMap
    ? subjMap[pid] || subjMap[pShort] || subjMap[pid.toUpperCase()]
    : undefined;

  if (pBlock) {
    let val: number | null | undefined = null;
    if (colId.startsWith("SBH")) {
      const idx = parseInt(colId.slice(3), 10) - 1;
      val = pBlock.sbh?.[idx];
    } else if (colId.startsWith("SB")) {
      const idx = parseInt(colId.slice(2), 10) - 1;
      val = pBlock.sb?.[idx];
    } else if (colId.startsWith("SR")) {
      const idx = parseInt(colId.slice(2), 10) - 1;
      val = pBlock.sr?.[idx];
    } else if (colId.startsWith("CV")) {
      const idx = parseInt(colId.slice(2), 10) - 1;
      val = pBlock.cv?.[idx];
    } else if (colId === "AUT") {
      val = pBlock.aut;
    }
    return typeof val === "number" && !isNaN(val) ? Number(val.toFixed(2)) : "";
  }

  // Fallback legacy solo para Periodo 1 si no existe detailedGrades
  if (!student.grades || pid !== "p1") return "";
  const subjectGrades = student.grades.filter(g => {
    const title = (g.title || "").toUpperCase();
    return title.includes(`[${subject.toUpperCase()}]`) || normalizeSubjectKey(title).includes(normTarget);
  });

  let filtered: typeof subjectGrades = [];
  let idx = 0;
  if (colId.startsWith("SBH")) {
    idx = parseInt(colId.slice(3), 10) - 1;
    filtered = subjectGrades.filter(g => g.type === "activity");
  } else if (colId.startsWith("SB")) {
    idx = parseInt(colId.slice(2), 10) - 1;
    filtered = subjectGrades.filter(g => g.type === "exam");
  } else if (colId.startsWith("SR")) {
    idx = parseInt(colId.slice(2), 10) - 1;
    filtered = subjectGrades.filter(g => g.type === "participation");
  } else if (colId.startsWith("CV")) {
    idx = parseInt(colId.slice(2), 10) - 1;
    filtered = subjectGrades.filter(g => g.type === "participation").slice(5);
  } else if (colId === "AUT") {
    idx = 0;
    filtered = subjectGrades.filter(g => (g.title || "").toUpperCase().includes("AUTO"));
  }

  const grade = filtered[idx];
  return grade && typeof grade.score === "number" ? Number(grade.score.toFixed(2)) : "";
}

/**
 * Núcleo puro de análisis, validación "Todo o Nada" y diligenciamiento de un Workbook SAPRED.
 * Separado de File/DOM para ser 100% testeable en Node.js y navegador.
 */
export function processSapredWorkbookInstance(
  XLSX: typeof XLSXType,
  wb: XLSXType.WorkBook,
  students: Student[],
  availableSubjects: string[],
  periodId: string
): SapredAnalysisResult {
  const activeStudents = students.filter(s => s.isActive !== false);
  // js-index-maps: índice O(1) por código e ID para evitar búsquedas O(N) por fila
  const studentByCodeMap = new Map<string, Student>();
  for (const s of activeStudents) {
    const code = cleanSapredCodigo(s.nroDocumento);
    if (code && !studentByCodeMap.has(code)) studentByCodeMap.set(code, s);
    if (s.id) studentByCodeMap.set(s.id, s);
  }
  const novelties: SapredNovelty[] = [];
  const sheetResults: SapredSheetSummary[] = [];
  const sapredOrders: Record<string, string[]> = {};
  const sapredMeta: Record<string, SapredRoomMeta> = {};

  let totalMatchedStudents = 0;
  let totalCellsWritten = 0;

  // Guardaremos los cambios pendientes por celda y solo los escribiremos si 0 errores bloqueantes
  const pendingWrites: { sheetName: string; r: number; c: number; value: number | "" }[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" });
    if (rows.length === 0) continue;

    const findMetaValue = (label: string): string => {
      const row = rows.find(r => String(r?.[0] ?? "").trim().toUpperCase() === label);
      return row ? String(row[1] ?? "").trim() : "";
    };

    const codSeccion = findMetaValue("COD_SECCION");
    const codAsignatura = findMetaValue("COD_ASIGNATURA");
    const seccionRaw = findMetaValue("SECCION");
    const asignaturaRaw = findMetaValue("ASIGNATURA");

    const room = parseSapredRoomFromSheet(sheetName, seccionRaw);
    const roomKey = room ? room.roomKey : sheetName;
    const resolvedSubject = resolveSapredSubject(asignaturaRaw, sheetName, codAsignatura, availableSubjects);

    if (!room) {
      novelties.push({
        sheetName,
        roomKey,
        subject: fixSapredMojibake(asignaturaRaw) || sheetName,
        rowNumber: 4,
        type: "SECCION_NO_RECONOCIDA",
        blocking: true,
        codigo: "",
        studentName: "",
        detail: `No se pudo identificar el grado y curso de la hoja "${sheetName}" (SECCION: "${seccionRaw || "vacía"}").`,
      });
    }

    if (!resolvedSubject) {
      novelties.push({
        sheetName,
        roomKey,
        subject: fixSapredMojibake(asignaturaRaw) || sheetName,
        rowNumber: 5,
        type: "ASIGNATURA_NO_RECONOCIDA",
        blocking: true,
        codigo: "",
        studentName: "",
        detail: `No se pudo asociar la asignatura "${fixSapredMojibake(asignaturaRaw) || sheetName}" (cód. ${codAsignatura || "?"}) con ninguna materia activa de EduManager.`,
      });
    }

    const headerRowIdx = rows.findIndex(r =>
      Array.isArray(r) && r.some(cell => String(cell ?? "").trim().toUpperCase() === "CODIGO")
    );

    if (headerRowIdx === -1) {
      novelties.push({
        sheetName,
        roomKey,
        subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
        rowNumber: 1,
        type: "SIN_COLUMNAS_NOTAS",
        blocking: true,
        codigo: "",
        studentName: "",
        detail: `No se encontró la fila de encabezados con la columna "CODIGO" en la hoja "${sheetName}".`,
      });
      continue;
    }

    const headers = rows[headerRowIdx].map(h => String(h ?? "").trim().toUpperCase());
    const colCodigoIdx = headers.indexOf("CODIGO");
    const colApellidoIdx = headers.indexOf("APELLIDO");
    const colNombreIdx = headers.indexOf("NOMBRE");

    const gradeCols = SAPRED_GRADE_COLUMNS
      .map(colId => ({ colId, colIdx: headers.indexOf(colId) }))
      .filter(c => c.colIdx !== -1);

    if (gradeCols.length === 0) {
      novelties.push({
        sheetName,
        roomKey,
        subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
        rowNumber: headerRowIdx + 1,
        type: "SIN_COLUMNAS_NOTAS",
        blocking: true,
        codigo: "",
        studentName: "",
        detail: `La hoja "${sheetName}" no contiene columnas de evaluación SAPRED (SB1..AUT).`,
      });
      continue;
    }

    const sheetOrder: string[] = [];
    const seenCodigos = new Map<string, number>();
    let sheetTotalRows = 0;
    let sheetMatched = 0;
    let sheetCells = 0;
    let sheetBlocking = 0;

    for (let r = headerRowIdx + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const firstCell = String(row[0] ?? "").trim().toUpperCase();
      if (
        firstCell === "CONVENCIONES" ||
        firstCell.startsWith("ELABORADO POR") ||
        firstCell === "SB1"
      ) {
        break;
      }

      const codigo = cleanSapredCodigo(row[colCodigoIdx]);
      const apellido = colApellidoIdx !== -1 ? String(row[colApellidoIdx] ?? "").trim() : "";
      const nombre = colNombreIdx !== -1 ? String(row[colNombreIdx] ?? "").trim() : "";
      const displayName = `${apellido} ${nombre}`.replace(/\s+/g, " ").trim();

      if (!codigo && !displayName) continue;
      sheetTotalRows++;

      if (!codigo) {
        sheetBlocking++;
        novelties.push({
          sheetName,
          roomKey,
          subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
          rowNumber: r + 1,
          type: "CODIGO_VACIO",
          blocking: true,
          codigo: "(Vacío)",
          studentName: displayName || `Fila #${r + 1}`,
          detail: `Falta el CODIGO del estudiante en la fila #${r + 1}.`,
        });
        continue;
      }

      if (seenCodigos.has(codigo)) {
        sheetBlocking++;
        novelties.push({
          sheetName,
          roomKey,
          subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
          rowNumber: r + 1,
          type: "CODIGO_DUPLICADO",
          blocking: true,
          codigo,
          studentName: displayName || codigo,
          detail: `CODIGO duplicado en la misma hoja (ya aparece en fila #${seenCodigos.get(codigo)}).`,
        });
        continue;
      }
      seenCodigos.set(codigo, r + 1);
      sheetOrder.push(codigo);

      const student =
        studentByCodeMap.get(codigo) ||
        studentByCodeMap.get(`st-${codigo}`) ||
        studentByCodeMap.get(`st-${codigo}-1`);

      if (!student) {
        // Intentar localizar coincidencia exacta por nombre en el mismo salón para sugerir corrección de CODIGO
        const normNameSimple = (s: string) =>
          fixSapredMojibake(s)
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replace(/\s+/g, " ")
            .trim();
        const sapredTargetName = normNameSimple(`${apellido} ${nombre}`);
        const sapredApNorm = normNameSimple(apellido);
        const sapredNmTokens = normNameSimple(nombre).split(" ").filter(Boolean);
        const byNameInRoom = room
          ? activeStudents.find(s => {
              if (normalizeGrade(s.grado) !== room.grade || !matchStudentCourse(s.curso, room.course, s.grado, room.grade)) {
                return false;
              }
              const eduApNorm = normNameSimple(`${s.primerApellido || ""} ${s.segundoApellido || ""}`);
              const eduName = normNameSimple(`${eduApNorm} ${s.primerNombre || ""} ${s.segundoNombre || ""}`);
              if (sapredTargetName && eduName === sapredTargetName) return true;
              // Coincidencia exacta de apellidos + al menos un nombre en común (ej. YENNY DANIELA vs JENNY DANIELA)
              if (sapredApNorm && eduApNorm === sapredApNorm) {
                const eduNmTokens = normNameSimple(`${s.primerNombre || ""} ${s.segundoNombre || ""}`).split(" ").filter(Boolean);
                return sapredNmTokens.some(t => t.length >= 3 && eduNmTokens.includes(t));
              }
              return false;
            })
          : undefined;

        const apPartsFix = fixSapredMojibake(apellido).toUpperCase().split(/\s+/).filter(Boolean);
        const nmPartsFix = fixSapredMojibake(nombre).toUpperCase().split(/\s+/).filter(Boolean);

        sheetBlocking++;
        novelties.push({
          sheetName,
          roomKey,
          subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
          rowNumber: r + 1,
          type: "NO_EXISTE_EN_EDUMANAGER",
          blocking: true,
          codigo,
          studentName: displayName || codigo,
          detail: byNameInRoom
            ? `En SAPRED tiene CODIGO ${codigo}, pero en EduManager "${byNameInRoom.primerApellido} ${byNameInRoom.segundoApellido} ${byNameInRoom.primerNombre} ${byNameInRoom.segundoNombre}".trim() aparece con CODIGO ${byNameInRoom.nroDocumento}.`
            : `Estudiante en SAPRED con CODIGO ${codigo} no existe o está retirado/inactivo en EduManager.`,
          ...(byNameInRoom
            ? {
                suggestedCodeFix: {
                  studentId: byNameInRoom.id,
                  oldCodigo: byNameInRoom.nroDocumento,
                  newCodigo: codigo,
                  primerApellido: apPartsFix[0] || byNameInRoom.primerApellido,
                  segundoApellido: apPartsFix.slice(1).join(" "),
                  primerNombre: nmPartsFix[0] || byNameInRoom.primerNombre,
                  segundoNombre: nmPartsFix.slice(1).join(" "),
                },
              }
            : {}),
        });
        continue;
      }

      if (room && (normalizeGrade(student.grado) !== room.grade || !matchStudentCourse(student.curso, room.course, student.grado, room.grade))) {
        sheetBlocking++;
        novelties.push({
          sheetName,
          roomKey,
          subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
          rowNumber: r + 1,
          type: "CAMBIO_DE_SALON",
          blocking: true,
          codigo,
          studentName: displayName || `${student.primerApellido} ${student.primerNombre}`,
          detail: `En EduManager figura en ${student.grado}-${student.curso}, pero en esta hoja de SAPRED figura en ${room.grade}-${room.course}.`,
        });
        continue;
      }

      // Verificar si los apellidos/nombres fueron modificados respecto a EduManager
      const normNameCompare = (s: string) =>
        fixSapredMojibake(s)
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toUpperCase()
          .replace(/\s+/g, " ")
          .trim();
      const sapredFullNorm = normNameCompare(`${apellido} ${nombre}`);
      const eduFullNorm = normNameCompare(
        `${student.primerApellido || ""} ${student.segundoApellido || ""} ${student.primerNombre || ""} ${student.segundoNombre || ""}`
      );
      if (sapredFullNorm && eduFullNorm && sapredFullNorm !== eduFullNorm) {
        const apParts = fixSapredMojibake(apellido).toUpperCase().split(/\s+/).filter(Boolean);
        const nmParts = fixSapredMojibake(nombre).toUpperCase().split(/\s+/).filter(Boolean);
        sheetBlocking++;
        novelties.push({
          sheetName,
          roomKey,
          subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
          rowNumber: r + 1,
          type: "DATOS_MODIFICADOS",
          blocking: true,
          codigo,
          studentName: displayName,
          detail: `Nombre en SAPRED ("${sapredFullNorm}") difiere de EduManager ("${eduFullNorm}").`,
          suggestedFix: {
            studentId: student.id,
            primerApellido: apParts[0] || "",
            segundoApellido: apParts.slice(1).join(" "),
            primerNombre: nmParts[0] || "",
            segundoNombre: nmParts.slice(1).join(" "),
          },
        });
        continue;
      }

      sheetMatched++;
      totalMatchedStudents++;

      if (resolvedSubject) {
        for (const gCol of gradeCols) {
          const val = getStudentSapredGradeCellValue(student, gCol.colId, resolvedSubject, periodId);
          pendingWrites.push({ sheetName, r, c: gCol.colIdx, value: val });
          if (val !== "") {
            sheetCells++;
            totalCellsWritten++;
          }
        }
      }
    }

    // Verificar estudiantes matriculados en EduManager para ese salón que faltan en la hoja SAPRED
    if (room) {
      const roomStudents = activeStudents.filter(
        s => normalizeGrade(s.grado) === room.grade && matchStudentCourse(s.curso, room.course, s.grado, room.grade)
      );
      for (const st of roomStudents) {
        const stCode = cleanSapredCodigo(st.nroDocumento);
        if (!seenCodigos.has(stCode)) {
          sheetBlocking++;
          novelties.push({
            sheetName,
            roomKey,
            subject: resolvedSubject || fixSapredMojibake(asignaturaRaw),
            rowNumber: 0,
            type: "FALTA_EN_SAPRED",
            blocking: true,
            codigo: stCode,
            studentName: `${st.primerApellido} ${st.segundoApellido} ${st.primerNombre} ${st.segundoNombre}`.replace(/\s+/g, " ").trim(),
            detail: `Matriculado en ${room.grade}-${room.course} en EduManager pero no aparece en la hoja SAPRED "${sheetName}" (posible ingreso nuevo o retiro pendiente).`,
            studentId: st.id,
          });
        }
      }
    }

    if (room && sheetOrder.length > 0) {
      sapredOrders[room.roomKey] = sheetOrder;
      sapredMeta[room.roomKey] = {
        ...(codSeccion ? { codSeccion } : {}),
      };
      if (resolvedSubject) {
        const metaKey = `${room.roomKey}__${normalizeSubjectKey(resolvedSubject)}`;
        sapredMeta[metaKey] = {
          ...(codSeccion ? { codSeccion } : {}),
          ...(codAsignatura ? { codAsignatura } : {}),
        };
      }
    }

    sheetResults.push({
      sheetName,
      roomKey,
      grade: room?.grade || "?",
      course: room?.course || "?",
      sapredSubjectRaw: fixSapredMojibake(asignaturaRaw),
      resolvedSubject: resolvedSubject || "(No reconocida)",
      codSeccion,
      codAsignatura,
      totalSapredRows: sheetTotalRows,
      matchedCount: sheetMatched,
      cellsWritten: sheetCells,
      blockingErrorsCount: sheetBlocking,
    });
  }

  const hasBlockingErrors = novelties.some(n => n.blocking);

  // Regla "Todo o Nada": solo escribimos notas en el libro si 0 novedades bloqueantes
  if (!hasBlockingErrors) {
    for (const w of pendingWrites) {
      const ws = wb.Sheets[w.sheetName];
      if (!ws) continue;
      const addr = XLSX.utils.encode_cell({ r: w.r, c: w.c });
      if (w.value === "") {
        delete ws[addr];
      } else {
        ws[addr] = { t: "n", v: w.value };
      }
    }
  }

  return {
    workbook: wb,
    sheetResults,
    novelties,
    hasBlockingErrors,
    totalSheets: sheetResults.length,
    totalMatchedStudents,
    totalCellsWritten,
    sapredOrders,
    sapredMeta,
  };
}

export async function analyzeAndFillSapredWorkbook(
  file: File,
  students: Student[],
  availableSubjects: string[],
  periodId: string
): Promise<SapredAnalysisResult> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  return processSapredWorkbookInstance(XLSX, wb, students, availableSubjects, periodId);
}

/**
 * Elimina el stream interno `\x01Sh33tJ5` que SheetJS inserta en los archivos OLE2 (.xls),
 * ya que plataformas antiguas como SAPRED rechazan ese stream (`no se esperaba instancia Verificadoras □S`).
 * Mantiene el árbol rojo-negro OLE2 100% válido apuntando Root -> Workbook.
 */
export function stripSheetJsWatermarkFromXls(rawBytes: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(rawBytes);
  // Firma UTF-16LE de "\x01Sh33tJ5": 01 00 53 00 68 00 33 00 33 00 74 00 4a 00 35 00
  const sig = [0x01, 0x00, 0x53, 0x00, 0x68, 0x00, 0x33, 0x00, 0x33, 0x00, 0x74, 0x00, 0x4a, 0x00, 0x35, 0x00];
  let idx = -1;
  for (let i = 0; i <= bytes.length - sig.length; i++) {
    let match = true;
    for (let j = 0; j < sig.length; j++) {
      if (bytes[i + j] !== sig[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      idx = i;
      break;
    }
  }
  if (idx < 128 || idx + 256 > bytes.length) return bytes;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const rootOff = idx - 128;
  const wbkOff = idx + 128;

  // Root.child -> 2 (Workbook), Workbook.left/right/child -> -1, color -> 1 (black)
  view.setInt32(rootOff + 0x4c, 2, true);
  view.setInt32(wbkOff + 0x44, -1, true);
  view.setInt32(wbkOff + 0x48, -1, true);
  view.setInt32(wbkOff + 0x4c, -1, true);
  bytes[wbkOff + 0x43] = 1;

  // Limpiar la entrada de directorio \x01Sh33tJ5
  bytes.fill(0, idx, idx + 128);
  return bytes;
}

function triggerXlsDownload(bytes: Uint8Array, filename: string): void {
  const safeBuffer = new Uint8Array(bytes).buffer;
  const blob = new Blob([safeBuffer], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function downloadFilledSapredXls(
  wb: XLSXType.WorkBook,
  originalFilename: string,
  periodId: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const cleanBase = originalFilename.replace(/\.(xls|xlsx)$/i, "");
  const outName = `${cleanBase}_EDUMANAGER_${periodId.toUpperCase()}.xls`;
  const raw = XLSX.write(wb, { bookType: "xls", type: "array" }) as ArrayBuffer | Uint8Array;
  const clean = stripSheetJsWatermarkFromXls(raw instanceof Uint8Array ? raw : new Uint8Array(raw));
  triggerXlsDownload(clean, outName);
}

export function downloadSapredNoveltiesExcel(novelties: SapredNovelty[]): void {
  const rows = novelties.map(n => ({
    HOJA_SAPRED: n.sheetName,
    SALON: n.roomKey,
    ASIGNATURA: n.subject,
    FILA: n.rowNumber > 0 ? n.rowNumber : "N/A",
    TIPO_NOVEDAD: n.type,
    BLOQUEANTE: n.blocking ? "SI" : "NO",
    CODIGO: n.codigo,
    ESTUDIANTE: n.studentName,
    DETALLE: n.detail,
  }));
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  downloadRowsAsExcel(rows, `SAPRED_NOVEDADES_${dateStr}.xlsx`, "Novedades SAPRED");
}

/**
 * Ordena una lista de estudiantes según el orden guardado de SAPRED por curso (`sapredOrder`),
 * ubicando al final en orden alfabético a cualquier estudiante nuevo no listado en SAPRED.
 */
export function sortStudentsBySapredOrder(
  students: Student[],
  sapredOrder?: Record<string, string[]>
): Student[] {
  if (!sapredOrder || Object.keys(sapredOrder).length === 0) {
    return [...students].sort((a, b) => {
      const nameA = `${a.primerApellido || ""} ${a.segundoApellido || ""} ${a.primerNombre || ""} ${a.segundoNombre || ""}`.trim().toUpperCase();
      const nameB = `${b.primerApellido || ""} ${b.segundoApellido || ""} ${b.primerNombre || ""} ${b.segundoNombre || ""}`.trim().toUpperCase();
      return nameA.localeCompare(nameB);
    });
  }

  const indexMapByRoom = new Map<string, Map<string, number>>();
  Object.entries(sapredOrder).forEach(([roomKey, codes]) => {
    const map = new Map<string, number>();
    codes.forEach((c, idx) => map.set(cleanSapredCodigo(c), idx));
    indexMapByRoom.set(roomKey.toUpperCase(), map);
  });

  return [...students].sort((a, b) => {
    const roomA = `${normalizeGrade(a.grado).replace("°", "")}-${String(a.curso || "").trim().toUpperCase()}`;
    const roomB = `${normalizeGrade(b.grado).replace("°", "")}-${String(b.curso || "").trim().toUpperCase()}`;
    if (roomA !== roomB) return roomA.localeCompare(roomB, undefined, { numeric: true });

    const map = indexMapByRoom.get(roomA);
    if (map) {
      const idxA = map.get(cleanSapredCodigo(a.nroDocumento));
      const idxB = map.get(cleanSapredCodigo(b.nroDocumento));
      if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
      if (idxA !== undefined) return -1;
      if (idxB !== undefined) return 1;
    }

    const nameA = `${a.primerApellido || ""} ${a.segundoApellido || ""} ${a.primerNombre || ""} ${a.segundoNombre || ""}`.trim().toUpperCase();
    const nameB = `${b.primerApellido || ""} ${b.segundoApellido || ""} ${b.primerNombre || ""} ${b.segundoNombre || ""}`.trim().toUpperCase();
    return nameA.localeCompare(nameB);
  });
}

function getSapredSubjectMeta(subject: string) {
  const norm = normalizeSubjectKey(subject);
  const found = SUBJECT_TO_SAPRED_META.find(m => m.keywords.some(kw => norm.includes(kw)));
  if (found) return found;
  const fallbackSuffix = norm.replace(/[^A-Z0-9]/g, "").slice(0, 4) || "ASIG";
  return { suffix: fallbackSuffix, codAsig: "60", sapredName: subject.toUpperCase() };
}

export interface ExportMultiSheetSapredParams {
  students: Student[];
  schedule: ScheduleEntry[];
  selectedSubject: string;
  selectedGrade: string;
  selectedCurso: string;
  periodId: PeriodId | string;
  teacherName: string;
  scope: "current_subject" | "all_teacher";
  sapredOrder?: Record<string, string[]>;
  sapredMeta?: Record<string, SapredRoomMeta>;
}

/**
 * Genera y descarga un libro .xls multi-hoja compatible con SAPRED (columnas CODIGO..AUT,
 * sin PARC/REC/DEF), ordenando los estudiantes según sapredOrder si existe.
 */
export async function exportMultiSheetSapredXls(params: ExportMultiSheetSapredParams): Promise<number> {
  const {
    students,
    schedule,
    selectedSubject,
    selectedGrade,
    selectedCurso,
    periodId,
    teacherName,
    scope,
    sapredOrder,
    sapredMeta,
  } = params;

  const activeStudents = students.filter(s => s.isActive !== false);
  const pairs: { grade: string; course: string; roomKey: string; subject: string }[] = [];
  const seenPairs = new Set<string>();

  const addPair = (grade: string, course: string, subject: string) => {
    const g = normalizeGrade(grade);
    const c = String(course || "").trim().toUpperCase();
    const roomKey = `${g.replace("°", "")}-${c}`;
    const key = `${roomKey}__${normalizeSubjectKey(subject)}`;
    if (!seenPairs.has(key)) {
      seenPairs.add(key);
      pairs.push({ grade: g, course: c, roomKey, subject });
    }
  };

  if (scope === "all_teacher" && schedule.length > 0) {
    schedule.forEach(b => {
      if (b.grade && b.group && b.subject) {
        addPair(b.grade, b.group, b.subject);
      }
    });
  } else {
    // Materia actual: usar cursos filtrados del horario o de los estudiantes filtrados
    const matchingSchedule = schedule.filter(
      b => normalizeSubjectKey(b.subject || "") === normalizeSubjectKey(selectedSubject)
    );
    if (matchingSchedule.length > 0 && selectedGrade === "TODOS" && selectedCurso === "TODOS") {
      matchingSchedule.forEach(b => addPair(b.grade, b.group, selectedSubject));
    } else {
      activeStudents.forEach(st => {
        if (selectedGrade !== "TODOS" && normalizeGrade(st.grado) !== normalizeGrade(selectedGrade)) return;
        if (selectedCurso !== "TODOS" && st.curso !== selectedCurso) return;
        addPair(st.grado, st.curso, selectedSubject);
      });
    }
  }

  pairs.sort((a, b) => a.roomKey.localeCompare(b.roomKey, undefined, { numeric: true }) || a.subject.localeCompare(b.subject));

  if (pairs.length === 0) return 0;

  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  for (const pair of pairs) {
    const roomStudentsRaw = activeStudents.filter(
      s => normalizeGrade(s.grado) === pair.grade && matchStudentCourse(s.curso, pair.course, s.grado, pair.grade)
    );
    if (roomStudentsRaw.length === 0) continue;

    const roomStudents = sortStudentsBySapredOrder(roomStudentsRaw, sapredOrder);
    const subjMeta = getSapredSubjectMeta(pair.subject);
    const savedSubjectMeta = sapredMeta?.[`${pair.roomKey}__${normalizeSubjectKey(pair.subject)}`];
    const savedRoomMeta = sapredMeta?.[pair.roomKey];
    const resolvedCodSeccionStr =
      savedSubjectMeta?.codSeccion ||
      savedRoomMeta?.codSeccion ||
      DEFAULT_SAPRED_COD_SECCION[pair.roomKey] ||
      "";
    const resolvedCodAsigStr = savedSubjectMeta?.codAsignatura || subjMeta.codAsig;
    const codSeccionVal = /^\d+$/.test(resolvedCodSeccionStr) ? Number(resolvedCodSeccionStr) : resolvedCodSeccionStr;
    const codAsigVal = /^\d+$/.test(resolvedCodAsigStr) ? Number(resolvedCodAsigStr) : resolvedCodAsigStr;

    const aoa: (string | number)[][] = [
      ["INSTITUCION EDUCATIVA INDIGENA TECNICA AGROAMBIENTAL BILINGUE AWA", ...Array(27).fill("")],
      ["COD_SECCION", codSeccionVal, ...Array(26).fill("")],
      ["COD_ASIGNATURA", codAsigVal, ...Array(26).fill("")],
      ["SECCION", `${pair.roomKey} IETABA`, ...Array(26).fill("")],
      ["ASIGNATURA", subjMeta.sapredName, ...Array(26).fill("")],
      ["DOCENTE", (teacherName || "").toUpperCase(), ...Array(26).fill("")],
      [...SAPRED_HEADERS],
    ];

    for (const st of roomStudents) {
      const codeNum = /^\d+$/.test(cleanSapredCodigo(st.nroDocumento))
        ? Number(cleanSapredCodigo(st.nroDocumento))
        : cleanSapredCodigo(st.nroDocumento);
      const apellidos = `${st.primerApellido || ""} ${st.segundoApellido || ""}`.replace(/\s+/g, " ").trim().toUpperCase();
      const nombres = `${st.primerNombre || ""} ${st.segundoNombre || ""}`.replace(/\s+/g, " ").trim().toUpperCase();
      const gradesRow = SAPRED_GRADE_COLUMNS.map(colId =>
        getStudentSapredGradeCellValue(st, colId, pair.subject, String(periodId))
      );
      aoa.push([codeNum, apellidos, nombres, ...gradesRow]);
    }

    aoa.push(["CONVENCIONES", ...Array(27).fill("")]);
    for (let i = 1; i <= 8; i++) aoa.push([`SB${i}`, "SABER, ", ...Array(26).fill("")]);
    for (let i = 1; i <= 8; i++) aoa.push([`SBH${i}`, "SABER - HACER, ", ...Array(26).fill("")]);
    for (let i = 1; i <= 5; i++) aoa.push([`SR${i}`, "SER, ", ...Array(26).fill("")]);
    for (let i = 1; i <= 3; i++) aoa.push([`CV${i}`, "CONVIVIR, ", ...Array(26).fill("")]);
    aoa.push(["AUT", "AUTO-EVALUACION, ", ...Array(26).fill("")]);
    aoa.push(["Elaborado por Sistema SAPRED. - www.siticol.com", ...Array(27).fill("")]);

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    let sheetTitle = `${pair.roomKey}__${subjMeta.suffix}`.slice(0, 31);
    let counter = 2;
    while (usedSheetNames.has(sheetTitle)) {
      sheetTitle = `${pair.roomKey}__${subjMeta.suffix}_${counter++}`.slice(0, 31);
    }
    usedSheetNames.add(sheetTitle);
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
  }

  if (wb.SheetNames.length === 0) return 0;

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const scopeTag = scope === "all_teacher" ? "TODOS_CURSOS" : normalizeSubjectKey(selectedSubject).replace(/\s+/g, "_");
  const filename = `SAPRED_NOTAS_${scopeTag}_${String(periodId).toUpperCase()}_${dateStr}.xls`;

  const raw = XLSX.write(wb, { bookType: "xls", type: "array" }) as ArrayBuffer | Uint8Array;
  const clean = stripSheetJsWatermarkFromXls(raw instanceof Uint8Array ? raw : new Uint8Array(raw));
  triggerXlsDownload(clean, filename);

  return wb.SheetNames.length;
}
