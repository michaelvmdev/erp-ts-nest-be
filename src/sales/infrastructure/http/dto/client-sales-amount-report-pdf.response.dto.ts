import { ApiProperty } from '@nestjs/swagger';
import { ClientSalesAmountReportPdfOutput } from '../../../application/generate-client-sales-amount-report-pdf.use-case';

export class ClientSalesAmountReportPdfResponseDto {
  @ApiProperty({
    example: 'monto-clientes-2026-08-01_2026-08-31.pdf',
    description:
      'Nombre sugerido del archivo. Para un solo dia es ' +
      '"monto-clientes-YYYY-MM-DD.pdf"; para un rango, ' +
      '"monto-clientes-YYYY-MM-DD_YYYY-MM-DD.pdf".',
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
    output: ClientSalesAmountReportPdfOutput,
  ): ClientSalesAmountReportPdfResponseDto {
    const dto = new ClientSalesAmountReportPdfResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = 'application/pdf';
    dto.base64 = output.base64;
    return dto;
  }
}
