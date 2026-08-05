import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Parametros de `GET /suppliers`.
 *
 * Viajan en la query string: son planos, pocos y de solo lectura, asi que un
 * GET cacheable es lo natural. Las conversiones son explicitas porque el
 * ValidationPipe corre con `enableImplicitConversion: false`.
 */
export class ListSuppliersQueryDto {
  @ApiPropertyOptional({
    maxLength: 150,
    example: 'electronica',
    description:
      'Coincidencia parcial e insensible a mayusculas sobre la razon social.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  supplierDescription?: string;

  @ApiPropertyOptional({
    example: '20100070970',
    description: 'Coincidencia exacta de RUC.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^20[0-9]{9}$/, {
    message: 'supplierRuc debe tener 11 digitos y empezar en "20".',
  })
  supplierRuc?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Filtra por estado. Si se omite, devuelve activos e inactivos.',
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as unknown;
  })
  @IsBoolean({ message: 'supplierActive debe ser "true" o "false".' })
  supplierActive?: boolean;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero.' })
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 50,
    example: 50,
    description:
      'Tamano de pagina. El valor por defecto es 50 porque los proveedores ' +
      'suelen pedirse completos para poblar un desplegable.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero.' })
  @Min(1)
  @Max(100)
  limit?: number;
}
