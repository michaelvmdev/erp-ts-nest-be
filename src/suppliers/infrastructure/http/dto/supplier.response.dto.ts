import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Supplier } from '../../../domain/supplier';

export class SupplierResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description:
      'Identificador del proveedor. Lo genera el backend al dar de alta.',
  })
  supplierId!: string;

  @ApiProperty({
    maxLength: 150,
    example: 'Distribuidora Electronica S.A.C.',
    description: 'Razon social del proveedor.',
  })
  supplierDescription!: string;

  @ApiProperty({
    example: '20100070970',
    description: 'RUC de la empresa.',
  })
  supplierRuc!: string;

  @ApiProperty({
    example: true,
    description:
      'Un proveedor inactivo se conserva junto con el historico de compras; ' +
      'simplemente deja de ofrecerse para asignaciones nuevas.',
  })
  supplierActive!: boolean;

  static fromDomain(supplier: Supplier): SupplierResponseDto {
    const s = supplier.toSnapshot();
    const dto = new SupplierResponseDto();
    dto.supplierId = s.id;
    dto.supplierDescription = s.description;
    dto.supplierRuc = s.ruc;
    dto.supplierActive = s.active;
    return dto;
  }
}

export class PaginatedSuppliersResponseDto {
  @ApiProperty({ type: [SupplierResponseDto] })
  items!: SupplierResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
