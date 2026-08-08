import { Inject, Injectable } from '@nestjs/common';
import { buildEmailHtml, LOGO_CID } from '../../mail/email-template';
import type { EmailSummaryItem } from '../../mail/email-template';
import { MAILER } from '../../mail/mailer.port';
import type { Mailer } from '../../mail/mailer.port';
import { brandLogoPng } from '../../shared/infrastructure/assets';
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

    const pdf = await this.renderer.render(view);
    const fileName = `${view.saleNumber}.pdf`;
    const logo = brandLogoPng();

    const summaryItems: EmailSummaryItem[] = [
      { label: 'Comprobante', value: view.saleNumber },
      { label: 'Total', value: `S/ ${view.total}` },
    ];

    const html = buildEmailHtml({
      greeting: `Hola ${view.client.description},`,
      paragraphs: [
        `Adjuntamos tu comprobante ${view.saleNumber} por un total de S/ ${view.total}.`,
        'Puedes encontrar el documento en PDF adjunto a este correo.',
      ],
      summaryItems,
      showLogo: logo !== null,
    });

    const result = await this.mailer.send({
      to: email,
      subject: `Comprobante ${view.saleNumber}`,
      text:
        `Hola ${view.client.description},\n\n` +
        `Adjuntamos tu comprobante ${view.saleNumber} por un total de S/ ${view.total}.\n\n` +
        'Gracias por tu compra.\nMichael Dev S.A.C.',
      html,
      attachments: [
        { filename: fileName, content: pdf, contentType: 'application/pdf' },
        ...(logo
          ? [{ filename: 'logo.png', content: logo, contentType: 'image/png', cid: LOGO_CID }]
          : []),
      ],
    });

    return {
      to: email,
      messageId: result.messageId,
      sentAt: new Date().toISOString(),
    };
  }
}
