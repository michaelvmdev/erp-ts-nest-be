import { Inject, Injectable } from '@nestjs/common';
import { Purchase } from '../domain/purchase';
import { PurchaseNotFoundError } from '../domain/purchase.errors';
import { PURCHASE_REPOSITORY } from '../domain/purchase.repository';
import type { PurchaseRepository } from '../domain/purchase.repository';
import { PurchaseId } from '../domain/value-objects/purchase-id.value-object';

@Injectable()
export class FindPurchaseUseCase {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchases: PurchaseRepository,
  ) {}

  async execute(rawPurchaseId: string): Promise<Purchase> {
    const id = PurchaseId.of(rawPurchaseId);

    const purchase = await this.purchases.findById(id);
    if (!purchase) {
      throw new PurchaseNotFoundError(id.value);
    }
    return purchase;
  }
}
