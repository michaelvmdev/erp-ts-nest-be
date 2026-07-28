import { Page } from '../../shared/domain/pagination';
import { Product } from './product';
import { ProductSearchCriteria } from './product-search.criteria';
import { BrandId, ProductId } from './value-objects/identifiers.value-object';

/**
 * Puerto de salida del agregado Producto.
 *
 * El dominio declara *que* necesita de la persistencia; quien lo implementa y
 * como es indiferente. La implementacion con TypeORM vive en infrastructure y
 * se inyecta por el token de abajo. Para un test basta con una implementacion
 * en memoria: los casos de uso no notan la diferencia.
 */
export interface ProductRepository {
  findById(id: ProductId): Promise<Product | null>;

  search(criteria: ProductSearchCriteria): Promise<Page<Product>>;

  /** Alta. Falla si el id ya existe. */
  insert(product: Product): Promise<void>;

  /** Actualizacion completa del agregado ya existente. */
  update(product: Product): Promise<void>;

  /**
   * Baja fisica.
   *
   * Lanza ProductInUseError si el producto aparece en sale_details: la decision
   * de traducir la violacion de clave foranea a un error de dominio es del
   * adaptador, porque solo el conoce los codigos de error de PostgreSQL.
   */
  delete(id: ProductId): Promise<void>;
}

/**
 * Puerto para verificar que una marca existe antes de asociarla.
 *
 * Va aparte del repositorio de productos porque Marca es otro agregado. El
 * dominio de productos solo necesita saber si un BrandId es valido, no manejar
 * marcas: este puerto expresa exactamente esa necesidad y nada mas.
 */
export interface BrandExistenceChecker {
  exists(brandId: BrandId): Promise<boolean>;
}

/**
 * Tokens de inyeccion. Hacen falta porque una interfaz de TypeScript no existe
 * en tiempo de ejecucion y Nest no puede usarla como identificador de provider.
 */
export const PRODUCT_REPOSITORY = Symbol('ProductRepository');
export const BRAND_EXISTENCE_CHECKER = Symbol('BrandExistenceChecker');
