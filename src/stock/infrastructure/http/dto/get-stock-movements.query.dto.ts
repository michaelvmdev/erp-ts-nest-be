import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

const MOVEMENT_TYPES = ['purchase_in', 'sale_out', 'return_in', 'adjustment'] as const;

export class GetStockMovementsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'productId debe ser un UUID valido.' })
  productId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'warehouseId debe ser un UUID valido.' })
  warehouseId?: string;

  @ApiPropertyOptional({ enum: MOVEMENT_TYPES })
  @IsOptional()
  @IsIn(MOVEMENT_TYPES, { message: 'movementType invalido.' })
  movementType?: (typeof MOVEMENT_TYPES)[number];

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Desde esta fecha (ISO 8601).' })
  @IsOptional()
  @IsDateString({}, { message: 'dateFrom debe ser una fecha valida (ISO 8601).' })
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Hasta esta fecha (ISO 8601).' })
  @IsOptional()
  @IsDateString({}, { message: 'dateTo debe ser una fecha valida (ISO 8601).' })
  dateTo?: string;

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
