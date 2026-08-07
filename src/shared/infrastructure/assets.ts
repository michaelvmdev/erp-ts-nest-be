import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Estaticos de marca (logo y favicon).
 *
 * Los archivos viven en `assets/` en la raiz del proyecto. `nest build` no los
 * copia al `dist/` (no estan bajo `src/`), asi que la ruta se resuelve en tiempo
 * de ejecucion: primero junto al codigo compilado (por si algun dia se copian a
 * `dist/assets`) y luego en la raiz del proyecto (`process.cwd()`), que es el
 * caso normal con `nest start` y con `node dist/main.js` lanzado desde la raiz.
 *
 * En un despliegue serverless hay que asegurarse de incluir la carpeta en el
 * bundle: el tracing de archivos no sigue las lecturas de `fs`.
 */
const CANDIDATOS = [
  join(__dirname, '..', '..', 'assets'),
  join(process.cwd(), 'assets'),
];

export const ASSETS_DIR =
  CANDIDATOS.find((dir) => existsSync(dir)) ?? join(process.cwd(), 'assets');

/** Nombres de los archivos de marca, en un solo lugar. */
export const BRAND_LOGO_PNG = 'erp-mv-dev-logo.png';
export const BRAND_FAVICON_ICO = 'erp-mv-dev.ico';

export const assetPath = (nombre: string): string => join(ASSETS_DIR, nombre);

// El logo se lee una sola vez y se cachea: es el mismo en cada PDF y no cambia
// mientras el proceso vive. `null` se cachea igual para no reintentar leer un
// archivo que no esta en cada render.
let logoCache: Buffer | null | undefined;

/**
 * Devuelve el logo PNG como Buffer, o `null` si no se pudo leer. Tolerar la
 * ausencia es deliberado: un PDF sin logo es preferible a un PDF que no se
 * genera porque falta un estatico.
 */
export function brandLogoPng(): Buffer | null {
  if (logoCache !== undefined) return logoCache;
  try {
    logoCache = readFileSync(assetPath(BRAND_LOGO_PNG));
  } catch {
    logoCache = null;
  }
  return logoCache;
}
