import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de PATCH /categories/{categoryId}.
 *
 * Ambos campos son opcionales y se aplica solo lo que venga. Desactivar la
 * categoria es enviar unicamente `{"categoryActive": false}`.
 */
export class UpdateCategoryRequestDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
    example: 'Perifericos',
    description: 'Nuevo nombre. No puede chocar con otra categoria existente.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'categoryDescription no puede estar vacio.' })
  @MaxLength(100, {
    message: 'categoryDescription no puede superar 100 caracteres.',
  })
  categoryDescription?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Enviar `false` desactiva la categoria. Se conserva junto con sus productos; ' +
      'simplemente deja de ofrecerse para asignaciones nuevas.',
  })
  @IsOptional()
  @IsBoolean()
  categoryActive?: boolean;
}
