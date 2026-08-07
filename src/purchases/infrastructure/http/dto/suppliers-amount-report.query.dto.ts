import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

/**
 * Parametros de `GET /purchases/suppliers-amount-report`.
 *
 * `from` es obligatorio; `to` opcional (si se omite, es el reporte del dia
 * `from`). Solo se filtra por rango de fechas.
 */
export class SuppliersAmountReportQueryDto {
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
