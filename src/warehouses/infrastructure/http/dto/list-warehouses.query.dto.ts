import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListWarehousesQueryDto {
  @ApiPropertyOptional({ maxLength: 20, example: 'ALM', description: 'Coincidencia parcial sobre el codigo.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  warehouseCode?: string;

  @ApiPropertyOptional({ maxLength: 200, example: 'Lima', description: 'Coincidencia parcial sobre la descripcion.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  warehouseDescription?: string;

  @ApiPropertyOptional({ example: true, description: 'Filtra por estado. Si se omite, devuelve activos e inactivos.' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as unknown;
  })
  @IsBoolean({ message: 'warehouseActive debe ser "true" o "false".' })
  warehouseActive?: boolean;

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

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 50, example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero.' })
  @Min(1)
  @Max(100)
  limit?: number;
}
