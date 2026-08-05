import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de PATCH /suppliers/{supplierId}.
 *
 * Todos los campos son opcionales y se aplica solo lo que venga. Desactivar el
 * proveedor es enviar unicamente `{"supplierActive": false}`.
 */
export class UpdateSupplierRequestDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 150,
    example: 'Distribuidora Electronica S.A.C.',
    description: 'Nueva razon social.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'supplierDescription no puede estar vacio.' })
  @MaxLength(150, {
    message: 'supplierDescription no puede superar 150 caracteres.',
  })
  supplierDescription?: string;

  @ApiPropertyOptional({
    example: '20100070970',
    description:
      'Nuevo RUC. No puede chocar con el de otro proveedor existente.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^20[0-9]{9}$/, {
    message: 'supplierRuc debe tener 11 digitos y empezar en "20".',
  })
  supplierRuc?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Enviar `false` desactiva el proveedor. No se borra: el historico de ' +
      'compras lo sigue referenciando.',
  })
  @IsOptional()
  @IsBoolean()
  supplierActive?: boolean;
}
