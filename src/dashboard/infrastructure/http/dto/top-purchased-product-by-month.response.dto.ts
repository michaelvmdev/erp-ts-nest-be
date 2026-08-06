import { ApiProperty } from '@nestjs/swagger';
import { MonthlyTopPurchasedProduct } from '../../../domain/dashboard.repository';

export class MonthlyTopPurchasedProductPointDto {
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
    description: '`null` si el mes no tuvo compras.',
  })
  productId!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'Logitech MX Master 3S',
    description: 'Nombre del producto lider. `null` si el mes no tuvo compras.',
  })
  productName!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'Mouse inalambrico ergonomico con sensor de 8000 DPI.',
    description:
      'Descripcion del producto lider. `null` si el mes no tuvo compras o si el ' +
      'producto no tiene descripcion.',
  })
  productDescription!: string | null;

  @ApiProperty({
    type: 'integer',
    example: 120,
    description:
      'Unidades compradas del producto lider; 0 si el mes no tuvo compras.',
  })
  unitsPurchased!: number;
}

/** Serie anual: el producto mas comprado de cada mes. */
export class TopPurchasedProductByMonthResponseDto {
  @ApiProperty({
    type: 'integer',
    example: 2026,
    description: 'Ano de la serie.',
  })
  year!: number;

  @ApiProperty({
    type: [MonthlyTopPurchasedProductPointDto],
    description:
      'Siempre los 12 meses, en orden; los vacios van con producto null.',
  })
  items!: MonthlyTopPurchasedProductPointDto[];

  static build(
    year: number,
    rows: MonthlyTopPurchasedProduct[],
  ): TopPurchasedProductByMonthResponseDto {
    const dto = new TopPurchasedProductByMonthResponseDto();
    dto.year = year;
    dto.items = rows.map((r) => {
      const p = new MonthlyTopPurchasedProductPointDto();
      p.month = r.month;
      p.productId = r.productId;
      p.productName = r.productName;
      p.productDescription = r.productDescription;
      p.unitsPurchased = r.unitsPurchased;
      return p;
    });
    return dto;
  }
}
