import { ConflictError, NotFoundError } from '../../shared/domain/domain.error';

export class AccountNotFoundError extends NotFoundError {
  readonly code = 'ACCOUNT_NOT_FOUND';

  constructor(id: string) {
    super(`No existe una cuenta contable con id ${id}.`);
  }
}

export class AccountCodeAlreadyExistsError extends ConflictError {
  readonly code = 'ACCOUNT_CODE_ALREADY_EXISTS';

  constructor(code: string) {
    super(`Ya existe una cuenta con el codigo "${code}".`);
  }
}
