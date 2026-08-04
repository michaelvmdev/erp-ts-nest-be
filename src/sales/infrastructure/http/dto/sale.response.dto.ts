import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Sale } from '../../../domain/sale';
import type { SaleSummary } from '../../../domain/sale.repository';

export class SaleLineResponseDto {
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

  @ApiProperty({ type: 'integer', example: 2 })
  quantity!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    example: 449.0,
    description:
      'Precio al que se vendio. Queda congelado aunque el catalogo cambie despues.',
  })
  unitPrice!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    example: 898.0,
    description: 'Cantidad por precio unitario. Lo calcula el backend.',
  })
  partial!: number;
}

export class SaleResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  saleId!: string;

  @ApiProperty({
    example: 'FAC-0000000001',
    description:
      'Numero del comprobante: el codigo de su tipo y el correlativo de 10 digitos. ' +
      'Lo asigna el backend y no se puede modificar.',
  })
  saleNumber!: string;

  @ApiProperty({
    example: 'FAC',
    description: 'Codigo del tipo de comprobante.',
  })
  saleTypeCode!: string;

  @ApiProperty({ format: 'date', example: '2026-07-30' })
  saleDate!: string;

  @ApiProperty({ example: '14:50:07' })
  saleHour!: string;

  @ApiProperty({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
  })
  clientId!: string;

  @ApiProperty({ example: '15', description: 'Derivado del distrito.' })
  departmentId!: string;

  @ApiProperty({ example: '1501', description: 'Derivado del distrito.' })
  provinceId!: string;

  @ApiProperty({ example: '150131' })
  districtId!: string;

  @ApiProperty({ type: 'number', format: 'double', example: 898.0 })
  subTotal!: number;

  @ApiProperty({
    type: 'number',
    format: 'double',
    example: 161.64,
    description: 'IGV del 18% sobre el subtotal, redondeado al centimo.',
  })
  igv!: number;

  @ApiProperty({ type: 'number', format: 'double', example: 1059.64 })
  total!: number;

  @ApiProperty({ type: [SaleLineResponseDto] })
  saleDetails!: SaleLineResponseDto[];

  static fromDomain(sale: Sale): SaleResponseDto {
    const s = sale.toSnapshot();
    const dto = new SaleResponseDto();
    dto.saleId = s.id;
    dto.saleNumber = s.number;
    dto.saleTypeCode = s.saleTypeCode;
    dto.saleDate = s.date;
    dto.saleHour = s.hour;
    dto.clientId = s.clientId;
    dto.departmentId = s.departmentId;
    dto.provinceId = s.provinceId;
    dto.districtId = s.districtId;
    dto.subTotal = s.subTotal.toNumber();
    dto.igv = s.igv.toNumber();
    dto.total = s.total.toNumber();
    dto.saleDetails = s.lines.map((l) => ({
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
 * pueda mostrar cuantos items tiene la venta sin pedir el detalle completo.
 */
export class SaleSummaryResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  saleId!: string;

  @ApiProperty({ example: 'FAC-0000000001' })
  saleNumber!: string;

  @ApiProperty({ example: 'FAC' })
  saleTypeCode!: string;

  @ApiProperty({ format: 'date', example: '2026-07-30' })
  saleDate!: string;

  @ApiProperty({ example: '14:50:07' })
  saleHour!: string;

  @ApiProperty({
    format: 'uuid',
    example: '5b8f3c21-9d4e-4a7b-8c16-2f9e1d3a5b7c',
  })
  clientId!: string;

  @ApiProperty({ example: '15' })
  departmentId!: string;

  @ApiProperty({ example: '1501' })
  provinceId!: string;

  @ApiProperty({ example: '150131' })
  districtId!: string;

  @ApiProperty({ type: 'number', format: 'double', example: 898.0 })
  subTotal!: number;

  @ApiProperty({ type: 'number', format: 'double', example: 161.64 })
  igv!: number;

  @ApiProperty({ type: 'number', format: 'double', example: 1059.64 })
  total!: number;

  @ApiProperty({
    type: 'integer',
    example: 3,
    description:
      'Cantidad de lineas. El detalle se obtiene con GET /sales/{saleId}.',
  })
  lineCount!: number;

  static fromSummary(s: SaleSummary): SaleSummaryResponseDto {
    const dto = new SaleSummaryResponseDto();
    dto.saleId = s.id;
    dto.saleNumber = s.number;
    dto.saleTypeCode = s.saleTypeCode;
    dto.saleDate = s.date;
    dto.saleHour = s.hour;
    dto.clientId = s.clientId;
    dto.departmentId = s.departmentId;
    dto.provinceId = s.provinceId;
    dto.districtId = s.districtId;
    dto.subTotal = s.subTotal.toNumber();
    dto.igv = s.igv.toNumber();
    dto.total = s.total.toNumber();
    dto.lineCount = s.lineCount;
    return dto;
  }
}

export class PaginatedSalesResponseDto {
  @ApiProperty({ type: [SaleSummaryResponseDto] })
  items!: SaleSummaryResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
