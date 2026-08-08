import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateWarehouseRequestDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 200,
    example: 'Almacen Secundario Callao',
    description: 'Nueva descripcion. El codigo (warehouseCode) es inmutable.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'warehouseDescription no puede estar vacio.' })
  @MaxLength(200, { message: 'warehouseDescription no puede superar 200 caracteres.' })
  warehouseDescription?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Enviar false desactiva el almacen sin borrarlo.',
  })
  @IsOptional()
  @IsBoolean()
  warehouseActive?: boolean;
}
