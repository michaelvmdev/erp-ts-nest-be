import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClientId } from '../../clients/domain/value-objects/client-id.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { Money } from '../../shared/domain/money.value-object';
import { Quote } from '../domain/quote';
import { QuoteClientNotFoundError } from '../domain/quote.errors';
import { QUOTE_CATALOG, QUOTE_REPOSITORY } from '../domain/quote.repository';
import type { QuoteCatalog, QuoteRepository } from '../domain/quote.repository';
import { QuoteId } from '../domain/value-objects/quote-id.value-object';
import { QuoteLine } from '../domain/quote-line';
import { CreateQuoteCommand } from './quote.commands';

@Injectable()
export class CreateQuoteUseCase {
  constructor(
    @Inject(QUOTE_REPOSITORY) private readonly quotes: QuoteRepository,
    @Inject(QUOTE_CATALOG)    private readonly catalog: QuoteCatalog,
  ) {}

  async execute(command: CreateQuoteCommand): Promise<Quote> {
    const clientId = ClientId.of(command.clientId);
    const cliente = await this.catalog.clientState(clientId.value);
    if (!cliente) {
      throw new QuoteClientNotFoundError(clientId.value);
    }

    const productIds = command.details.map((d) => d.productId);
    const productsState = await this.catalog.productsState(productIds);

    const lines = command.details.map((d) => {
      const state = productsState.get(d.productId);
      if (!state) {
        throw new Error(`Producto "${d.productId}" no encontrado.`);
      }
      return QuoteLine.of({
        item: d.item,
        productId: ProductId.of(d.productId),
        quantity: d.quantity,
        unitPrice: state.price,
      });
    });

    const ahora = new Date();
    const dd = (n: number) => String(n).padStart(2, '0');
    const fecha =
      command.date ??
      `${ahora.getFullYear()}-${dd(ahora.getMonth() + 1)}-${dd(ahora.getDate())}`;

    const quote = await this.quotes.emit((numero) =>
      Quote.create({
        id: QuoteId.of(randomUUID()),
        number: numero,
        clientId,
        date: fecha,
        validUntil: command.validUntil,
        notes: command.notes,
        lines,
      }),
    );

    return quote;
  }
}
