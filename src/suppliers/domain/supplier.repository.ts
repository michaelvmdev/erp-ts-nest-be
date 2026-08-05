import { Page } from '../../shared/domain/pagination';
import { Supplier } from './supplier';
import { SupplierSearchCriteria } from './supplier-search.criteria';
import { SupplierId } from './value-objects/supplier-id.value-object';
import { SupplierRuc } from './value-objects/supplier-ruc.value-object';

/**
 * Puerto de salida del agregado Proveedor.
 *
 * El dominio declara que necesita de la persistencia; la implementacion con
 * TypeORM vive en infrastructure y se inyecta por el token de abajo.
 */
export interface SupplierRepository {
  findById(id: SupplierId): Promise<Supplier | null>;

  search(criteria: SupplierSearchCriteria): Promise<Page<Supplier>>;

  /**
   * Busca por RUC exacto.
   *
   * `excludeId` permite corregir el RUC de un proveedor sin que choque consigo
   * mismo al validar un PATCH.
   */
  findByRuc(ruc: SupplierRuc, excludeId?: SupplierId): Promise<Supplier | null>;

  insert(supplier: Supplier): Promise<void>;

  update(supplier: Supplier): Promise<void>;

  /**
   * Baja fisica.
   *
   * Lanza SupplierInUseError si el proveedor figura en compras registradas: la
   * decision de traducir la violacion de clave foranea a un error de dominio es
   * del adaptador, porque solo el conoce los codigos de error de PostgreSQL.
   */
  delete(id: SupplierId): Promise<void>;
}

export const SUPPLIER_REPOSITORY = Symbol('SupplierRepository');
