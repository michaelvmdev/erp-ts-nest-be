import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Warehouse } from '../../../domain/warehouse';

export class WarehouseResponseDto {
  @ApiProperty({ format: 'uuid', example: 'b2000000-0000-4000-8000-000000000001' })
  warehouseId!: string;

  @ApiProperty({ maxLength: 20, example: 'ALM-001', description: 'Codigo del almacen (mayusculas).' })
  warehouseCode!: string;

  @ApiProperty({ maxLength: 200, example: 'Almacen Principal Lima' })
  warehouseDescription!: string;

  @ApiProperty({ example: true })
  warehouseActive!: boolean;

  static fromDomain(warehouse: Warehouse): WarehouseResponseDto {
    const s = warehouse.toSnapshot();
    const dto = new WarehouseResponseDto();
    dto.warehouseId = s.id;
    dto.warehouseCode = s.code;
    dto.warehouseDescription = s.description;
    dto.warehouseActive = s.active;
    return dto;
  }
}

export class PaginatedWarehousesResponseDto {
  @ApiProperty({ type: [WarehouseResponseDto] })
  items!: WarehouseResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
