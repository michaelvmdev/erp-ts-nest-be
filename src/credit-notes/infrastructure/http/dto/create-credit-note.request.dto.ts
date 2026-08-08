import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreditNoteLineRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'productId debe ser un UUID valido.' })
  productId!: string;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 9999 })
  @IsInt({ message: 'quantity debe ser un entero.' })
  @Min(1)
  @Max(9999)
  quantity!: number;
}

export class CreateCreditNoteRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Venta que se anula o devuelve parcialmente.' })
  @IsUUID('4', { message: 'saleId debe ser un UUID valido.' })
  saleId!: string;

  @ApiProperty({
    maxLength: 500,
    example: 'Devolucion por producto defectuoso.',
    description: 'Motivo de la nota de credito.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  reason!: string;

  @ApiPropertyOptional({ format: 'date', example: '2026-08-07' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'creditNoteDate debe tener el formato YYYY-MM-DD.' })
  creditNoteDate?: string;

  @ApiPropertyOptional({ example: '14:00:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, { message: 'creditNoteHour debe tener el formato HH:MM:SS.' })
  creditNoteHour?: string;

  @ApiProperty({ type: [CreditNoteLineRequestDto], minItems: 1, maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreditNoteLineRequestDto)
  creditNoteDetails!: CreditNoteLineRequestDto[];
}
