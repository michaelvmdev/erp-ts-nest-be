import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

/**
 * Parametros de `GET /purchases`.
 *
 * Viajan en la query string: son planos y de solo lectura, asi que el GET queda
 * cacheable y un enlace a un listado filtrado se puede compartir.
 *
 * Mas acotado que el de ventas: la compra no tiene numero de comprobante ni
 * ubigeo. Las conversiones numericas son explicitas porque el ValidationPipe
 * corre con `enableImplicitConversion: false`.
 */
export class SearchPurchasesQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description: 'Filtra por proveedor.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'supplierId debe ser un UUID valido.' })
  supplierId?: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-01-01',
    description: 'Desde, inclusive.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateFrom debe tener el formato YYYY-MM-DD.',
  })
  dateFrom?: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-08-31',
    description: 'Hasta, inclusive.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateTo debe tener el formato YYYY-MM-DD.',
  })
  dateTo?: string;

  @ApiPropertyOptional({
    type: 'number',
    format: 'double',
    minimum: 0,
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  totalMin?: number;

  @ApiPropertyOptional({
    type: 'number',
    format: 'double',
    minimum: 0,
    example: 50000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  totalMax?: number;

  @ApiPropertyOptional({
    enum: ['date', 'total'],
    default: 'date',
    description: 'Campo de ordenamiento.',
  })
  @IsOptional()
  @IsIn(['date', 'total'])
  sortBy?: 'date' | 'total';

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    description:
      'Por defecto descendente: al listar compras se suelen querer las ultimas.',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero.' })
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero.' })
  @Min(1)
  @Max(100)
  limit?: number;
}
