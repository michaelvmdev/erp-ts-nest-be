import { ClientId } from '../../../clients/domain/value-objects/client-id.value-object';
import { ProductId } from '../../../products/domain/value-objects/identifiers.value-object';
import { Money } from '../../../shared/domain/money.value-object';
import { Quote, QuoteStatus } from '../../domain/quote';
import { QuoteLine } from '../../domain/quote-line';
import { QuoteSummary } from '../../domain/quote.repository';
import { QuoteId } from '../../domain/value-objects/quote-id.value-object';
import { QuoteDetailOrmEntity, QuoteOrmEntity } from './quote.orm-entity';

export class QuoteMapper {
  static toDomain(row: QuoteOrmEntity, details: QuoteDetailOrmEntity[]): Quote {
    const lines = details.map((d) =>
      QuoteLine.of({
        item: d.item,
        productId: ProductId.of(d.productId),
        quantity: d.quantity,
        unitPrice: Money.fromDecimalString(d.unitPrice),
      }),
    );
    return Quote.rehydrate({
      id: QuoteId.of(row.quoteId),
      number: row.quoteNumber,
      status: row.status as QuoteStatus,
      clientId: ClientId.of(row.clientId),
      date: row.quoteDate,
      validUntil: row.validUntil,
      notes: row.notes,
      lines,
      createdAt: row.createdAt,
    });
  }

  static toSummary(
    row: QuoteOrmEntity & { clientName: string; lineCount: number },
  ): QuoteSummary {
    return {
      id: row.quoteId,
      number: row.quoteNumber,
      status: row.status as QuoteStatus,
      clientId: row.clientId,
      clientName: row.clientName,
      date: row.quoteDate,
      validUntil: row.validUntil,
      total: Money.fromDecimalString(row.total),
      lineCount: Number(row.lineCount),
      createdAt: row.createdAt,
    };
  }

  static toPersistence(
    quote: Quote,
  ): { header: Partial<QuoteOrmEntity>; details: Partial<QuoteDetailOrmEntity>[] } {
    const snap = quote.toSnapshot();
    const header: Partial<QuoteOrmEntity> = {
      quoteId:     snap.id,
      quoteNumber: snap.number,
      status:      snap.status,
      clientId:    snap.clientId,
      quoteDate:   snap.date,
      validUntil:  snap.validUntil,
      notes:       snap.notes,
      subTotal:    (snap.subTotal.centimos / 100).toFixed(2),
      igv:         (snap.igv.centimos / 100).toFixed(2),
      total:       (snap.total.centimos / 100).toFixed(2),
    };
    const details = snap.lines.map((l) => ({
      quoteId:   snap.id,
      item:      l.item,
      productId: l.productId,
      quantity:  l.quantity,
      unitPrice: (l.unitPrice.centimos / 100).toFixed(2),
      partial:   (l.partial.centimos / 100).toFixed(2),
    }));
    return { header, details };
  }
}
