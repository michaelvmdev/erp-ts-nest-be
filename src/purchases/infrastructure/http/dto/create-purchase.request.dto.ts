import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class PurchaseLineRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4', { message: 'productId debe ser un UUID valido.' })
  productId!: string;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: 9999, example: 20 })
  @IsInt({ message: 'quantity debe ser un entero.' })
  @Min(1, { message: 'quantity debe ser al menos 1.' })
  @Max(9999, { message: 'quantity no puede superar 9999.' })
  quantity!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    minimum: 0,
    maximum: 9999999999.99,
    example: 349.5,
    description:
      'Costo unitario pagado al proveedor, con dos decimales como maximo. A ' +
      'diferencia de una venta, este importe SI se envia: es el costo de compra, ' +
      'que no esta en el catalogo (products solo guarda el precio de venta).',
  })
  @IsNumber(
    { maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false },
    { message: 'unitPrice debe ser un numero con dos decimales como maximo.' },
  )
  @Min(0, { message: 'unitPrice no puede ser negativo.' })
  @Max(9999999999.99, { message: 'unitPrice supera el maximo admitido.' })
  unitPrice!: number;
}

/**
 * Cuerpo de POST /purchases.
 *
 * Cada linea trae su `unitPrice` (el costo), pero NO se aceptan `partial`,
 * `subTotal`, `igv` ni `total`: esos los calcula el backend. El `ValidationPipe`
 * corre con `forbidNonWhitelisted`, asi que enviarlos devuelve 400.
 */
export class CreatePurchaseRequestDto {
  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description: 'Proveedor al que se le compra. Debe existir y estar activo.',
  })
  @IsUUID('4', { message: 'supplierId debe ser un UUID valido.' })
  supplierId!: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-08-01',
    description: 'Si se omite, se usa la fecha del momento del registro.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'purchaseDate debe tener el formato YYYY-MM-DD.',
  })
  purchaseDate?: string;

  @ApiPropertyOptional({
    example: '10:30:00',
    description: 'Si se omite, se usa la hora del momento del registro.',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, {
    message: 'purchaseHour debe tener el formato HH:MM:SS.',
  })
  purchaseHour?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Almacen de entrada. Si se provee, se generan movimientos de stock (purchase_in) ' +
      'por cada linea de la compra.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'warehouseId debe ser un UUID valido.' })
  warehouseId?: string;

  @ApiProperty({
    type: [PurchaseLineRequestDto],
    minItems: 1,
    maxItems: 100,
    description:
      'Al menos una linea. Un mismo producto no puede repetirse: hay que sumar las cantidades.',
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Una compra necesita al menos una linea de detalle.',
  })
  @ArrayMaxSize(100, {
    message: 'Una compra no puede tener mas de 100 lineas.',
  })
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineRequestDto)
  purchaseDetails!: PurchaseLineRequestDto[];
}
