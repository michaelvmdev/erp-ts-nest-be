import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { StockLevel } from '../../../domain/stock-level';

export class StockLevelResponseDto {
  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({ example: 'Cable HDMI 2m' })
  productName!: string;

  @ApiProperty({ format: 'uuid' })
  warehouseId!: string;

  @ApiProperty({ example: 'ALM-001' })
  warehouseCode!: string;

  @ApiProperty({ example: 'Almacen Principal Lima' })
  warehouseDescription!: string;

  @ApiProperty({ example: 42.5, description: 'Cantidad disponible (puede ser decimal para kg, mt, etc.).' })
  quantity!: number;

  static fromDomain(level: StockLevel): StockLevelResponseDto {
    const dto = new StockLevelResponseDto();
    dto.productId = level.productId;
    dto.productName = level.productName;
    dto.warehouseId = level.warehouseId;
    dto.warehouseCode = level.warehouseCode;
    dto.warehouseDescription = level.warehouseDescription;
    dto.quantity = level.quantity;
    return dto;
  }
}

export class PaginatedStockLevelsResponseDto {
  @ApiProperty({ type: [StockLevelResponseDto] })
  items!: StockLevelResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
