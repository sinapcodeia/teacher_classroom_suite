/**
 * Formato estandarizado del TEJIDO DE APRENDIZAJE (Puyuaizpa Putkit Kamna).
 *
 * Jerarquía institucional:
 *   Periodo (Maza / Pas / Kutña T+T)
 *     └─ Higra del Conocimiento (Tuh Putkamna)  → lo que se dicta en el periodo; base de las clases
 *          ├─ Ejes / temas de la higra
 *          ├─ Hilos del Saber (Piankammu Mi): SABER · HACER · SER
 *          ├─ Sabidurías (Pianaizpa): Propias (Pañapain) · Interculturales (Ñanpaskas)
 *          └─ Tejiendo Aprendo (Sat Ishkit) · Ayudas pedagógicas (Katkin Aizpa)
 *
 * Cada FILA del archivo = una Higra del Conocimiento de un periodo.
 */

export const TEJIDO_COLUMNS = [
  { key: "grado", label: "Grado", required: true, help: "Número del grado: 6, 7, 8..." },
  { key: "materia", label: "Materia", required: true, help: "Nombre exacto de la materia" },
  { key: "periodo", label: "Periodo", required: true, help: "1, 2 o 3" },
  { key: "semanas", label: "No. Semanas", required: false, help: "Semanas del periodo" },
  { key: "higra", label: "Higra del Conocimiento (Tuh Putkamna)", required: true, help: "Nombre de la higra. Ej: Numérico variacional" },
  { key: "ejes", label: "Temas de la Higra", required: true, help: "Temas separados por | o salto de línea" },
  { key: "saber", label: "Hilo SABER", required: true, help: "Lo que el estudiante conoce" },
  { key: "hacer", label: "Hilo HACER", required: true, help: "Lo que el estudiante realiza" },
  { key: "ser", label: "Hilo SER", required: true, help: "Actitudes y valores" },
  { key: "propias", label: "Sabidurías Propias (Pañapain)", required: false, help: "Saberes del territorio" },
  { key: "interculturales", label: "Sabidurías Interculturales (Ñanpaskas Piankamna)", required: false, help: "Saberes de otras culturas" },
  { key: "tejiendo", label: "Tejiendo Aprendo (Sat Ishkit Kamtana)", required: false, help: "Estrategias, separadas por |" },
  { key: "ayudas", label: "Ayudas Pedagógicas (Katkin Aizpa)", required: false, help: "Recursos y materiales" },
] as const;

export type TejidoKey = typeof TEJIDO_COLUMNS[number]["key"];
export type TejidoRow = Record<TejidoKey, string>;

export const PERIOD_TITLES: Record<number, string> = {
  1: "MAZA T+T – PRIMER PERIODO",
  2: "PAS T+T – SEGUNDO PERIODO",
  3: "KUTÑA T+T – TERCER PERIODO",
};

const norm = (s: string) =>
  (s || "").toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

/** Alias aceptados por columna (incluye formatos anteriores). */
const ALIASES: Record<TejidoKey, string[]> = {
  grado: ["grado", "kamnukin", "grade"],
  materia: ["materia", "asignatura", "area", "subject"],
  periodo: ["periodo", "maza t t", "period"],
  semanas: ["no semanas", "semanas", "numero de semanas"],
  higra: ["higra del conocimiento tuh putkamna", "higra del conocimiento", "higra", "tuh putkamna", "putkamna", "tema", "piankammu mi", "piankammu"],
  ejes: ["temas de la higra", "ejes", "ejes temas de la higra", "temas", "subtemas", "contenidos"],
  saber: ["hilo saber", "saber"],
  hacer: ["hilo hacer", "hacer", "saber hacer"],
  ser: ["hilo ser", "ser", "saber ser"],
  propias: ["sabidurias propias panapain", "sabidurias propias", "panapain", "saberes propios", "propias"],
  interculturales: ["sabidurias interculturales nanpaskas piankamna", "sabidurias interculturales", "nanpaskas", "saberes interculturales", "interculturales"],
  tejiendo: ["tejiendo aprendo sat ishkit kamtana", "tejiendo aprendo", "sat ishkit", "metodologia"],
  ayudas: ["ayudas pedagogicas katkin aizpa", "ayudas pedagogicas", "katkin aizpa", "ayudas", "recursos"],
};

export function mapHeader(header: string): TejidoKey | null {
  const h = norm(header);
  if (!h) return null;
  for (const k of Object.keys(ALIASES) as TejidoKey[]) {
    if (ALIASES[k].includes(h)) return k;
  }
  return null;
}

/** Convierte "a | b \n c" o "• a • b" en lista limpia. */
export function splitList(v: string): string[] {
  return (v || "")
    .split(/\r?\n|\||•/)
    .map(s => s.replace(/^[\s\-–*·\d.)]+/, "").trim())
    .filter(Boolean);
}

export interface ParsedTejido {
  rows: (TejidoRow & { _line: number })[];
  errors: string[];
  warnings: string[];
  unknownHeaders: string[];
}

export function normalizeRows(raw: Record<string, any>[]): ParsedTejido {
  const errors: string[] = [];
  const warnings: string[] = [];
  const unknown = new Set<string>();
  const rows: (TejidoRow & { _line: number })[] = [];

  const seenHigraInPeriod = new Set<string>();

  raw.forEach((r, i) => {
    const row = { _line: i + 2 } as TejidoRow & { _line: number };
    TEJIDO_COLUMNS.forEach(c => (row[c.key] = ""));
    Object.entries(r).forEach(([h, v]) => {
      const k = mapHeader(h);
      if (k) row[k] = (v ?? "").toString().trim();
      else if (h && h.trim()) unknown.add(h.trim());
    });
    // Ignorar filas vacías o de instrucciones
    if (!row.higra && !row.saber && !row.hacer && !row.ser && !row.ejes) return;
    if (norm(row.grado).startsWith("instruc")) return;

    const missing = TEJIDO_COLUMNS.filter(c => c.required && !row[c.key]).map(c => c.label);
    if (missing.length) errors.push(`Fila ${row._line}: falta ${missing.join(", ")}.`);
    const p = parseInt(row.periodo, 10);
    if (row.periodo && ![1, 2, 3].includes(p)) errors.push(`Fila ${row._line}: el periodo debe ser 1, 2 o 3 (se encontró "${row.periodo}").`);
    if (row.periodo && row.higra) {
      const dupKey = `${p}::${norm(row.higra)}`;
      if (seenHigraInPeriod.has(dupKey)) {
        errors.push(`Fila ${row._line}: la Higra "${row.higra}" está duplicada en el Periodo ${row.periodo}.`);
      }
      seenHigraInPeriod.add(dupKey);
    }
    rows.push(row);
  });

  if (rows.length === 0) errors.push("El archivo no tiene filas con información. Usa el formato descargable.");
  const grades = new Set(rows.map(r => r.grado).filter(Boolean));
  const subjects = new Set(rows.map(r => norm(r.materia)).filter(Boolean));
  if (grades.size > 1) errors.push(`El archivo mezcla varios grados (${[...grades].join(", ")}). Sube un archivo por grado y materia.`);
  if (subjects.size > 1) errors.push("El archivo mezcla varias materias. Sube un archivo por grado y materia.");

  return { rows, errors, warnings, unknownHeaders: [...unknown] };
}

export function downloadTejidoNoveltiesCSV(errors: string[], fileName = "Tejido"): void {
  const header = "NRO_NOVEDAD;DETALLE_DEL_ERROR;ACCION_REQUERIDA\n";
  const body = errors
    .map((err, idx) => `${idx + 1};"${err.replace(/"/g, '""')}";"Corregir la fila indicada en el archivo CSV antes de volver a subirlo"`)
    .join("\n");
  const blob = new Blob(["\uFEFF" + header + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte_Novedades_Tejido_${fileName.replace(/\.csv$/i, "")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Construye el Topic institucional a partir de una fila. */
export function rowToTopic(row: TejidoRow, idx: number) {
  const ejes = splitList(row.ejes);
  const periodo = parseInt(row.periodo, 10) || 1;
  return {
    id: `P${periodo}-H${idx + 1}`,
    status: "not_started" as const,
    title: row.higra,
    tuhPutkamna: ejes.length ? `${row.higra}: ${ejes.join(". ")}.` : row.higra,
    ejes,
    completedEjes: [] as string[],
    saber: row.saber,
    hacer: row.hacer,
    ser: row.ser,
    // Compatibilidad con vistas que leen el campo combinado
    hijosSaber: `SABER: ${row.saber}\nHACER: ${row.hacer}\nSER: ${row.ser}`,
    panapain: row.propias,
    nanpaskas: row.interculturales,
    satIshkit: splitList(row.tejiendo).join(", ") || row.tejiendo,
    katkinAizpa: row.ayudas,
    semanas: row.semanas,
  };
}

export interface NormalizedTopicView {
  id: string;
  higra: string;          // Nombre principal de la Higra del Conocimiento (Tuh Putkamna)
  higraDetalle?: string;  // Subtítulo o descripción de la Higra si existe
  ejes: string[];         // Lista de temas/subtemas que componen la Higra
  completedEjes: string[];// Temas de la Higra ya cubiertos
  saber: string;          // Hilo SABER
  hacer: string;          // Hilo HACER
  ser: string;            // Hilo SER
  panapain: string;       // Sabidurías Propias
  nanpaskas: string;      // Sabidurías Interculturales
  satIshkit: string;      // Tejiendo Aprendo (Metodología)
  katkinAizpa?: string;   // Ayudas Pedagógicas / Recursos sugeridos
  semanas?: string;
}

/**
 * Normaliza cualquier Topic (sea cargado con el nuevo formato CSV/Excel o con la
 * estructura anterior guardada en Firestore) para que SIEMPRE:
 *  1. La Higra del Conocimiento (Tuh Putkamna) sea el eje/título principal.
 *  2. Los Temas de la Higra (ejes) estén listados como ítems verificables.
 *  3. Los Hilos del Saber (Piankammu Mi) estén separados en SABER, HACER y SER.
 */
export function normalizeTopicForDisplay(topic: any): NormalizedTopicView {
  if (!topic) {
    return {
      id: "",
      higra: "Higra del Conocimiento",
      ejes: [],
      completedEjes: [],
      saber: "",
      hacer: "",
      ser: "",
      panapain: "",
      nanpaskas: "",
      satIshkit: "",
    };
  }

  const rawTitle = (topic.title || "").trim();
  const rawTuh = (topic.tuhPutkamna || "").trim();
  const rawHijos = (topic.hijosSaber || "").trim();

  // Detectar si viene con formato nuevo (tiene topic.saber explícito o hijosSaber con "SABER:")
  const hasExplicitSaber = Boolean(topic.saber && topic.saber.trim());
  const parsedFromCombined = { saber: "", hacer: "", ser: "" };
  if (rawHijos.includes("SABER:") || rawHijos.includes("HACER:") || rawHijos.includes("SER:")) {
    const mSaber = rawHijos.match(/SABER:\s*([\s\S]*?)(?=\n\s*HACER:|\n\s*SER:|$)/i);
    const mHacer = rawHijos.match(/HACER:\s*([\s\S]*?)(?=\n\s*SER:|$)/i);
    const mSer = rawHijos.match(/SER:\s*([\s\S]*?)$/i);
    if (mSaber) parsedFromCombined.saber = mSaber[1].trim();
    if (mHacer) parsedFromCombined.hacer = mHacer[1].trim();
    if (mSer) parsedFromCombined.ser = mSer[1].trim();
  }

  let higra = rawTitle;
  let higraDetalle: string | undefined = undefined;
  let ejes: string[] = Array.isArray(topic.ejes) && topic.ejes.length > 0 ? [...topic.ejes] : [];
  let saber = (topic.saber || parsedFromCombined.saber || "").trim();
  let hacer = (topic.hacer || parsedFromCombined.hacer || "").trim();
  let ser = (topic.ser || parsedFromCombined.ser || "").trim();

  // Caso legacy: en los datos anteriores, `tuhPutkamna` tenía "Nombre Higra: tema 1, tema 2"
  // y `title` tenía en realidad el Hilo SABER ("Identificar y clasificar...", "Conocer definiciones...").
  const isLegacyInverted = !hasExplicitSaber && !parsedFromCombined.saber && rawTuh.length > 0 && rawTuh !== rawTitle;

  if (isLegacyInverted) {
    // Extraer nombre de la Higra y su detalle desde tuhPutkamna
    const colonIdx = rawTuh.indexOf(":");
    if (colonIdx > 0) {
      higra = rawTuh.slice(0, colonIdx).trim();
      higraDetalle = rawTuh.slice(colonIdx + 1).trim();
    } else {
      higra = rawTuh;
    }
    // El antiguo `title` era el Hilo SABER
    saber = rawTitle;

    // En datos antiguos, `hijosSaber` guardaba la lista numerada de temas de la Higra ("1. ... 2. ...")
    if (ejes.length === 0 && rawHijos) {
      const splitNumbered = rawHijos
        .split(/(?:\r?\n|\||•|(?=\b\d+\.\s))/)
        .map((s: string) => s.replace(/^[\s\-–*·\d.)]+/, "").trim())
        .filter(Boolean);
      if (splitNumbered.length > 0) {
        ejes = splitNumbered;
      }
    }
    // Si aún no hay ejes pero higraDetalle tiene frases separadas por punto o coma
    if (ejes.length === 0 && higraDetalle) {
      const fromDetail = higraDetalle
        .split(/[.;]/)
        .map(s => s.trim())
        .filter(s => s.length > 3);
      if (fromDetail.length > 1) ejes = fromDetail;
    }
  } else {
    // Formato v2: title es la Higra
    const colonIdx = rawTitle.indexOf(":");
    if (colonIdx > 0 && !higraDetalle) {
      higra = rawTitle.slice(0, colonIdx).trim();
      higraDetalle = rawTitle.slice(colonIdx + 1).trim();
    }
    if (ejes.length === 0 && rawTuh && rawTuh !== rawTitle) {
      const afterColon: string = rawTuh.includes(":") ? rawTuh.slice(rawTuh.indexOf(":") + 1) : rawTuh;
      const parts = afterColon.split(/[.|•\n]/).map((s: string) => s.trim()).filter((s: string) => s.length > 2);
      if (parts.length > 0) ejes = parts;
    }
    if (!saber) saber = rawTitle;
  }

  // Garantizar que HACER y SER nunca queden vacíos si el registro antiguo no los traía
  if (!hacer) {
    hacer = ejes.length > 0
      ? `Desarrollar actividades prácticas y resolución de situaciones sobre: ${ejes.join(", ")}.`
      : `Aplicar de forma práctica los conceptos de ${higra} en situaciones reales del contexto escolar y comunitario.`;
  }
  if (!ser) {
    ser = `Participar con responsabilidad, pensamiento crítico y respeto por los saberes comunitarios durante el trabajo colaborativo.`;
  }

  // Si aún no hay ejes, crear al menos el eje principal de la Higra para poder hacer seguimiento
  if (ejes.length === 0) {
    ejes = [higraDetalle || higra];
  }

  // Determinar qué ejes están completados
  let completedEjes: string[] = [];
  if (topic.status === "covered") {
    completedEjes = [...ejes];
  } else if (Array.isArray(topic.completedEjes)) {
    completedEjes = topic.completedEjes.filter((e: string) => ejes.includes(e));
  } else if (Array.isArray(topic.subtopics)) {
    completedEjes = topic.subtopics.filter((s: any) => s.status === "completed").map((s: any) => s.title);
  }

  return {
    id: topic.id || "P1-H1",
    higra,
    higraDetalle,
    ejes,
    completedEjes,
    saber,
    hacer,
    ser,
    panapain: (topic.panapain || "").trim(),
    nanpaskas: (topic.nanpaskas || "").trim(),
    satIshkit: (topic.satIshkit || "").trim(),
    katkinAizpa: (topic.katkinAizpa || "").trim() || undefined,
    semanas: topic.semanas,
  };
}

export interface PeriodCoverageStat {
  unitId: string;
  order: number;
  title: string;
  totalHigras: number;
  coveredHigras: number;
  totalEjes: number;
  completedEjes: number;
  percentage: number;
  pendingEjesList: { topicId: string; higra: string; eje: string }[];
}

/**
 * Calcula el cumplimiento real de todas las Higras y de cada uno de sus temas (ejes)
 * en todos los periodos académicos.
 */
export function computeCurriculumCoverage(activeCurriculum: any): {
  periods: PeriodCoverageStat[];
  totalHigras: number;
  coveredHigras: number;
  totalEjes: number;
  completedEjes: number;
  overallPercentage: number;
} {
  if (!activeCurriculum || !Array.isArray(activeCurriculum.units)) {
    return { periods: [], totalHigras: 0, coveredHigras: 0, totalEjes: 0, completedEjes: 0, overallPercentage: 0 };
  }

  const sortedUnits = [...activeCurriculum.units].sort((a, b) => (a.order || 0) - (b.order || 0));
  let totalHigras = 0;
  let coveredHigras = 0;
  let totalEjes = 0;
  let completedEjes = 0;

  const periods: PeriodCoverageStat[] = sortedUnits.map((unit, idx) => {
    const topics = Array.isArray(unit.topics) ? unit.topics : [];
    let uTotalEjes = 0;
    let uCompletedEjes = 0;
    let uCoveredHigras = 0;
    const pendingEjesList: { topicId: string; higra: string; eje: string }[] = [];

    topics.forEach((t: any) => {
      const normT = normalizeTopicForDisplay(t);
      const tEjes = normT.ejes.length > 0 ? normT.ejes : [normT.higra];
      const tDone = t.status === "covered" ? tEjes.length : normT.completedEjes.length;
      if (t.status === "covered" || (tEjes.length > 0 && tDone === tEjes.length)) {
        uCoveredHigras += 1;
      }
      uTotalEjes += tEjes.length;
      uCompletedEjes += tDone;

      tEjes.forEach(eje => {
        const isDone = t.status === "covered" || normT.completedEjes.includes(eje);
        if (!isDone) {
          pendingEjesList.push({ topicId: normT.id, higra: normT.higra, eje });
        }
      });
    });

    totalHigras += topics.length;
    coveredHigras += uCoveredHigras;
    totalEjes += uTotalEjes;
    completedEjes += uCompletedEjes;

    const percentage = uTotalEjes > 0 ? Math.round((uCompletedEjes / uTotalEjes) * 100) : 0;
    return {
      unitId: unit.id || `unit-periodo-${idx + 1}`,
      order: unit.order || idx + 1,
      title: unit.title || PERIOD_TITLES[idx + 1] || `Periodo ${idx + 1}`,
      totalHigras: topics.length,
      coveredHigras: uCoveredHigras,
      totalEjes: uTotalEjes,
      completedEjes: uCompletedEjes,
      percentage,
      pendingEjesList,
    };
  });

  const overallPercentage = totalEjes > 0 ? Math.round((completedEjes / totalEjes) * 100) : 0;
  return { periods, totalHigras, coveredHigras, totalEjes, completedEjes, overallPercentage };
}

const csvCell = (v: string) => `"${(v || "").replace(/"/g, '""')}"`;

/** Genera el formato CSV (separado por ; para Excel en español) con ejemplo real. */
export function buildTemplateCSV(grade?: string, subject?: string, withExample = true): string {
  const g = grade && grade !== "TODOS" ? grade : "6";
  const m = subject || "MATEMÁTICAS";
  const header = TEJIDO_COLUMNS.map(c => csvCell(c.label + (c.required ? " *" : ""))).join(";");
  const examples: string[][] = withExample
    ? [
        [g, m, "1", "10", "Numérico variacional",
          "Operaciones con los números naturales | Operaciones con fraccionarios | Operaciones con números decimales | Situaciones problema",
          "Conocer las definiciones y propiedades de los conjuntos de números naturales y racionales.",
          "Realizar operaciones básicas como números naturales y racionales.",
          "Ser lógico, preciso y analítico al trabajar con números naturales y racionales.",
          "Los conjuntos de los números naturales se utilizan comúnmente en la vida diaria, especialmente en la contabilidad para manejar los recursos económicos de la comunidad.",
          "En diferentes culturas, los conjuntos de números naturales y racionales se utilizan de manera única y reflejan las prácticas y tradiciones locales.",
          "Trabajo individual | Trabajo colaborativo | Mesa redonda | Exposiciones | Lluvia de ideas | Salidas de campo | Carteleras | Proyección y edición de videos educativos",
          "Guías, material concreto, videos"],
        [g, m, "1", "10", "Numérico variacional",
          "Concepto de número entero | Representación de números enteros en la recta numérica | Valor absoluto | Orden en los enteros | Operación con números enteros | Situaciones problema",
          "Identifica las principales propiedades de los números enteros y comprende el algoritmo de las operaciones básicas.",
          "Resuelve situaciones que involucran las operaciones básicas con números enteros y aplica sus propiedades en el desarrollo de polinomios aritméticos.",
          "Comparte su saber en el trabajo colectivo, demostrando responsabilidad y respeto hacia sus compañeros.",
          "Proponer diferentes caminos de solución a un problema determinado, utilizando técnicas, conceptos, procedimientos y/o argumentos matemáticos propios de los números enteros.",
          "Identifica los números enteros y sus propiedades en un contexto social y económico; plantea y resuelve problemas de tipo matemático y de otras ciencias con números enteros.",
          "Trabajo individual | Trabajo colaborativo | Mesa redonda | Exposiciones | Carteleras",
          "Recta numérica, guías"],
      ]
    : [[g, m, "1", "", "", "", "", "", "", "", "", "", ""]];
  const body = examples.map(r => r.map(csvCell).join(";")).join("\r\n");
  return "\uFEFF" + header + "\r\n" + body + "\r\n";
}

export function downloadTemplate(grade?: string, subject?: string, withExample = true) {
  const csv = buildTemplateCSV(grade, subject, withExample);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");
  a.href = url;
  a.download = `Formato_Tejido_${safe(subject || "Materia")}_Grado_${safe(grade && grade !== "TODOS" ? grade : "X")}${withExample ? "_ejemplo" : ""}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
