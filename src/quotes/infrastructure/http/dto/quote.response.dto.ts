import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Quote } from '../../../domain/quote';
import { QuoteSummary } from '../../../domain/quote.repository';

export class QuoteLineResponseDto {
  @ApiProperty() item!: number;
  @ApiProperty({ format: 'uuid' }) productId!: string;
  @ApiProperty() quantity!: number;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() partial!: number;
}

export class QuoteDetailResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() number!: string;
  @ApiProperty({ enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'] }) status!: string;
  @ApiProperty({ format: 'uuid' }) clientId!: string;
  @ApiProperty() date!: string;
  @ApiProperty() validUntil!: string;
  @ApiPropertyOptional({ nullable: true }) notes!: string | null;
  @ApiProperty() subTotal!: number;
  @ApiProperty() igv!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: [QuoteLineResponseDto] }) lines!: QuoteLineResponseDto[];
  @ApiProperty() createdAt!: string;

  static fromDomain(q: Quote): QuoteDetailResponseDto {
    const snap = q.toSnapshot();
    const dto = new QuoteDetailResponseDto();
    dto.id         = snap.id;
    dto.number     = snap.number;
    dto.status     = snap.status;
    dto.clientId   = snap.clientId;
    dto.date       = snap.date;
    dto.validUntil = snap.validUntil;
    dto.notes      = snap.notes;
    dto.subTotal   = snap.subTotal.centimos / 100;
    dto.igv        = snap.igv.centimos / 100;
    dto.total      = snap.total.centimos / 100;
    dto.createdAt  = snap.createdAt.toISOString();
    dto.lines      = snap.lines.map((l) => ({
      item:      l.item,
      productId: l.productId,
      quantity:  l.quantity,
      unitPrice: l.unitPrice.centimos / 100,
      partial:   l.partial.centimos / 100,
    }));
    return dto;
  }
}

export class QuoteSummaryResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() number!: string;
  @ApiProperty({ enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'] }) status!: string;
  @ApiProperty({ format: 'uuid' }) clientId!: string;
  @ApiProperty() clientName!: string;
  @ApiProperty() date!: string;
  @ApiProperty() validUntil!: string;
  @ApiProperty() total!: number;
  @ApiProperty() lineCount!: number;
  @ApiProperty() createdAt!: string;

  static fromSummary(s: QuoteSummary): QuoteSummaryResponseDto {
    const dto = new QuoteSummaryResponseDto();
    dto.id         = s.id;
    dto.number     = s.number;
    dto.status     = s.status;
    dto.clientId   = s.clientId;
    dto.clientName = s.clientName;
    dto.date       = s.date;
    dto.validUntil = s.validUntil;
    dto.total      = s.total.centimos / 100;
    dto.lineCount  = s.lineCount;
    dto.createdAt  = s.createdAt.toISOString();
    return dto;
  }
}

export class PaginatedQuotesResponseDto {
  @ApiProperty({ type: [QuoteSummaryResponseDto] }) items!: QuoteSummaryResponseDto[];
  @ApiProperty({ type: PageMetaDto }) meta!: PageMetaDto;
}
