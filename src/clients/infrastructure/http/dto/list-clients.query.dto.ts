import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Parametros de `GET /clients`.
 *
 * Viajan en la query string, igual que en marcas: son planos y de solo lectura,
 * asi que el GET queda cacheable.
 *
 * Las conversiones son explicitas porque el ValidationPipe corre con
 * `enableImplicitConversion: false`. La conversion implicita convertiria la
 * cadena "false" en `true` por no estar vacia, que es justo el error a evitar.
 */
export class ListClientsQueryDto {
  @ApiPropertyOptional({
    maxLength: 100,
    example: 'comercial',
    description:
      'Coincidencia parcial e insensible a mayusculas sobre el nombre.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientDescription?: string;

  @ApiPropertyOptional({
    example: '20100043212',
    description:
      'Busqueda por documento exacto, no parcial: identifica a un unico cliente, ' +
      'y quien lo escribe completo espera esa fila y no una lista.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{1,11}$/, { message: 'documentNumber solo admite digitos.' })
  documentNumber?: string;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    example: 2,
    description: 'Filtra por tipo de documento.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'documentTypeId debe ser un entero.' })
  @Min(1)
  documentTypeId?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Filtra por estado. Si se omite, devuelve activos e inactivos.',
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as unknown;
  })
  @IsBoolean({ message: 'clientActive debe ser "true" o "false".' })
  clientActive?: boolean;

  @ApiPropertyOptional({
    enum: ['description', 'documentNumber'],
    default: 'description',
  })
  @IsOptional()
  @IsIn(['description', 'documentNumber'])
  sortBy?: 'description' | 'documentNumber';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un entero.' })
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
    example: 20,
    description:
      'Tamano de pagina. El tope de 100 evita respuestas desmedidas.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero.' })
  @Min(1)
  @Max(100)
  limit?: number;
}
