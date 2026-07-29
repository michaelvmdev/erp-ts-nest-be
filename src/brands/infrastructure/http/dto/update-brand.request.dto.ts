import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de PATCH /brands/{brandId}.
 *
 * Ambos campos son opcionales y se aplica solo lo que venga. Desactivar la marca
 * es enviar unicamente `{"brandActive": false}`.
 */
export class UpdateBrandRequestDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 50,
    example: 'Logitech',
    description: 'Nuevo nombre. No puede chocar con otra marca existente.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'brandDescription no puede estar vacio.' })
  @MaxLength(50, {
    message: 'brandDescription no puede superar 50 caracteres.',
  })
  brandDescription?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Enviar `false` desactiva la marca. No se borra: sus productos y el historico ' +
      'de ventas la siguen referenciando.',
  })
  @IsOptional()
  @IsBoolean()
  brandActive?: boolean;
}
