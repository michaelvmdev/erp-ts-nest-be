/**
 * Contratos de entrada de la capa de aplicacion, en tipos planos.
 *
 * Notese que ninguno acepta importes: ni `unitPrice`, ni `partial`, ni
 * `subTotal`, ni `igv`, ni `total`. Todos se derivan del catalogo y de las
 * cantidades. Un cliente no puede decidir cuanto cuesta lo que compra.
 */

export interface SaleLineCommand {
  readonly productId: string;
  readonly quantity: number;
}

export interface CreateSaleCommand {
  readonly saleTypeId: number;
  readonly clientId: string;
  /** Codigo de distrito. La provincia y el departamento se derivan de el. */
  readonly districtId: string;
  /** Si se omiten, se toma el momento de la emision. */
  readonly saleDate?: string;
  readonly saleHour?: string;
  readonly saleDetails: readonly SaleLineCommand[];
  /** Si se provee, se registran movimientos de stock (sale_out) por cada linea. */
  readonly warehouseId?: string;
}

export interface UpdateSaleCommand {
  readonly clientId?: string;
  readonly districtId?: string;
  /** Si viene, reemplaza por completo las lineas y recalcula los importes. */
  readonly saleDetails?: readonly SaleLineCommand[];
}

export interface SearchSalesQuery {
  readonly saleNumber?: string | null;
  readonly saleTypeCode?: string | null;
  readonly clientId?: string | null;
  readonly districtId?: string | null;
  readonly departmentId?: string | null;
  readonly dateFrom?: string | null;
  readonly dateTo?: string | null;
  readonly totalMin?: number | null;
  readonly totalMax?: number | null;
  readonly sortBy?: 'date' | 'number' | 'total';
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
