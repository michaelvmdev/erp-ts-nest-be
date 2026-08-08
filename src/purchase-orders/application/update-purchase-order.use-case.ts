import { Inject, Injectable } from '@nestjs/common';
import { PurchaseOrder } from '../domain/purchase-order';
import { PurchaseOrderNotFoundError } from '../domain/purchase-order.errors';
import { PURCHASE_ORDER_REPOSITORY } from '../domain/purchase-order.repository';
import type { PurchaseOrderRepository } from '../domain/purchase-order.repository';
import { PurchaseOrderId } from '../domain/value-objects/purchase-order-id.value-object';
import { UpdatePurchaseOrderCommand } from './purchase-order.commands';

@Injectable()
export class UpdatePurchaseOrderUseCase {
  constructor(
    @Inject(PURCHASE_ORDER_REPOSITORY)
    private readonly orders: PurchaseOrderRepository,
  ) {}

  async execute(id: string, command: UpdatePurchaseOrderCommand): Promise<PurchaseOrder> {
    const order = await this.orders.findById(PurchaseOrderId.of(id));
    if (!order) throw new PurchaseOrderNotFoundError(id);

    if (command.status !== undefined) {
      order.transitionTo(command.status);
    }
    if (command.notes !== undefined) {
      order.changeNotes(command.notes);
    }

    await this.orders.update(order);
    return order;
  }
}
