/**
 * ════════════════════════════════════════════════════════════════════════════
 *  MOTOR ACADÉMICO OFICIAL SIEEE · IETABA  (Fuente Única de Verdad)
 * ════════════════════════════════════════════════════════════════════════════
 *  Toda la app (Dashboard, Estudiantes, Dirección de Grupo, Ficha 360°,
 *  Reportes PDF y BI) DEBE calcular notas, acumulados y puestos SOLO con
 *  las funciones de este archivo. No duplicar fórmulas en componentes.
 *
 *  1. Nota de una asignatura en un período (calculatePeriodGrades):
 *       SB 30% · SBH 40% · SR 20% · CV 5% · AUT 5%
 *       - Se normaliza sobre los pilares que ya tienen nota (períodos en curso).
 *       - Si existe Recuperación (REC), reemplaza la nota parcial.
 *  2. Promedio del estudiante en un período (calculateStudentPeriodAverage):
 *       promedio de las asignaturas calificadas en ese período
 *       + bono de participación de ESE período (tope configurable, máx 5.0).
 *  3. Acumulado / Nota Final de los 3 períodos (calculateStudentYearBreakdown):
 *       los 3 períodos pesan igual (1/3 c/u).
 *       Acumulado = Σ notas de los períodos evaluados / Nº períodos evaluados,
 *       donde un período evaluado sin nota del estudiante cuenta como 0.
 *       Nota Final Anual = (P1 + P2 + P3) / 3.
 *  4. Puestos (calculateGroupRankings): ranking por P1, P2, P3 y Final,
 *       dentro de cada salón (grado + curso), con desempate académico y
 *       empates compartidos (ranking de competencia 1-2-2-4).
 * ════════════════════════════════════════════════════════════════════════════
 */

export type DetailedGrades = {
  sb: (number | null)[]; // Saber (8 slots)
  sbh: (number | null)[]; // Saber-Hacer (8 slots)
  sr: (number | null)[]; // Ser (5 slots)
  cv: (number | null)[]; // Convivencia (3 slots)
  aut: number | null; // Autoevaluación (1 slot)
  rec?: number | null; // Recuperación del Periodo (1 slot)
};

export interface StudentAcademicSummary {
  overallAvg: number; // Acumulado del Año (períodos evaluados)
  periodAvg: number;  // Promedio del Periodo Activo
  subjectAverages: Record<string, number>; // subjectId -> Definitiva Acumulada
  periodSubjectAverages: Record<string, Record<string, number>>; // subjectId -> periodId -> nota
}

export interface MinimalGradeEntry {
  score: number;
  type?: string;
  periodId?: string;
}

export interface MinimalStudentForSummary {
  id?: string;
  avgGrade?: number;
  grado?: string;
  curso?: string;
  detailedGrades?: Record<string, Record<string, DetailedGrades>>;
  grades?: MinimalGradeEntry[];
  participationCap?: number;
  attendanceRecord?: Record<string, string>;
}

export const PERIOD_IDS = ["p1", "p2", "p3"] as const;
export type PeriodId = typeof PERIOD_IDS[number];
export const TOTAL_ACADEMIC_PERIODS = PERIOD_IDS.length;
export const PASSING_GRADE = 3.0;

export const SIEEE_WEIGHTS = { sb: 0.30, sbh: 0.40, sr: 0.20, cv: 0.05, aut: 0.05 } as const;

/** Redondeo seguro a 2 decimales (evita errores de coma flotante tipo 4.005 → 4.00). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Normaliza identificadores de período: "1", 1, "P1", "p1", "periodo 1" → "p1". */
export function normalizePeriodId(p: string | number | null | undefined): PeriodId | null {
  if (p === null || p === undefined) return null;
  const m = String(p).toLowerCase().match(/([1-3])/);
  if (!m) return null;
  return `p${m[1]}` as PeriodId;
}

const isNum = (v: unknown): v is number => typeof v === "number" && !Number.isNaN(v);

/** ¿El bloque de notas del período tiene al menos una nota real (o recuperación)? */
export function hasDetailedData(detailed: DetailedGrades | null | undefined): boolean {
  if (!detailed) return false;
  const anyIn = (arr?: (number | null)[] | null) => Array.isArray(arr) && arr.some(isNum);
  return anyIn(detailed.sb) || anyIn(detailed.sbh) || anyIn(detailed.sr) || anyIn(detailed.cv) || isNum(detailed.aut) || isNum(detailed.rec);
}

/**
 * Calcula la nota final ponderada según los Pilares Institucionales IETABA.
 * Pesos definidos: SB=30%, SBH=40%, SR=20%, CV=5%, AUT=5%.
 */
export function calculatePeriodGrades(detailed: DetailedGrades): { parcial: number, rec: number | null, definitiva: number } {
  const getAvg = (vals: (number | null)[] | null | undefined): number | null => {
    if (!Array.isArray(vals)) return null;
    const valid = vals.filter(isNum);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  };

  const sbAvg  = getAvg(detailed?.sb);
  const sbhAvg = getAvg(detailed?.sbh);
  const srAvg  = getAvg(detailed?.sr);
  const cvAvg  = getAvg(detailed?.cv);
  const autVal = isNum(detailed?.aut) ? detailed.aut : null;

  // Construir mapa solo de pilares con datos reales
  const active: { avg: number; weight: number }[] = [];
  if (sbAvg  !== null) active.push({ avg: sbAvg,  weight: SIEEE_WEIGHTS.sb  });
  if (sbhAvg !== null) active.push({ avg: sbhAvg, weight: SIEEE_WEIGHTS.sbh });
  if (srAvg  !== null) active.push({ avg: srAvg,  weight: SIEEE_WEIGHTS.sr  });
  if (cvAvg  !== null) active.push({ avg: cvAvg,  weight: SIEEE_WEIGHTS.cv  });
  if (autVal !== null) active.push({ avg: autVal, weight: SIEEE_WEIGHTS.aut });

  let parcial = 0;
  if (active.length > 0) {
    const totalWeight = active.reduce((sum, p) => sum + p.weight, 0);
    parcial = active.reduce((sum, p) => sum + (p.avg * p.weight) / totalWeight, 0);
  }

  parcial = round2(parcial);
  const rec = isNum(detailed?.rec) ? (detailed.rec as number) : null;

  // Regla institucional: la Recuperación reemplaza la nota parcial del período.
  const definitiva = rec !== null ? rec : parcial;

  return { parcial, rec, definitiva };
}

/**
 * Retorna la definitiva (considerando la recuperación si existe).
 */
export function calculateDetailedFinal(detailed: DetailedGrades): number {
  return calculatePeriodGrades(detailed).definitiva;
}

/**
 * Nota oficial de UNA asignatura en UN período. `null` si aún no tiene notas.
 */
export function calculateSubjectPeriodScore(detailed: DetailedGrades | null | undefined): number | null {
  if (!detailed || !hasDetailedData(detailed)) return null;
  const v = calculatePeriodGrades(detailed).definitiva;
  return v > 0 ? v : null;
}

/**
 * BONO SALVAVIDAS POR PARTICIPACIÓN EN CLASE
 * Suma décimas adicionales directamente sobre la nota final del período.
 * @param participations Cantidad o array de participaciones registradas
 * @param maxCap Tope máximo configurable (+0.5 por defecto, o +1.0 punto máximo)
 */
export function calculateParticipationBonus(
  participations: number | MinimalGradeEntry[],
  maxCap: number = 0.5
): number {
  if (!participations) return 0;

  let rawBonus = 0;
  if (typeof participations === "number") {
    rawBonus = participations * 0.10;
  } else if (Array.isArray(participations)) {
    const partGrades = participations.filter(g => g.type === 'participation');
    rawBonus = partGrades.reduce((sum, g) => sum + ((g.score || 5.0) * 0.02), 0);
  }

  return round2(Math.min(maxCap, rawBonus));
}

/**
 * Bono de participación SOLO del período indicado.
 * Participaciones antiguas sin período se asignan al período activo.
 */
export function calculatePeriodParticipationBonus(
  student: MinimalStudentForSummary,
  periodId: string,
  activePeriod?: string
): number {
  if (!student.grades || student.grades.length === 0) return 0;
  const target = normalizePeriodId(periodId);
  const active = normalizePeriodId(activePeriod);
  const inPeriod = student.grades.filter(g => {
    if (g.type !== 'participation') return false;
    const gp = normalizePeriodId(g.periodId);
    return gp ? gp === target : target === active;
  });
  return calculateParticipationBonus(inPeriod, student.participationCap || 0.5);
}

/** Busca el bloque de notas del período aceptando llaves "p1" o "1". */
function getPeriodBlock(pMap: Record<string, DetailedGrades> | undefined, periodId: PeriodId): DetailedGrades | undefined {
  if (!pMap) return undefined;
  return pMap[periodId] || pMap[periodId.replace("p", "")] || pMap[periodId.toUpperCase()];
}

/** Devuelve los mapas por asignatura a evaluar (todas o una en particular, sin distinguir mayúsculas). */
function getSubjectMaps(student: MinimalStudentForSummary, subject?: string): Record<string, DetailedGrades>[] {
  const dg = student.detailedGrades || {};
  if (subject && subject !== "TODOS" && subject !== "TODAS") {
    if (dg[subject]) return [dg[subject]];
    const key = Object.keys(dg).find(k => k.trim().toUpperCase() === subject.trim().toUpperCase());
    return key ? [dg[key]] : [];
  }
  return Object.values(dg);
}

export interface PeriodAverageOptions {
  subject?: string;
  includeBonus?: boolean;
  activePeriod?: string;
}

/**
 * Promedio oficial del estudiante en un período (todas las asignaturas o una).
 * `null` si no tiene ninguna nota en ese período.
 */
export function calculateStudentPeriodAverage(
  student: MinimalStudentForSummary,
  periodId: string,
  opts: PeriodAverageOptions = {}
): number | null {
  const pId = normalizePeriodId(periodId);
  if (!pId) return null;
  const scores = getSubjectMaps(student, opts.subject)
    .map(m => calculateSubjectPeriodScore(getPeriodBlock(m, pId)))
    .filter((v): v is number => v !== null);
  if (scores.length === 0) return null;
  const base = scores.reduce((a, b) => a + b, 0) / scores.length;
  const includeBonus = opts.includeBonus !== false;
  const bonus = includeBonus ? calculatePeriodParticipationBonus(student, pId, opts.activePeriod) : 0;
  return round2(Math.min(5.0, base + bonus));
}

export interface StudentYearBreakdown {
  periods: Record<PeriodId, number | null>;
  /** Períodos que cuentan para el acumulado (missing = 0). */
  evaluatedPeriods: PeriodId[];
  /** Períodos en los que el estudiante sí tiene nota. */
  completedCount: number;
  /** Suma de puntos de los períodos evaluados. */
  pointsAccumulated: number;
  /** Promedio acumulado sobre los períodos evaluados. */
  accumulatedAvg: number | null;
  /** (P1 + P2 + P3) / 3 — Nota Final Anual (definitiva cuando se cierra P3). */
  finalAnnualAvg: number | null;
  /** true cuando los 3 períodos ya están evaluados. */
  isYearClosed: boolean;
  /** Períodos evaluados en los que el estudiante NO tiene nota (cuentan como 0). */
  missingPeriods: PeriodId[];
}

export interface YearBreakdownOptions extends PeriodAverageOptions {
  /** Períodos evaluados a nivel de grupo (recomendado para comparaciones justas). */
  evaluatedPeriods?: PeriodId[];
}

/** Índice del período activo (p1→0, p2→1, p3→2). Por defecto p3 (todo el año). */
function activeIndex(activePeriod?: string): number {
  const p = normalizePeriodId(activePeriod);
  return p ? PERIOD_IDS.indexOf(p) : PERIOD_IDS.length - 1;
}

/**
 * Desglose anual oficial del estudiante: P1, P2, P3, Acumulado y Nota Final Anual.
 */
export function calculateStudentYearBreakdown(
  student: MinimalStudentForSummary,
  activePeriod?: string,
  opts: YearBreakdownOptions = {}
): StudentYearBreakdown {
  const periods = {} as Record<PeriodId, number | null>;
  PERIOD_IDS.forEach(p => {
    periods[p] = calculateStudentPeriodAverage(student, p, { ...opts, activePeriod });
  });

  const idx = activeIndex(activePeriod);
  const evaluatedPeriods = (opts.evaluatedPeriods
    ? opts.evaluatedPeriods.filter(p => PERIOD_IDS.indexOf(p) <= idx)
    : PERIOD_IDS.filter((p, i) => i <= idx && periods[p] !== null)) as PeriodId[];

  const completedCount = PERIOD_IDS.filter(p => periods[p] !== null).length;
  const pointsAccumulated = round2(evaluatedPeriods.reduce((s, p) => s + (periods[p] ?? 0), 0));
  const hasAny = completedCount > 0;
  const accumulatedAvg = evaluatedPeriods.length > 0 && hasAny
    ? round2(pointsAccumulated / evaluatedPeriods.length)
    : null;
  const finalAnnualAvg = hasAny
    ? round2(PERIOD_IDS.reduce((s, p) => s + (periods[p] ?? 0), 0) / TOTAL_ACADEMIC_PERIODS)
    : null;
  const missingPeriods = evaluatedPeriods.filter(p => periods[p] === null);

  return {
    periods,
    evaluatedPeriods,
    completedCount,
    pointsAccumulated,
    accumulatedAvg,
    finalAnnualAvg,
    isYearClosed: evaluatedPeriods.length === TOTAL_ACADEMIC_PERIODS,
    missingPeriods
  };
}

/** Clave del salón (grado + curso) usada para agrupar rankings. */
export function defaultGroupKey(s: MinimalStudentForSummary): string {
  const g = String(s.grado ?? "").trim().toUpperCase().replace(/[°º]/g, "");
  const c = String(s.curso ?? "").trim().toUpperCase();
  return `${g}|${c}`;
}

/**
 * Períodos evaluados de un grupo: los períodos ≤ período activo en los que
 * al menos un estudiante del grupo tiene nota. Así, si el docente empezó a
 * usar la app en P2, el P1 vacío no castiga a nadie; pero si P1 sí se evaluó,
 * el estudiante sin nota en P1 recibe 0 en ese período.
 */
export function resolveGroupEvaluatedPeriods(
  students: MinimalStudentForSummary[],
  activePeriod?: string,
  subject?: string
): PeriodId[] {
  const idx = activeIndex(activePeriod);
  return PERIOD_IDS.filter((p, i) =>
    i <= idx && students.some(s => calculateStudentPeriodAverage(s, p, { subject, includeBonus: false }) !== null)
  ) as PeriodId[];
}

/** Cuenta inasistencias registradas ('absent'). */
export function countAbsences(s: MinimalStudentForSummary): number {
  return Object.values(s.attendanceRecord || {}).filter(v => v === "absent").length;
}

export interface RankItem {
  id: string;
  score: number | null;
  /** Criterios de desempate en orden de prioridad (mayor es mejor). */
  tiebreakers?: number[];
}

/**
 * Ranking de competencia estándar ("1-2-2-4"):
 *  - ordena por puntaje (2 decimales) desc y luego por desempates;
 *  - si dos estudiantes empatan en puntaje y en TODOS los desempates, comparten puesto.
 *  - quien no tiene puntaje (null) no recibe puesto.
 */
export function computeCompetitionRanks(items: RankItem[]): Map<string, number> {
  const valid = items
    .filter(i => i.score !== null && i.score !== undefined && !Number.isNaN(i.score))
    .map(i => ({ ...i, s: round2(i.score as number), t: (i.tiebreakers || []).map(v => round2(v)) }));

  const cmp = (a: typeof valid[number], b: typeof valid[number]) => {
    if (b.s !== a.s) return b.s - a.s;
    const len = Math.max(a.t.length, b.t.length);
    for (let k = 0; k < len; k++) {
      const d = (b.t[k] ?? 0) - (a.t[k] ?? 0);
      if (d !== 0) return d;
    }
    return 0;
  };

  valid.sort(cmp);
  const ranks = new Map<string, number>();
  valid.forEach((item, i) => {
    if (i > 0 && cmp(valid[i - 1], item) === 0) {
      ranks.set(item.id, ranks.get(valid[i - 1].id) as number);
    } else {
      ranks.set(item.id, i + 1);
    }
  });
  return ranks;
}

export type RankingScope = PeriodId | "final";

export interface StudentRankingEntry {
  studentId: string;
  groupKey: string;
  breakdown: StudentYearBreakdown;
  absences: number;
  periodRanks: Record<PeriodId, number | null>;
  /** Puesto por Acumulado / Nota Final de los períodos evaluados. */
  finalRank: number | null;
  /** Tamaño del grupo rankeado para cada alcance (para mostrar "#2 / 27"). */
  rankedOf: Record<RankingScope, number>;
}

export interface GroupRankingOptions {
  activePeriod?: string;
  subject?: string;
  /** "course" = puesto dentro de cada salón (grado+curso). "none" = todo el listado recibido. */
  groupBy?: "course" | "none";
  groupKey?: (s: MinimalStudentForSummary) => string;
}

export interface GroupRankingResult {
  entries: Map<string, StudentRankingEntry>;
  evaluatedPeriodsByGroup: Map<string, PeriodId[]>;
  /** Devuelve los N primeros puestos para un alcance (P1, P2, P3 o final). */
  getTop: (scope: RankingScope, n?: number) => StudentRankingEntry[];
  getScore: (entry: StudentRankingEntry, scope: RankingScope) => number | null;
}

/**
 * MOTOR OFICIAL DE PRIMEROS PUESTOS
 *  - Puesto por período (P1, P2, P3): desempate por acumulado y luego por menos inasistencias.
 *  - Puesto Final (acumulado de períodos evaluados = Nota Final de los 3 períodos al cerrar P3):
 *    desempate por la nota del período activo y luego por menos inasistencias.
 */
export function calculateGroupRankings(
  students: (MinimalStudentForSummary & { id: string })[],
  opts: GroupRankingOptions = {}
): GroupRankingResult {
  const { activePeriod, subject } = opts;
  const keyFn = opts.groupBy === "none" ? () => "ALL" : (opts.groupKey || defaultGroupKey);

  const groups = new Map<string, (MinimalStudentForSummary & { id: string })[]>();
  students.forEach(s => {
    const k = keyFn(s);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(s);
  });

  const entries = new Map<string, StudentRankingEntry>();
  const evaluatedPeriodsByGroup = new Map<string, PeriodId[]>();
  const activeP = normalizePeriodId(activePeriod) || "p3";

  groups.forEach((members, gKey) => {
    const evaluated = resolveGroupEvaluatedPeriods(members, activePeriod, subject);
    evaluatedPeriodsByGroup.set(gKey, evaluated);

    const rows = members.map(s => ({
      s,
      breakdown: calculateStudentYearBreakdown(s, activePeriod, { subject, evaluatedPeriods: evaluated }),
      absences: countAbsences(s)
    }));

    const periodRankMaps = {} as Record<PeriodId, Map<string, number>>;
    PERIOD_IDS.forEach(p => {
      periodRankMaps[p] = computeCompetitionRanks(rows.map(r => ({
        id: r.s.id,
        score: r.breakdown.periods[p],
        tiebreakers: [r.breakdown.accumulatedAvg ?? 0, -r.absences]
      })));
    });
    const finalRankMap = computeCompetitionRanks(rows.map(r => ({
      id: r.s.id,
      score: r.breakdown.accumulatedAvg,
      tiebreakers: [r.breakdown.periods[activeP] ?? 0, -r.absences]
    })));

    const rankedOf = {
      p1: periodRankMaps.p1.size,
      p2: periodRankMaps.p2.size,
      p3: periodRankMaps.p3.size,
      final: finalRankMap.size
    } as Record<RankingScope, number>;

    rows.forEach(r => {
      entries.set(r.s.id, {
        studentId: r.s.id,
        groupKey: gKey,
        breakdown: r.breakdown,
        absences: r.absences,
        periodRanks: {
          p1: periodRankMaps.p1.get(r.s.id) ?? null,
          p2: periodRankMaps.p2.get(r.s.id) ?? null,
          p3: periodRankMaps.p3.get(r.s.id) ?? null
        },
        finalRank: finalRankMap.get(r.s.id) ?? null,
        rankedOf
      });
    });
  });

  const getScore = (e: StudentRankingEntry, scope: RankingScope) =>
    scope === "final" ? e.breakdown.accumulatedAvg : e.breakdown.periods[scope];
  const getRank = (e: StudentRankingEntry, scope: RankingScope) =>
    scope === "final" ? e.finalRank : e.periodRanks[scope];

  const getTop = (scope: RankingScope, n = 5) =>
    Array.from(entries.values())
      .filter(e => getRank(e, scope) !== null)
      .sort((a, b) => (getRank(a, scope)! - getRank(b, scope)!) || ((getScore(b, scope) ?? 0) - (getScore(a, scope) ?? 0)))
      .slice(0, n);

  return { entries, evaluatedPeriodsByGroup, getTop, getScore };
}

/** Etiqueta visual de un puesto: 🥇 1° · 🥈 2° · 🥉 3° · #4 */
export function formatRank(rank: number | null | undefined): string {
  if (!rank) return "—";
  if (rank === 1) return "🥇 1°";
  if (rank === 2) return "🥈 2°";
  if (rank === 3) return "🥉 3°";
  return `#${rank}`;
}

/**
 * CÁLCULO MASTER AUDITADO MULTI-PERIODO Y ACUMULADO INSTITUCIONAL
 * (compatibilidad: usado para `avgGrade` y vistas existentes).
 */
export function calculateStudentAcademicSummary(
  student: MinimalStudentForSummary,
  activePeriod: string = "p1",
  evaluatedPeriods?: PeriodId[]
): StudentAcademicSummary {
  const detailedGrades = student.detailedGrades || {};
  const subjectIds = Object.keys(detailedGrades);

  if (subjectIds.length === 0) {
    const defaultAvg = student.avgGrade || 0;
    return { overallAvg: defaultAvg, periodAvg: defaultAvg, subjectAverages: {}, periodSubjectAverages: {} };
  }

  const periodSubjectAverages: Record<string, Record<string, number>> = {};
  const subjectAverages: Record<string, number> = {};

  subjectIds.forEach(subId => {
    periodSubjectAverages[subId] = {};
    const notes: number[] = [];
    PERIOD_IDS.forEach(pId => {
      const note = calculateSubjectPeriodScore(getPeriodBlock(detailedGrades[subId], pId));
      if (note !== null) {
        periodSubjectAverages[subId][pId] = note;
        notes.push(note);
      }
    });
    if (notes.length > 0) subjectAverages[subId] = round2(notes.reduce((a, b) => a + b, 0) / notes.length);
  });

  const breakdown = calculateStudentYearBreakdown(student, activePeriod, { evaluatedPeriods });
  const activeP = normalizePeriodId(activePeriod);
  const periodValue = activeP ? breakdown.periods[activeP] : null;
  const fallback = breakdown.accumulatedAvg ?? (student.avgGrade || 0);

  return {
    overallAvg: breakdown.accumulatedAvg ?? fallback,
    // Si el período activo aún no tiene notas, se muestra el acumulado como referencia.
    periodAvg: periodValue ?? fallback,
    subjectAverages,
    periodSubjectAverages
  };
}
