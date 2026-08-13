import { Inject, Injectable } from '@nestjs/common';
import { UserEcommerceNotFoundError } from '../domain/user-ecommerce.errors';
import { USER_ECOMMERCE_REPOSITORY } from '../domain/user-ecommerce.repository';
import type { UserEcommerceRepository } from '../domain/user-ecommerce.repository';
import { UserEcommerceId } from '../domain/value-objects/user-ecommerce-id.value-object';

@Injectable()
export class DeleteUserEcommerceUseCase {
  constructor(
    @Inject(USER_ECOMMERCE_REPOSITORY)
    private readonly users: UserEcommerceRepository,
  ) {}

  async execute(rawId: string): Promise<void> {
    const id = UserEcommerceId.of(rawId);

    const user = await this.users.findById(id);
    if (!user) throw new UserEcommerceNotFoundError(id.value);

    await this.users.delete(id);
  }
}
