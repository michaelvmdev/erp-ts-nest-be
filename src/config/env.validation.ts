/**
 * Valida las variables de entorno al arrancar.
 *
 * La idea es fallar de inmediato y con un mensaje claro. Sin esto, un DB_PASSWORD
 * ausente no se nota hasta que el driver intenta conectar, y el error que sale
 * ("password authentication failed" o "client password must be a string") no
 * apunta al problema real.
 */
export interface EnvVars {
  NODE_ENV: string;
  PORT: number;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  DB_LOGGING: boolean;
}

const REQUERIDAS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;

/**
 * process.env solo contiene strings, pero el tipo que recibe `validate` es
 * Record<string, unknown>. Convertir con String() sobre un unknown produciria
 * "[object Object]" para un valor inesperado, asi que se descarta explicitamente
 * todo lo que no sea un valor primitivo.
 */
function asString(valor: unknown): string {
  if (typeof valor === 'string') return valor;
  if (typeof valor === 'number' || typeof valor === 'boolean')
    return String(valor);
  return '';
}

function toPort(valor: unknown, porDefecto: number, nombre: string): number {
  const raw = asString(valor).trim();
  if (raw === '') return porDefecto;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 65535) {
    throw new Error(
      `${nombre} debe ser un puerto valido entre 1 y 65535, se recibio "${raw}"`,
    );
  }
  return n;
}

function toBool(valor: unknown, porDefecto = false): boolean {
  const raw = asString(valor).trim().toLowerCase();
  if (raw === '') return porDefecto;
  return ['1', 'true', 'yes', 'on'].includes(raw);
}

export function validateEnv(config: Record<string, unknown>): EnvVars {
  const faltantes = REQUERIDAS.filter(
    (clave) => asString(config[clave]).trim() === '',
  );

  if (faltantes.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${faltantes.join(', ')}. ` +
        'Copia .env.example a .env y completalo.',
    );
  }

  const nodeEnv = asString(config.NODE_ENV).trim();

  return {
    NODE_ENV: nodeEnv === '' ? 'development' : nodeEnv,
    PORT: toPort(config.PORT, 3000, 'PORT'),
    DB_HOST: asString(config.DB_HOST),
    DB_PORT: toPort(config.DB_PORT, 5432, 'DB_PORT'),
    DB_USER: asString(config.DB_USER),
    DB_PASSWORD: asString(config.DB_PASSWORD),
    DB_NAME: asString(config.DB_NAME),
    DB_LOGGING: toBool(config.DB_LOGGING),
  };
}
