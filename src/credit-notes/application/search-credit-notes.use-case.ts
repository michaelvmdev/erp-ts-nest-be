import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { PageRequest } from '../../shared/domain/pagination';
import { CreditNoteSummary } from '../domain/credit-note.repository';
import { CREDIT_NOTE_REPOSITORY } from '../domain/credit-note.repository';
import type { CreditNoteRepository } from '../domain/credit-note.repository';
import { SearchCreditNotesQuery } from './credit-note.commands';

@Injectable()
export class SearchCreditNotesUseCase {
  constructor(
    @Inject(CREDIT_NOTE_REPOSITORY)
    private readonly creditNotes: CreditNoteRepository,
  ) {}

  async execute(query: SearchCreditNotesQuery): Promise<Page<CreditNoteSummary>> {
    const pageRequest = PageRequest.of(query.page, query.limit);
    return this.creditNotes.search({
      saleId: query.saleId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: { page: pageRequest.page, limit: pageRequest.limit, offset: pageRequest.offset },
    });
  }
}
