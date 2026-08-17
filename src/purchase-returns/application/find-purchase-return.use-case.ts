import { Inject, Injectable } from '@nestjs/common';
import { PurchaseReturnNotFoundError } from '../domain/purchase-return.errors';
import { PURCHASE_RETURN_REPOSITORY } from '../domain/purchase-return.repository';
import type { PurchaseReturnRepository } from '../domain/purchase-return.repository';
import { PurchaseReturnId } from '../domain/value-objects/purchase-return-id.value-object';
import { PurchaseReturn } from '../domain/purchase-return';

@Injectable()
export class FindPurchaseReturnUseCase {
  constructor(
    @Inject(PURCHASE_RETURN_REPOSITORY)
    private readonly purchaseReturns: PurchaseReturnRepository,
  ) {}

  async execute(id: string): Promise<PurchaseReturn> {
    const pr = await this.purchaseReturns.findById(PurchaseReturnId.of(id));
    if (!pr) throw new PurchaseReturnNotFoundError(id);
    return pr;
  }
}
