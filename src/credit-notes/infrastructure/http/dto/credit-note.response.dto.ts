import { ApiProperty } from '@nestjs/swagger';
import { CreditNote } from '../../../domain/credit-note';
import { CreditNoteSummary } from '../../../domain/credit-note.repository';

export class CreditNoteLineResponseDto {
  @ApiProperty() item!: number;
  @ApiProperty() productId!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() partial!: number;

  static fromSnapshot(s: { item: number; productId: string; quantity: number; unitPrice: { toNumber(): number }; partial: { toNumber(): number } }): CreditNoteLineResponseDto {
    const dto = new CreditNoteLineResponseDto();
    dto.item = s.item;
    dto.productId = s.productId;
    dto.quantity = s.quantity;
    dto.unitPrice = s.unitPrice.toNumber();
    dto.partial = s.partial.toNumber();
    return dto;
  }
}

export class CreditNoteResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() saleId!: string;
  @ApiProperty() number!: string;
  @ApiProperty() date!: string;
  @ApiProperty() hour!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() subTotal!: number;
  @ApiProperty() igv!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: [CreditNoteLineResponseDto] }) lines!: CreditNoteLineResponseDto[];

  static fromDomain(cn: CreditNote): CreditNoteResponseDto {
    const snap = cn.toSnapshot();
    const dto = new CreditNoteResponseDto();
    dto.id = snap.id;
    dto.saleId = snap.saleId;
    dto.number = snap.number;
    dto.date = snap.date;
    dto.hour = snap.hour;
    dto.reason = snap.reason;
    dto.subTotal = snap.subTotal.toNumber();
    dto.igv = snap.igv.toNumber();
    dto.total = snap.total.toNumber();
    dto.lines = snap.lines.map(CreditNoteLineResponseDto.fromSnapshot);
    return dto;
  }
}

export class CreditNoteSummaryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() saleId!: string;
  @ApiProperty() number!: string;
  @ApiProperty() date!: string;
  @ApiProperty() hour!: string;
  @ApiProperty() reason!: string;
  @ApiProperty() subTotal!: number;
  @ApiProperty() igv!: number;
  @ApiProperty() total!: number;
  @ApiProperty() lineCount!: number;

  static fromSummary(s: CreditNoteSummary): CreditNoteSummaryResponseDto {
    const dto = new CreditNoteSummaryResponseDto();
    dto.id = s.id;
    dto.saleId = s.saleId;
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

export class PaginatedCreditNotesResponseDto {
  @ApiProperty({ type: [CreditNoteSummaryResponseDto] }) items!: CreditNoteSummaryResponseDto[];
  @ApiProperty() meta!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
