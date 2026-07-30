import { InvalidInputError } from '../../../shared/domain/domain.error';

export class InvalidClientDescriptionError extends InvalidInputError {
  readonly code = 'INVALID_CLIENT_DESCRIPTION';

  constructor(message: string) {
    super(message);
  }
}

/** Razon social de una empresa o nombre completo de una persona natural. */
export class ClientDescription {
  static readonly MAX = 100;

  private constructor(readonly value: string) {}

  static of(valor: string): ClientDescription {
    const limpio = valor?.trim() ?? '';

    if (limpio.length === 0) {
      throw new InvalidClientDescriptionError(
        'El nombre del cliente no puede estar vacio.',
      );
    }
    if (limpio.length > ClientDescription.MAX) {
      throw new InvalidClientDescriptionError(
        `El nombre del cliente no puede superar ${ClientDescription.MAX} caracteres, tiene ${limpio.length}.`,
      );
    }
    return new ClientDescription(limpio);
  }

  toString(): string {
    return this.value;
  }
}
