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
 * Parametros de `GET /sales`.
 *
 * Viajan en la query string: son planos y de solo lectura, asi que el GET queda
 * cacheable y un enlace a un listado filtrado se puede compartir.
 *
 * Las conversiones numericas son explicitas porque el ValidationPipe corre con
 * `enableImplicitConversion: false`.
 */
export class SearchSalesQueryDto {
  @ApiPropertyOptional({
    example: 'FAC-0000000001',
    description: 'Numero exacto. Identifica un unico comprobante.',
  })
  @IsOptional()
  @Matches(/^[A-Za-z]{3}-[0-9]{10}$/, {
    message: 'saleNumber debe tener la forma "FAC-0000000001".',
  })
  saleNumber?: string;

  @ApiPropertyOptional({
    example: 'FAC',
    description:
      'Filtra por tipo de comprobante usando su codigo de tres letras. Se resuelve como ' +
      'prefijo del numero, asi que aprovecha el indice.',
  })
  @IsOptional()
  @Matches(/^[A-Za-z]{3}$/, { message: 'saleTypeCode debe ser tres letras.' })
  saleTypeCode?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
  })
  @IsOptional()
  @IsUUID('4', { message: 'clientId debe ser un UUID valido.' })
  clientId?: string;

  @ApiPropertyOptional({ example: '150131', description: 'Distrito exacto.' })
  @IsOptional()
  @Matches(/^[0-9]{6}$/, { message: 'districtId debe tener 6 digitos.' })
  districtId?: string;

  @ApiPropertyOptional({
    example: '15',
    description: 'Departamento exacto. Util para agrupar ventas por region.',
  })
  @IsOptional()
  @Matches(/^[0-9]{2}$/, { message: 'departmentId debe tener 2 digitos.' })
  departmentId?: string;

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
    example: 500,
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
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  totalMax?: number;

  @ApiPropertyOptional({
    enum: ['date', 'number', 'total'],
    default: 'date',
    description: 'Campo de ordenamiento.',
  })
  @IsOptional()
  @IsIn(['date', 'number', 'total'])
  sortBy?: 'date' | 'number' | 'total';

  @ApiPropertyOptional({
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    description:
      'Por defecto descendente: al listar ventas se suelen querer las ultimas.',
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
