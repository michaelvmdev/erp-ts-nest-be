import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, MaxLength } from 'class-validator';

/**
 * Parametros de `POST /sales/report/send-email`.
 *
 * El correo y las fechas viajan en la query string. `from` es obligatorio; `to`
 * opcional: si se omite, el reporte enviado es del dia `from` ("ventas del dia").
 * El formato de fecha se valida con una expresion regular porque el rango se usa
 * tal cual (YYYY-MM-DD) contra la columna `sale_date`, que no tiene hora.
 */
export class SendSalesReportEmailQueryDto {
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
}
