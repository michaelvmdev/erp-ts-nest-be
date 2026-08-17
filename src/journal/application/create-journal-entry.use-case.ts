import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Money } from '../../shared/domain/money.value-object';
import { JournalEntry, JournalEntryId, JournalReferenceType } from '../domain/journal-entry';
import { JournalLine } from '../domain/journal-line';
import { JOURNAL_REPOSITORY, JournalRepository } from '../domain/journal.repository';

export interface CreateJournalLineCommand {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface CreateJournalEntryCommand {
  entryDate: string;
  description: string;
  referenceType: JournalReferenceType;
  referenceId?: string | null;
  lines: CreateJournalLineCommand[];
}

@Injectable()
export class CreateJournalEntryUseCase {
  constructor(
    @Inject(JOURNAL_REPOSITORY)
    private readonly repo: JournalRepository,
  ) {}

  async execute(cmd: CreateJournalEntryCommand): Promise<JournalEntry> {
    return this.repo.emit((numero) => {
      const lines = cmd.lines.map((l, i) =>
        new JournalLine(
          i + 1,
          l.accountCode,
          l.accountName,
          Money.fromCentimos(Math.round(l.debit * 100)),
          Money.fromCentimos(Math.round(l.credit * 100)),
        ),
      );
      return JournalEntry.create({
        id: JournalEntryId.of(randomUUID()),
        entryNumber: numero,
        entryDate: cmd.entryDate,
        description: cmd.description,
        referenceType: cmd.referenceType,
        referenceId: cmd.referenceId ?? null,
        lines,
      });
    });
  }
}
