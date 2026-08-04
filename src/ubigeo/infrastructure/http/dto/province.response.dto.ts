import { ApiProperty } from '@nestjs/swagger';
import { Province } from '../../../domain/province';

export class ProvinceResponseDto {
  @ApiProperty({
    example: '1501',
    minLength: 4,
    maxLength: 4,
    description: 'Codigo INEI de la provincia: cuatro digitos. Empieza con el del departamento.',
  })
  provinceId!: string;

  @ApiProperty({
    example: '15',
    minLength: 2,
    maxLength: 2,
    description: 'Codigo del departamento al que pertenece.',
  })
  departmentId!: string;

  @ApiProperty({ maxLength: 100, example: 'Lima' })
  provinceDescription!: string;

  static fromDomain(province: Province): ProvinceResponseDto {
    const s = province.toSnapshot();
    const dto = new ProvinceResponseDto();
    dto.provinceId = s.id;
    dto.departmentId = s.departmentId;
    dto.provinceDescription = s.description;
    return dto;
  }
}
