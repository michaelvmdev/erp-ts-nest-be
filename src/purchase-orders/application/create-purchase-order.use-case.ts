import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Money } from '../../shared/domain/money.value-object';
import { ProductId } from '../../products/domain/value-objects/identifiers.value-object';
import { PurchaseOrder } from '../domain/purchase-order';
import { PurchaseOrderLine } from '../domain/purchase-order-line';
import {
  PurchaseOrderSupplierNotFoundError,
  InvalidPurchaseOrderError,
} from '../domain/purchase-order.errors';
import {
  PURCHASE_ORDER_CATALOG,
  PURCHASE_ORDER_REPOSITORY,
} from '../domain/purchase-order.repository';
import type {
  PurchaseOrderCatalog,
  PurchaseOrderRepository,
} from '../domain/purchase-order.repository';
import { PurchaseOrderId } from '../domain/value-objects/purchase-order-id.value-object';
import { CreatePurchaseOrderCommand } from './purchase-order.commands';

@Injectable()
export class CreatePurchaseOrderUseCase {
  constructor(
    @Inject(PURCHASE_ORDER_REPOSITORY)
    private readonly orders: PurchaseOrderRepository,
    @Inject(PURCHASE_ORDER_CATALOG)
    private readonly catalogo: PurchaseOrderCatalog,
  ) {}

  async execute(command: CreatePurchaseOrderCommand): Promise<PurchaseOrder> {
    const supplierOk = await this.catalogo.supplierExists(command.supplierId);
    if (!supplierOk) throw new PurchaseOrderSupplierNotFoundError(command.supplierId);

    const productIds = command.lines.map((l) => l.productId);
    const existingIds = await this.catalogo.productsExist(productIds);
    const missing = productIds.filter((id) => !existingIds.has(id));
    if (missing.length > 0) {
      throw new InvalidPurchaseOrderError(
        `Los siguientes productos no existen: ${missing.join(', ')}.`,
      );
    }

    const lines = command.lines.map((l, i) =>
      PurchaseOrderLine.of({
        item: i + 1,
        productId: ProductId.of(l.productId),
        quantityOrdered: l.quantityOrdered,
        quantityReceived: 0,
        unitPrice: Money.fromNumber(l.unitPrice),
      }),
    );

    const order = PurchaseOrder.create({
      id: PurchaseOrderId.of(randomUUID()),
      supplierId: command.supplierId,
      date: command.date,
      notes: command.notes,
      lines,
    });

    await this.orders.insert(order);
    return order;
  }
}
