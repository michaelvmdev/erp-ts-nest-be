import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { STOCK_WRITER } from '../../stock/domain/stock-writer';
import type { StockWriter } from '../../stock/domain/stock-writer';
import { PurchaseReturn } from '../domain/purchase-return';
import { PurchaseReturnLine } from '../domain/purchase-return-line';
import {
  PurchaseReturnProductNotInPurchaseError,
  PurchaseReturnPurchaseNotFoundError,
} from '../domain/purchase-return.errors';
import {
  PURCHASE_RETURN_CATALOG,
  PURCHASE_RETURN_REPOSITORY,
} from '../domain/purchase-return.repository';
import type {
  PurchaseReturnCatalog,
  PurchaseReturnRepository,
} from '../domain/purchase-return.repository';
import { PurchaseReturnId } from '../domain/value-objects/purchase-return-id.value-object';
import { CreatePurchaseReturnCommand } from './purchase-return.commands';

@Injectable()
export class CreatePurchaseReturnUseCase {
  constructor(
    @Inject(PURCHASE_RETURN_REPOSITORY)
    private readonly purchaseReturns: PurchaseReturnRepository,
    @Inject(PURCHASE_RETURN_CATALOG)
    private readonly catalogo: PurchaseReturnCatalog,
    @Inject(STOCK_WRITER)
    private readonly stockWriter: StockWriter,
  ) {}

  async execute(command: CreatePurchaseReturnCommand): Promise<PurchaseReturn> {
    const exists = await this.catalogo.purchaseExists(command.purchaseId);
    if (!exists) throw new PurchaseReturnPurchaseNotFoundError(command.purchaseId);

    const purchaseLines = await this.catalogo.purchaseLinesMap(command.purchaseId);

    const lineas: PurchaseReturnLine[] = command.purchaseReturnDetails.map((d, i) => {
      const detail = purchaseLines.get(d.productId);
      if (!detail) throw new PurchaseReturnProductNotInPurchaseError(d.productId);
      return PurchaseReturnLine.of({
        item: i + 1,
        productId: ProductId.of(d.productId),
        quantity: d.quantity,
        unitCost: detail.unitCost,
      });
    });

    const { fecha, hora } = momentoDeRegistro(command);

    const purchaseReturn = await this.purchaseReturns.emit(command.purchaseId, (numero) =>
      PurchaseReturn.create({
        id: PurchaseReturnId.of(randomUUID()),
        purchaseId: command.purchaseId,
        number: numero,
        date: fecha,
        hour: hora,
        reason: command.reason,
        lines: lineas,
      }),
    );

    if (command.warehouseId) {
      await this.stockWriter.insertMovements(
        lineas.map((l) => ({
          productId:    l.productId.value,
          warehouseId:  command.warehouseId!,
          movementType: 'purchase_return' as const,
          quantity:     -l.quantity,
          unitCost:     l.unitCost.toNumber(),
          referenceId:  purchaseReturn.id.value,
        })),
      );
    }

    return purchaseReturn;
  }
}

function momentoDeRegistro(command: CreatePurchaseReturnCommand): { fecha: string; hora: string } {
  const ahora = new Date();
  const dd = (n: number) => String(n).padStart(2, '0');
  return {
    fecha: command.returnDate ??
      `${ahora.getFullYear()}-${dd(ahora.getMonth() + 1)}-${dd(ahora.getDate())}`,
    hora: command.returnHour ??
      `${dd(ahora.getHours())}:${dd(ahora.getMinutes())}:${dd(ahora.getSeconds())}`,
  };
}
