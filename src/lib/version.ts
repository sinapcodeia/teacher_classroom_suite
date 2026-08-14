/**
 * version.ts — Re-exporta APP_VERSION_LABEL desde constants.ts.
 * Mantenido por compatibilidad con imports existentes.
 * Usar @/lib/constants directamente en código nuevo.
 */
export { APP_VERSION, APP_VERSION_LABEL } from "./constants";
