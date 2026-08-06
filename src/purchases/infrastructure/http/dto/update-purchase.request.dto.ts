import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PurchaseLineRequestDto } from './create-purchase.request.dto';

/**
 * Cuerpo de PATCH /purchases/{purchaseId}.
 *
 * Se pueden corregir el proveedor, la fecha, la hora y las lineas. A diferencia
 * de una venta, la fecha y la hora SI son editables: una compra no es un
 * documento fiscal, asi que son datos operativos corregibles. Los importes no
 * se reciben: se recalculan a partir de las lineas.
 */
export class UpdatePurchaseRequestDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description: 'Corrige el proveedor. Debe existir y estar activo.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'supplierId debe ser un UUID valido.' })
  supplierId?: string;

  @ApiPropertyOptional({
    format: 'date',
    example: '2026-08-01',
    description: 'Corrige la fecha de la compra.',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'purchaseDate debe tener el formato YYYY-MM-DD.',
  })
  purchaseDate?: string;

  @ApiPropertyOptional({
    example: '10:30:00',
    description: 'Corrige la hora de la compra.',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, {
    message: 'purchaseHour debe tener el formato HH:MM:SS.',
  })
  purchaseHour?: string;

  @ApiPropertyOptional({
    type: [PurchaseLineRequestDto],
    minItems: 1,
    maxItems: 100,
    description:
      'Si viene, **reemplaza por completo** las lineas y recalcula subtotal, IGV y total. ' +
      'No es un parche linea por linea: los importes dependen del conjunto, y aplicar ' +
      'cambios de a uno dejaria totales incoherentes a mitad de camino.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Una compra necesita al menos una linea de detalle.',
  })
  @ArrayMaxSize(100, {
    message: 'Una compra no puede tener mas de 100 lineas.',
  })
  @ValidateNested({ each: true })
  @Type(() => PurchaseLineRequestDto)
  purchaseDetails?: PurchaseLineRequestDto[];
}
