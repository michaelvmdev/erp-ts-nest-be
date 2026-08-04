import { ApiProperty } from '@nestjs/swagger';
import { TopProduct } from '../../../domain/dashboard.repository';

export class TopProductResponseDto {
  @ApiProperty({ example: '2026-07', description: 'Mes de la métrica (YYYY-MM).' })
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
    description: 'Unidades vendidas en el mes, sumando todas las ventas.',
  })
  unitsSold!: number;

  static fromReadModel(m: TopProduct): TopProductResponseDto {
    const dto = new TopProductResponseDto();
    dto.period = m.period;
    dto.productId = m.productId;
    dto.productName = m.productName;
    dto.unitsSold = m.unitsSold;
    return dto;
  }
}
