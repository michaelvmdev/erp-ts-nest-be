import { Inject, Injectable } from '@nestjs/common';
import { UserEcommerce } from '../domain/user-ecommerce';
import {
  UserEcommerceEmailAlreadyExistsError,
  UserEcommerceNotFoundError,
} from '../domain/user-ecommerce.errors';
import { USER_ECOMMERCE_REPOSITORY } from '../domain/user-ecommerce.repository';
import type { UserEcommerceRepository } from '../domain/user-ecommerce.repository';
import { UserEcommerceId } from '../domain/value-objects/user-ecommerce-id.value-object';
import { UpdateUserEcommerceCommand } from './user-ecommerce.commands';

@Injectable()
export class UpdateUserEcommerceUseCase {
  constructor(
    @Inject(USER_ECOMMERCE_REPOSITORY)
    private readonly users: UserEcommerceRepository,
  ) {}

  async execute(rawId: string, command: UpdateUserEcommerceCommand): Promise<UserEcommerce> {
    const id = UserEcommerceId.of(rawId);

    const user = await this.users.findById(id);
    if (!user) throw new UserEcommerceNotFoundError(id.value);

    if (command.email !== undefined) {
      const emailNormalized = command.email.toLowerCase().trim();
      const other = await this.users.findByEmail(emailNormalized, id);
      if (other) throw new UserEcommerceEmailAlreadyExistsError(emailNormalized);
      user.changeEmail(emailNormalized);
    }

    if (command.firstName !== undefined || command.lastName !== undefined) {
      user.rename(
        command.firstName ?? user.firstName,
        command.lastName ?? user.lastName,
      );
    }

    if (command.phone !== undefined) {
      user.changePhone(command.phone);
    }

    if (command.active !== undefined) {
      if (command.active) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    await this.users.update(user);
    return user;
  }
}
