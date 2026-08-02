import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de PATCH /products/{productId}.
 *
 * No hereda de CreateProductRequestDto con PartialType a proposito. Aunque
 * ahorraria lineas, ataria los dos contratos: cualquier campo obligatorio que
 * se agregue al alta aparecerian de rebote como opcional aqui, sin que nadie lo
 * decida. Alta y modificacion son operaciones distintas y evolucionan por
 * separado.
 *
 * Todos los campos son opcionales; se aplica solo lo que venga. Enviar `null`
 * en productDescription o productImage borra el valor, que no es lo mismo que
 * omitirlos.
 */
export class UpdateProductRequestDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description: 'Nueva marca. Debe corresponder a una marca existente.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'brandId debe ser un UUID valido.' })
  brandId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '4b53e66e-794b-4e37-b4af-4e5971858c23',
    description: 'Nueva categoria. Debe corresponder a una categoria existente.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId debe ser un UUID valido.' })
  categoryId?: string;

  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
    example: 'Logitech MX Master 3S',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'productName no puede estar vacio.' })
  @MaxLength(100, { message: 'productName no puede superar 100 caracteres.' })
  productName?: string;

  @ApiPropertyOptional({
    maxLength: 250,
    nullable: true,
    description: 'Enviar `null` o cadena vacia borra la descripcion.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250, {
    message: 'productDescription no puede superar 250 caracteres.',
  })
  productDescription?: string | null;

  @ApiPropertyOptional({
    maxLength: 500,
    nullable: true,
    description: 'Enviar `null` o cadena vacia quita la imagen.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'productImage no puede superar 500 caracteres.' })
  productImage?: string | null;

  @ApiPropertyOptional({
    type: 'number',
    format: 'double',
    minimum: 0,
    maximum: 9999999999.99,
    example: 399.9,
  })
  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    {
      message:
        'productUnitPrice debe ser un numero con dos decimales como maximo.',
    },
  )
  @Min(0, { message: 'productUnitPrice no puede ser negativo.' })
  @Max(9999999999.99, {
    message: 'productUnitPrice supera el maximo admitido.',
  })
  productUnitPrice?: number;

  @ApiPropertyOptional({
    example: false,
    description:
      'Poner en `false` es la forma recomendada de retirar un producto de la venta.',
  })
  @IsOptional()
  @IsBoolean()
  productActive?: boolean;
}
