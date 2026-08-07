import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';
import type { ProductSalesReportOrderBy } from '../../../domain/product-sales-report-view';

/**
 * Parametros de `GET /sales/products-report`.
 *
 * `from` es obligatorio; `to` opcional (si se omite, es el reporte del dia
 * `from`). `orderBy` elige el criterio de orden: por monto (total) o por
 * cantidad; si se omite, se ordena por monto.
 */
export class ProductSalesReportQueryDto {
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
    enum: ['amount', 'quantity'],
    default: 'amount',
    description:
      'Criterio de orden: "amount" por monto total vendido, "quantity" por ' +
      'unidades vendidas. Por defecto, por monto. Siempre descendente.',
  })
  @IsOptional()
  @IsIn(['amount', 'quantity'], {
    message: 'orderBy debe ser "amount" o "quantity".',
  })
  orderBy?: ProductSalesReportOrderBy;
}
