import { ApiProperty } from '@nestjs/swagger';
import { MonthlyTopProduct } from '../../../domain/dashboard.repository';

export class MonthlyTopProductPointDto {
  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: 12,
    example: 7,
    description: 'Mes, del 1 (enero) al 12 (diciembre).',
  })
  month!: number;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: '`null` si el mes no tuvo ventas.',
  })
  productId!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'Logitech MX Master 3S',
    description: 'Nombre del producto lider. `null` si el mes no tuvo ventas.',
  })
  productName!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'Mouse inalambrico ergonomico con sensor de 8000 DPI.',
    description:
      'Descripcion del producto lider. `null` si el mes no tuvo ventas o si el ' +
      'producto no tiene descripcion.',
  })
  productDescription!: string | null;

  @ApiProperty({
    type: 'integer',
    example: 120,
    description: 'Unidades vendidas del producto lider; 0 si el mes no tuvo ventas.',
  })
  unitsSold!: number;
}

/** Serie anual: el producto mas vendido de cada mes. */
export class TopProductByMonthResponseDto {
  @ApiProperty({
    type: 'integer',
    example: 2026,
    description: 'Ano de la serie.',
  })
  year!: number;

  @ApiProperty({
    type: [MonthlyTopProductPointDto],
    description: 'Siempre los 12 meses, en orden; los vacios van con producto null.',
  })
  items!: MonthlyTopProductPointDto[];

  static build(
    year: number,
    rows: MonthlyTopProduct[],
  ): TopProductByMonthResponseDto {
    const dto = new TopProductByMonthResponseDto();
    dto.year = year;
    dto.items = rows.map((r) => {
      const p = new MonthlyTopProductPointDto();
      p.month = r.month;
      p.productId = r.productId;
      p.productName = r.productName;
      p.productDescription = r.productDescription;
      p.unitsSold = r.unitsSold;
      return p;
    });
    return dto;
  }
}
