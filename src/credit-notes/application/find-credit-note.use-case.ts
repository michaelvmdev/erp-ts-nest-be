import { Inject, Injectable } from '@nestjs/common';
import { CreditNote } from '../domain/credit-note';
import { CreditNoteNotFoundError } from '../domain/credit-note.errors';
import { CREDIT_NOTE_REPOSITORY } from '../domain/credit-note.repository';
import type { CreditNoteRepository } from '../domain/credit-note.repository';
import { CreditNoteId } from '../domain/value-objects/credit-note-id.value-object';

@Injectable()
export class FindCreditNoteUseCase {
  constructor(
    @Inject(CREDIT_NOTE_REPOSITORY)
    private readonly creditNotes: CreditNoteRepository,
  ) {}

  async execute(id: string): Promise<CreditNote> {
    const cn = await this.creditNotes.findById(CreditNoteId.of(id));
    if (!cn) throw new CreditNoteNotFoundError(id);
    return cn;
  }
}
