import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

/**
 * Parametros de `GET /dashboard/monthly-sales-by-category`.
 */
export class MonthlySalesByCategoryQueryDto {
  @ApiProperty({
    type: 'integer',
    minimum: 2000,
    maximum: 2100,
    example: 2026,
    description: 'Ano de los datos, en cuatro digitos.',
  })
  @Type(() => Number)
  @IsInt({ message: 'year debe ser un entero.' })
  @Min(2000, { message: 'year no puede ser menor que 2000.' })
  @Max(2100, { message: 'year no puede ser mayor que 2100.' })
  year!: number;

  @ApiProperty({
    format: 'uuid',
    example: '4b53e66e-794b-4e37-b4af-4e5971858c23',
    description: 'Categoria de la que se agregan las ventas.',
  })
  @IsUUID('4', { message: 'categoryId debe ser un UUID valido.' })
  categoryId!: string;
}
