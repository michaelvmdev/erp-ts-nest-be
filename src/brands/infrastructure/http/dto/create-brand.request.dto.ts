import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateBrandRequestDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 50,
    example: 'Logitech',
    description:
      'Nombre de la marca. Se recortan los espacios de los extremos. ' +
      'No puede repetir una marca existente ignorando mayusculas.',
  })
  @IsString()
  @MinLength(1, { message: 'brandDescription no puede estar vacio.' })
  @MaxLength(50, {
    message: 'brandDescription no puede superar 50 caracteres.',
  })
  brandDescription!: string;

  @ApiPropertyOptional({
    default: true,
    example: true,
    description: 'Si se omite, la marca se crea activa.',
  })
  @IsOptional()
  @IsBoolean()
  brandActive?: boolean;
}
