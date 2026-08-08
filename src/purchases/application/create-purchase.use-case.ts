import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupplierId } from '../../suppliers/domain/value-objects/supplier-id.value-object';
import { STOCK_WRITER } from '../../stock/domain/stock-writer';
import type { StockWriter } from '../../stock/domain/stock-writer';
import { Purchase } from '../domain/purchase';
import {
  InactivePurchaseSupplierError,
  PurchaseSupplierNotFoundError,
} from '../domain/purchase.errors';
import {
  PURCHASE_CATALOG,
  PURCHASE_REPOSITORY,
} from '../domain/purchase.repository';
import type {
  PurchaseCatalog,
  PurchaseRepository,
} from '../domain/purchase.repository';
import { PurchaseId } from '../domain/value-objects/purchase-id.value-object';
import { construirLineas } from './purchase-lines.builder';
import { CreatePurchaseCommand } from './purchase.commands';

@Injectable()
export class CreatePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchases: PurchaseRepository,
    @Inject(PURCHASE_CATALOG)
    private readonly catalogo: PurchaseCatalog,
    @Inject(STOCK_WRITER)
    private readonly stockWriter: StockWriter,
  ) {}

  async execute(command: CreatePurchaseCommand): Promise<Purchase> {
    const supplierId = SupplierId.of(command.supplierId);
    const proveedor = await this.catalogo.supplierState(supplierId.value);
    if (!proveedor) {
      throw new PurchaseSupplierNotFoundError(supplierId.value);
    }
    if (!proveedor.active) {
      throw new InactivePurchaseSupplierError(supplierId.value);
    }

    const lineas = await construirLineas(
      this.catalogo,
      command.purchaseDetails,
    );

    const { fecha, hora } = momentoDeRegistro(command);

    const purchase = Purchase.create({
      id: PurchaseId.of(randomUUID()),
      supplierId,
      date: fecha,
      hour: hora,
      lines: lineas,
    });

    await this.purchases.insert(purchase);

    if (command.warehouseId) {
      await this.stockWriter.insertMovements(
        purchase.lines.map((l) => ({
          productId: l.productId.value,
          warehouseId: command.warehouseId!,
          movementType: 'purchase_in' as const,
          quantity: l.quantity,
          unitCost: l.unitPrice.toNumber(),
          referenceId: purchase.id.value,
        })),
      );
    }

    return purchase;
  }
}

/**
 * Fecha y hora de la compra.
 *
 * Si no vienen en el cuerpo se toma el momento actual, que es el caso normal.
 * Se permite enviarlas para poder cargar compras historicas, que es como se
 * generaron los datos de prueba.
 */
function momentoDeRegistro(command: CreatePurchaseCommand): {
  fecha: string;
  hora: string;
} {
  const ahora = new Date();
  const dd = (n: number) => String(n).padStart(2, '0');

  // Hora local del servidor y no UTC: la fecha de una compra es la del lugar
  // donde se registra.
  const fecha =
    command.purchaseDate ??
    `${ahora.getFullYear()}-${dd(ahora.getMonth() + 1)}-${dd(ahora.getDate())}`;
  const hora =
    command.purchaseHour ??
    `${dd(ahora.getHours())}:${dd(ahora.getMinutes())}:${dd(ahora.getSeconds())}`;

  return { fecha, hora };
}
