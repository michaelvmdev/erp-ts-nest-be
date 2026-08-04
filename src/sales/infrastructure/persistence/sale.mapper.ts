import { ClientId } from '../../../clients/domain/value-objects/client-id.value-object';
import { ProductId } from '../../../products/domain/value-objects/identifiers.value-object';
import { Money } from '../../../shared/domain/money.value-object';
import { Sale } from '../../domain/sale';
import { SaleLine } from '../../domain/sale-line';
import type { SaleSummary } from '../../domain/sale.repository';
import {
  SaleId,
  SaleNumber,
} from '../../domain/value-objects/sale-identifiers.value-object';
import { Ubigeo } from '../../domain/value-objects/ubigeo.value-object';
import { SaleDetailOrmEntity, SaleOrmEntity } from './sale.orm-entity';

export class SaleMapper {
  static toDomain(row: SaleOrmEntity, detalles: SaleDetailOrmEntity[]): Sale {
    const lineas = [...detalles]
      // El orden por item importa: es el que ve el usuario en el comprobante.
      .sort((a, b) => a.item - b.item)
      .map((d) =>
        SaleLine.of({
          item: d.item,
          productId: ProductId.of(d.productId),
          quantity: d.quantity,
          unitPrice: Money.fromDecimalString(d.unitPrice),
        }),
      );

    return Sale.rehydrate({
      id: SaleId.of(row.saleId),
      number: SaleNumber.rehydrate(row.saleNumber),
      // La columna es `date`; el driver la entrega como YYYY-MM-DD.
      date: row.saleDate,
      hour: row.saleHour,
      clientId: ClientId.of(row.clientId),
      ubigeo: Ubigeo.rehydrate(
        row.districtId,
        row.provinceId,
        row.departmentId,
      ),
      lines: lineas,
    });
  }

  static toPersistence(sale: Sale): {
    cabecera: SaleOrmEntity;
    lineas: SaleDetailOrmEntity[];
  } {
    const s = sale.toSnapshot();

    const cabecera = new SaleOrmEntity();
    cabecera.saleId = s.id;
    cabecera.saleNumber = s.number;
    cabecera.saleDate = s.date;
    cabecera.saleHour = s.hour;
    cabecera.clientId = s.clientId;
    cabecera.departmentId = s.departmentId;
    cabecera.provinceId = s.provinceId;
    cabecera.districtId = s.districtId;
    cabecera.subTotal = s.subTotal.toDecimalString();
    cabecera.igv = s.igv.toDecimalString();
    cabecera.total = s.total.toDecimalString();

    const lineas = s.lines.map((l) => {
      const fila = new SaleDetailOrmEntity();
      fila.saleId = s.id;
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
   * un Sale sin lineas violaria la invariante de que el total es la suma de ellas.
   */
  static toSummary(row: SaleOrmEntity & { lineCount?: string }): SaleSummary {
    const numero = SaleNumber.rehydrate(row.saleNumber);
    return {
      id: row.saleId,
      number: numero.value,
      saleTypeCode: numero.code,
      date: row.saleDate,
      hour: row.saleHour,
      clientId: row.clientId,
      departmentId: row.departmentId,
      provinceId: row.provinceId,
      districtId: row.districtId,
      subTotal: Money.fromDecimalString(row.subTotal),
      igv: Money.fromDecimalString(row.igv),
      total: Money.fromDecimalString(row.total),
      lineCount: Number(row.lineCount ?? 0),
    };
  }
}
