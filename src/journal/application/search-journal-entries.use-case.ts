import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { JOURNAL_REPOSITORY } from '../domain/journal.repository';
import type { JournalEntrySummary, JournalRepository, JournalSearchCriteria } from '../domain/journal.repository';

@Injectable()
export class SearchJournalEntriesUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly repo: JournalRepository,
  ) {}

  async execute(criteria: JournalSearchCriteria): Promise<Page<JournalEntrySummary>> {
    return this.repo.search(criteria);
  }
}
