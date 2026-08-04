/**
 * Puerto de salida para el envio de correo.
 *
 * El dominio y la aplicacion dependen de esta interfaz, no de nodemailer. El
 * adaptador concreto (NodemailerMailer) vive en este mismo modulo y se inyecta
 * por el token de abajo; para un test basta una implementacion en memoria.
 */

export interface MailAttachment {
  /** Nombre con el que se adjunta el archivo. */
  filename: string;
  /** Contenido binario en memoria; nunca se escribe a disco. */
  content: Buffer;
  contentType: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: MailAttachment[];
}

export interface SendMailResult {
  messageId: string;
  accepted: string[];
}

export interface Mailer {
  send(input: SendMailInput): Promise<SendMailResult>;
}

export const MAILER = Symbol('Mailer');
