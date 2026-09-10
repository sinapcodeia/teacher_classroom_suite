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
export const INSTITUTION_FULL_NAME = "Institución Educativa Indígena Técnica Agroambiental Bilingüe Awá";
export const INSTITUTION_FULL_NAME_UPPER = "INSTITUCIÓN EDUCATIVA INDÍGENA TÉCNICA AGROAMBIENTAL BILINGÜE AWÁ";
export const INSTITUTION_SHORT = "I.E.I.T.A.B.A";
export const INSTITUTION_LOCATION = "Resguardo Awá Katsa Su · El Diviso · Nariño · Colombia";

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
 * Copia pura de AppContext.normalizeGrade sin imports de React/Firebase.
 */
export function normalizeGrade(raw: string | undefined | null): string {
  if (!raw) return "PREESCOLAR";
  const s = raw.toString().trim().toUpperCase();

  // Preescolar / Transición
  if (
    s === "0" || s === "CERO" || s === "TRANSICIÓN" || s === "TRANSICION" ||
    s === "PREESCOLAR" || s === "JARDÍN" || s === "JARDIN" ||
    s === "KÍNDER" || s === "KINDER"
  ) return "PREESCOLAR";

  // Ya tiene formato N°
  if (/^\d+°$/.test(s)) return s;

  // Numérico
  const numMatch = s.match(/^(\d+)/);
  if (numMatch) {
    const n = parseInt(numMatch[1]);
    if (n === 0) return "PREESCOLAR";
    if (n >= 1 && n <= 11) return `${n}°`;
  }

  // Textual
  const wordMap: Record<string, string> = {
    "PRIMERO": "1°", "SEGUNDO": "2°", "TERCERO": "3°", "CUARTO": "4°", "QUINTO": "5°",
    "SEXTO": "6°", "SEPTIMO": "7°", "SÉPTIMO": "7°", "OCTAVO": "8°", "NOVENO": "9°",
    "DECIMO": "10°", "DÉCIMO": "10°", "ONCE": "11°", "UNDECIMO": "11°", "UNDÉCIMO": "11°",
  };
  for (const [key, val] of Object.entries(wordMap)) {
    if (s.includes(key)) return val;
  }

  return s;
}

/**
 * parseFlexibleFloat — Parsea números aceptando coma ',' o punto '.' como decimal.
 * Copia pura de AppContext.parseFlexibleFloat sin imports de React.
 */
export function parseFlexibleFloat(val: string | number | null | undefined): number {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const normalized = String(val).trim().replace(",", ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * sanitizeText — Elimina scripts e inyección HTML (anti-XSS).
 * Copia pura de AppContext.sanitizeText sin imports de React.
 */
export function sanitizeText(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/[<>]/g, "")
    .trim();
}

/**
 * matchStudentCourse — Compara y empareja cursos considerando múltiples formatos:
 * "4", "7-4", "7.4", "7°-4", "TODOS".
 */
export function matchStudentCourse(
  studentCourse: string | number | undefined | null,
  targetCourse: string | number | undefined | null,
  studentGrade?: string | number | undefined | null,
  targetGrade?: string | number | undefined | null
): boolean {
  if (!targetCourse || targetCourse === "TODOS") return true;
  if (studentCourse === undefined || studentCourse === null || studentCourse === "") return false;

  const sC = String(studentCourse).trim().toUpperCase();
  const tC = String(targetCourse).trim().toUpperCase();

  // 1. Coincidencia exacta ("4" === "4", "7-4" === "7-4")
  if (sC === tC) return true;

  // 2. Extracción de sufijo limpio ("7-4" -> "4", "7.4" -> "4", "7_4" -> "4")
  const sSuffix = sC.replace(/^.*[.\-_]/, "").trim();
  const tSuffix = tC.replace(/^.*[.\-_]/, "").trim();
  if (sSuffix && tSuffix && sSuffix === tSuffix) return true;

  // 3. Prefijado con Grado (ej: Grado 7 con curso 4 vs "7-4" o "7°-4")
  if (targetGrade || studentGrade) {
    const rawG = targetGrade || studentGrade;
    const normG = normalizeGrade(String(rawG));
    const numG = normG.replace(/\D/g, "");
    if (sC === `${normG}-${tSuffix}` || sC === `${numG}-${tSuffix}` || sC === `${numG}.${tSuffix}`) {
      return true;
    }
  }

  return false;
}



/**
 * normalizeUpperCaseName — Limpia espacios múltiples y estandariza nombres a MAYÚSCULAS.
 */
export function normalizeUpperCaseName(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * normalizeEmail — Normaliza correos electrónicos a minúsculas sin espacios.
 */
export function normalizeEmail(email: string | undefined | null): string {
  if (!email) return "";
  return String(email).trim().toLowerCase();
}

/**
 * isValidEmail — Valida sintaxis estándar de correo electrónico.
 */
export function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).trim());
}

/**
 * normalizePhone — Extrae únicamente los dígitos numéricos del teléfono.
 */
export function normalizePhone(phone: string | undefined | null): string {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

/**
 * isValidPhone — Valida si un teléfono móvil en Colombia tiene 10 dígitos válidos.
 */
export function isValidPhone(phone: string | undefined | null): boolean {
  if (!phone) return false;
  const digits = normalizePhone(phone);
  return digits.length === 10 || (digits.length >= 7 && digits.length <= 12);
}

/**
 * formatPhoneDisplay — Formatea un número de 10 dígitos a "300 000 0000".
 */
export function formatPhoneDisplay(phone: string | undefined | null): string {
  if (!phone) return "";
  const digits = normalizePhone(phone);
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}
