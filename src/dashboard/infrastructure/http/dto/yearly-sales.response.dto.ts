import { ApiProperty } from '@nestjs/swagger';
import { YearlyAmount } from '../../../domain/dashboard.repository';

export class YearlySalesPointDto {
  @ApiProperty({
    type: 'integer',
    example: 2026,
    description: 'Ano calendario.',
  })
  year!: number;

  @ApiProperty({
    example: '48250.00',
    description:
      'Suma de importes del ano. Cadena decimal; "0.00" si no hubo ventas.',
  })
  total!: string;
}

/** Serie de importes por ano para grafico lineal. */
export class YearlySalesResponseDto {
  @ApiProperty({
    type: [YearlySalesPointDto],
    description: 'Anos en orden ascendente con el total de cada uno.',
  })
  items!: YearlySalesPointDto[];

  static build(rows: YearlyAmount[]): YearlySalesResponseDto {
    const dto = new YearlySalesResponseDto();
    dto.items = rows.map((r) => {
      const p = new YearlySalesPointDto();
      p.year = r.year;
      p.total = r.total;
      return p;
    });
    return dto;
  }
}
