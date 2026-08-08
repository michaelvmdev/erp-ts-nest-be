import { Money } from '../../../shared/domain/money.value-object';
import { ProductId } from '../../../products/domain/value-objects/identifiers.value-object';
import { CreditNote } from '../../domain/credit-note';
import { CreditNoteLine } from '../../domain/credit-note-line';
import { CreditNoteSummary } from '../../domain/credit-note.repository';
import { CreditNoteId } from '../../domain/value-objects/credit-note-id.value-object';
import {
  CreditNoteDetailOrmEntity,
  CreditNoteOrmEntity,
} from './credit-note.orm-entity';

export class CreditNoteMapper {
  static toDomain(
    row: CreditNoteOrmEntity,
    details: CreditNoteDetailOrmEntity[],
  ): CreditNote {
    const lines = details
      .sort((a, b) => a.item - b.item)
      .map((d) =>
        CreditNoteLine.of({
          item: d.item,
          productId: ProductId.of(d.productId),
          quantity: d.quantity,
          unitPrice: Money.fromDecimalString(d.unitPrice),
        }),
      );

    return CreditNote.rehydrate({
      id: CreditNoteId.of(row.creditNoteId),
      saleId: row.saleId,
      number: row.creditNoteNumber,
      date: row.creditNoteDate,
      hour: row.creditNoteHour,
      reason: row.reason,
      lines,
    });
  }

  static toSummary(
    row: CreditNoteOrmEntity & { lineCount: string },
  ): CreditNoteSummary {
    return {
      id: row.creditNoteId,
      saleId: row.saleId,
      number: row.creditNoteNumber,
      date: row.creditNoteDate,
      hour: row.creditNoteHour,
      reason: row.reason,
      subTotal: Money.fromDecimalString(row.subTotal),
      igv: Money.fromDecimalString(row.igv),
      total: Money.fromDecimalString(row.total),
      lineCount: Number(row.lineCount),
    };
  }

  static toPersistence(cn: CreditNote): {
    cabecera: CreditNoteOrmEntity;
    lineas: CreditNoteDetailOrmEntity[];
  } {
    const snap = cn.toSnapshot();
    const cabecera = new CreditNoteOrmEntity();
    cabecera.creditNoteId = snap.id;
    cabecera.saleId = snap.saleId;
    cabecera.creditNoteNumber = snap.number;
    cabecera.creditNoteDate = snap.date;
    cabecera.creditNoteHour = snap.hour;
    cabecera.reason = snap.reason;
    cabecera.subTotal = snap.subTotal.toDecimalString();
    cabecera.igv = snap.igv.toDecimalString();
    cabecera.total = snap.total.toDecimalString();

    const lineas = snap.lines.map((l) => {
      const det = new CreditNoteDetailOrmEntity();
      det.creditNoteId = snap.id;
      det.item = l.item;
      det.productId = l.productId;
      det.quantity = l.quantity;
      det.unitPrice = l.unitPrice.toDecimalString();
      det.partial = l.partial.toDecimalString();
      return det;
    });

    return { cabecera, lineas };
  }
}
