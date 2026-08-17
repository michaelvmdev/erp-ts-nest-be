import { Money } from '../../shared/domain/money.value-object';
import { Page } from '../../shared/domain/pagination';
import { Quote, QuoteStatus } from './quote';
import { QuoteId } from './value-objects/quote-id.value-object';

export interface QuoteSummary {
  readonly id: string;
  readonly number: string;
  readonly status: QuoteStatus;
  readonly clientId: string;
  readonly clientName: string;
  readonly date: string;
  readonly validUntil: string;
  readonly total: Money;
  readonly lineCount: number;
  readonly createdAt: Date;
}

export interface QuoteSearchCriteria {
  clientId?: string;
  status?: QuoteStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface QuoteRepository {
  findById(id: QuoteId): Promise<Quote | null>;
  search(criteria: QuoteSearchCriteria): Promise<Page<QuoteSummary>>;
  emit(armar: (numero: string) => Quote): Promise<Quote>;
  update(quote: Quote): Promise<void>;
}

export interface QuoteCatalog {
  clientState(clientId: string): Promise<{ active: boolean; name: string } | null>;
  productsState(
    productIds: readonly string[],
  ): Promise<Map<string, { price: Money; active: boolean }>>;
}

export const QUOTE_REPOSITORY = Symbol('QuoteRepository');
export const QUOTE_CATALOG    = Symbol('QuoteCatalog');
