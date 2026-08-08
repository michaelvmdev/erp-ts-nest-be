import { Inject, Injectable } from '@nestjs/common';
import { User, UserNotFoundError, UserId } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface UpdateUserCommand {
  readonly id: string;
  readonly name?: string;
  readonly roleId?: string;
  readonly active?: boolean;
}

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async run(cmd: UpdateUserCommand): Promise<User> {
    const userId = UserId.of(cmd.id);
    const user = await this.users.findById(userId);
    if (!user) throw new UserNotFoundError(cmd.id);

    user.update({ name: cmd.name, roleId: cmd.roleId, active: cmd.active });
    await this.users.save(user);
    return user;
  }
}
