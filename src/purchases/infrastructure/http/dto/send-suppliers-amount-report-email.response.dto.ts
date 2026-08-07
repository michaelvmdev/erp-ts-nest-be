import { ApiProperty } from '@nestjs/swagger';
import { SendSupplierPurchasesAmountReportOutput } from '../../../application/send-supplier-purchases-amount-report-pdf.use-case';

export class SendSuppliersAmountReportEmailResponseDto {
  @ApiProperty({
    format: 'email',
    example: 'gerencia@ejemplo.com',
    description: 'Direccion a la que se envio el reporte.',
  })
  to!: string;

  @ApiProperty({
    example: '<a1b2c3@appsales.local>',
    description: 'Identificador del mensaje que devuelve el servidor SMTP.',
  })
  messageId!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-08-07T10:20:07.000Z',
    description: 'Momento en que se despacho el envio.',
  })
  sentAt!: string;

  static fromOutput(
    output: SendSupplierPurchasesAmountReportOutput,
  ): SendSuppliersAmountReportEmailResponseDto {
    const dto = new SendSuppliersAmountReportEmailResponseDto();
    dto.to = output.to;
    dto.messageId = output.messageId;
    dto.sentAt = output.sentAt;
    return dto;
  }
}
