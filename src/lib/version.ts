/**
 * version.ts — Fuente directa de versión desde package.json.
 * Autónomo: NO importa de constants.ts para evitar cadenas de módulos.
 */
import pkg from "../../package.json";

export const APP_VERSION: string = pkg.version;
export const APP_VERSION_LABEL: string = `v${pkg.version}`;
