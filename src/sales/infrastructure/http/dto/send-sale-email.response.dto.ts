import { ApiProperty } from '@nestjs/swagger';
import { SendSalePdfOutput } from '../../../application/send-sale-pdf.use-case';

export class SendSaleEmailResponseDto {
  @ApiProperty({
    format: 'email',
    example: 'cliente@ejemplo.com',
    description: 'Direccion a la que se envio el comprobante.',
  })
  to!: string;

  @ApiProperty({
    example: '<a1b2c3@dbsales.local>',
    description: 'Identificador del mensaje que devuelve el servidor SMTP.',
  })
  messageId!: string;

  @ApiProperty({
    format: 'date-time',
    example: '2026-08-02T14:50:07.000Z',
    description: 'Momento en que se despacho el envio.',
  })
  sentAt!: string;

  static fromOutput(output: SendSalePdfOutput): SendSaleEmailResponseDto {
    const dto = new SendSaleEmailResponseDto();
    dto.to = output.to;
    dto.messageId = output.messageId;
    dto.sentAt = output.sentAt;
    return dto;
  }
}
