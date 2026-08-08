import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePaymentRequestDto {
  @ApiProperty({ enum: ['income', 'expense'] })
  @IsIn(['income', 'expense'])
  paymentType!: 'income' | 'expense';

  @ApiProperty({ enum: ['sale', 'purchase', 'credit_note', 'purchase_order'] })
  @IsIn(['sale', 'purchase', 'credit_note', 'purchase_order'])
  referenceType!: 'sale' | 'purchase' | 'credit_note' | 'purchase_order';

  @ApiProperty()
  @IsUUID('4')
  referenceId!: string;

  @ApiProperty({ example: '2026-01-15' })
  @IsDateString()
  paymentDate!: string;

  @ApiProperty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @ApiPropertyOptional({ enum: ['cash', 'transfer', 'card', 'check'], default: 'cash' })
  @IsOptional()
  @IsIn(['cash', 'transfer', 'card', 'check'])
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'check';

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
