import { CategoryDescription } from './value-objects/category-description.value-object';
import { CategoryId } from './value-objects/category-id.value-object';

export interface CategorySnapshot {
  readonly id: string;
  readonly description: string;
  readonly active: boolean;
}

/**
 * Raiz del agregado Categoria.
 *
 * Sigue las mismas reglas que Brand: sin constructor publico, sin setters, y
 * los cambios pasan por metodos con nombre de intencion. No importa nada de
 * NestJS ni de TypeORM.
 *
 * A diferencia de la marca, la categoria si admite baja fisica (DELETE), pero
 * solo cuando ningun producto la referencia; esa comprobacion vive en la
 * persistencia, no aqui. La baja logica (`deactivate`) sigue disponible para
 * retirarla de asignaciones nuevas conservando su historico.
 */
export class Category {
  private constructor(
    private readonly _id: CategoryId,
    private _description: CategoryDescription,
    private _active: boolean,
  ) {}

  /** Alta de una categoria nueva. Nace activa salvo indicacion contraria. */
  static create(params: {
    id: CategoryId;
    description: CategoryDescription;
    active?: boolean;
  }): Category {
    return new Category(params.id, params.description, params.active ?? true);
  }

  /** Reconstruccion desde la persistencia. */
  static rehydrate(params: {
    id: CategoryId;
    description: CategoryDescription;
    active: boolean;
  }): Category {
    return new Category(params.id, params.description, params.active);
  }

  get id(): CategoryId {
    return this._id;
  }

  get description(): CategoryDescription {
    return this._description;
  }

  get isActive(): boolean {
    return this._active;
  }

  rename(description: CategoryDescription): void {
    this._description = description;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  toSnapshot(): CategorySnapshot {
    return {
      id: this._id.value,
      description: this._description.value,
      active: this._active,
    };
  }
}
