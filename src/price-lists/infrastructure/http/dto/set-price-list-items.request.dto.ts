import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsNumber, IsUUID, Min, ValidateNested } from 'class-validator';

export class PriceListItemInputDto {
  @ApiProperty({ format: 'uuid', example: '00000000-0000-4000-8000-000000000001' })
  @IsUUID('4', { message: 'productId debe ser un UUID valido.' })
  productId!: string;

  @ApiProperty({ example: 29.9, minimum: 0, description: 'Precio unitario. No puede ser negativo.' })
  @IsNumber({}, { message: 'unitPrice debe ser un numero.' })
  @Min(0, { message: 'unitPrice no puede ser negativo.' })
  unitPrice!: number;
}

export class SetPriceListItemsRequestDto {
  @ApiProperty({ type: [PriceListItemInputDto], description: 'Lista completa de items. Reemplaza todos los items actuales.' })
  @IsArray()
  @ArrayNotEmpty({ message: 'items no puede estar vacio.' })
  @ValidateNested({ each: true })
  @Type(() => PriceListItemInputDto)
  items!: PriceListItemInputDto[];
}
