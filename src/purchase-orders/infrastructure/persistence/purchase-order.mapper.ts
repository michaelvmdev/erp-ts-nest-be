import { Money } from '../../../shared/domain/money.value-object';
import { ProductId } from '../../../products/domain/value-objects/identifiers.value-object';
import { PurchaseOrder } from '../../domain/purchase-order';
import { PurchaseOrderLine } from '../../domain/purchase-order-line';
import { PurchaseOrderSummary } from '../../domain/purchase-order.repository';
import { PurchaseOrderId } from '../../domain/value-objects/purchase-order-id.value-object';
import {
  PurchaseOrderDetailOrmEntity,
  PurchaseOrderOrmEntity,
} from './purchase-order.orm-entity';

export class PurchaseOrderMapper {
  static toDomain(
    row: PurchaseOrderOrmEntity,
    details: PurchaseOrderDetailOrmEntity[],
  ): PurchaseOrder {
    const lines = details
      .sort((a, b) => a.item - b.item)
      .map((d) =>
        PurchaseOrderLine.of({
          item: d.item,
          productId: ProductId.of(d.productId),
          quantityOrdered: Number(d.quantityOrdered),
          quantityReceived: Number(d.quantityReceived),
          unitPrice: Money.fromDecimalString(d.unitPrice),
        }),
      );

    return PurchaseOrder.rehydrate({
      id: PurchaseOrderId.of(row.purchaseOrderId),
      supplierId: row.supplierId,
      date: row.purchaseOrderDate,
      status: row.purchaseOrderStatus,
      notes: row.notes,
      lines,
    });
  }

  static toSummary(
    row: PurchaseOrderOrmEntity & { lineCount: string },
  ): PurchaseOrderSummary {
    return {
      id: row.purchaseOrderId,
      supplierId: row.supplierId,
      date: row.purchaseOrderDate,
      status: row.purchaseOrderStatus,
      notes: row.notes,
      subTotal: Money.fromDecimalString(row.subTotal),
      igv: Money.fromDecimalString(row.igv),
      total: Money.fromDecimalString(row.total),
      lineCount: Number(row.lineCount),
    };
  }

  static toPersistence(order: PurchaseOrder): {
    cabecera: PurchaseOrderOrmEntity;
    lineas: PurchaseOrderDetailOrmEntity[];
  } {
    const snap = order.toSnapshot();

    const cabecera = new PurchaseOrderOrmEntity();
    cabecera.purchaseOrderId = snap.id;
    cabecera.supplierId = snap.supplierId;
    cabecera.purchaseOrderDate = snap.date;
    cabecera.purchaseOrderStatus = snap.status;
    cabecera.subTotal = snap.subTotal.toDecimalString();
    cabecera.igv = snap.igv.toDecimalString();
    cabecera.total = snap.total.toDecimalString();
    cabecera.notes = snap.notes;

    const lineas = snap.lines.map((l) => {
      const det = new PurchaseOrderDetailOrmEntity();
      det.purchaseOrderId = snap.id;
      det.item = l.item;
      det.productId = l.productId;
      det.quantityOrdered = String(l.quantityOrdered);
      det.quantityReceived = String(l.quantityReceived);
      det.unitPrice = l.unitPrice.toDecimalString();
      det.partial = l.partial.toDecimalString();
      return det;
    });

    return { cabecera, lineas };
  }
}
