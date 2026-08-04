import { ApiProperty } from '@nestjs/swagger';
import { District } from '../../../domain/district';

export class DistrictResponseDto {
  @ApiProperty({
    example: '150101',
    minLength: 6,
    maxLength: 6,
    description: 'Codigo INEI del distrito: seis digitos. Es el valor que se envia al registrar una venta.',
  })
  districtId!: string;

  @ApiProperty({
    example: '1501',
    minLength: 4,
    maxLength: 4,
    description: 'Codigo de la provincia a la que pertenece.',
  })
  provinceId!: string;

  @ApiProperty({ maxLength: 100, example: 'Lima' })
  districtDescription!: string;

  static fromDomain(district: District): DistrictResponseDto {
    const s = district.toSnapshot();
    const dto = new DistrictResponseDto();
    dto.districtId = s.id;
    dto.provinceId = s.provinceId;
    dto.districtDescription = s.description;
    return dto;
  }
}
