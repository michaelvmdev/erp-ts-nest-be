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

export class ListUnitsQueryDto {
  @ApiPropertyOptional({ maxLength: 10, example: 'KG', description: 'Coincidencia parcial sobre el codigo.' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  unitCode?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'kilo', description: 'Coincidencia parcial sobre la descripcion.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  unitDescription?: string;

  @ApiPropertyOptional({ example: true, description: 'Filtra por estado. Si se omite, devuelve activas e inactivas.' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as unknown;
  })
  @IsBoolean({ message: 'unitActive debe ser "true" o "false".' })
  unitActive?: boolean;

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
