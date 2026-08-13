import { Inject, Injectable } from '@nestjs/common';
import { UserEcommerce } from '../domain/user-ecommerce';
import { UserEcommerceNotFoundError } from '../domain/user-ecommerce.errors';
import { USER_ECOMMERCE_REPOSITORY } from '../domain/user-ecommerce.repository';
import type { UserEcommerceRepository } from '../domain/user-ecommerce.repository';
import { UserEcommerceId } from '../domain/value-objects/user-ecommerce-id.value-object';

@Injectable()
export class FindUserEcommerceUseCase {
  constructor(
    @Inject(USER_ECOMMERCE_REPOSITORY)
    private readonly users: UserEcommerceRepository,
  ) {}

  async execute(rawId: string): Promise<UserEcommerce> {
    const id = UserEcommerceId.of(rawId);
    const user = await this.users.findById(id);
    if (!user) throw new UserEcommerceNotFoundError(id.value);
    return user;
  }
}
