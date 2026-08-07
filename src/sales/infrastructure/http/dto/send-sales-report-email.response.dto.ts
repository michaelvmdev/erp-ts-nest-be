import { ApiProperty } from '@nestjs/swagger';
import { SendSalesReportOutput } from '../../../application/send-sales-report-pdf.use-case';

export class SendSalesReportEmailResponseDto {
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
    example: '2026-08-07T04:15:07.000Z',
    description: 'Momento en que se despacho el envio.',
  })
  sentAt!: string;

  static fromOutput(
    output: SendSalesReportOutput,
  ): SendSalesReportEmailResponseDto {
    const dto = new SendSalesReportEmailResponseDto();
    dto.to = output.to;
    dto.messageId = output.messageId;
    dto.sentAt = output.sentAt;
    return dto;
  }
}
