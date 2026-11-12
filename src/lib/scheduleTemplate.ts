import Papa from "papaparse";
import { ScheduleBlock } from "@/context/AppContext";
import { normalizeGrade } from "./constants";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const SCHEDULE_DAYS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES"] as const;
export type OfficialDay = typeof SCHEDULE_DAYS[number];

export const OFFICIAL_SLOTS = [
  { start: "07:30", end: "08:30" },
  { start: "08:30", end: "09:30" },
  { start: "09:30", end: "10:30" },
  // 10:30 - 11:00 DESCANSO
  { start: "11:00", end: "11:50" },
  { start: "11:50", end: "12:40" },
  { start: "12:40", end: "13:30" },
] as const;

export const SCHEDULE_BLOCK_COLORS = [
  "bg-blue-100 text-blue-900 border-blue-200",
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-purple-100 text-purple-900 border-purple-200",
  "bg-rose-100 text-rose-900 border-rose-200",
  "bg-cyan-100 text-cyan-900 border-cyan-200",
  "bg-lime-100 text-lime-900 border-lime-200",
  "bg-orange-100 text-orange-900 border-orange-200",
];

export const SCHEDULE_CSV_HEADERS = [
  "DIA",
  "HORA_INICIO",
  "HORA_FIN",
  "ASIGNATURA",
  "GRADO",
  "CURSO",
] as const;

export interface ScheduleValidationIssue {
  rowNumber: number;
  day: string;
  slot: string;
  field: string;
  level: "error" | "warning";
  message: string;
}

export interface ScheduleCollisionItem {
  block: ScheduleBlock;
  conflictWith: string;
}

export interface ScheduleCSVParseResult {
  validBlocks: ScheduleBlock[];
  issues: ScheduleValidationIssue[];
  hasBlockingErrors: boolean;
  freeSlotsSkipped: number;
}

function normalizeDayName(raw: string): OfficialDay | null {
  const clean = (raw || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (clean === "LUNES" || clean === "LUN") return "LUNES";
  if (clean === "MARTES" || clean === "MAR") return "MARTES";
  if (clean === "MIERCOLES" || clean === "MIE" || clean === "MIÉRCOLES") return "MIÉRCOLES";
  if (clean === "JUEVES" || clean === "JUE") return "JUEVES";
  if (clean === "VIERNES" || clean === "VIE") return "VIERNES";
  return null;
}

function normalizeTimeToken(raw: string): string {
  const clean = (raw || "").trim();
  if (!clean) return "";
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return clean;
  const hh = match[1].padStart(2, "0");
  const mm = match[2];
  return `${hh}:${mm}`;
}

export function buildScheduleTemplateCSV(
  mode: "example" | "blank" | "current",
  currentBlocks: ScheduleBlock[] = []
): string {
  const rows: Record<string, string>[] = [];

  if (mode === "current" && currentBlocks.length > 0) {
    currentBlocks.forEach(b => {
      rows.push({
        DIA: b.day,
        HORA_INICIO: b.startTime,
        HORA_FIN: b.endTime,
        ASIGNATURA: b.subject,
        GRADO: b.grade,
        CURSO: b.course,
      });
    });
  } else if (mode === "example") {
    const sampleData: Record<string, { subject: string; grade: string; course: string }> = {
      "LUNES_07:30": { subject: "TECNOLOGÍA E INFORMÁTICA", grade: "6°", course: "6-1" },
      "LUNES_08:30": { subject: "TECNOLOGÍA E INFORMÁTICA", grade: "6°", course: "6-2" },
      "MARTES_09:30": { subject: "TECNOLOGÍA E INFORMÁTICA", grade: "7°", course: "7-1" },
      "MIÉRCOLES_11:00": { subject: "TECNOLOGÍA E INFORMÁTICA", grade: "8°", course: "8-1" },
      "JUEVES_07:30": { subject: "TECNOLOGÍA E INFORMÁTICA", grade: "9°", course: "9-1" },
      "VIERNES_11:50": { subject: "TECNOLOGÍA E INFORMÁTICA", grade: "10°", course: "10-1" },
    };

    SCHEDULE_DAYS.forEach(day => {
      OFFICIAL_SLOTS.forEach(slot => {
        const key = `${day}_${slot.start}`;
        const sample = sampleData[key];
        rows.push({
          DIA: day,
          HORA_INICIO: slot.start,
          HORA_FIN: slot.end,
          ASIGNATURA: sample?.subject || "",
          GRADO: sample?.grade || "",
          CURSO: sample?.course || "",
        });
      });
    });
  } else {
    SCHEDULE_DAYS.forEach(day => {
      OFFICIAL_SLOTS.forEach(slot => {
        rows.push({
          DIA: day,
          HORA_INICIO: slot.start,
          HORA_FIN: slot.end,
          ASIGNATURA: "",
          GRADO: "",
          CURSO: "",
        });
      });
    });
  }

  const csv = Papa.unparse(rows, {
    columns: [...SCHEDULE_CSV_HEADERS],
  });
  return "\uFEFF" + csv;
}

export function downloadScheduleTemplate(
  mode: "example" | "blank" | "current",
  currentBlocks: ScheduleBlock[] = []
): void {
  const content = buildScheduleTemplateCSV(mode, currentBlocks);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const filename =
    mode === "example"
      ? "Formato_Horario_Docente_IETABA_Ejemplo.csv"
      : mode === "blank"
      ? "Formato_Horario_Docente_IETABA_EnBlanco.csv"
      : "Mi_Horario_Docente_IETABA.csv";
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadScheduleNoveltiesCSV(
  issues: ScheduleValidationIssue[],
  collisions: ScheduleCollisionItem[] = []
): void {
  const rows: Record<string, any>[] = [
    ...issues.map(iss => ({
      FILA_CSV: iss.rowNumber,
      DIA: iss.day,
      FRANJA_HORARIA: iss.slot,
      CAMPO: iss.field,
      NOVEDAD_GOBERNANZA: iss.message,
      ACCION_REQUERIDA: "Corregir en el archivo CSV antes de volver a subir",
    })),
    ...collisions.map((c, idx) => ({
      FILA_CSV: `CHOQUE-${idx + 1}`,
      DIA: c.block.day,
      FRANJA_HORARIA: `${c.block.startTime} - ${c.block.endTime}`,
      CAMPO: "CHOQUE DE SALÓN",
      NOVEDAD_GOBERNANZA: `El curso ${c.block.course} ya está asignado a ${c.conflictWith} en esa misma franja (${c.block.day} ${c.block.startTime}).`,
      ACCION_REQUERIDA: "Cambiar el curso o la franja horaria en el archivo CSV",
    })),
  ];
  const csv = "\uFEFF" + Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "Reporte_Novedades_Horario_IETABA.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function verifyScheduleCollisionsInFirestore(
  blocks: ScheduleBlock[],
  currentUserId: string
): Promise<ScheduleCollisionItem[]> {
  const collisions: ScheduleCollisionItem[] = [];
  if (blocks.length === 0) return collisions;

  try {
    const usersSnap = await getDocs(collection(db, "users"));
    for (const blk of blocks) {
      for (const userDoc of usersSnap.docs) {
        if (currentUserId && userDoc.id === currentUserId) continue;
        const data = userDoc.data();
        const otherSchedule: ScheduleBlock[] = data.weeklySchedule || [];
        const conflict = otherSchedule.find(
          b => b.day === blk.day && b.startTime === blk.startTime && b.course === blk.course
        );
        if (conflict) {
          const teacherName = data.name || data.firstName || "Otro docente";
          collisions.push({ block: blk, conflictWith: teacherName });
          break;
        }
      }
    }
  } catch {
    // Offline fallback
  }
  return collisions;
}

export function parseAndValidateScheduleCSV(
  rawRows: any[],
  masterSubjects: string[] = []
): ScheduleCSVParseResult {
  const validBlocks: ScheduleBlock[] = [];
  const issues: ScheduleValidationIssue[] = [];
  const occupiedSlots = new Map<string, number>();
  let freeSlotsSkipped = 0;

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2;
    const norm: Record<string, any> = {};
    Object.keys(rawRow || {}).forEach((k, colIdx) => {
      const clean = k
        .replace(/^\uFEFF/, "")
        .toUpperCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[\s.-]+/g, "_")
        .trim();
      norm[clean] = rawRow[k];
      norm[`POS_${colIdx}`] = rawRow[k];
    });

    const rawDay = String(norm["DIA"] ?? norm["POS_0"] ?? "").trim();
    const rawStart = String(
      norm["HORA_INICIO"] ?? norm["HORA"] ?? norm["FRANJA"] ?? norm["POS_1"] ?? ""
    ).trim();
    const rawSubject = String(
      norm["ASIGNATURA"] ?? norm["MATERIA"] ?? norm["AREA"] ?? norm["POS_3"] ?? ""
    ).trim().toUpperCase();
    const rawGrade = String(norm["GRADO"] ?? norm["NIVEL"] ?? norm["POS_4"] ?? "").trim();
    const rawCourse = String(
      norm["CURSO"] ?? norm["GRUPO"] ?? norm["SALON"] ?? norm["POS_5"] ?? ""
    ).trim().toUpperCase();

    // If pre-filled template slot has no subject, no grade, and no course, skip as free hour
    if (!rawSubject && !rawGrade && !rawCourse) {
      freeSlotsSkipped++;
      return;
    }

    let rowHasError = false;

    const day = normalizeDayName(rawDay);
    if (!day) {
      issues.push({
        rowNumber,
        day: rawDay || "SIN DÍA",
        slot: rawStart || "—",
        field: "DIA",
        level: "error",
        message: `Día inválido ("${rawDay}"). Usa LUNES, MARTES, MIÉRCOLES, JUEVES o VIERNES.`,
      });
      rowHasError = true;
    }

    const startTime = normalizeTimeToken(rawStart);
    if (startTime === "10:30") {
      issues.push({
        rowNumber,
        day: day || rawDay || "—",
        slot: "10:30 - 11:00",
        field: "HORA_INICIO",
        level: "error",
        message: "No se puede asignar clase en la franja 10:30 – 11:00 porque corresponde al DESCANSO institucional.",
      });
      rowHasError = true;
    }

    const officialSlot = OFFICIAL_SLOTS.find(s => s.start === startTime);
    if (!officialSlot && startTime !== "10:30") {
      issues.push({
        rowNumber,
        day: day || rawDay || "—",
        slot: rawStart || "SIN HORA",
        field: "HORA_INICIO",
        level: "error",
        message: `Hora de inicio "${rawStart}" inválida. Franjas permitidas: 07:30, 08:30, 09:30, 11:00, 11:50, 12:40.`,
      });
      rowHasError = true;
    }

    if (!rawSubject) {
      issues.push({
        rowNumber,
        day: day || rawDay || "—",
        slot: officialSlot ? `${officialSlot.start} - ${officialSlot.end}` : rawStart,
        field: "ASIGNATURA",
        level: "error",
        message: "Falta el nombre de la ASIGNATURA.",
      });
      rowHasError = true;
    }

    let resolvedGrade = rawGrade;
    if (!resolvedGrade && rawCourse.includes("-")) {
      resolvedGrade = rawCourse.split("-")[0];
    }
    const normalizedGradeStr = resolvedGrade ? normalizeGrade(resolvedGrade) : "";

    if (!normalizedGradeStr) {
      issues.push({
        rowNumber,
        day: day || rawDay || "—",
        slot: officialSlot ? `${officialSlot.start} - ${officialSlot.end}` : rawStart,
        field: "GRADO",
        level: "error",
        message: `Falta el GRADO para la asignatura ${rawSubject || "indicada"}.`,
      });
      rowHasError = true;
    }

    if (!rawCourse) {
      issues.push({
        rowNumber,
        day: day || rawDay || "—",
        slot: officialSlot ? `${officialSlot.start} - ${officialSlot.end}` : rawStart,
        field: "CURSO",
        level: "error",
        message: `Falta el CURSO / GRUPO (ej: 6-1 o 1) para la asignatura ${rawSubject || "indicada"}.`,
      });
      rowHasError = true;
    }

    if (day && officialSlot) {
      const slotKey = `${day}_${officialSlot.start}`;
      if (occupiedSlots.has(slotKey)) {
        issues.push({
          rowNumber,
          day,
          slot: `${officialSlot.start} - ${officialSlot.end}`,
          field: "DIA + HORA_INICIO",
          level: "error",
          message: `Franja duplicada en el archivo (${day} ${officialSlot.start} ya fue asignada en la fila #${occupiedSlots.get(slotKey)}).`,
        });
        rowHasError = true;
      } else {
        occupiedSlots.set(slotKey, rowNumber);
      }
    }

    if (rowHasError || !day || !officialSlot) {
      return;
    }

    let resolvedCourse = rawCourse;
    if (!resolvedCourse.includes("-")) {
      const cleanG = normalizedGradeStr.replace("°", "").trim();
      resolvedCourse = cleanG ? `${cleanG}-${resolvedCourse}` : resolvedCourse;
    }

    const subjIdx = masterSubjects.findIndex(
      s => s.toUpperCase() === rawSubject
    );
    const colorIndex = subjIdx >= 0 ? subjIdx : validBlocks.length;
    const color =
      SCHEDULE_BLOCK_COLORS[colorIndex % SCHEDULE_BLOCK_COLORS.length] ||
      SCHEDULE_BLOCK_COLORS[0];

    validBlocks.push({
      id: `b-csv-${Date.now()}-${idx}`,
      day,
      startTime: officialSlot.start,
      endTime: officialSlot.end,
      subject: rawSubject,
      grade: normalizedGradeStr,
      course: resolvedCourse,
      color,
    });
  });

  if (validBlocks.length === 0 && issues.length === 0) {
    issues.push({
      rowNumber: 1,
      day: "—",
      slot: "—",
      field: "ARCHIVO",
      level: "error",
      message: "El archivo no contiene ninguna clase diligenciada. Rellena ASIGNATURA, GRADO y CURSO en tus horas de clase.",
    });
  }

  return {
    validBlocks,
    issues,
    hasBlockingErrors: issues.length > 0 || validBlocks.length === 0,
    freeSlotsSkipped,
  };
}
