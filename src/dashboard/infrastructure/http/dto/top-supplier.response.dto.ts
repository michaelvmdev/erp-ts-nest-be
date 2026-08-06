import { ApiProperty } from '@nestjs/swagger';
import { TopSupplier } from '../../../domain/dashboard.repository';

export class TopSupplierResponseDto {
  @ApiProperty({
    example: '2026-07',
    description: 'Mes de la métrica (YYYY-MM).',
  })
  period!: string;

  @ApiProperty({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
  })
  supplierId!: string;

  @ApiProperty({ example: 'Distribuidora Tecnológica del Norte S.A.C.' })
  supplierDescription!: string;

  @ApiProperty({
    example: '12300.00',
    description: 'Monto total comprado en el mes a ese proveedor.',
  })
  totalAmount!: string;

  static fromReadModel(m: TopSupplier): TopSupplierResponseDto {
    const dto = new TopSupplierResponseDto();
    dto.period = m.period;
    dto.supplierId = m.supplierId;
    dto.supplierDescription = m.supplierDescription;
    dto.totalAmount = m.totalAmount;
    return dto;
  }
}
