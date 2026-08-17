import { InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';

export class InvalidJournalEntryError extends InvalidInputError {
  readonly code = 'INVALID_JOURNAL_ENTRY';
  constructor(message: string) { super(message); }
}

export class JournalEntryNotFoundError extends NotFoundError {
  readonly code = 'JOURNAL_ENTRY_NOT_FOUND';
  constructor(id: string) { super(`Asiento contable "${id}" no encontrado.`); }
}
