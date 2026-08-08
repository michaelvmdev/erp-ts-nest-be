import { ApiProperty } from '@nestjs/swagger';
import type { PurchasesBySupplierReportExcelOutput } from '../../../application/generate-purchases-by-supplier-report-excel.use-case';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export class PurchasesBySupplierReportExcelResponseDto {
  @ApiProperty({ example: 'compras-proveedor-2026-08-01_2026-08-31.xlsx' })
  fileName!: string;

  @ApiProperty({ example: XLSX_MIME })
  mimeType!: string;

  @ApiProperty({ example: 'UEsDBBQA...' })
  base64!: string;

  static fromOutput(output: PurchasesBySupplierReportExcelOutput): PurchasesBySupplierReportExcelResponseDto {
    const dto = new PurchasesBySupplierReportExcelResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = XLSX_MIME;
    dto.base64 = output.base64;
    return dto;
  }
}
