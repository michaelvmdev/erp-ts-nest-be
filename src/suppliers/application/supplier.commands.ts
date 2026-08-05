/**
 * Contratos de entrada de la capa de aplicacion, en tipos planos: los casos de
 * uso no dependen de las clases de request HTTP.
 */

export interface CreateSupplierCommand {
  readonly supplierDescription: string;
  readonly supplierRuc: string;
  readonly supplierActive?: boolean;
}

export interface UpdateSupplierCommand {
  readonly supplierDescription?: string;
  readonly supplierRuc?: string;
  readonly supplierActive?: boolean;
}

export interface ListSuppliersQuery {
  readonly supplierDescription?: string | null;
  readonly supplierRuc?: string | null;
  readonly supplierActive?: boolean | null;
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
