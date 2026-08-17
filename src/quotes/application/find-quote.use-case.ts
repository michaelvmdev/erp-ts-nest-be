import { Inject, Injectable } from '@nestjs/common';
import { QuoteNotFoundError } from '../domain/quote.errors';
import { QUOTE_REPOSITORY } from '../domain/quote.repository';
import type { QuoteRepository } from '../domain/quote.repository';
import { QuoteId } from '../domain/value-objects/quote-id.value-object';
import { Quote } from '../domain/quote';

@Injectable()
export class FindQuoteUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quotes: QuoteRepository,
  ) {}

  async execute(id: string): Promise<Quote> {
    const quote = await this.quotes.findById(QuoteId.of(id));
    if (!quote) {
      throw new QuoteNotFoundError(id);
    }
    return quote;
  }
}
