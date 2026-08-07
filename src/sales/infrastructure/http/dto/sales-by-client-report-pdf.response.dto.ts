import { ApiProperty } from '@nestjs/swagger';
import { SalesByClientReportPdfOutput } from '../../../application/generate-sales-by-client-report-pdf.use-case';

export class SalesByClientReportPdfResponseDto {
  @ApiProperty({
    example: 'ventas-cliente-2026-08-01_2026-08-31.pdf',
    description:
      'Nombre sugerido del archivo. Para un solo dia es ' +
      '"ventas-cliente-YYYY-MM-DD.pdf"; para un rango, ' +
      '"ventas-cliente-YYYY-MM-DD_YYYY-MM-DD.pdf".',
  })
  fileName!: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Tipo de contenido del archivo codificado en base64.',
  })
  mimeType!: string;

  @ApiProperty({
    example: 'JVBERi0xLjMKJ...',
    description: 'PDF del reporte codificado en base64.',
  })
  base64!: string;

  static fromOutput(
    output: SalesByClientReportPdfOutput,
  ): SalesByClientReportPdfResponseDto {
    const dto = new SalesByClientReportPdfResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = 'application/pdf';
    dto.base64 = output.base64;
    return dto;
  }
}
