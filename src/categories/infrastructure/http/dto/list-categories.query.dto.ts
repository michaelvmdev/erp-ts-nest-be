import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Parametros de `GET /categories`.
 *
 * Igual que en marcas, viajan en la query string: son planos, pocos y de solo
 * lectura, asi que un GET cacheable es lo natural.
 *
 * Las conversiones son explicitas porque el ValidationPipe corre con
 * `enableImplicitConversion: false`: de la URL todo llega como texto y hay que
 * decir como interpretarlo. La conversion implicita convertiria "false" a `true`
 * por ser una cadena no vacia, que es justo el error que se quiere evitar.
 */
export class ListCategoriesQueryDto {
  @ApiPropertyOptional({
    maxLength: 100,
    example: 'audio',
    description:
      'Coincidencia parcial e insensible a mayusculas sobre el nombre.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  categoryDescription?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Filtra por estado. Si se omite, devuelve activas e inactivas.',
  })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    // Cualquier otra cosa se devuelve sin tocar para que @IsBoolean la rechace
    // con un 400 que nombra el campo, en vez de convertirla en silencio.
    return value as unknown;
  })
  @IsBoolean({ message: 'categoryActive debe ser "true" o "false".' })
  categoryActive?: boolean;

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
    default: 50,
    example: 50,
    description:
      'Tamano de pagina. El valor por defecto es 50 porque las categorias suelen ' +
      'pedirse completas para poblar un desplegable.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un entero.' })
  @Min(1)
  @Max(100)
  limit?: number;
}
