import { Inject, Injectable } from '@nestjs/common';
import { JournalEntry, JournalEntryId } from '../domain/journal-entry';
import { JournalEntryNotFoundError } from '../domain/journal.errors';
import { JOURNAL_REPOSITORY } from '../domain/journal.repository';
import type { JournalRepository } from '../domain/journal.repository';

@Injectable()
export class FindJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly repo: JournalRepository,
  ) {}

  async execute(id: string): Promise<JournalEntry> {
    const entry = await this.repo.findById(JournalEntryId.of(id));
    if (!entry) throw new JournalEntryNotFoundError(id);
    return entry;
  }
}
