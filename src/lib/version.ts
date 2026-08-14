/**
 * Fuente única de verdad para la versión del aplicativo.
 * Siempre lee dinámicamente desde package.json.
 * NUNCA escribir versiones quemadas en los componentes.
 */
import pkg from "../../package.json";

export const APP_VERSION: string = pkg.version;
export const APP_VERSION_LABEL: string = `v${pkg.version}`;
