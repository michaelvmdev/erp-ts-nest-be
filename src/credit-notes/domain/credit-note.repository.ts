import { Money } from '../../shared/domain/money.value-object';
import { Page } from '../../shared/domain/pagination';
import { CreditNote } from './credit-note';
import { CreditNoteId } from './value-objects/credit-note-id.value-object';

export interface CreditNoteSummary {
  readonly id: string;
  readonly saleId: string;
  readonly number: string;
  readonly date: string;
  readonly hour: string;
  readonly reason: string;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lineCount: number;
}

export interface CreditNoteSearchCriteria {
  readonly saleId?: string;
  readonly dateFrom?: string;
  readonly dateTo?: string;
  readonly page: { page: number; limit: number; offset: number };
}

export interface CreditNoteRepository {
  findById(id: CreditNoteId): Promise<CreditNote | null>;
  search(criteria: CreditNoteSearchCriteria): Promise<Page<CreditNoteSummary>>;
  emit(saleId: string, armar: (numero: string) => CreditNote): Promise<CreditNote>;
}

export interface CreditNoteCatalog {
  saleExists(saleId: string): Promise<boolean>;
  saleLinesMap(saleId: string): Promise<Map<string, { unitPrice: Money }>>;
}

export const CREDIT_NOTE_REPOSITORY = Symbol('CreditNoteRepository');
export const CREDIT_NOTE_CATALOG = Symbol('CreditNoteCatalog');
