import { ApiProperty } from '@nestjs/swagger';
import { MonthlyAmount } from '../../../domain/dashboard.repository';

export class MonthlySalesPointDto {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 12,
    example: 7,
    description: 'Mes, del 1 (enero) al 12 (diciembre).',
  })
  month!: number;

  @ApiProperty({
    example: '48250.00',
    description:
      'Suma de importes del mes. Cadena decimal; "0.00" si no hubo ventas.',
  })
  total!: string;
}

/**
 * Serie anual de importes por mes. Reutilizada por los tres diagramas basados en
 * montos: ventas mensuales, por ubigeo y por categoria.
 */
export class MonthlySalesResponseDto {
  @ApiProperty({
    type: 'integer',
    example: 2026,
    description: 'Ano de la serie.',
  })
  year!: number;

  @ApiProperty({
    type: [MonthlySalesPointDto],
    description: 'Siempre los 12 meses, en orden; los vacios van con "0.00".',
  })
  items!: MonthlySalesPointDto[];

  static build(year: number, rows: MonthlyAmount[]): MonthlySalesResponseDto {
    const dto = new MonthlySalesResponseDto();
    dto.year = year;
    dto.items = rows.map((r) => {
      const p = new MonthlySalesPointDto();
      p.month = r.month;
      p.total = r.total;
      return p;
    });
    return dto;
  }
}
