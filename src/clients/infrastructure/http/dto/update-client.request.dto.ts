import { ApiPropertyOptional } from '@nestjs/swagger';
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

/**
 * Cuerpo de PATCH /clients/{clientId}.
 *
 * Todos los campos son opcionales y se aplica solo lo que venga. Activar o
 * desactivar es enviar unicamente `{"clientActive": false}`.
 */
export class UpdateClientRequestDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 100,
    example: 'Comercial San Martin S.A.C.',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'clientDescription no puede estar vacio.' })
  @MaxLength(100, {
    message: 'clientDescription no puede superar 100 caracteres.',
  })
  clientDescription?: string;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    example: 2,
    description:
      'Cambiar de tipo casi siempre exige enviar tambien `documentNumber`: el numero ' +
      'actual difícilmente cumpla el formato del tipo nuevo.',
  })
  @IsOptional()
  @IsInt({ message: 'documentTypeId debe ser un entero.' })
  @Min(1)
  documentTypeId?: number;

  @ApiPropertyOptional({
    example: '20100043212',
    description:
      'Numero de documento, solo digitos. Debe corresponder al tipo vigente o al nuevo.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{8}$|^[0-9]{11}$/, {
    message:
      'documentNumber debe tener 8 u 11 digitos, sin letras ni separadores.',
  })
  documentNumber?: string;

  @ApiPropertyOptional({
    example: false,
    description:
      'Enviar `false` desactiva el cliente y `true` lo reactiva. No se borra: sus ventas ' +
      'lo siguen referenciando.',
  })
  @IsOptional()
  @IsBoolean()
  clientActive?: boolean;
}
