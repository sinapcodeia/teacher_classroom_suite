/**
 * Pruebas unitarias del Motor Académico SIEEE (gradeUtils.ts)
 * Ejecutar:  node --experimental-strip-types scripts/test-grade-engine.mts
 */
import {
  calculatePeriodGrades, calculateSubjectPeriodScore, calculateStudentPeriodAverage,
  calculateStudentYearBreakdown, calculateGroupRankings, computeCompetitionRanks,
  resolveGroupEvaluatedPeriods, calculateStudentAcademicSummary, normalizePeriodId, formatRank
// @ts-expect-error — Node --experimental-strip-types requiere extensión explícita .ts
} from "../src/lib/gradeUtils.ts";

let passed = 0, failed = 0;
function eq(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; console.log(`  ❌ ${name}\n     esperado: ${JSON.stringify(expected)}\n     obtenido: ${JSON.stringify(actual)}`); }
}
const blk = (sb: (number|null)[] = [], sbh: (number|null)[] = [], sr: (number|null)[] = [], cv: (number|null)[] = [], aut: number|null = null, rec: number|null = null) =>
  ({ sb, sbh, sr, cv, aut, rec });
// Bloque con nota uniforme "n" en todos los pilares → definitiva = n
const full = (n: number) => blk([n], [n], [n], [n], n);
const st = (id: string, periods: Partial<Record<string, number>>, extra: Record<string, unknown> = {}) => ({
  id, grado: "6", curso: "1",
  detailedGrades: { "TECNOLOGÍA": Object.fromEntries(Object.entries(periods).map(([p, n]) => [p, full(n as number)])) },
  ...extra
});

console.log("\n1) Nota de asignatura por período (ponderación SIEEE)");
eq("Normaliza sobre pilares calificados (SB 4.0 + SBH 4.0 = 4.0, no 2.8)", calculatePeriodGrades(blk([4], [4])).definitiva, 4);
eq("Ponderación completa 30/40/20/5/5", calculatePeriodGrades(blk([5], [4], [3], [2], 1)).definitiva, round(5*0.3+4*0.4+3*0.2+2*0.05+1*0.05));
eq("Recuperación reemplaza la parcial", calculatePeriodGrades(blk([2], [2], [], [], null, 3.5)).definitiva, 3.5);
eq("Bloque vacío → null (no 0)", calculateSubjectPeriodScore(blk()), null);
eq("Solo REC cuenta como nota", calculateSubjectPeriodScore(blk([], [], [], [], null, 3.2)), 3.2);

console.log("\n2) Promedio del estudiante por período");
const multi = { id: "m", detailedGrades: { A: { p1: full(4) }, B: { p1: full(3) }, C: { p2: full(5) } } };
eq("Promedio de asignaturas del P1", calculateStudentPeriodAverage(multi, "p1"), 3.5);
eq("Filtro por asignatura (case-insensitive)", calculateStudentPeriodAverage(multi, "p1", { subject: "a" }), 4);
eq("Período sin notas → null", calculateStudentPeriodAverage(multi, "p3"), null);
eq("Acepta llaves legacy '1'", calculateStudentPeriodAverage({ detailedGrades: { A: { "1": full(4.4) } } }, "p1"), 4.4);
const withBonus = { ...multi, grades: [{ score: 5, type: "participation", periodId: "p1" }, { score: 5, type: "participation", periodId: "p2" }] };
eq("Bono de participación SOLO del período (P1 +0.10)", calculateStudentPeriodAverage(withBonus, "p1"), 3.6);
eq("Bono P2 independiente", calculateStudentPeriodAverage(withBonus, "p2"), 5);
eq("normalizePeriodId('Periodo 2')", normalizePeriodId("Periodo 2"), "p2");

console.log("\n3) Nota Final de los 3 períodos");
const A = st("A", { p1: 4.2 });
const B = st("B", { p1: 4.0, p2: 4.0, p3: 4.1 });
const evalAll = resolveGroupEvaluatedPeriods([A, B], "p3");
eq("Períodos evaluados del grupo", evalAll, ["p1", "p2", "p3"]);
const bA = calculateStudentYearBreakdown(A, "p3", { evaluatedPeriods: evalAll });
eq("Alumno con solo P1=4.2 → acumulado 1.4 (antes daba 4.2)", bA.accumulatedAvg, 1.4);
eq("Períodos faltantes cuentan 0", bA.missingPeriods, ["p2", "p3"]);
const bB = calculateStudentYearBreakdown(B, "p3", { evaluatedPeriods: evalAll });
eq("Alumno con 3 períodos (4.0, 4.0, 4.1) → 4.03", bB.accumulatedAvg, 4.03);
eq("Nota Final Anual = (P1+P2+P3)/3", bB.finalAnnualAvg, 4.03);
eq("Año cerrado al evaluar P3", bB.isYearClosed, true);
const bMid = calculateStudentYearBreakdown(B, "p2", { evaluatedPeriods: resolveGroupEvaluatedPeriods([B], "p2") });
eq("En P2 el acumulado solo usa P1 y P2 (no adelanta P3)", [bMid.accumulatedAvg, bMid.isYearClosed], [4, false]);
const late = [st("L1", { p2: 4, p3: 4 }), st("L2", { p2: 3, p3: 5 })];
eq("Grupo que empezó en P2: P1 no castiga", resolveGroupEvaluatedPeriods(late, "p3"), ["p2", "p3"]);

console.log("\n4) Primeros puestos");
const r1 = calculateGroupRankings([A, B], { activePeriod: "p3" });
eq("Puesto Final: B 1° y A 2°", [r1.entries.get("B")!.finalRank, r1.entries.get("A")!.finalRank], [1, 2]);
eq("Puesto P1: A 1° (4.2) y B 2°", [r1.entries.get("A")!.periodRanks.p1, r1.entries.get("B")!.periodRanks.p1], [1, 2]);
eq("Sin nota en P2 → sin puesto P2", r1.entries.get("A")!.periodRanks.p2, null);
eq("rankedOf P2 = 1", r1.entries.get("B")!.rankedOf.p2, 1);

const ties = computeCompetitionRanks([
  { id: "x", score: 4.5 }, { id: "y", score: 4.5 }, { id: "z", score: 4.0 }, { id: "w", score: null }
]);
eq("Empate total comparte puesto (1-1-3)", [ties.get("x"), ties.get("y"), ties.get("z"), ties.get("w")], [1, 1, 3, undefined]);
const tb = computeCompetitionRanks([{ id: "a", score: 4.5, tiebreakers: [3.9] }, { id: "b", score: 4.5, tiebreakers: [4.2] }]);
eq("Desempate por acumulado (b 1°, a 2°)", [tb.get("b"), tb.get("a")], [1, 2]);
const fp = computeCompetitionRanks([{ id: "a", score: 4.004 }, { id: "b", score: 3.996 }]);
eq("Redondeo a 2 decimales antes de comparar (4.00 = 4.00 → empate)", [fp.get("a"), fp.get("b")], [1, 1]);

const C1 = st("C1", { p1: 4.8 }); const C2 = { ...st("C2", { p1: 3.0 }), curso: "2" };
const byCourse = calculateGroupRankings([C1, C2], { activePeriod: "p1" });
eq("Ranking por salón: cada uno 1° en su curso", [byCourse.entries.get("C1")!.periodRanks.p1, byCourse.entries.get("C2")!.periodRanks.p1], [1, 1]);
const global = calculateGroupRankings([C1, C2], { activePeriod: "p1", groupBy: "none" });
eq("groupBy none: ranking del listado completo", global.getTop("p1", 5).map(e => e.studentId), ["C1", "C2"]);

const abs1 = st("Q1", { p1: 4 }, { attendanceRecord: { d1: "absent", d2: "absent" } });
const abs2 = st("Q2", { p1: 4 }, { attendanceRecord: { d1: "absent" } });
const rAbs = calculateGroupRankings([abs1, abs2], { activePeriod: "p1" });
eq("Desempate final por menos inasistencias", [rAbs.entries.get("Q2")!.periodRanks.p1, rAbs.entries.get("Q1")!.periodRanks.p1], [1, 2]);

eq("formatRank", [formatRank(1), formatRank(2), formatRank(3), formatRank(7), formatRank(null)], ["🥇 1°", "🥈 2°", "🥉 3°", "#7", "—"]);

console.log("\n5) Compatibilidad calculateStudentAcademicSummary");
const sm = calculateStudentAcademicSummary(B, "p2");
eq("periodAvg = nota del período activo", sm.periodAvg, 4);
eq("overallAvg = acumulado hasta P2", sm.overallAvg, 4);
const sEmpty = calculateStudentAcademicSummary({ avgGrade: 3.7 }, "p1");
eq("Sin detailedGrades conserva avgGrade legacy", sEmpty.periodAvg, 3.7);
const sNoActive = calculateStudentAcademicSummary(st("N", { p1: 4.4 }), "p2");
eq("Período activo sin notas → muestra acumulado de referencia", sNoActive.periodAvg, 4.4);

function round(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }

console.log(`\nResultado: ${passed} OK · ${failed} FALLIDAS\n`);
if (failed > 0) process.exit(1);
