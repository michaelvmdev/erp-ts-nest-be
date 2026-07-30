import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateClientRequestDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 100,
    example: 'Comercial San Martin S.A.C.',
    description:
      'Razon social o nombre completo. Se recortan los espacios de los extremos.',
  })
  @IsString()
  @MinLength(1, { message: 'clientDescription no puede estar vacio.' })
  @MaxLength(100, {
    message: 'clientDescription no puede superar 100 caracteres.',
  })
  clientDescription!: string;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    example: 2,
    description:
      'Tipo de documento. Los valores validos se consultan en `GET /document-types`.',
  })
  @IsInt({ message: 'documentTypeId debe ser un entero.' })
  @Min(1)
  documentTypeId!: number;

  @ApiProperty({
    example: '20100043212',
    description:
      'Numero de documento, solo digitos. Debe corresponder al tipo enviado: ' +
      '8 digitos para DNI; 11 para RUC, empezando en 10 (persona natural) o 20 (persona juridica).',
  })
  @IsString()
  @Matches(/^[0-9]{8}$|^[0-9]{11}$/, {
    message:
      'documentNumber debe tener 8 u 11 digitos, sin letras ni separadores.',
  })
  documentNumber!: string;

  @ApiPropertyOptional({
    default: true,
    example: true,
    description: 'Si se omite, el cliente se crea activo.',
  })
  @IsOptional()
  @IsBoolean()
  clientActive?: boolean;
}
