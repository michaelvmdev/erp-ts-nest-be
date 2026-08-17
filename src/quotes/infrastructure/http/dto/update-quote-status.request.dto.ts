import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

const ALLOWED_STATUSES = ['sent', 'accepted', 'rejected', 'expired'] as const;
type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export class UpdateQuoteStatusRequestDto {
  @ApiProperty({ enum: ALLOWED_STATUSES })
  @IsIn(ALLOWED_STATUSES)
  status!: AllowedStatus;
}
