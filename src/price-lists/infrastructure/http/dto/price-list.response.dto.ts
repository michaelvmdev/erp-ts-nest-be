import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { PriceList } from '../../../domain/price-list';

export class PriceListItemResponseDto {
  @ApiProperty({ format: 'uuid', example: '00000000-0000-4000-8000-000000000001' })
  productId!: string;

  @ApiProperty({ example: 29.9, description: 'Precio unitario en la lista.' })
  unitPrice!: number;
}

export class PriceListResponseDto {
  @ApiProperty({ format: 'uuid', example: 'd4000000-0000-4000-8000-000000000001' })
  priceListId!: string;

  @ApiProperty({ maxLength: 100, example: 'Lista General' })
  priceListName!: string;

  @ApiPropertyOptional({ maxLength: 300, example: 'Precios para publico en general', nullable: true })
  priceListDescription!: string | null;

  @ApiProperty({ example: true })
  priceListActive!: boolean;

  @ApiProperty({ type: [PriceListItemResponseDto], description: 'Vacio en el listado paginado; completo en GET /:id.' })
  items!: PriceListItemResponseDto[];

  static fromDomain(pl: PriceList): PriceListResponseDto {
    const s = pl.toSnapshot();
    const dto = new PriceListResponseDto();
    dto.priceListId = s.id;
    dto.priceListName = s.name;
    dto.priceListDescription = s.description;
    dto.priceListActive = s.active;
    dto.items = s.items.map((i) => {
      const item = new PriceListItemResponseDto();
      item.productId = i.productId;
      item.unitPrice = i.unitPrice;
      return item;
    });
    return dto;
  }
}

export class PaginatedPriceListsResponseDto {
  @ApiProperty({ type: [PriceListResponseDto] })
  items!: PriceListResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
