import { ScheduleBlock } from "@/context/AppContext";

const DAYS_ORDER = ["LUNES","MARTES","MIÉRCOLES","JUEVES","VIERNES"] as const;
type Day = typeof DAYS_ORDER[number];

const DAY_NAMES_ES: Record<number, Day> = {
  1: "LUNES", 2: "MARTES", 3: "MIÉRCOLES", 4: "JUEVES", 5: "VIERNES",
};

/** Returns schedule blocks for today */
export function getDailySchedule(blocks: ScheduleBlock[], date = new Date()): ScheduleBlock[] {
  const dayIndex = date.getDay(); // 0=Sun
  const todayName = DAY_NAMES_ES[dayIndex];
  if (!todayName) return [];
  return [...blocks]
    .filter(b => b.day === todayName)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Returns blocks grouped by day for the week */
export function getWeeklySchedule(blocks: ScheduleBlock[]): Record<Day, ScheduleBlock[]> {
  const result = {} as Record<Day, ScheduleBlock[]>;
  for (const day of DAYS_ORDER) {
    result[day] = [...blocks]
      .filter(b => b.day === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  return result;
}

/** Expands a weekly schedule into every working day of a given month.
 *  Returns an array of { date, blocks } */
export function getMonthlySchedule(
  blocks: ScheduleBlock[],
  year: number,
  month: number // 0-indexed
): Array<{ date: Date; dayName: Day; blocks: ScheduleBlock[] }> {
  const result: Array<{ date: Date; dayName: Day; blocks: ScheduleBlock[] }> = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayIndex = date.getDay();
    const dayName = DAY_NAMES_ES[dayIndex];
    if (!dayName) continue; // skip weekends
    const dayBlocks = blocks
      .filter(b => b.day === dayName)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
    result.push({ date, dayName, blocks: dayBlocks });
  }
  return result;
}

/** Returns unique subjects from a schedule */
export function getSubjectsFromSchedule(blocks: ScheduleBlock[]): string[] {
  return [...new Set(blocks.map(b => b.subject))].sort();
}

/** Returns unique courses from a schedule */
export function getCoursesFromSchedule(blocks: ScheduleBlock[]): string[] {
  return [...new Set(blocks.map(b => b.course))].sort();
}

/** Total weekly hours per subject */
export function getWeeklyHoursBySubject(blocks: ScheduleBlock[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const block of blocks) {
    const [sh, sm] = block.startTime.split(":").map(Number);
    const [eh, em] = block.endTime.split(":").map(Number);
    const hours = (eh * 60 + em - sh * 60 - sm) / 60;
    result[block.subject] = (result[block.subject] || 0) + hours;
  }
  return result;
}
