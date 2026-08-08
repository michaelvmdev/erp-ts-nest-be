import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { User, UserEmailConflictError, UserId } from '../domain/user';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export interface RegisterUserCommand {
  readonly roleId: string;
  readonly email: string;
  readonly name: string;
  readonly password: string;
}

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) {}

  async run(cmd: RegisterUserCommand): Promise<User> {
    const existing = await this.users.findByEmail(cmd.email);
    if (existing) throw new UserEmailConflictError(cmd.email);

    const passwordHash = await bcrypt.hash(cmd.password, 10);
    const user = User.create({
      id: UserId.of(uuidv4()),
      roleId: cmd.roleId,
      email: cmd.email,
      name: cmd.name,
      passwordHash,
    });
    await this.users.insert(user);
    return user;
  }
}
