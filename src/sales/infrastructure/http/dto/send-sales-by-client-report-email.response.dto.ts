import { ApiProperty } from '@nestjs/swagger';
import { SendSalesByClientReportOutput } from '../../../application/send-sales-by-client-report-pdf.use-case';

export class SendSalesByClientReportEmailResponseDto {
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
    output: SendSalesByClientReportOutput,
  ): SendSalesByClientReportEmailResponseDto {
    const dto = new SendSalesByClientReportEmailResponseDto();
    dto.to = output.to;
    dto.messageId = output.messageId;
    dto.sentAt = output.sentAt;
    return dto;
  }
}
