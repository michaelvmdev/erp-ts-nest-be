import { ApiProperty } from '@nestjs/swagger';
import type { SalesByClientReportExcelOutput } from '../../../application/generate-sales-by-client-report-excel.use-case';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export class SalesByClientReportExcelResponseDto {
  @ApiProperty({ example: 'ventas-cliente-2026-08-01_2026-08-31.xlsx' })
  fileName!: string;

  @ApiProperty({ example: XLSX_MIME })
  mimeType!: string;

  @ApiProperty({ example: 'UEsDBBQA...' })
  base64!: string;

  static fromOutput(output: SalesByClientReportExcelOutput): SalesByClientReportExcelResponseDto {
    const dto = new SalesByClientReportExcelResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = XLSX_MIME;
    dto.base64 = output.base64;
    return dto;
  }
}
