import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

/**
 * Parametros de `GET /purchases/purchases-by-supplier-report`.
 *
 * El reporte es siempre sobre un proveedor concreto, asi que `supplierId` es
 * obligatorio. `from` es obligatorio; `to` opcional (si se omite, es el reporte
 * del dia `from`).
 */
export class PurchasesBySupplierReportQueryDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    description: 'Proveedor del que se listan las compras.',
  })
  @IsUUID('4', { message: 'supplierId debe ser un UUID valido.' })
  supplierId!: string;

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
