import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, Matches, MaxLength } from 'class-validator';
import type { ProductSalesReportOrderBy } from '../../../domain/product-sales-report-view';

/**
 * Parametros de `POST /sales/products-report/send-email`.
 *
 * El correo, las fechas y el orden viajan en la query string. `email` y `from`
 * son obligatorios; `to` opcional (si se omite, es el reporte del dia `from`);
 * `orderBy` por monto (por defecto) o por cantidad.
 */
export class SendProductSalesReportEmailQueryDto {
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
