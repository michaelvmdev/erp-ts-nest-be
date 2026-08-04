import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class PriceRangeDto {
  @ApiPropertyOptional({
    type: 'number',
    format: 'double',
    minimum: 0,
    example: 100,
    description: 'Precio minimo, inclusive.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  min?: number;

  @ApiPropertyOptional({
    type: 'number',
    format: 'double',
    minimum: 0,
    example: 1000,
    description: 'Precio maximo, inclusive.',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  max?: number;
}

/**
 * Cuerpo de POST /products/query.
 *
 * Va en el cuerpo y no en la query string porque el filtro es un objeto anidado
 * (`productUnitPrice.min` / `.max`) y crecera. Serializar estructuras en la URL
 * obliga a inventar una convencion de codificacion, choca con el limite
 * practico de longitud y termina siendo mas fragil que un JSON.
 */
export class QueryProductsRequestDto {
  @ApiPropertyOptional({
    maxLength: 250,
    example: 'acer',
    description:
      'Coincidencia parcial e insensible a mayusculas sobre el nombre o la ' +
      'descripcion del producto (equivale a `ILIKE %texto%`).',
  })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  productDescription?: string;

  @ApiPropertyOptional({
    type: PriceRangeDto,
    description:
      'Rango de precio. Se puede enviar solo `min`, solo `max` o ambos. ' +
      'Si `min` supera a `max` la peticion se rechaza con 400.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeDto)
  productUnitPrice?: PriceRangeDto;

  @ApiPropertyOptional({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description: 'Filtra por marca exacta.',
  })
  @IsOptional()
  @IsUUID('4', { message: 'brandId debe ser un UUID valido.' })
  brandId?: string;

  @ApiPropertyOptional({
    example: true,
    description:
      'Filtra por estado. Si se omite, devuelve activos e inactivos.',
  })
  @IsOptional()
  @IsBoolean()
  productActive?: boolean;

  @ApiPropertyOptional({
    enum: ['name', 'unitPrice'],
    default: 'name',
    description: 'Campo de ordenamiento.',
  })
  @IsOptional()
  @IsIn(['name', 'unitPrice'])
  sortBy?: 'name' | 'unitPrice';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @IsInt()
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
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
