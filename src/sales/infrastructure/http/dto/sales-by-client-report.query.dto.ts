import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

/**
 * Parametros de `GET /sales/sales-by-client-report`.
 *
 * El reporte es siempre sobre un cliente concreto, asi que `clientId` es
 * obligatorio. `from` es obligatorio; `to` opcional (si se omite, es el reporte
 * del dia `from`).
 */
export class SalesByClientReportQueryDto {
  @ApiProperty({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
    description: 'Cliente del que se listan las ventas.',
  })
  @IsUUID('4', { message: 'clientId debe ser un UUID valido.' })
  clientId!: string;

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
