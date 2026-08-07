import { ApiProperty } from '@nestjs/swagger';
import { ProductSalesReportPdfOutput } from '../../../application/generate-product-sales-report-pdf.use-case';

export class ProductSalesReportPdfResponseDto {
  @ApiProperty({
    example: 'productos-vendidos-2026-08-01_2026-08-31.pdf',
    description:
      'Nombre sugerido del archivo. Para un solo dia es ' +
      '"productos-vendidos-YYYY-MM-DD.pdf"; para un rango, ' +
      '"productos-vendidos-YYYY-MM-DD_YYYY-MM-DD.pdf".',
  })
  fileName!: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Tipo de contenido del archivo codificado en base64.',
  })
  mimeType!: string;

  @ApiProperty({
    example: 'JVBERi0xLjMKJ...',
    description:
      'PDF del reporte codificado en base64. El front puede decodificarlo para ' +
      'descargarlo o mostrarlo sin una segunda peticion.',
  })
  base64!: string;

  static fromOutput(
    output: ProductSalesReportPdfOutput,
  ): ProductSalesReportPdfResponseDto {
    const dto = new ProductSalesReportPdfResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = 'application/pdf';
    dto.base64 = output.base64;
    return dto;
  }
}
