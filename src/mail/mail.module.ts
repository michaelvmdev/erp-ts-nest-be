import { Module } from '@nestjs/common';
import { MAILER } from './mailer.port';
import { NodemailerMailer } from './nodemailer.mailer';

/**
 * Envio de correo, aislado en su propio modulo para que cualquier feature que lo
 * necesite lo importe sin acoplarse a nodemailer. Exporta el token MAILER; el
 * adaptador concreto se decide aqui y solo aqui.
 */
@Module({
  providers: [
    NodemailerMailer,
    { provide: MAILER, useExisting: NodemailerMailer },
  ],
  exports: [MAILER],
})
export class MailModule {}
