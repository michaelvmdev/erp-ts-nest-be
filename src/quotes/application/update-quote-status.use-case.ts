import { Inject, Injectable } from '@nestjs/common';
import { QuoteNotFoundError } from '../domain/quote.errors';
import { QUOTE_REPOSITORY } from '../domain/quote.repository';
import type { QuoteRepository } from '../domain/quote.repository';
import { QuoteId } from '../domain/value-objects/quote-id.value-object';
import { UpdateQuoteStatusCommand } from './quote.commands';
import { Quote } from '../domain/quote';

@Injectable()
export class UpdateQuoteStatusUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quotes: QuoteRepository,
  ) {}

  async execute(command: UpdateQuoteStatusCommand): Promise<Quote> {
    const quote = await this.quotes.findById(QuoteId.of(command.quoteId));
    if (!quote) {
      throw new QuoteNotFoundError(command.quoteId);
    }

    quote.transitionTo(command.status);
    await this.quotes.update(quote);
    return quote;
  }
}
