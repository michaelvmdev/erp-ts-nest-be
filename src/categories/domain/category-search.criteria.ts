import { PageRequest } from '../../shared/domain/pagination';

export type CategorySortDirection = 'ASC' | 'DESC';

/**
 * Criterio de listado de categorias.
 *
 * Igual que el de marcas: `categories` es una tabla de referencia, asi que solo
 * interesa buscar por texto y filtrar por estado.
 */
export class CategorySearchCriteria {
  /**
   * Las categorias suelen pedirse para poblar un desplegable, donde recibir 20
   * de 11 no tiene sentido. Por eso el tamano por defecto es mayor que el de
   * productos; el tope de PageRequest sigue vigente.
   */
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly description: string | null,
    readonly active: boolean | null,
    readonly sortDirection: CategorySortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    description?: string | null;
    active?: boolean | null;
    sortDirection?: CategorySortDirection;
    page?: number;
    limit?: number;
  }): CategorySearchCriteria {
    const descripcion = params.description?.trim();
    return new CategorySearchCriteria(
      descripcion ? descripcion : null,
      params.active ?? null,
      params.sortDirection ?? 'ASC',
      PageRequest.of(
        params.page,
        params.limit ?? CategorySearchCriteria.DEFAULT_LIMIT,
      ),
    );
  }
}
