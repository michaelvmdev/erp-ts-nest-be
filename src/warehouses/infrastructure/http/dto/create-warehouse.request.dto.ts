import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateWarehouseRequestDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 20,
    example: 'ALM-001',
    description:
      'Codigo del almacen. Letras mayusculas, digitos y guiones (A-Z, 0-9, -), maximo 20 caracteres.',
  })
  @IsString()
  @MinLength(1, { message: 'warehouseCode no puede estar vacio.' })
  @MaxLength(20, { message: 'warehouseCode no puede superar 20 caracteres.' })
  @Matches(/^[A-Za-z0-9-]+$/, { message: 'warehouseCode solo puede contener letras, digitos y guiones.' })
  warehouseCode!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 200,
    example: 'Almacen Principal Lima',
  })
  @IsString()
  @MinLength(1, { message: 'warehouseDescription no puede estar vacio.' })
  @MaxLength(200, { message: 'warehouseDescription no puede superar 200 caracteres.' })
  warehouseDescription!: string;

  @ApiPropertyOptional({ default: true, example: true })
  @IsOptional()
  @IsBoolean()
  warehouseActive?: boolean;
}
