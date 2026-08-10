import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class ListNpsSurveysQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    description: 'Filtra por venta concreta.',
  })
  @IsOptional()
  @IsUUID('4')
  saleId?: string;

  @ApiPropertyOptional({
    enum: ['promoter', 'passive', 'detractor'],
    example: 'promoter',
    description: 'Filtra por categoria NPS.',
  })
  @IsOptional()
  @IsIn(['promoter', 'passive', 'detractor'])
  category?: 'promoter' | 'passive' | 'detractor';

  @ApiPropertyOptional({ minimum: 0, maximum: 10, example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  scoreMin?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  scoreMax?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Fecha de inicio (inclusive).' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-10', description: 'Fecha de fin (inclusive).' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['score', 'createdAt'], default: 'createdAt' })
  @IsOptional()
  @IsIn(['score', 'createdAt'])
  sortBy?: 'score' | 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class NpsScoreQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'Inicio del periodo (inclusive).' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-08-10', description: 'Fin del periodo (inclusive).' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
