import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Payment } from '../../../domain/payment';
import type { PaymentMethod, PaymentType, ReferenceType } from '../../../domain/payment';

export class PaymentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: ['income', 'expense'] }) paymentType!: PaymentType;
  @ApiProperty({ enum: ['sale', 'purchase', 'credit_note', 'purchase_order'] }) referenceType!: ReferenceType;
  @ApiProperty() referenceId!: string;
  @ApiProperty() paymentDate!: string;
  @ApiProperty() amount!: number;
  @ApiProperty({ enum: ['cash', 'transfer', 'card', 'check'] }) paymentMethod!: PaymentMethod;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty() createdAt!: Date;

  static fromDomain(p: Payment): PaymentResponseDto {
    const snap = p.toSnapshot();
    const dto = new PaymentResponseDto();
    dto.id = snap.id;
    dto.paymentType = snap.paymentType;
    dto.referenceType = snap.referenceType;
    dto.referenceId = snap.referenceId;
    dto.paymentDate = snap.paymentDate;
    dto.amount = snap.amount.toNumber();
    dto.paymentMethod = snap.paymentMethod;
    dto.notes = snap.notes;
    dto.createdAt = snap.createdAt;
    return dto;
  }
}

export class PaginatedPaymentsResponseDto {
  @ApiProperty({ type: [PaymentResponseDto] }) items!: PaymentResponseDto[];
  @ApiProperty() meta!: {
    page: number; limit: number; total: number;
    totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean;
  };
}
