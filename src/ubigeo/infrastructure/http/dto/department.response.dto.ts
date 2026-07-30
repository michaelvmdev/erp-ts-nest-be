import { ApiProperty } from '@nestjs/swagger';
import { Department } from '../../../domain/department';

export class DepartmentResponseDto {
  @ApiProperty({
    example: '15',
    minLength: 2,
    maxLength: 2,
    description: 'Codigo INEI del departamento: dos digitos, con ceros a la izquierda.',
  })
  departmentId!: string;

  @ApiProperty({ maxLength: 100, example: 'Lima' })
  departmentDescription!: string;

  static fromDomain(department: Department): DepartmentResponseDto {
    const s = department.toSnapshot();
    const dto = new DepartmentResponseDto();
    dto.departmentId = s.id;
    dto.departmentDescription = s.description;
    return dto;
  }
}
