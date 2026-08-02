import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateCategoryRequestDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 100,
    example: 'Perifericos',
    description:
      'Nombre de la categoria. Se recortan los espacios de los extremos. ' +
      'No puede repetir una categoria existente ignorando mayusculas.',
  })
  @IsString()
  @MinLength(1, { message: 'categoryDescription no puede estar vacio.' })
  @MaxLength(100, {
    message: 'categoryDescription no puede superar 100 caracteres.',
  })
  categoryDescription!: string;

  @ApiPropertyOptional({
    default: true,
    example: true,
    description: 'Si se omite, la categoria se crea activa.',
  })
  @IsOptional()
  @IsBoolean()
  categoryActive?: boolean;
}
