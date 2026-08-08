import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const STATUSES = ['pending', 'partial', 'received', 'cancelled'] as const;

export class UpdatePurchaseOrderRequestDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES, { message: 'status invalido.' })
  status?: (typeof STATUSES)[number];

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}
