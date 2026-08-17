import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

const LOT_STATUSES = ['active', 'depleted', 'expired'] as const;

export class SearchLotsQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  warehouseId?: string;

  @ApiPropertyOptional({ enum: LOT_STATUSES })
  @IsOptional()
  @IsIn(LOT_STATUSES)
  status?: (typeof LOT_STATUSES)[number];

  @ApiPropertyOptional({ example: '2026-12-31', description: 'Lotes que vencen en o antes de esta fecha.' })
  @IsOptional()
  @IsDateString()
  expiringBeforeDate?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
