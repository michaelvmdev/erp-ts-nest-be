import { ApiProperty } from '@nestjs/swagger';
import { PurchaseOrder } from '../../../domain/purchase-order';
import type { PurchaseOrderStatus } from '../../../domain/purchase-order';
import type { PurchaseOrderSummary } from '../../../domain/purchase-order.repository';

export class PurchaseOrderLineResponseDto {
  @ApiProperty() item!: number;
  @ApiProperty() productId!: string;
  @ApiProperty() quantityOrdered!: number;
  @ApiProperty() quantityReceived!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() partial!: number;

  static fromSnapshot(s: { item: number; productId: string; quantityOrdered: number; quantityReceived: number; unitPrice: { toNumber(): number }; partial: { toNumber(): number } }): PurchaseOrderLineResponseDto {
    const dto = new PurchaseOrderLineResponseDto();
    dto.item = s.item;
    dto.productId = s.productId;
    dto.quantityOrdered = s.quantityOrdered;
    dto.quantityReceived = s.quantityReceived;
    dto.unitPrice = s.unitPrice.toNumber();
    dto.partial = s.partial.toNumber();
    return dto;
  }
}

export class PurchaseOrderResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() supplierId!: string;
  @ApiProperty() date!: string;
  @ApiProperty({ enum: ['pending', 'partial', 'received', 'cancelled'] }) status!: PurchaseOrderStatus;
  @ApiProperty({ nullable: true }) notes!: string | null;
  @ApiProperty() subTotal!: number;
  @ApiProperty() igv!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: [PurchaseOrderLineResponseDto] }) lines!: PurchaseOrderLineResponseDto[];

  static fromDomain(order: PurchaseOrder): PurchaseOrderResponseDto {
    const snap = order.toSnapshot();
    const dto = new PurchaseOrderResponseDto();
    dto.id = snap.id;
    dto.supplierId = snap.supplierId;
    dto.date = snap.date;
    dto.status = snap.status;
    dto.notes = snap.notes;
    dto.subTotal = snap.subTotal.toNumber();
    dto.igv = snap.igv.toNumber();
    dto.total = snap.total.toNumber();
    dto.lines = snap.lines.map(PurchaseOrderLineResponseDto.fromSnapshot);
    return dto;
  }
}

export class PurchaseOrderSummaryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() supplierId!: string;
  @ApiProperty() date!: string;
  @ApiProperty({ enum: ['pending', 'partial', 'received', 'cancelled'] }) status!: PurchaseOrderStatus;
  @ApiProperty({ nullable: true }) notes!: string | null;
  @ApiProperty() subTotal!: number;
  @ApiProperty() igv!: number;
  @ApiProperty() total!: number;
  @ApiProperty() lineCount!: number;

  static fromSummary(s: PurchaseOrderSummary): PurchaseOrderSummaryResponseDto {
    const dto = new PurchaseOrderSummaryResponseDto();
    dto.id = s.id;
    dto.supplierId = s.supplierId;
    dto.date = s.date;
    dto.status = s.status;
    dto.notes = s.notes;
    dto.subTotal = s.subTotal.toNumber();
    dto.igv = s.igv.toNumber();
    dto.total = s.total.toNumber();
    dto.lineCount = s.lineCount;
    return dto;
  }
}

export class PaginatedPurchaseOrdersResponseDto {
  @ApiProperty({ type: [PurchaseOrderSummaryResponseDto] }) items!: PurchaseOrderSummaryResponseDto[];
  @ApiProperty() meta!: {
    page: number; limit: number; total: number;
    totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean;
  };
}
