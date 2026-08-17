import { ApiProperty } from '@nestjs/swagger';
import { PurchaseReturn } from '../../../domain/purchase-return';
import type { PurchaseReturnSummary } from '../../../domain/purchase-return.repository';

export class PurchaseReturnLineResponseDto {
  @ApiProperty() item!: number;
  @ApiProperty() productId!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitCost!: number;
  @ApiProperty() partial!: number;

  static fromSnapshot(s: {
    item: number;
    productId: string;
    quantity: number;
    unitCost: { toNumber(): number };
    partial: { toNumber(): number };
  }): PurchaseReturnLineResponseDto {
    const dto = new PurchaseReturnLineResponseDto();
    dto.item = s.item;
    dto.productId = s.productId;
    dto.quantity = s.quantity;
    dto.unitCost = s.unitCost.toNumber();
    dto.partial = s.partial.toNumber();
    return dto;
  }
}

export class PurchaseReturnResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() purchaseId!: string;
  @ApiProperty() number!: string;
  @ApiProperty() date!: string;
  @ApiProperty() hour!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() subTotal!: number;
  @ApiProperty() igv!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: [PurchaseReturnLineResponseDto] }) lines!: PurchaseReturnLineResponseDto[];

  static fromDomain(pr: PurchaseReturn): PurchaseReturnResponseDto {
    const snap = pr.toSnapshot();
    const dto = new PurchaseReturnResponseDto();
    dto.id = snap.id;
    dto.purchaseId = snap.purchaseId;
    dto.number = snap.number;
    dto.date = snap.date;
    dto.hour = snap.hour;
    dto.reason = snap.reason;
    dto.subTotal = snap.subTotal.toNumber();
    dto.igv = snap.igv.toNumber();
    dto.total = snap.total.toNumber();
    dto.lines = snap.lines.map(PurchaseReturnLineResponseDto.fromSnapshot);
    return dto;
  }
}

export class PurchaseReturnSummaryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() purchaseId!: string;
  @ApiProperty() number!: string;
  @ApiProperty() date!: string;
  @ApiProperty() hour!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() subTotal!: number;
  @ApiProperty() igv!: number;
  @ApiProperty() total!: number;
  @ApiProperty() lineCount!: number;

  static fromSummary(s: PurchaseReturnSummary): PurchaseReturnSummaryResponseDto {
    const dto = new PurchaseReturnSummaryResponseDto();
    dto.id = s.id;
    dto.purchaseId = s.purchaseId;
    dto.number = s.number;
    dto.date = s.date;
    dto.hour = s.hour;
    dto.reason = s.reason;
    dto.subTotal = s.subTotal.toNumber();
    dto.igv = s.igv.toNumber();
    dto.total = s.total.toNumber();
    dto.lineCount = s.lineCount;
    return dto;
  }
}

export class PaginatedPurchaseReturnsResponseDto {
  @ApiProperty({ type: [PurchaseReturnSummaryResponseDto] }) items!: PurchaseReturnSummaryResponseDto[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
