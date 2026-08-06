import { ApiProperty } from '@nestjs/swagger';
import { MonthlyAmount } from '../../../domain/dashboard.repository';

export class MonthlyPurchasesPointDto {
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
      'Suma de importes del mes. Cadena decimal; "0.00" si no hubo compras.',
  })
  total!: string;
}

/**
 * Serie anual de importes de compra por mes. Reutilizada por los dos diagramas
 * de compras basados en montos: compras mensuales y por categoria.
 */
export class MonthlyPurchasesResponseDto {
  @ApiProperty({
    type: 'integer',
    example: 2026,
    description: 'Ano de la serie.',
  })
  year!: number;

  @ApiProperty({
    type: [MonthlyPurchasesPointDto],
    description: 'Siempre los 12 meses, en orden; los vacios van con "0.00".',
  })
  items!: MonthlyPurchasesPointDto[];

  static build(
    year: number,
    rows: MonthlyAmount[],
  ): MonthlyPurchasesResponseDto {
    const dto = new MonthlyPurchasesResponseDto();
    dto.year = year;
    dto.items = rows.map((r) => {
      const p = new MonthlyPurchasesPointDto();
      p.month = r.month;
      p.total = r.total;
      return p;
    });
    return dto;
  }
}
