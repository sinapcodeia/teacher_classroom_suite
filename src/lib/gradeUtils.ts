export type DetailedGrades = {
  sb: (number | null)[]; // Saber (8 slots)
  sbh: (number | null)[]; // Saber-Hacer (8 slots)
  sr: (number | null)[]; // Ser (5 slots)
  cv: (number | null)[]; // Convivencia (3 slots)
  aut: number | null; // Autoevaluación (1 slot)
};

export interface StudentAcademicSummary {
  overallAvg: number; // Definitiva Acumulada del Año
  periodAvg: number;  // Promedio del Periodo Activo
  subjectAverages: Record<string, number>; // subjectId -> Definitiva Acumulada
  periodSubjectAverages: Record<string, Record<string, number>>; // subjectId -> periodId -> nota
}

export interface MinimalStudentForSummary {
  avgGrade?: number;
  detailedGrades?: Record<string, Record<string, DetailedGrades>>;
}

/**
 * Calcula la nota final ponderada según los Pilares Institucionales IETABA.
 * Pesos definidos: SB=30%, SBH=40%, SR=20%, CV=5%, AUT=5%.
 */
export function calculateDetailedFinal(detailed: DetailedGrades): number {
  const getAvg = (vals: (number | null)[] | null | undefined): number | null => {
    if (!vals) return null;
    const valid = (vals as (number | null)[]).filter((v): v is number => v !== null && v !== undefined);
    return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
  };

  const sbAvg  = getAvg(detailed.sb);
  const sbhAvg = getAvg(detailed.sbh);
  const srAvg  = getAvg(detailed.sr);
  const cvAvg  = getAvg(detailed.cv);
  const autVal = (detailed.aut !== null && detailed.aut !== undefined) ? detailed.aut : null;

  // Pesos brutos institucionales
  const WEIGHTS = { sb: 0.30, sbh: 0.40, sr: 0.20, cv: 0.05, aut: 0.05 };

  // Construir mapa solo de pilares con datos reales
  const active: { avg: number; weight: number }[] = [];
  if (sbAvg  !== null) active.push({ avg: sbAvg,  weight: WEIGHTS.sb  });
  if (sbhAvg !== null) active.push({ avg: sbhAvg, weight: WEIGHTS.sbh });
  if (srAvg  !== null) active.push({ avg: srAvg,  weight: WEIGHTS.sr  });
  if (cvAvg  !== null) active.push({ avg: cvAvg,  weight: WEIGHTS.cv  });
  if (autVal !== null) active.push({ avg: autVal, weight: WEIGHTS.aut });

  if (active.length === 0) return 0;

  // Normalizar pesos según los pilares activos
  const totalWeight = active.reduce((sum, p) => sum + p.weight, 0);
  const final = active.reduce((sum, p) => sum + (p.avg * p.weight) / totalWeight, 0);

  return Number(final.toFixed(2));
}

/**
 * CÁLCULO MASTER AUDITADO MULTI-PERIODO Y ACUMULADO INSTITUCIONAL
 */
export function calculateStudentAcademicSummary(
  student: MinimalStudentForSummary, 
  activePeriod: string = "p1"
): StudentAcademicSummary {
  const detailedGrades = student.detailedGrades || {};
  const subjectIds = Object.keys(detailedGrades);

  if (subjectIds.length === 0) {
    const defaultAvg = student.avgGrade || 0;
    return {
      overallAvg: defaultAvg,
      periodAvg: defaultAvg,
      subjectAverages: {},
      periodSubjectAverages: {}
    };
  }

  const periodSubjectAverages: Record<string, Record<string, number>> = {};
  const subjectAverages: Record<string, number> = {};
  const periodTotals: Record<string, number[]> = {};

  let totalCumulativeSum = 0;
  let totalCumulativeCount = 0;

  subjectIds.forEach(subId => {
    const pGrades = detailedGrades[subId] || {};
    periodSubjectAverages[subId] = {};
    const subPeriodNotes: number[] = [];

    Object.entries(pGrades).forEach(([pId, detailed]) => {
      if (detailed) {
        const note = calculateDetailedFinal(detailed);
        if (note > 0) {
          periodSubjectAverages[subId][pId] = note;
          subPeriodNotes.push(note);

          if (!periodTotals[pId]) periodTotals[pId] = [];
          periodTotals[pId].push(note);
        }
      }
    });

    if (subPeriodNotes.length > 0) {
      const subAvg = subPeriodNotes.reduce((a, b) => a + b, 0) / subPeriodNotes.length;
      subjectAverages[subId] = Number(subAvg.toFixed(2));
      totalCumulativeSum += subAvg;
      totalCumulativeCount++;
    }
  });

  let periodAvg = 0;
  if (activePeriod && periodTotals[activePeriod] && periodTotals[activePeriod].length > 0) {
    const sum = periodTotals[activePeriod].reduce((a, b) => a + b, 0);
    periodAvg = Number((sum / periodTotals[activePeriod].length).toFixed(2));
  } else {
    periodAvg = totalCumulativeCount > 0 ? Number((totalCumulativeSum / totalCumulativeCount).toFixed(2)) : (student.avgGrade || 0);
  }

  const overallAvg = totalCumulativeCount > 0 
    ? Number((totalCumulativeSum / totalCumulativeCount).toFixed(2)) 
    : (student.avgGrade || 0);

  return {
    overallAvg,
    periodAvg,
    subjectAverages,
    periodSubjectAverages
  };
}
