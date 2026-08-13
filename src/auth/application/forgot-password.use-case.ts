import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { USER_REPOSITORY } from '../domain/user.repository';
import type { UserRepository } from '../domain/user.repository';

export const PASSWORD_RESET_STORE = Symbol('PasswordResetStore');

export interface PasswordResetEntry {
  userId: string;
  expiresAt: Date;
}

export interface PasswordResetStore {
  set(token: string, entry: PasswordResetEntry): void;
  get(token: string): PasswordResetEntry | undefined;
  delete(token: string): void;
}

/** TTL for reset tokens: 15 minutes */
const TTL_MS = 15 * 60 * 1000;

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(PASSWORD_RESET_STORE) private readonly store: PasswordResetStore,
  ) {}

  async execute(email: string, frontendUrl: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || !user.active) {
      // Do not reveal whether the email exists — always return 204
      this.logger.log(`forgot-password: no active user for ${email}`);
      return;
    }

    const token = randomBytes(32).toString('hex');
    this.store.set(token, { userId: user.id.value, expiresAt: new Date(Date.now() + TTL_MS) });

    const resetUrl = `${frontendUrl}/nueva-contrasena?token=${token}`;

    await this.mailer.send({
      to: user.email,
      subject: 'Recuperación de contraseña — ERP MV-DEV',
      html: `
        <p>Hola <strong>${user.name}</strong>,</p>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>
          <a href="${resetUrl}" style="color:#2563eb">Haz clic aquí para crear una nueva contraseña</a>
        </p>
        <p>Este enlace expira en 15 minutos. Si no solicitaste el cambio, ignora este correo.</p>
      `,
    });

    this.logger.log(`forgot-password: reset email sent to ${user.email}`);
  }
}
