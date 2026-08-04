import { Page } from '../../shared/domain/pagination';
import { Brand } from './brand';
import { BrandSearchCriteria } from './brand-search.criteria';
import { BrandDescription } from './value-objects/brand-description.value-object';
import { BrandId } from './value-objects/brand-id.value-object';

/**
 * Puerto de salida del agregado Marca.
 *
 * Igual que en productos: el dominio declara que necesita, y la implementacion
 * con TypeORM vive en infrastructure y se inyecta por el token de abajo.
 */
export interface BrandRepository {
  findById(id: BrandId): Promise<Brand | null>;

  search(criteria: BrandSearchCriteria): Promise<Page<Brand>>;

  /**
   * Busca por descripcion normalizada (sin distinguir mayusculas ni espacios).
   *
   * `excludeId` permite renombrar una marca sin que choque consigo misma: al
   * validar un PATCH hay que ignorar la fila que se esta editando.
   */
  findByDescription(
    description: BrandDescription,
    excludeId?: BrandId,
  ): Promise<Brand | null>;

  insert(brand: Brand): Promise<void>;

  update(brand: Brand): Promise<void>;

  /**
   * Baja fisica.
   *
   * Lanza BrandInUseError si la marca tiene productos asociados: la decision de
   * traducir la violacion de clave foranea a un error de dominio es del
   * adaptador, porque solo el conoce los codigos de error de PostgreSQL.
   */
  delete(id: BrandId): Promise<void>;
}

export const BRAND_REPOSITORY = Symbol('BrandRepository');
