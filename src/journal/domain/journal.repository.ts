import { Page } from '../../shared/domain/pagination';
import { JournalEntry, JournalEntryId, JournalReferenceType } from './journal-entry';

export interface JournalEntrySummary {
  readonly id: string;
  readonly entryNumber: string;
  readonly entryDate: string;
  readonly description: string;
  readonly referenceType: JournalReferenceType;
  readonly referenceId: string | null;
  readonly totalDebit: string;
  readonly lineCount: number;
}

export interface JournalSearchCriteria {
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly referenceType?: JournalReferenceType;
  readonly accountCode?: string;
  readonly page: number;
  readonly limit: number;
}

export interface JournalRepository {
  findById(id: JournalEntryId): Promise<JournalEntry | null>;
  search(criteria: JournalSearchCriteria): Promise<Page<JournalEntrySummary>>;
  emit(armar: (numero: string) => JournalEntry): Promise<JournalEntry>;
}

export const JOURNAL_REPOSITORY = Symbol('JournalRepository');
