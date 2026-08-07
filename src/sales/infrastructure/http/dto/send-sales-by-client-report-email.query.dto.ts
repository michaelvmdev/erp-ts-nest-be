import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * Parametros de `POST /sales/sales-by-client-report/send-email`.
 *
 * El correo, las fechas y el cliente viajan en la query string. `email` y `from`
 * son obligatorios; `to` opcional (si se omite, es el reporte del dia `from`);
 * `clientId` opcional acota a un unico cliente.
 */
export class SendSalesByClientReportEmailQueryDto {
  @ApiProperty({
    format: 'email',
    example: 'gerencia@ejemplo.com',
    description: 'Direccion a la que se envia el reporte en PDF adjunto.',
  })
  @IsEmail({}, { message: 'email debe ser una direccion de correo valida.' })
  @MaxLength(254, { message: 'email no puede superar 254 caracteres.' })
  email!: string;

  @ApiProperty({
    format: 'date',
    example: '2026-08-01',
    description: 'Inicio del rango, inclusive (YYYY-MM-DD).',
  })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from debe tener el formato YYYY-MM-DD.',
  })
  from!: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-08-31',
    description:
      'Fin del rango, inclusive (YYYY-MM-DD). Si se omite, el reporte es del ' +
      'dia indicado en "from".',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to debe tener el formato YYYY-MM-DD.',
  })
  to?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
    description:
      'Si se indica, el reporte incluye solo las ventas de ese cliente.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'clientId debe ser un UUID valido.' })
  clientId?: string;
}
