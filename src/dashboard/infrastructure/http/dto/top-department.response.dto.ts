import { ApiProperty } from '@nestjs/swagger';
import { TopDepartment } from '../../../domain/dashboard.repository';

export class TopDepartmentResponseDto {
  @ApiProperty({ example: '2026-07', description: 'Mes de la métrica (YYYY-MM).' })
  period!: string;

  @ApiProperty({
    example: '15',
    minLength: 2,
    maxLength: 2,
    description: 'Código INEI del departamento.',
  })
  departmentId!: string;

  @ApiProperty({ example: 'Lima' })
  departmentDescription!: string;

  @ApiProperty({
    example: '18300.00',
    description: 'Monto total comprado en el mes por ese departamento.',
  })
  totalAmount!: string;

  static fromReadModel(m: TopDepartment): TopDepartmentResponseDto {
    const dto = new TopDepartmentResponseDto();
    dto.period = m.period;
    dto.departmentId = m.departmentId;
    dto.departmentDescription = m.departmentDescription;
    dto.totalAmount = m.totalAmount;
    return dto;
  }
}
