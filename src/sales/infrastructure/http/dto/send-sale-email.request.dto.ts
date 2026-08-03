import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MaxLength } from 'class-validator';

export class SendSaleEmailRequestDto {
  @ApiProperty({
    format: 'email',
    example: 'cliente@ejemplo.com',
    description: 'Direccion a la que se envia el comprobante en PDF adjunto.',
  })
  @IsEmail({}, { message: 'email debe ser una direccion de correo valida.' })
  @MaxLength(254, { message: 'email no puede superar 254 caracteres.' })
  email!: string;
}
