import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PASSWORD_RESET_STORE } from './forgot-password.use-case';
import type { PasswordResetStore } from './forgot-password.use-case';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_RESET_STORE) private readonly store: PasswordResetStore,
  ) {}

  async execute(token: string, newPassword: string): Promise<void> {
    const entry = this.store.get(token);

    if (!entry) {
      throw new UnprocessableEntityException('El enlace de recuperación no es válido.');
    }
    if (entry.expiresAt < new Date()) {
      this.store.delete(token);
      throw new UnprocessableEntityException('El enlace de recuperación ha expirado.');
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await this.users.updatePassword(entry.userId, hash);
    this.store.delete(token);
  }
}
