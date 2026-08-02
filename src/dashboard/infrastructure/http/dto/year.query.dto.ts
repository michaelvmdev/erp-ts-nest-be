import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

/**
 * Parametro comun de los diagramas anuales: el ano.
 *
 * La conversion es explicita porque el ValidationPipe corre con
 * `enableImplicitConversion: false`: de la URL el ano llega como texto y hay que
 * decir que se interprete como numero.
 */
export class YearQueryDto {
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
}
