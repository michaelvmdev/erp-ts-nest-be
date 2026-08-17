import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteDetailItemDto {
  @ApiProperty({ minimum: 1, description: 'Numero de linea.' })
  @IsInt()
  @Min(1)
  item!: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateQuoteRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Cliente al que se dirige la cotizacion.' })
  @IsUUID('4')
  clientId!: string;

  @ApiPropertyOptional({ example: '2026-08-14', description: 'Fecha de emision (por defecto: hoy).' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ example: '2026-09-14', description: 'Fecha hasta la que es valida la cotizacion.' })
  @IsDateString()
  validUntil!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [CreateQuoteDetailItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteDetailItemDto)
  details!: CreateQuoteDetailItemDto[];
}
