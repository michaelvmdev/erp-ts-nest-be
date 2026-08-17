import { InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';

export class InvalidQuoteError extends InvalidInputError {
  readonly code = 'INVALID_QUOTE';
  constructor(message: string) {
    super(message);
  }
}

export class QuoteNotFoundError extends NotFoundError {
  readonly code = 'QUOTE_NOT_FOUND';
  constructor(id: string) {
    super(`Cotizacion con id "${id}" no encontrada.`);
  }
}

export class QuoteClientNotFoundError extends NotFoundError {
  readonly code = 'QUOTE_CLIENT_NOT_FOUND';
  constructor(clientId: string) {
    super(`Cliente con id "${clientId}" no encontrado.`);
  }
}

export class QuoteInvalidStatusTransitionError extends InvalidInputError {
  readonly code = 'QUOTE_INVALID_STATUS_TRANSITION';
  constructor(from: string, to: string) {
    super(`No se puede cambiar el estado de la cotizacion de "${from}" a "${to}".`);
  }
}

export class QuoteAlreadyFinalizedError extends InvalidInputError {
  readonly code = 'QUOTE_ALREADY_FINALIZED';
  constructor() {
    super('La cotizacion ya esta en un estado final (aceptada, rechazada o vencida).');
  }
}
