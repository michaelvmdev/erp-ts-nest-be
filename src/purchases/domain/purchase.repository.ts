import { Money } from '../../shared/domain/money.value-object';
import { Page } from '../../shared/domain/pagination';
import { Purchase } from './purchase';
import { PurchaseSearchCriteria } from './purchase-search.criteria';
import { PurchaseId } from './value-objects/purchase-id.value-object';

/**
 * Cabecera de compra sin sus lineas, para los listados.
 *
 * El listado no devuelve el detalle a proposito, igual que en ventas: veinte
 * compras con varias lineas serian muchas filas que el cliente casi nunca usa
 * en una tabla. El detalle completo se obtiene con GET /purchases/{purchaseId}.
 */
export interface PurchaseSummary {
  readonly id: string;
  readonly supplierId: string;
  readonly date: string;
  readonly hour: string;
  readonly subTotal: Money;
  readonly igv: Money;
  readonly total: Money;
  readonly lineCount: number;
}

/**
 * Puerto de salida del agregado Compra.
 *
 * Mas simple que el de ventas: no hay `emit` con correlativo porque la compra
 * no lleva numero de comprobante. Guardar la cabecera y sus lineas es una sola
 * transaccion, pero sin reservar ninguna serie.
 */
export interface PurchaseRepository {
  findById(id: PurchaseId): Promise<Purchase | null>;

  search(criteria: PurchaseSearchCriteria): Promise<Page<PurchaseSummary>>;

  /** Persiste la cabecera y sus lineas en una sola transaccion. */
  insert(purchase: Purchase): Promise<void>;

  /** Actualiza la cabecera y reemplaza por completo las lineas. */
  update(purchase: Purchase): Promise<void>;
}

/**
 * Lo que el modulo de compras necesita saber de otros agregados: que el
 * proveedor y los productos referenciados existan y esten disponibles.
 *
 * Va en un unico puerto porque es una sola pregunta, igual que SaleCatalog.
 */
export interface PurchaseCatalog {
  /** `null` si el proveedor no existe; si existe, indica si esta activo. */
  supplierState(supplierId: string): Promise<{ active: boolean } | null>;

  /**
   * Existencia de cada producto pedido. Los que no existen no aparecen en el
   * conjunto, para que el caso de uso pueda nombrarlos en el error.
   *
   * No devuelve el precio —a diferencia de SaleCatalog— porque el costo lo trae
   * la peticion, ni el estado activo, porque un producto inactivo si se puede
   * comprar.
   */
  productsExist(productIds: readonly string[]): Promise<Set<string>>;
}

export const PURCHASE_REPOSITORY = Symbol('PurchaseRepository');
export const PURCHASE_CATALOG = Symbol('PurchaseCatalog');
