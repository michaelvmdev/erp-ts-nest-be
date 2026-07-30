import { PageRequest } from '../../shared/domain/pagination';
import { DocumentTypeId } from '../../document-types/domain/document-type-id.value-object';

export type ClientSortField = 'description' | 'documentNumber';
export type SortDirection = 'ASC' | 'DESC';

/**
 * Criterio de busqueda de clientes.
 *
 * `documentNumber` se compara por igualdad y no por coincidencia parcial: es un
 * identificador unico, y quien lo escribe completo espera esa fila y no una
 * lista de las que lo contienen.
 */
export class ClientSearchCriteria {
  private constructor(
    readonly description: string | null,
    readonly documentNumber: string | null,
    readonly documentTypeId: DocumentTypeId | null,
    readonly active: boolean | null,
    readonly sortBy: ClientSortField,
    readonly sortDirection: SortDirection,
    readonly page: PageRequest,
  ) {}

  static of(params: {
    description?: string | null;
    documentNumber?: string | null;
    documentTypeId?: DocumentTypeId | null;
    active?: boolean | null;
    sortBy?: ClientSortField;
    sortDirection?: SortDirection;
    page?: number;
    limit?: number;
  }): ClientSearchCriteria {
    const descripcion = params.description?.trim();
    const documento = params.documentNumber?.trim();

    return new ClientSearchCriteria(
      descripcion ? descripcion : null,
      documento ? documento : null,
      params.documentTypeId ?? null,
      params.active ?? null,
      params.sortBy ?? 'description',
      params.sortDirection ?? 'ASC',
      PageRequest.of(params.page, params.limit),
    );
  }
}
