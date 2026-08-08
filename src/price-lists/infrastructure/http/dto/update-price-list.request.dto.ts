import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdatePriceListRequestDto {
  @ApiPropertyOptional({ minLength: 1, maxLength: 100, example: 'Lista VIP' })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'priceListName no puede estar vacio.' })
  @MaxLength(100, { message: 'priceListName no puede superar 100 caracteres.' })
  priceListName?: string;

  @ApiPropertyOptional({ maxLength: 300, nullable: true, example: null, description: 'Enviar null para borrar la descripcion.' })
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'priceListDescription no puede superar 300 caracteres.' })
  priceListDescription?: string | null;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  priceListActive?: boolean;
}
