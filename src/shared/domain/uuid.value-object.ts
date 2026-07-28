import { InvalidInputError } from './domain.error';

export class InvalidUuidError extends InvalidInputError {
  readonly code = 'INVALID_UUID';

  constructor(etiqueta: string, valor: string) {
    super(`${etiqueta} debe ser un UUID valido, se recibio "${valor}".`);
  }
}

const PATRON_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Base de los identificadores. Que cada agregado tenga su propia clase de id
 * —y no un `string` suelto— hace imposible pasar un brandId donde se espera un
 * productId: el compilador lo rechaza antes de que llegue a la base.
 */
export abstract class UuidValueObject {
  protected constructor(readonly value: string) {}

  protected static ensureValid(etiqueta: string, valor: string): string {
    const normalizado = valor?.trim().toLowerCase() ?? '';
    if (!PATRON_UUID.test(normalizado)) {
      throw new InvalidUuidError(etiqueta, valor);
    }
    return normalizado;
  }

  equals(otro: UuidValueObject): boolean {
    return otro instanceof this.constructor && otro.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
