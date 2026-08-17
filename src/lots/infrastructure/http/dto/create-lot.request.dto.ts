import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateLotRequestDto {
  @ApiProperty({ example: 'LOT-2026-001', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  lotNumber!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  productId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  warehouseId!: string;

  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  manufacturingDate?: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  expirationDate!: string;

  @ApiProperty({ minimum: 1, description: 'Cantidad inicial ingresada al almacen.' })
  @IsInt()
  @Min(1)
  initialQuantity!: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
