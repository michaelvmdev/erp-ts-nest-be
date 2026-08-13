import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { UserEcommerce } from '../domain/user-ecommerce';
import { UserEcommerceEmailAlreadyExistsError } from '../domain/user-ecommerce.errors';
import { USER_ECOMMERCE_REPOSITORY } from '../domain/user-ecommerce.repository';
import type { UserEcommerceRepository } from '../domain/user-ecommerce.repository';
import { UserEcommerceId } from '../domain/value-objects/user-ecommerce-id.value-object';
import { CreateUserEcommerceCommand } from './user-ecommerce.commands';

@Injectable()
export class CreateUserEcommerceUseCase {
  constructor(
    @Inject(USER_ECOMMERCE_REPOSITORY)
    private readonly users: UserEcommerceRepository,
  ) {}

  async execute(command: CreateUserEcommerceCommand): Promise<UserEcommerce> {
    const emailNormalized = command.email.toLowerCase().trim();

    const existing = await this.users.findByEmail(emailNormalized);
    if (existing) throw new UserEcommerceEmailAlreadyExistsError(emailNormalized);

    const user = UserEcommerce.create({
      id: UserEcommerceId.of(randomUUID()),
      email: emailNormalized,
      firstName: command.firstName,
      lastName: command.lastName,
      phone: command.phone ?? null,
      active: command.active,
    });

    await this.users.insert(user);
    return user;
  }
}
