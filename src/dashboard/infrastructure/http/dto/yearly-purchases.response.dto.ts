import { ApiProperty } from '@nestjs/swagger';
import { YearlyAmount } from '../../../domain/dashboard.repository';

export class YearlyPurchasesPointDto {
  @ApiProperty({
    type: 'integer',
    example: 2026,
    description: 'Ano calendario.',
  })
  year!: number;

  @ApiProperty({
    example: '48250.00',
    description:
      'Suma de importes del ano. Cadena decimal; "0.00" si no hubo compras.',
  })
  total!: string;
}

/** Serie de importes de compra por ano para grafico lineal. */
export class YearlyPurchasesResponseDto {
  @ApiProperty({
    type: [YearlyPurchasesPointDto],
    description: 'Anos en orden ascendente con el total de cada uno.',
  })
  items!: YearlyPurchasesPointDto[];

  static build(rows: YearlyAmount[]): YearlyPurchasesResponseDto {
    const dto = new YearlyPurchasesResponseDto();
    dto.items = rows.map((r) => {
      const p = new YearlyPurchasesPointDto();
      p.year = r.year;
      p.total = r.total;
      return p;
    });
    return dto;
  }
}
