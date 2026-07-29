import { PageRequest } from '../../shared/domain/pagination';

export type BrandSortDirection = 'ASC' | 'DESC';

/**
 * Criterio de listado de marcas.
 *
 * Mas simple que el de productos porque `brands` es una tabla de referencia:
 * solo interesa buscar por texto y filtrar por estado.
 */
export class BrandSearchCriteria {
  /**
   * Las marcas suelen pedirse para poblar un desplegable, donde recibir 20 de 50
   * obliga a encadenar peticiones sin ganancia real. Por eso el tamano por
   * defecto es mayor que el de productos; el tope de PageRequest sigue vigente.
   */
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly description: string | null,
    readonly active: boolean | null,
    readonly sortDirection: BrandSortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    description?: string | null;
    active?: boolean | null;
    sortDirection?: BrandSortDirection;
    page?: number;
    limit?: number;
  }): BrandSearchCriteria {
    const descripcion = params.description?.trim();
    return new BrandSearchCriteria(
      descripcion ? descripcion : null,
      params.active ?? null,
      params.sortDirection ?? 'ASC',
      PageRequest.of(
        params.page,
        params.limit ?? BrandSearchCriteria.DEFAULT_LIMIT,
      ),
    );
  }
}
