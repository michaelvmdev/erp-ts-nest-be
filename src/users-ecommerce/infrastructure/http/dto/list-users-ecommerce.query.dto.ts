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

export class ListUsersEcommerceQueryDto {
  @ApiPropertyOptional({ maxLength: 200, example: 'carlos', description: 'Busqueda parcial sobre email.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'Carlos', description: 'Busqueda parcial sobre nombre.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ maxLength: 100, example: 'Garcia', description: 'Busqueda parcial sobre apellido.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ example: true, description: 'Filtra por estado. Si se omite, devuelve todos.' })
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value as unknown;
  })
  @IsBoolean({ message: 'active debe ser "true" o "false".' })
  active?: boolean;

  @ApiPropertyOptional({ enum: ['email', 'firstName', 'lastName', 'createdAt'], default: 'lastName' })
  @IsOptional()
  @IsIn(['email', 'firstName', 'lastName', 'createdAt'])
  sortBy?: 'email' | 'firstName' | 'lastName' | 'createdAt';

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'], default: 'ASC' })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortDirection?: 'ASC' | 'DESC';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
