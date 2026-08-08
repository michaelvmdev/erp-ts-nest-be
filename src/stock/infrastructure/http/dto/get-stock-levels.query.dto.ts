import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class GetStockLevelsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por almacen.' })
  @IsOptional()
  @IsUUID('4', { message: 'warehouseId debe ser un UUID valido.' })
  warehouseId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Filtrar por producto.' })
  @IsOptional()
  @IsUUID('4', { message: 'productId debe ser un UUID valido.' })
  productId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Si es true, incluye productos con stock 0 o negativo.',
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as unknown;
  })
  @IsBoolean()
  includeEmpty?: boolean;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
