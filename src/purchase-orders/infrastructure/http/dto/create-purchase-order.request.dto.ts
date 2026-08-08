import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseOrderLineRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'productId debe ser un UUID valido.' })
  productId!: string;

  @ApiProperty({ type: 'number', minimum: 0.001, example: 10 })
  @IsNumber({ maxDecimalPlaces: 4 }, { message: 'quantityOrdered debe ser un numero con hasta 4 decimales.' })
  @Min(0.001)
  @Max(9999999)
  quantityOrdered!: number;

  @ApiProperty({ type: 'number', minimum: 0, example: 25.5 })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'unitPrice debe ser un numero con hasta 2 decimales.' })
  @Min(0)
  @Max(9999999999.99)
  unitPrice!: number;
}

export class CreatePurchaseOrderRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4', { message: 'supplierId debe ser un UUID valido.' })
  supplierId!: string;

  @ApiProperty({ format: 'date', example: '2026-08-07' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date debe tener el formato YYYY-MM-DD.' })
  date!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [PurchaseOrderLineRequestDto], minItems: 1, maxItems: 100 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineRequestDto)
  lines!: PurchaseOrderLineRequestDto[];
}
