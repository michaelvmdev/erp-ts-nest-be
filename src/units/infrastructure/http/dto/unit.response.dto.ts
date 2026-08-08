import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Unit } from '../../../domain/unit';

export class UnitResponseDto {
  @ApiProperty({ format: 'uuid', example: 'a1000000-0000-4000-8000-000000000001' })
  unitId!: string;

  @ApiProperty({ maxLength: 10, example: 'UND', description: 'Codigo de la unidad (mayusculas).' })
  unitCode!: string;

  @ApiProperty({ maxLength: 100, example: 'Unidad', description: 'Nombre descriptivo de la unidad.' })
  unitDescription!: string;

  @ApiProperty({ example: true })
  unitActive!: boolean;

  static fromDomain(unit: Unit): UnitResponseDto {
    const s = unit.toSnapshot();
    const dto = new UnitResponseDto();
    dto.unitId = s.id;
    dto.unitCode = s.code;
    dto.unitDescription = s.description;
    dto.unitActive = s.active;
    return dto;
  }
}

export class PaginatedUnitsResponseDto {
  @ApiProperty({ type: [UnitResponseDto] })
  items!: UnitResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
