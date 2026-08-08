import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { Mailer, SendMailInput, SendMailResult } from './mailer.port';

/**
 * Adaptador del puerto Mailer con nodemailer sobre SMTP.
 *
 * El transporter se crea de forma perezosa la primera vez que se envia, no en el
 * arranque: asi la app levanta aunque el correo no este configurado, y solo
 * quien use el envio se topa con el error.
 *
 * Cuando falta configuracion o el servidor SMTP falla se responde 503 (no un 500
 * generico): es una dependencia externa no disponible, y el cliente lo distingue
 * de un fallo del propio backend.
 */
@Injectable()
export class NodemailerMailer implements Mailer {
  private readonly logger = new Logger(NodemailerMailer.name);
  private transporter?: Transporter;

  constructor(private readonly config: ConfigService) {}

  async send(input: SendMailInput): Promise<SendMailResult> {
    const transporter = this.obtenerTransporter();
    // MAIL_FROM es lo ideal; si no se puso, se cae al usuario autenticado.
    const from =
      this.config.get<string>('MAIL_FROM')?.trim() ||
      this.config.get<string>('MAIL_USER')?.trim();

    try {
      // sendMail devuelve un tipo `any` que depende del transporte; se acota a lo
      // unico que aqui interesa para no propagar `any` por el resto del metodo.
      const info = (await transporter.sendMail({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
        attachments: input.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
          cid: a.cid,
        })),
      })) as { messageId?: string; accepted?: unknown };

      const aceptados: unknown = info.accepted;
      const accepted: string[] = Array.isArray(aceptados)
        ? (aceptados as unknown[]).map((a) => String(a))
        : [];
      return { messageId: info.messageId ?? '', accepted };
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);
      this.logger.error(`Fallo al enviar correo a ${input.to}: ${mensaje}`);
      throw new ServiceUnavailableException(
        `No se pudo enviar el correo: ${mensaje}`,
      );
    }
  }

  private obtenerTransporter(): Transporter {
    const host = this.config.get<string>('MAIL_HOST')?.trim();
    if (!host) {
      throw new ServiceUnavailableException(
        'El envio de correo no esta configurado: falta MAIL_HOST. ' +
          'Completa las variables MAIL_* en el archivo .env.',
      );
    }

    if (!this.transporter) {
      const user = this.config.get<string>('MAIL_USER')?.trim();
      const pass = this.config.get<string>('MAIL_PASSWORD');
      this.transporter = createTransport({
        host,
        port: this.config.get<number>('MAIL_PORT') ?? 587,
        secure: this.config.get<boolean>('MAIL_SECURE') ?? false,
        // Sin usuario, se asume un relay SMTP abierto (util en pruebas locales).
        auth: user ? { user, pass } : undefined,
      });
    }

    return this.transporter;
  }
}
