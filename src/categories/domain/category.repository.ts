import { Page } from '../../shared/domain/pagination';
import { Category } from './category';
import { CategorySearchCriteria } from './category-search.criteria';
import { CategoryDescription } from './value-objects/category-description.value-object';
import { CategoryId } from './value-objects/category-id.value-object';

/**
 * Puerto de salida del agregado Categoria.
 *
 * El dominio declara que necesita de la persistencia; la implementacion con
 * TypeORM vive en infrastructure y se inyecta por el token de abajo.
 */
export interface CategoryRepository {
  findById(id: CategoryId): Promise<Category | null>;

  search(criteria: CategorySearchCriteria): Promise<Page<Category>>;

  /**
   * Busca por descripcion normalizada (sin distinguir mayusculas ni espacios).
   *
   * `excludeId` permite renombrar una categoria sin que choque consigo misma: al
   * validar un PATCH hay que ignorar la fila que se esta editando.
   */
  findByDescription(
    description: CategoryDescription,
    excludeId?: CategoryId,
  ): Promise<Category | null>;

  insert(category: Category): Promise<void>;

  update(category: Category): Promise<void>;

  /**
   * Baja fisica.
   *
   * Lanza CategoryInUseError si algun producto referencia la categoria: la
   * decision de traducir la violacion de clave foranea a un error de dominio es
   * del adaptador, porque solo el conoce los codigos de error de PostgreSQL.
   */
  delete(id: CategoryId): Promise<void>;
}

export const CATEGORY_REPOSITORY = Symbol('CategoryRepository');
