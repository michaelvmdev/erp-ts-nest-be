import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Purchase } from '../../../domain/purchase';
import type { PurchaseSummary } from '../../../domain/purchase.repository';

export class PurchaseLineResponseDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    description: 'Correlativo de la linea, desde 1.',
  })
  item!: number;

  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  productId!: string;

  @ApiProperty({ type: 'integer', example: 20 })
  quantity!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    example: 349.5,
    description:
      'Costo unitario pagado al proveedor. Queda congelado en la linea.',
  })
  unitPrice!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    example: 6990.0,
    description: 'Cantidad por costo unitario. Lo calcula el backend.',
  })
  partial!: number;
}

export class PurchaseResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  purchaseId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
  })
  supplierId!: string;

  @ApiProperty({ format: 'date', example: '2026-08-01' })
  purchaseDate!: string;

  @ApiProperty({ example: '10:30:00' })
  purchaseHour!: string;

  @ApiProperty({ type: 'number', format: 'double', example: 6990.0 })
  subTotal!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    example: 1258.2,
    description: 'IGV del 18% sobre el subtotal, redondeado al centimo.',
  })
  igv!: number;

  @ApiProperty({ type: 'number', format: 'double', example: 8248.2 })
  total!: number;

  @ApiProperty({ type: [PurchaseLineResponseDto] })
  purchaseDetails!: PurchaseLineResponseDto[];

  static fromDomain(purchase: Purchase): PurchaseResponseDto {
    const p = purchase.toSnapshot();
    const dto = new PurchaseResponseDto();
    dto.purchaseId = p.id;
    dto.supplierId = p.supplierId;
    dto.purchaseDate = p.date;
    dto.purchaseHour = p.hour;
    dto.subTotal = p.subTotal.toNumber();
    dto.igv = p.igv.toNumber();
    dto.total = p.total.toNumber();
    dto.purchaseDetails = p.lines.map((l) => ({
      item: l.item,
      productId: l.productId,
      quantity: l.quantity,
      unitPrice: l.unitPrice.toNumber(),
      partial: l.partial.toNumber(),
    }));
    return dto;
  }
}

/**
 * Cabecera sin lineas, para el listado. Trae `lineCount` para que el cliente
 * sepa cuantos items tiene la compra sin pedir el detalle completo.
 */
export class PurchaseSummaryResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  purchaseId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
  })
  supplierId!: string;

  @ApiProperty({ format: 'date', example: '2026-08-01' })
  purchaseDate!: string;

  @ApiProperty({ example: '10:30:00' })
  purchaseHour!: string;

  @ApiProperty({ type: 'number', format: 'double', example: 6990.0 })
  subTotal!: number;

  @ApiProperty({ type: 'number', format: 'double', example: 1258.2 })
  igv!: number;

  @ApiProperty({ type: 'number', format: 'double', example: 8248.2 })
  total!: number;

  @ApiProperty({
    type: 'integer',
    example: 3,
    description:
      'Cantidad de lineas. El detalle se obtiene con GET /purchases/{purchaseId}.',
  })
  lineCount!: number;

  static fromSummary(s: PurchaseSummary): PurchaseSummaryResponseDto {
    const dto = new PurchaseSummaryResponseDto();
    dto.purchaseId = s.id;
    dto.supplierId = s.supplierId;
    dto.purchaseDate = s.date;
    dto.purchaseHour = s.hour;
    dto.subTotal = s.subTotal.toNumber();
    dto.igv = s.igv.toNumber();
    dto.total = s.total.toNumber();
    dto.lineCount = s.lineCount;
    return dto;
  }
}

export class PaginatedPurchasesResponseDto {
  @ApiProperty({ type: [PurchaseSummaryResponseDto] })
  items!: PurchaseSummaryResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
