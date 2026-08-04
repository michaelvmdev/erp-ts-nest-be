import { ApiProperty } from '@nestjs/swagger';
import { Product } from '../../../domain/product';

export class ProductResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description:
      'Identificador del producto. Lo genera el backend al dar de alta.',
  })
  productId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description: 'Marca a la que pertenece.',
  })
  brandId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '4b53e66e-794b-4e37-b4af-4e5971858c23',
    description: 'Categoria a la que pertenece.',
  })
  categoryId!: string;

  @ApiProperty({ maxLength: 100, example: 'Logitech MX Master 3S' })
  productName!: string;

  @ApiProperty({
    maxLength: 250,
    nullable: true,
    example: 'Mouse inalambrico ergonomico con sensor de 8000 DPI.',
    description: 'Descripcion larga. `null` si el producto no tiene una.',
  })
  productDescription!: string | null;

  @ApiProperty({
    maxLength: 500,
    nullable: true,
    example: null,
    description:
      'URL de la imagen. `null` si no se cargo; en ese caso el cliente debe usar ' +
      '`/img/product-placeholder.svg`.',
  })
  productImage!: string | null;

  @ApiProperty({
    type: 'number',
    format: 'double',
    example: 449.0,
    description: 'Precio unitario en soles, con dos decimales exactos.',
  })
  productUnitPrice!: number;

  @ApiProperty({
    example: true,
    description:
      'Un producto inactivo no se ofrece a la venta, pero conserva su historial.',
  })
  productActive!: boolean;

  /** El dominio no se serializa directamente: se proyecta a este DTO. */
  static fromDomain(product: Product): ProductResponseDto {
    const s = product.toSnapshot();
    const dto = new ProductResponseDto();
    dto.productId = s.id;
    dto.brandId = s.brandId;
    dto.categoryId = s.categoryId;
    dto.productName = s.name;
    dto.productDescription = s.description;
    dto.productImage = s.image;
    dto.productUnitPrice = s.unitPrice.toNumber();
    dto.productActive = s.active;
    return dto;
  }
}

export class PageMetaDto {
  @ApiProperty({ example: 1, minimum: 1, description: 'Pagina devuelta.' })
  page!: number;

  @ApiProperty({
    example: 20,
    minimum: 1,
    maximum: 100,
    description: 'Tamano de pagina.',
  })
  limit!: number;

  @ApiProperty({
    example: 100,
    description: 'Total de productos que cumplen el filtro.',
  })
  total!: number;

  @ApiProperty({ example: 5, description: 'Cantidad de paginas disponibles.' })
  totalPages!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage!: boolean;
}

export class PaginatedProductsResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  items!: ProductResponseDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
