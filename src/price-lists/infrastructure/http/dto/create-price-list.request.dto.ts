import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePriceListRequestDto {
  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Lista Mayorista' })
  @IsString()
  @MinLength(1, { message: 'priceListName no puede estar vacio.' })
  @MaxLength(100, { message: 'priceListName no puede superar 100 caracteres.' })
  priceListName!: string;

  @ApiPropertyOptional({ maxLength: 300, example: 'Precios para clientes mayoristas', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'priceListDescription no puede superar 300 caracteres.' })
  priceListDescription?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  priceListActive?: boolean;
}
