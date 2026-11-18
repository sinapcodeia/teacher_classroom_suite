import type * as XLSXType from "xlsx";

export const SPREADSHEET_ACCEPT =
  ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";

function ensureXlsxExtension(filename: string): string {
  const clean = filename.replace(/\.(csv|xlsx|xls)$/i, "");
  return `${clean}.xlsx`;
}

function computeAutoColumnWidths(aoa: any[][]): XLSXType.ColInfo[] {
  if (!aoa || aoa.length === 0) return [];
  const maxCols = aoa.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
  const widths: XLSXType.ColInfo[] = [];

  for (let c = 0; c < maxCols; c++) {
    let maxLen = 10;
    for (let r = 0; r < Math.min(aoa.length, 200); r++) {
      const cell = aoa[r]?.[c];
      if (cell === null || cell === undefined) continue;
      const str = String(cell);
      const longestLine = str
        .split(/\r?\n/)
        .reduce((m, line) => Math.max(m, line.length), 0);
      if (longestLine > maxLen) {
        maxLen = longestLine;
      }
    }
    widths.push({ wch: Math.min(Math.max(maxLen + 3, 10), 55) });
  }
  return widths;
}

/**
 * Descarga un arreglo de objetos como un archivo Excel (.xlsx) nativo usando SheetJS,
 * ajustando automáticamente el ancho de las columnas.
 */
export async function downloadRowsAsExcel(
  rows: Record<string, any>[],
  filename: string,
  sheetName = "Datos IETABA",
  explicitHeaders?: readonly string[]
): Promise<void> {
  const XLSX = await import("xlsx");
  const headers = explicitHeaders
    ? [...explicitHeaders]
    : rows.length > 0
    ? Object.keys(rows[0])
    : [];

  const ws =
    headers.length > 0
      ? XLSX.utils.json_to_sheet(rows, { header: headers })
      : XLSX.utils.json_to_sheet(rows);

  const aoa: any[][] = [
    headers,
    ...rows.map(r => headers.map(h => r[h] ?? "")),
  ];
  ws["!cols"] = computeAutoColumnWidths(aoa);

  const wb = XLSX.utils.book_new();
  const safeSheetName = (sheetName || "Hoja1").replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || "Hoja1";
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  XLSX.writeFile(wb, ensureXlsxExtension(filename));
}

/**
 * Descarga una matriz 2D (Array of Arrays) como un archivo Excel (.xlsx) nativo usando SheetJS.
 */
export async function downloadAOAAsExcel(
  aoa: any[][],
  filename: string,
  sheetName = "Planilla IETABA"
): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws["!cols"] = computeAutoColumnWidths(aoa);

  const wb = XLSX.utils.book_new();
  const safeSheetName = (sheetName || "Hoja1").replace(/[\\/?*[\]:]/g, " ").slice(0, 31).trim() || "Hoja1";
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  XLSX.writeFile(wb, ensureXlsxExtension(filename));
}

/**
 * Lee cualquier archivo Excel (.xlsx, .xls) o CSV (.csv) y devuelve las filas como objetos
 * `{ [encabezado]: valor }` listos para los validadores de gobernanza institucional.
 */
export async function parseSpreadsheetFileToObjects(
  file: File
): Promise<Record<string, any>[]> {
  const isCsv = /\.csv$/i.test(file.name);
  if (isCsv) {
    const Papa = (await import("papaparse")).default;
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        delimitersToGuess: [";", ",", "\t", "|"],
        transformHeader: h => h.replace(/^\uFEFF/, "").trim(),
        complete: results => resolve((results.data as Record<string, any>[]) || []),
        error: err => reject(err),
      });
    });
  }

  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const ws = wb.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  return rawRows.map(row => {
    const cleaned: Record<string, any> = {};
    Object.entries(row).forEach(([k, v]) => {
      const cleanKey = k.replace(/^\uFEFF/, "").trim();
      cleaned[cleanKey] = v ?? "";
    });
    return cleaned;
  });
}

/**
 * Lee cualquier archivo Excel (.xlsx, .xls) o CSV (.csv) y devuelve una matriz 2D de filas/celdas
 * (`string[][]`), ideal para planillas con metadatos en el encabezado.
 */
export async function parseSpreadsheetFileToAOA(file: File): Promise<string[][]> {
  const isCsv = /\.csv$/i.test(file.name);
  if (isCsv) {
    const Papa = (await import("papaparse")).default;
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        skipEmptyLines: true,
        complete: results => resolve((results.data as string[][]) || []),
        error: err => reject(err),
      });
    });
  }

  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: false });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const ws = wb.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
    dateNF: "yyyy-mm-dd",
  });
  return rows.map(r => (Array.isArray(r) ? r.map(c => String(c ?? "")) : []));
}
