import { ProductId } from '../../../products/domain/value-objects/identifiers.value-object';
import { Money } from '../../../shared/domain/money.value-object';
import { SupplierId } from '../../../suppliers/domain/value-objects/supplier-id.value-object';
import { Purchase } from '../../domain/purchase';
import { PurchaseLine } from '../../domain/purchase-line';
import type { PurchaseSummary } from '../../domain/purchase.repository';
import { PurchaseId } from '../../domain/value-objects/purchase-id.value-object';
import {
  PurchaseDetailOrmEntity,
  PurchaseOrmEntity,
} from './purchase.orm-entity';

export class PurchaseMapper {
  static toDomain(
    row: PurchaseOrmEntity,
    detalles: PurchaseDetailOrmEntity[],
  ): Purchase {
    const lineas = [...detalles]
      // El orden por item importa: es el que ve el usuario en el detalle.
      .sort((a, b) => a.item - b.item)
      .map((d) =>
        PurchaseLine.of({
          item: d.item,
          productId: ProductId.of(d.productId),
          quantity: d.quantity,
          unitPrice: Money.fromDecimalString(d.unitPrice),
        }),
      );

    return Purchase.rehydrate({
      id: PurchaseId.of(row.purchaseId),
      supplierId: SupplierId.of(row.supplierId),
      // La columna es `date`; el driver la entrega como YYYY-MM-DD.
      date: row.purchaseDate,
      hour: row.purchaseHour,
      lines: lineas,
    });
  }

  static toPersistence(purchase: Purchase): {
    cabecera: PurchaseOrmEntity;
    lineas: PurchaseDetailOrmEntity[];
  } {
    const p = purchase.toSnapshot();

    const cabecera = new PurchaseOrmEntity();
    cabecera.purchaseId = p.id;
    cabecera.supplierId = p.supplierId;
    cabecera.purchaseDate = p.date;
    cabecera.purchaseHour = p.hour;
    cabecera.subTotal = p.subTotal.toDecimalString();
    cabecera.igv = p.igv.toDecimalString();
    cabecera.total = p.total.toDecimalString();

    const lineas = p.lines.map((l) => {
      const fila = new PurchaseDetailOrmEntity();
      fila.purchaseId = p.id;
      fila.item = l.item;
      fila.productId = l.productId;
      fila.quantity = l.quantity;
      fila.unitPrice = l.unitPrice.toDecimalString();
      fila.partial = l.partial.toDecimalString();
      return fila;
    });

    return { cabecera, lineas };
  }

  /**
   * Proyeccion de listado. No construye el agregado porque no tiene sus lineas:
   * un Purchase sin lineas violaria la invariante de que el total es la suma de
   * ellas.
   */
  static toSummary(
    row: PurchaseOrmEntity & { lineCount?: string },
  ): PurchaseSummary {
    return {
      id: row.purchaseId,
      supplierId: row.supplierId,
      date: row.purchaseDate,
      hour: row.purchaseHour,
      subTotal: Money.fromDecimalString(row.subTotal),
      igv: Money.fromDecimalString(row.igv),
      total: Money.fromDecimalString(row.total),
      lineCount: Number(row.lineCount ?? 0),
    };
  }
}
