import { ApiProperty } from '@nestjs/swagger';
import { TotalPurchases } from '../../../domain/dashboard.repository';

export class TotalPurchasesResponseDto {
  @ApiProperty({
    example: '2026-07',
    description: 'Mes al que corresponden las cifras, en formato YYYY-MM.',
  })
  period!: string;

  @ApiProperty({
    example: '48250.00',
    description: 'Suma de los totales de las compras del mes. Cadena decimal.',
  })
  amount!: string;

  @ApiProperty({
    type: 'integer',
    example: 37,
    description: 'Cantidad de compras registradas en el mes.',
  })
  count!: number;

  static fromReadModel(m: TotalPurchases): TotalPurchasesResponseDto {
    const dto = new TotalPurchasesResponseDto();
    dto.period = m.period;
    dto.amount = m.amount;
    dto.count = m.count;
    return dto;
  }
}
