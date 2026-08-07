import { ApiProperty } from '@nestjs/swagger';
import { PurchasesBySupplierReportPdfOutput } from '../../../application/generate-purchases-by-supplier-report-pdf.use-case';

export class PurchasesBySupplierReportPdfResponseDto {
  @ApiProperty({
    example: 'compras-proveedor-2026-08-01_2026-08-31.pdf',
    description:
      'Nombre sugerido del archivo. Para un solo dia es ' +
      '"compras-proveedor-YYYY-MM-DD.pdf"; para un rango, ' +
      '"compras-proveedor-YYYY-MM-DD_YYYY-MM-DD.pdf".',
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
    output: PurchasesBySupplierReportPdfOutput,
  ): PurchasesBySupplierReportPdfResponseDto {
    const dto = new PurchasesBySupplierReportPdfResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = 'application/pdf';
    dto.base64 = output.base64;
    return dto;
  }
}
