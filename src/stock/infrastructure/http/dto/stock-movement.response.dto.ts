import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { StockMovement } from '../../../domain/stock-movement';

export class StockMovementResponseDto {
  @ApiProperty({ format: 'uuid' })
  movementId!: string;

  @ApiProperty({ format: 'uuid' })
  productId!: string;

  @ApiProperty({ example: 'PROD-001' })
  productCode!: string;

  @ApiProperty({ example: 'Cable HDMI 2m' })
  productName!: string;

  @ApiProperty({ format: 'uuid' })
  warehouseId!: string;

  @ApiProperty({ example: 'ALM-001' })
  warehouseCode!: string;

  @ApiProperty({ enum: ['purchase_in', 'sale_out', 'return_in', 'adjustment'] })
  movementType!: string;

  @ApiProperty({ example: 10.5 })
  quantity!: number;

  @ApiPropertyOptional({ example: 25.0, nullable: true })
  unitCost!: number | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  referenceId!: string | null;

  @ApiProperty({ example: '2026-01-15T10:30:00.000Z' })
  createdAt!: string;

  static fromDomain(m: StockMovement): StockMovementResponseDto {
    const dto = new StockMovementResponseDto();
    dto.movementId = m.movementId;
    dto.productId = m.productId;
    dto.productCode = m.productCode;
    dto.productName = m.productName;
    dto.warehouseId = m.warehouseId;
    dto.warehouseCode = m.warehouseCode;
    dto.movementType = m.movementType;
    dto.quantity = m.quantity;
    dto.unitCost = m.unitCost;
    dto.notes = m.notes;
    dto.referenceId = m.referenceId;
    dto.createdAt = m.createdAt.toISOString();
    return dto;
  }
}

export class PaginatedStockMovementsResponseDto {
  @ApiProperty({ type: [StockMovementResponseDto] })
  items!: StockMovementResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
