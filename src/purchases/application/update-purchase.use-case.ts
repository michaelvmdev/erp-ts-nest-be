import { Inject, Injectable } from '@nestjs/common';
import { SupplierId } from '../../suppliers/domain/value-objects/supplier-id.value-object';
import { Purchase } from '../domain/purchase';
import {
  InactivePurchaseSupplierError,
  PurchaseNotFoundError,
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
import { UpdatePurchaseCommand } from './purchase.commands';

/**
 * Corrige una compra ya registrada.
 *
 * Se pueden corregir el proveedor, la fecha, la hora y las lineas. A diferencia
 * de una venta —donde la fecha y la hora son inmutables por ser la identidad
 * fiscal del comprobante—, una compra no es un documento fiscal, asi que su
 * fecha y hora son datos operativos que se pueden corregir.
 *
 * Los importes no se reciben: si cambian las lineas, se recalculan.
 */
@Injectable()
export class UpdatePurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchases: PurchaseRepository,
    @Inject(PURCHASE_CATALOG)
    private readonly catalogo: PurchaseCatalog,
  ) {}

  async execute(
    rawPurchaseId: string,
    command: UpdatePurchaseCommand,
  ): Promise<Purchase> {
    const id = PurchaseId.of(rawPurchaseId);

    const purchase = await this.purchases.findById(id);
    if (!purchase) {
      throw new PurchaseNotFoundError(id.value);
    }

    // Semantica PATCH: se compara contra `undefined`, de modo que solo se aplica
    // lo que vino en el cuerpo.
    if (command.supplierId !== undefined) {
      const supplierId = SupplierId.of(command.supplierId);
      const proveedor = await this.catalogo.supplierState(supplierId.value);
      if (!proveedor) {
        throw new PurchaseSupplierNotFoundError(supplierId.value);
      }
      if (!proveedor.active) {
        throw new InactivePurchaseSupplierError(supplierId.value);
      }
      purchase.reassignSupplier(supplierId);
    }

    if (command.purchaseDate !== undefined) {
      purchase.changeDate(command.purchaseDate);
    }

    if (command.purchaseHour !== undefined) {
      purchase.changeHour(command.purchaseHour);
    }

    if (command.purchaseDetails !== undefined) {
      // Reemplazo completo, no parcial: los importes dependen del conjunto de
      // lineas. Al reemplazarlas, el agregado recalcula subtotal, IGV y total.
      purchase.replaceLines(
        await construirLineas(this.catalogo, command.purchaseDetails),
      );
    }

    await this.purchases.update(purchase);
    return purchase;
  }
}
