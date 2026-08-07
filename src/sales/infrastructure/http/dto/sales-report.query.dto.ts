import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

/**
 * Parametros de `GET /sales/report`.
 *
 * `from` es obligatorio; `to` opcional. Si `to` se omite, el reporte es del dia
 * `from` ("ventas del dia"). El formato se valida aqui con una expresion regular
 * en vez de convertir a Date, porque el rango se usa tal cual (YYYY-MM-DD) contra
 * la columna `sale_date`, que no tiene hora.
 */
export class SalesReportQueryDto {
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
