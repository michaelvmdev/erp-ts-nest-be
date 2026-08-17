import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const REFERENCE_TYPES = ['sale', 'purchase', 'purchase_return', 'credit_note', 'manual'] as const;
type RefType = (typeof REFERENCE_TYPES)[number];

export class CreateJournalLineDto {
  @ApiProperty({ example: '1211' })
  @IsString()
  accountCode!: string;

  @ApiProperty({ example: 'Clientes' })
  @IsString()
  accountName!: string;

  @ApiProperty({ example: 100.0, description: 'Monto de débito en soles (0 si es crédito)' })
  @IsNumber()
  @Min(0)
  debit!: number;

  @ApiProperty({ example: 0, description: 'Monto de crédito en soles (0 si es débito)' })
  @IsNumber()
  @Min(0)
  credit!: number;
}

export class CreateJournalEntryRequestDto {
  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  entryDate!: string;

  @ApiProperty({ example: 'Venta factura F001-0001' })
  @IsString()
  description!: string;

  @ApiProperty({ enum: REFERENCE_TYPES })
  @IsIn(REFERENCE_TYPES)
  referenceType!: RefType;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiProperty({ type: [CreateJournalLineDto] })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  lines!: CreateJournalLineDto[];
}
