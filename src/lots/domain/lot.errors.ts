import { InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';

export class InvalidLotError extends InvalidInputError {
  readonly code = 'INVALID_LOT';
  constructor(message: string) { super(message); }
}

export class LotNotFoundError extends NotFoundError {
  readonly code = 'LOT_NOT_FOUND';
  constructor(id: string) { super(`Lote con id "${id}" no encontrado.`); }
}
