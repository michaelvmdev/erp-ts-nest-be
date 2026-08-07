import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

/**
 * Parametros de `GET /sales/sales-by-client-report`.
 *
 * `from` es obligatorio; `to` opcional (si se omite, es el reporte del dia
 * `from`). `clientId` opcional acota el reporte a un unico cliente.
 */
export class SalesByClientReportQueryDto {
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
