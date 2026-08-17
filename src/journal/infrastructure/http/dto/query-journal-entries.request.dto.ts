import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

const REFERENCE_TYPES = ['sale', 'purchase', 'purchase_return', 'credit_note', 'manual'] as const;
type RefType = (typeof REFERENCE_TYPES)[number];

export class QueryJournalEntriesRequestDto {
  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: REFERENCE_TYPES })
  @IsOptional()
  @IsIn(REFERENCE_TYPES)
  referenceType?: RefType;

  @ApiPropertyOptional({ example: '1211' })
  @IsOptional()
  @IsString()
  accountCode?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
