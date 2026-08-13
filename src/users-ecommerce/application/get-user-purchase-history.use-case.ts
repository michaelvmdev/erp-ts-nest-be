import { Inject, Injectable } from '@nestjs/common';
import { USER_ECOMMERCE_REPOSITORY } from '../domain/user-ecommerce.repository';
import type { UserEcommerceRepository, UserPurchaseHistoryItem } from '../domain/user-ecommerce.repository';

@Injectable()
export class GetUserPurchaseHistoryUseCase {
  constructor(
    @Inject(USER_ECOMMERCE_REPOSITORY)
    private readonly repo: UserEcommerceRepository,
  ) {}

  execute(id: string): Promise<UserPurchaseHistoryItem[]> {
    return this.repo.getPurchaseHistory(id);
  }
}
