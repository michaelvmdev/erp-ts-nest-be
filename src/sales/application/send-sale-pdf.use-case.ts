import { Inject, Injectable } from '@nestjs/common';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { SaleNotFoundError } from '../domain/sale.errors';
import {
  SALE_PDF_RENDERER,
  SALE_PRINT_VIEW_READER,
} from '../domain/sale-print-view';
import type {
  SalePdfRenderer,
  SalePrintViewReader,
} from '../domain/sale-print-view';

export interface SendSalePdfOutput {
  to: string;
  messageId: string;
  sentAt: string;
}

@Injectable()
export class SendSalePdfUseCase {
  constructor(
    @Inject(SALE_PRINT_VIEW_READER)
    private readonly reader: SalePrintViewReader,
    @Inject(SALE_PDF_RENDERER)
    private readonly renderer: SalePdfRenderer,
    @Inject(MAILER)
    private readonly mailer: Mailer,
  ) {}

  async execute(rawSaleId: string, email: string): Promise<SendSalePdfOutput> {
    const view = await this.reader.byId(rawSaleId);
    if (!view) {
      throw new SaleNotFoundError(rawSaleId);
    }

    // El PDF se genera en memoria y se adjunta tal cual: nunca toca el disco.
    const pdf = await this.renderer.render(view);
    const fileName = `${view.saleNumber}.pdf`;

    const result = await this.mailer.send({
      to: email,
      subject: `Comprobante ${view.saleNumber}`,
      text:
        `Hola ${view.client.description},\n\n` +
        `Adjuntamos tu comprobante ${view.saleNumber} por un total de S/ ${view.total}.\n\n` +
        'Gracias por tu compra.\nMichael Dev S.A.C.\nEnviado con AppSales',
      attachments: [
        { filename: fileName, content: pdf, contentType: 'application/pdf' },
      ],
    });

    return {
      to: email,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    };
  }
}
