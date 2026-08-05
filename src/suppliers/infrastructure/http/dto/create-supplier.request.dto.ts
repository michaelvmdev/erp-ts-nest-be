import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateSupplierRequestDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 150,
    example: 'Distribuidora Electronica S.A.C.',
    description:
      'Razon social del proveedor. Se recortan los espacios de los extremos.',
  })
  @IsString()
  @MinLength(1, { message: 'supplierDescription no puede estar vacio.' })
  @MaxLength(150, {
    message: 'supplierDescription no puede superar 150 caracteres.',
  })
  supplierDescription!: string;

  @ApiProperty({
    example: '20100070970',
    description:
      'RUC de la empresa: 11 digitos, empieza en "20" y su digito verificador ' +
      'debe corresponder (algoritmo modulo 11 de SUNAT). No puede repetir el ' +
      'de un proveedor existente.',
  })
  @IsString()
  @Matches(/^20[0-9]{9}$/, {
    message: 'supplierRuc debe tener 11 digitos y empezar en "20".',
  })
  supplierRuc!: string;

  @ApiPropertyOptional({
    default: true,
    example: true,
    description: 'Si se omite, el proveedor se crea activo.',
  })
  @IsOptional()
  @IsBoolean()
  supplierActive?: boolean;
}
