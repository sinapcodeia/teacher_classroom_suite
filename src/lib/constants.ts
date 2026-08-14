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
