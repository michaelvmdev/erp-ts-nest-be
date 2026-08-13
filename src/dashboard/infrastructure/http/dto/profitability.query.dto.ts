import { IsDateString, IsOptional } from 'class-validator';

export class ProfitabilityQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
