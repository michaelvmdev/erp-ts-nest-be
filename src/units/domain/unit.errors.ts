import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class UnitNotFoundError extends NotFoundError {
  readonly code = 'UNIT_NOT_FOUND';

  constructor(unitId: string) {
    super(`No existe una unidad con id ${unitId}.`);
  }
}

export class UnitCodeAlreadyExistsError extends ConflictError {
  readonly code = 'UNIT_CODE_ALREADY_EXISTS';

  constructor(code: string) {
    super(`Ya existe una unidad con el codigo "${code}".`);
  }
}
