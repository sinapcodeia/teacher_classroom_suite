/**
 * constants.ts — Fuente única de verdad para todas las constantes institucionales.
 *
 * REGLA ABSOLUTA: NUNCA escribir estos valores directamente en componentes.
 * Siempre importar desde aquí. Así un solo cambio actualiza TODA la aplicación.
 */
import pkg from "../../package.json";

// ── VERSIÓN ─────────────────────────────────────────────────────────────────
export const APP_VERSION: string = pkg.version;
export const APP_VERSION_LABEL: string = `v${pkg.version}`;

// ── INSTITUCIÓN ──────────────────────────────────────────────────────────────
export const INSTITUTION_NAME = "IETABA";
export const INSTITUTION_FULL_NAME = "Institución Educativa Técnica Agropecuaria Bosques del Awa";
export const INSTITUTION_LOCATION = "Resguardo Awá Katsa Su · Colombia";

// ── PLATAFORMA ───────────────────────────────────────────────────────────────
export const APP_NAME = "EduManager";
export const APP_EDITION = "Premium Suite";
export const APP_BRAND = "SinapCodeIA";
export const APP_BRAND_LABEL = `${APP_NAME} ${APP_EDITION}`;

// ── COPYRIGHT ────────────────────────────────────────────────────────────────
export const CURRENT_YEAR = new Date().getFullYear();
export const COPYRIGHT_LINE = `© ${CURRENT_YEAR} @sinapcode`;
export const FOOTER_FULL = `${COPYRIGHT_LINE} • ${APP_VERSION_LABEL}`;

// ── SUPER ADMINS (fuente única - no duplicar en AppContext) ──────────────────
export const SUPER_ADMIN_EMAILS: string[] = [
  "sinapcodeia@gmail.com",
  "antonio_rburgos@msn.com",
];

// ── UTILIDADES PURAS (sin dependencia de React) ───────────────────────────────
/**
 * normalizeGrade — Normaliza strings de grado a formato "N°".
 * Copia pura de AppContext.normalizeGrade. Mantener sincronizadas.
 */
export function normalizeGrade(raw: string | undefined | null): string {
  if (!raw) return "PREESCOLAR";
  const s = raw.toString().trim().toUpperCase();
  if (s === "0" || s === "CERO" || s === "TRANSICI\u00d3N" || s === "TRANSICION" ||
      s === "PREESCOLAR" || s === "JARD\u00cdN" || s === "JARDIN" ||
      s === "K\u00cdNDER" || s === "KINDER") return "PREESCOLAR";
  if (/^\d+\u00b0$/.test(s)) return s;
  const numMatch = s.match(/^(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1]);
    if (n === 0) return "PREESCOLAR";
    if (n >= 1 && n <= 11) return `${n}\u00b0`;
  }
  const wordMap: Record<string, string> = {
    PRIMERO: "1\u00b0", SEGUNDO: "2\u00b0", TERCERO: "3\u00b0", CUARTO: "4\u00b0", QUINTO: "5\u00b0",
    SEXTO: "6\u00b0", SEPTIMO: "7\u00b0", S\u00c9PTIMO: "7\u00b0", OCTAVO: "8\u00b0", NOVENO: "9\u00b0",
    DECIMO: "10\u00b0", D\u00c9CIMO: "10\u00b0", ONCE: "11\u00b0", UNDECIMO: "11\u00b0", UND\u00c9CIMO: "11\u00b0",
  };
  for (const [key, val] of Object.entries(wordMap)) {
    if (s.includes(key)) return val;
  }
  return s;
}
