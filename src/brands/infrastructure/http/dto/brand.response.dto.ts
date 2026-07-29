import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Brand } from '../../../domain/brand';

export class BrandResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description:
      'Identificador de la marca. Lo genera el backend al dar de alta.',
  })
  brandId!: string;

  @ApiProperty({
    maxLength: 50,
    example: 'Logitech',
    description: 'Nombre de la marca.',
  })
  brandDescription!: string;

  @ApiProperty({
    example: true,
    description:
      'Una marca inactiva se conserva junto con sus productos y el historico de ventas; ' +
      'simplemente deja de ofrecerse para asignaciones nuevas.',
  })
  brandActive!: boolean;

  static fromDomain(brand: Brand): BrandResponseDto {
    const s = brand.toSnapshot();
    const dto = new BrandResponseDto();
    dto.brandId = s.id;
    dto.brandDescription = s.description;
    dto.brandActive = s.active;
    return dto;
  }
}

export class PaginatedBrandsResponseDto {
  @ApiProperty({ type: [BrandResponseDto] })
  items!: BrandResponseDto[];

  // Se reutiliza PageMetaDto: la forma del paginado es la misma en toda la API y
  // duplicarla haria que se desincronizaran con el tiempo.
  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
