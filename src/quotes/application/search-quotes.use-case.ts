import { Inject, Injectable } from '@nestjs/common';
import { Page } from '../../shared/domain/pagination';
import { QUOTE_REPOSITORY } from '../domain/quote.repository';
import type { QuoteRepository, QuoteSummary, QuoteSearchCriteria } from '../domain/quote.repository';

@Injectable()
export class SearchQuotesUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quotes: QuoteRepository,
  ) {}

  async execute(criteria: QuoteSearchCriteria): Promise<Page<QuoteSummary>> {
    return this.quotes.search(criteria);
  }
}
