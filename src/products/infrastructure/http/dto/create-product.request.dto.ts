import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
 * Cuerpo de POST /products.
 *
 * Las restricciones replican las de db/db.sql y las de los value objects. La
 * duplicacion es intencional: aqui sirven para devolver un 400 que enumera
 * todos los campos malos de una vez, mientras que el dominio protege la
 * invariante aunque la llamada no venga por HTTP.
 */
export class CreateProductRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description: 'Marca del producto. Debe corresponder a una marca existente.',
  })
  @IsUUID('4', { message: 'brandId debe ser un UUID valido.' })
  brandId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '4b53e66e-794b-4e37-b4af-4e5971858c23',
    description:
      'Categoria del producto. Debe corresponder a una categoria existente.',
  })
  @IsUUID('4', { message: 'categoryId debe ser un UUID valido.' })
  categoryId!: string;

  @ApiProperty({
    minLength: 1,
    maxLength: 100,
    example: 'Logitech MX Master 3S',
    description: 'Nombre comercial. Se recortan los espacios de los extremos.',
  })
  @IsString()
  @MinLength(1, { message: 'productName no puede estar vacio.' })
  @MaxLength(100, { message: 'productName no puede superar 100 caracteres.' })
  productName!: string;

  @ApiPropertyOptional({
    maxLength: 250,
    nullable: true,
    example: 'Mouse inalambrico ergonomico con sensor de 8000 DPI.',
    description: 'Descripcion larga. Una cadena vacia se guarda como `null`.',
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
    example: 'https://cdn.ejemplo.com/productos/mx-master-3s.webp',
    description:
      'URL http/https o ruta absoluta que empiece con `/`. Una cadena vacia se guarda como `null`.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'productImage no puede superar 500 caracteres.' })
  productImage?: string | null;

  @ApiProperty({
    type: 'number',
    format: 'double',
    minimum: 0,
    maximum: 9999999999.99,
    example: 449.0,
    description: 'Precio unitario en soles. Dos decimales como maximo.',
  })
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
  productUnitPrice!: number;

  @ApiPropertyOptional({
    default: true,
    example: true,
    description: 'Si se omite, el producto se crea activo.',
  })
  @IsOptional()
  @IsBoolean()
  productActive?: boolean;
}
