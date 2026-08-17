import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Lot } from '../../../domain/lot';
import { LotSummary } from '../../../domain/lot.repository';

export class LotDetailResponseDto {
  @ApiProperty({ format: 'uuid' })         id!: string;
  @ApiProperty()                            lotNumber!: string;
  @ApiProperty({ format: 'uuid' })         productId!: string;
  @ApiProperty({ format: 'uuid' })         warehouseId!: string;
  @ApiPropertyOptional({ nullable: true }) manufacturingDate!: string | null;
  @ApiProperty()                            expirationDate!: string;
  @ApiProperty()                            initialQuantity!: number;
  @ApiProperty()                            currentQuantity!: number;
  @ApiProperty({ enum: ['active', 'depleted', 'expired'] }) status!: string;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty()                            createdAt!: string;

  static fromDomain(lot: Lot): LotDetailResponseDto {
    const s = lot.toSnapshot();
    const dto = new LotDetailResponseDto();
    dto.id                = s.id;
    dto.lotNumber         = s.lotNumber;
    dto.productId         = s.productId;
    dto.warehouseId       = s.warehouseId;
    dto.manufacturingDate = s.manufacturingDate;
    dto.expirationDate    = s.expirationDate;
    dto.initialQuantity   = s.initialQuantity;
    dto.currentQuantity   = s.currentQuantity;
    dto.status            = s.status;
    dto.notes             = s.notes;
    dto.createdAt         = s.createdAt.toISOString();
    return dto;
  }
}

export class LotSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty()                    lotNumber!: string;
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty()                    productName!: string;
  @ApiProperty({ format: 'uuid' }) warehouseId!: string;
  @ApiProperty()                    warehouseCode!: string;
  @ApiProperty()                    expirationDate!: string;
  @ApiProperty()                    initialQuantity!: number;
  @ApiProperty()                    currentQuantity!: number;
  @ApiProperty({ enum: ['active', 'depleted', 'expired'] }) status!: string;
  @ApiProperty()                    createdAt!: string;

  static fromSummary(s: LotSummary): LotSummaryResponseDto {
    const dto = new LotSummaryResponseDto();
    dto.id              = s.id;
    dto.lotNumber       = s.lotNumber;
    dto.productId       = s.productId;
    dto.productName     = s.productName;
    dto.warehouseId     = s.warehouseId;
    dto.warehouseCode   = s.warehouseCode;
    dto.expirationDate  = s.expirationDate;
    dto.initialQuantity = s.initialQuantity;
    dto.currentQuantity = s.currentQuantity;
    dto.status          = s.status;
    dto.createdAt       = s.createdAt.toISOString();
    return dto;
  }
}

export class PaginatedLotsResponseDto {
  @ApiProperty({ type: [LotSummaryResponseDto] }) items!: LotSummaryResponseDto[];
  @ApiProperty({ type: PageMetaDto })             meta!: PageMetaDto;
}
