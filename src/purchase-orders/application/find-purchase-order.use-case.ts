import { Inject, Injectable } from '@nestjs/common';
import { PurchaseOrder } from '../domain/purchase-order';
import { PurchaseOrderNotFoundError } from '../domain/purchase-order.errors';
import { PURCHASE_ORDER_REPOSITORY } from '../domain/purchase-order.repository';
import type { PurchaseOrderRepository } from '../domain/purchase-order.repository';
import { PurchaseOrderId } from '../domain/value-objects/purchase-order-id.value-object';

@Injectable()
export class FindPurchaseOrderUseCase {
  constructor(
    @Inject(PURCHASE_ORDER_REPOSITORY)
    private readonly orders: PurchaseOrderRepository,
  ) {}

  async execute(id: string): Promise<PurchaseOrder> {
    const order = await this.orders.findById(PurchaseOrderId.of(id));
    if (!order) throw new PurchaseOrderNotFoundError(id);
    return order;
  }
}
