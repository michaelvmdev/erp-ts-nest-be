import { ApiProperty } from '@nestjs/swagger';
import type { ProductSalesReportExcelOutput } from '../../../application/generate-product-sales-report-excel.use-case';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export class ProductSalesReportExcelResponseDto {
  @ApiProperty({ example: 'productos-2026-08-01_2026-08-31.xlsx' })
  fileName!: string;

  @ApiProperty({ example: XLSX_MIME })
  mimeType!: string;

  @ApiProperty({ example: 'UEsDBBQA...' })
  base64!: string;

  static fromOutput(output: ProductSalesReportExcelOutput): ProductSalesReportExcelResponseDto {
    const dto = new ProductSalesReportExcelResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = XLSX_MIME;
    dto.base64 = output.base64;
    return dto;
  }
}
