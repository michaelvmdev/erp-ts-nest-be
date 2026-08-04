import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../../products/infrastructure/http/dto/product.response.dto';
import { Category } from '../../../domain/category';

export class CategoryResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f',
    description:
      'Identificador de la categoria. Lo genera el backend al dar de alta.',
  })
  categoryId!: string;

  @ApiProperty({
    maxLength: 100,
    example: 'Perifericos',
    description: 'Nombre de la categoria.',
  })
  categoryDescription!: string;

  @ApiProperty({
    example: true,
    description:
      'Una categoria inactiva se conserva junto con sus productos; simplemente deja ' +
      'de ofrecerse para asignaciones nuevas.',
  })
  categoryActive!: boolean;

  static fromDomain(category: Category): CategoryResponseDto {
    const s = category.toSnapshot();
    const dto = new CategoryResponseDto();
    dto.categoryId = s.id;
    dto.categoryDescription = s.description;
    dto.categoryActive = s.active;
    return dto;
  }
}

export class PaginatedCategoriesResponseDto {
  @ApiProperty({ type: [CategoryResponseDto] })
  items!: CategoryResponseDto[];

  // Se reutiliza PageMetaDto: la forma del paginado es la misma en toda la API y
  // duplicarla haria que se desincronizaran con el tiempo.
  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}
