import { PageRequest } from '../../shared/domain/pagination';

export type SupplierSortDirection = 'ASC' | 'DESC';

/**
 * Criterio de listado de proveedores.
 *
 * Igual que brands: `suppliers` es una tabla de referencia, asi que interesa
 * buscar por texto, por RUC exacto y filtrar por estado.
 */
export class SupplierSearchCriteria {
  static readonly DEFAULT_LIMIT = 50;

  private constructor(
    readonly description: string | null,
    readonly ruc: string | null,
    readonly active: boolean | null,
    readonly sortDirection: SupplierSortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    description?: string | null;
    ruc?: string | null;
    active?: boolean | null;
    sortDirection?: SupplierSortDirection;
    page?: number;
    limit?: number;
  }): SupplierSearchCriteria {
    const descripcion = params.description?.trim();
    const ruc = params.ruc?.trim();
    return new SupplierSearchCriteria(
      descripcion ? descripcion : null,
      ruc ? ruc : null,
      params.active ?? null,
      params.sortDirection ?? 'ASC',
      PageRequest.of(
        params.page,
        params.limit ?? SupplierSearchCriteria.DEFAULT_LIMIT,
      ),
    );
  }
}
