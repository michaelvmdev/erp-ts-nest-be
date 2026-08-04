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
import { SaleLineRequestDto } from './create-sale.request.dto';

/**
 * Cuerpo de PATCH /sales/{saleId}.
 *
 * Lo que se puede corregir es acotado a proposito. No estan `saleNumber`,
 * `saleDate` ni `saleHour`: identifican el documento fiscal y el momento de su
 * emision, y cambiarlos no seria corregir una venta sino inventar otra. Tampoco
 * los importes, que se recalculan a partir de las lineas.
 */
export class UpdateSaleRequestDto {
  @ApiPropertyOptional({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
    description: 'Corrige el cliente. Debe estar activo.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'clientId debe ser un UUID valido.' })
  clientId?: string;

  @ApiPropertyOptional({
    example: '150131',
    description:
      'Corrige el distrito. La provincia y el departamento se recalculan solos.',
  })
  @IsOptional()
  @Matches(/^[0-9]{6}$/, { message: 'districtId debe tener 6 digitos.' })
  districtId?: string;

  @ApiPropertyOptional({
    type: [SaleLineRequestDto],
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
    message: 'Una venta necesita al menos una linea de detalle.',
  })
  @ArrayMaxSize(100, { message: 'Una venta no puede tener mas de 100 lineas.' })
  @ValidateNested({ each: true })
  @Type(() => SaleLineRequestDto)
  saleDetails?: SaleLineRequestDto[];
}
