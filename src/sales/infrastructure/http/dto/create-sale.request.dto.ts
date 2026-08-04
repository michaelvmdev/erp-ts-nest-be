import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SaleLineRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'productId debe ser un UUID valido.' })
  productId!: string;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 9999, example: 2 })
  @IsInt({ message: 'quantity debe ser un entero.' })
  @Min(1, { message: 'quantity debe ser al menos 1.' })
  @Max(9999, { message: 'quantity no puede superar 9999.' })
  quantity!: number;
}

/**
 * Cuerpo de POST /sales.
 *
 * No admite importes. Ni `unitPrice`, ni `partial`, ni `subTotal`, ni `igv`, ni
 * `total`: los calcula el backend con el precio vigente del catalogo. El
 * `ValidationPipe` corre con `forbidNonWhitelisted`, asi que enviarlos devuelve
 * 400 en vez de ignorarlos en silencio.
 *
 * Tampoco admite `saleNumber`: es la identidad fiscal del documento y la asigna
 * el backend consumiendo el correlativo del tipo.
 */
export class CreateSaleRequestDto {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    example: 1,
    description:
      'Tipo de comprobante. Determina el codigo del numero y de que serie sale el ' +
      'correlativo. Los valores disponibles estan en la tabla de tipos de comprobante.',
  })
  @IsInt({ message: 'saleTypeId debe ser un entero.' })
  @Min(1)
  saleTypeId!: number;

  @ApiProperty({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
  })
  @IsUUID('4', { message: 'clientId debe ser un UUID valido.' })
  clientId!: string;

  @ApiProperty({
    example: '150131',
    description:
      'Codigo de distrito, 6 digitos. La provincia y el departamento se derivan de sus ' +
      'prefijos, asi que no se envian: eso hace imposible una combinacion incoherente.',
  })
  @Matches(/^[0-9]{6}$/, { message: 'districtId debe tener 6 digitos.' })
  districtId!: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-07-30',
    description: 'Si se omite, se usa la fecha del momento de la emision.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'saleDate debe tener el formato YYYY-MM-DD.',
  })
  saleDate?: string;

  @ApiPropertyOptional({
    example: '14:50:07',
    description: 'Si se omite, se usa la hora del momento de la emision.',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, {
    message: 'saleHour debe tener el formato HH:MM:SS.',
  })
  saleHour?: string;

  @ApiProperty({
    type: [SaleLineRequestDto],
    minItems: 1,
    maxItems: 100,
    description:
      'Al menos una linea. Un mismo producto no puede repetirse: hay que sumar las cantidades.',
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Una venta necesita al menos una linea de detalle.',
  })
  @ArrayMaxSize(100, { message: 'Una venta no puede tener mas de 100 lineas.' })
  @ValidateNested({ each: true })
  @Type(() => SaleLineRequestDto)
  saleDetails!: SaleLineRequestDto[];
}
