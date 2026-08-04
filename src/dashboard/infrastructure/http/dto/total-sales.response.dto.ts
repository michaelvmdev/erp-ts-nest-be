import { ApiProperty } from '@nestjs/swagger';
import { TotalSales } from '../../../domain/dashboard.repository';

export class TotalSalesResponseDto {
  @ApiProperty({
    example: '2026-07',
    description: 'Mes al que corresponden las cifras, en formato YYYY-MM.',
  })
  period!: string;

  @ApiProperty({
    example: '48250.00',
    description: 'Suma de los totales de las ventas del mes. Cadena decimal.',
  })
  amount!: string;

  @ApiProperty({
    type: 'integer',
    example: 37,
    description: 'Cantidad de comprobantes emitidos en el mes.',
  })
  count!: number;

  static fromReadModel(m: TotalSales): TotalSalesResponseDto {
    const dto = new TotalSalesResponseDto();
    dto.period = m.period;
    dto.amount = m.amount;
    dto.count = m.count;
    return dto;
  }
}
