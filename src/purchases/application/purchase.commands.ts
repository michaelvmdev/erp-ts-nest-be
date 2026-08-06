/**
 * Contratos de entrada de la capa de aplicacion, en tipos planos.
 *
 * A diferencia de las ventas, la linea SI acepta `unitPrice`: es el costo
 * pagado al proveedor, un dato que no esta en el catalogo. Lo que no se acepta
 * es `partial`, `subTotal`, `igv` ni `total`: esos los deriva el backend.
 */

export interface PurchaseLineCommand {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface CreatePurchaseCommand {
  readonly supplierId: string;
  /** Si se omiten, se toma el momento del registro. */
  readonly purchaseDate?: string;
  readonly purchaseHour?: string;
  readonly purchaseDetails: readonly PurchaseLineCommand[];
}

export interface UpdatePurchaseCommand {
  readonly supplierId?: string;
  readonly purchaseDate?: string;
  readonly purchaseHour?: string;
  /** Si viene, reemplaza por completo las lineas y recalcula los importes. */
  readonly purchaseDetails?: readonly PurchaseLineCommand[];
}

export interface SearchPurchasesQuery {
  readonly supplierId?: string | null;
  readonly dateFrom?: string | null;
  readonly dateTo?: string | null;
  readonly totalMin?: number | null;
  readonly totalMax?: number | null;
  readonly sortBy?: 'date' | 'total';
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}
