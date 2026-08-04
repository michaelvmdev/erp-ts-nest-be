import { ApiProperty } from '@nestjs/swagger';
import { TopClient } from '../../../domain/dashboard.repository';

export class TopClientResponseDto {
  @ApiProperty({ example: '2026-07', description: 'Mes de la métrica (YYYY-MM).' })
  period!: string;

  @ApiProperty({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
  })
  clientId!: string;

  @ApiProperty({ example: 'Comercial San Miguel S.A.C.' })
  clientDescription!: string;

  @ApiProperty({
    example: '12300.00',
    description: 'Monto total comprado en el mes por ese cliente.',
  })
  totalAmount!: string;

  static fromReadModel(m: TopClient): TopClientResponseDto {
    const dto = new TopClientResponseDto();
    dto.period = m.period;
    dto.clientId = m.clientId;
    dto.clientDescription = m.clientDescription;
    dto.totalAmount = m.totalAmount;
    return dto;
  }
}
