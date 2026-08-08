import { ApiProperty } from '@nestjs/swagger';
import type { ClientSalesAmountReportExcelOutput } from '../../../application/generate-client-sales-amount-report-excel.use-case';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export class ClientSalesAmountReportExcelResponseDto {
  @ApiProperty({ example: 'clientes-monto-2026-08-01_2026-08-31.xlsx' })
  fileName!: string;

  @ApiProperty({ example: XLSX_MIME })
  mimeType!: string;

  @ApiProperty({ example: 'UEsDBBQA...' })
  base64!: string;

  static fromOutput(output: ClientSalesAmountReportExcelOutput): ClientSalesAmountReportExcelResponseDto {
    const dto = new ClientSalesAmountReportExcelResponseDto();
    dto.fileName = output.fileName;
    dto.mimeType = XLSX_MIME;
    dto.base64 = output.base64;
    return dto;
  }
}
