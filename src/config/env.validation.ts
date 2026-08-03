/**
 * Valida las variables de entorno al arrancar.
 *
 * La idea es fallar de inmediato y con un mensaje claro. Sin esto, un POSTGRES_PASSWORD
 * ausente no se nota hasta que el driver intenta conectar, y el error que sale
 * ("password authentication failed" o "client password must be a string") no
 * apunta al problema real.
 */
export interface EnvVars {
  NODE_ENV: string;
  PORT: number;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DATABASE: string;
  POSTGRES_LOGGING: boolean;
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;
  // Correo saliente (SMTP). Opcional: la app arranca sin esto, pero el envio de
  // comprobantes por correo falla con un mensaje claro hasta que se configure.
  MAIL_HOST: string;
  MAIL_PORT: number;
  MAIL_SECURE: boolean;
  MAIL_USER: string;
  MAIL_PASSWORD: string;
  MAIL_FROM: string;
}

const REQUERIDAS = [
  'POSTGRES_HOST',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DATABASE',
] as const;

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

/** Entero >= 1 con valor por defecto. Usado por la config del rate-limiting. */
function toPositiveInt(
  valor: unknown,
  porDefecto: number,
  nombre: string,
): number {
  const raw = asString(valor).trim();
  if (raw === '') return porDefecto;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(
      `${nombre} debe ser un entero positivo, se recibio "${raw}"`,
    );
  }
  return n;
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
    POSTGRES_HOST: asString(config.POSTGRES_HOST),
    POSTGRES_PORT: toPort(config.POSTGRES_PORT, 5432, 'POSTGRES_PORT'),
    POSTGRES_USER: asString(config.POSTGRES_USER),
    POSTGRES_PASSWORD: asString(config.POSTGRES_PASSWORD),
    POSTGRES_DATABASE: asString(config.POSTGRES_DATABASE),
    POSTGRES_LOGGING: toBool(config.POSTGRES_LOGGING),
    THROTTLE_TTL: toPositiveInt(config.THROTTLE_TTL, 60, 'THROTTLE_TTL'),
    THROTTLE_LIMIT: toPositiveInt(config.THROTTLE_LIMIT, 100, 'THROTTLE_LIMIT'),
    // El puerto solo se valida como puerto si viene; sin correo configurado
    // queda en 587 por defecto y nunca se usa.
    MAIL_HOST: asString(config.MAIL_HOST).trim(),
    MAIL_PORT: toPort(config.MAIL_PORT, 587, 'MAIL_PORT'),
    MAIL_SECURE: toBool(config.MAIL_SECURE),
    MAIL_USER: asString(config.MAIL_USER).trim(),
    MAIL_PASSWORD: asString(config.MAIL_PASSWORD),
    MAIL_FROM: asString(config.MAIL_FROM).trim(),
  };
}
