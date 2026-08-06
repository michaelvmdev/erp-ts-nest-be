import { ApiProperty } from '@nestjs/swagger';
import { TopPurchasedProduct } from '../../../domain/dashboard.repository';

export class TopPurchasedProductResponseDto {
  @ApiProperty({
    example: '2026-07',
    description: 'Mes de la métrica (YYYY-MM).',
  })
  period!: string;

  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  productId!: string;

  @ApiProperty({ example: 'Mouse inalámbrico Logitech M170' })
  productName!: string;

  @ApiProperty({
    type: 'integer',
    example: 120,
    description: 'Unidades compradas en el mes, sumando todas las compras.',
  })
  unitsPurchased!: number;

  static fromReadModel(m: TopPurchasedProduct): TopPurchasedProductResponseDto {
    const dto = new TopPurchasedProductResponseDto();
    dto.period = m.period;
    dto.productId = m.productId;
    dto.productName = m.productName;
    dto.unitsPurchased = m.unitsPurchased;
    return dto;
  }
}
