import { ApiProperty } from '@nestjs/swagger';
import { SaleType } from '../../../domain/sale-type';

export class SaleTypeResponseDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    description:
      'Identificador del tipo de comprobante. Es el valor que se envia como `saleTypeId` ' +
      'al registrar una venta.',
  })
  saleTypeId!: number;

  @ApiProperty({ maxLength: 20, example: 'Factura' })
  saleTypeDescription!: string;

  @ApiProperty({
    example: 'FAC',
    minLength: 3,
    maxLength: 3,
    description:
      'Codigo de tres letras. Es el prefijo del numero del comprobante: una venta de este ' +
      'tipo se numera "FAC-0000000001".',
  })
  saleTypeCode!: string;

  static fromDomain(saleType: SaleType): SaleTypeResponseDto {
    const s = saleType.toSnapshot();
    const dto = new SaleTypeResponseDto();
    dto.saleTypeId = s.id;
    dto.saleTypeDescription = s.description;
    dto.saleTypeCode = s.code;
    return dto;
  }
}
