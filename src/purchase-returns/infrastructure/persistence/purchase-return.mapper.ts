import { Money } from '../../../shared/domain/money.value-object';
import { ProductId } from '../../../products/domain/value-objects/identifiers.value-object';
import { PurchaseReturn } from '../../domain/purchase-return';
import { PurchaseReturnLine } from '../../domain/purchase-return-line';
import type { PurchaseReturnSummary } from '../../domain/purchase-return.repository';
import { PurchaseReturnId } from '../../domain/value-objects/purchase-return-id.value-object';
import {
  PurchaseReturnDetailOrmEntity,
  PurchaseReturnOrmEntity,
} from './purchase-return.orm-entity';

export class PurchaseReturnMapper {
  static toDomain(
    row: PurchaseReturnOrmEntity,
    details: PurchaseReturnDetailOrmEntity[],
  ): PurchaseReturn {
    const lines = details
      .sort((a, b) => a.item - b.item)
      .map((d) =>
        PurchaseReturnLine.of({
          item: d.item,
          productId: ProductId.of(d.productId),
          quantity: d.quantity,
          unitCost: Money.fromDecimalString(d.unitCost),
        }),
      );

    return PurchaseReturn.rehydrate({
      id: PurchaseReturnId.of(row.purchaseReturnId),
      purchaseId: row.purchaseId,
      number: row.purchaseReturnNumber,
      date: row.returnDate,
      hour: row.returnHour,
      reason: row.reason,
      lines,
    });
  }

  static toSummary(
    row: PurchaseReturnOrmEntity & { lineCount: string },
  ): PurchaseReturnSummary {
    return {
      id: row.purchaseReturnId,
      purchaseId: row.purchaseId,
      number: row.purchaseReturnNumber,
      date: row.returnDate,
      hour: row.returnHour,
      reason: row.reason,
      subTotal: Money.fromDecimalString(row.subTotal),
      igv: Money.fromDecimalString(row.igv),
      total: Money.fromDecimalString(row.total),
      lineCount: Number(row.lineCount),
    };
  }

  static toPersistence(pr: PurchaseReturn): {
    cabecera: PurchaseReturnOrmEntity;
    lineas: PurchaseReturnDetailOrmEntity[];
  } {
    const snap = pr.toSnapshot();
    const cabecera = new PurchaseReturnOrmEntity();
    cabecera.purchaseReturnId = snap.id;
    cabecera.purchaseId = snap.purchaseId;
    cabecera.purchaseReturnNumber = snap.number;
    cabecera.returnDate = snap.date;
    cabecera.returnHour = snap.hour;
    cabecera.reason = snap.reason;
    cabecera.subTotal = snap.subTotal.toDecimalString();
    cabecera.igv = snap.igv.toDecimalString();
    cabecera.total = snap.total.toDecimalString();

    const lineas = snap.lines.map((l) => {
      const det = new PurchaseReturnDetailOrmEntity();
      det.purchaseReturnId = snap.id;
      det.item = l.item;
      det.productId = l.productId;
      det.quantity = l.quantity;
      det.unitCost = l.unitCost.toDecimalString();
      det.partial = l.partial.toDecimalString();
      return det;
    });

    return { cabecera, lineas };
  }
}
