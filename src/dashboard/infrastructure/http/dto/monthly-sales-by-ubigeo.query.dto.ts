import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

/**
 * Parametros de `GET /dashboard/monthly-sales-by-ubigeo`.
 *
 * `departmentId` es obligatorio; `provinceId` y `districtId` permiten afinar el
 * filtro (departamento -> provincia -> distrito). Los codigos son los del INEI:
 * 2, 4 y 6 digitos respectivamente, y se validan por patron.
 */
export class MonthlySalesByUbigeoQueryDto {
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
    example: '15',
    description: 'Codigo de departamento (2 digitos).',
  })
  @Matches(/^[0-9]{2}$/, {
    message: 'departmentId debe tener 2 digitos.',
  })
  departmentId!: string;

  @ApiPropertyOptional({
    example: '1501',
    description:
      'Codigo de provincia (4 digitos). Debe empezar con el departamento.',
  })
  @IsOptional()
  @Matches(/^[0-9]{4}$/, {
    message: 'provinceId debe tener 4 digitos.',
  })
  provinceId?: string;

  @ApiPropertyOptional({
    example: '150101',
    description:
      'Codigo de distrito (6 digitos). Debe empezar con la provincia.',
  })
  @IsOptional()
  @Matches(/^[0-9]{6}$/, {
    message: 'districtId debe tener 6 digitos.',
  })
  districtId?: string;
}
