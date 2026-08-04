import { Inject, Injectable } from '@nestjs/common';
import { SaleNotFoundError } from '../domain/sale.errors';
import {
  SALE_PDF_RENDERER,
  SALE_PRINT_VIEW_READER,
} from '../domain/sale-print-view';
import type {
  SalePdfRenderer,
  SalePrintViewReader,
} from '../domain/sale-print-view';

export interface SalePdfOutput {
  fileName: string;
  base64: string;
}

@Injectable()
export class GenerateSalePdfUseCase {
  constructor(
    @Inject(SALE_PRINT_VIEW_READER)
    private readonly reader: SalePrintViewReader,
    @Inject(SALE_PDF_RENDERER)
    private readonly renderer: SalePdfRenderer,
  ) {}

  async execute(rawSaleId: string): Promise<SalePdfOutput> {
    const view = await this.reader.byId(rawSaleId);
    if (!view) {
      throw new SaleNotFoundError(rawSaleId);
    }

    const pdf = await this.renderer.render(view);
    return {
      fileName: `${view.saleNumber}.pdf`,
      base64: pdf.toString('base64'),
    };
  }
}
