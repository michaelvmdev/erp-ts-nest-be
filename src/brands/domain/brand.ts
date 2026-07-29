import { BrandDescription } from './value-objects/brand-description.value-object';
import { BrandId } from './value-objects/brand-id.value-object';

export interface BrandSnapshot {
  readonly id: string;
  readonly description: string;
  readonly active: boolean;
}

/**
 * Raiz del agregado Marca.
 *
 * Sigue las mismas reglas que Product: sin constructor publico, sin setters, y
 * los cambios pasan por metodos con nombre de intencion. No importa nada de
 * NestJS ni de TypeORM.
 *
 * La marca no se borra nunca. Sus productos la referencian por clave foranea y
 * el historico de ventas depende de ellos, asi que la unica baja posible es
 * logica: `deactivate`.
 */
export class Brand {
  private constructor(
    private readonly _id: BrandId,
    private _description: BrandDescription,
    private _active: boolean,
  ) {}

  /** Alta de una marca nueva. Nace activa salvo indicacion contraria. */
  static create(params: {
    id: BrandId;
    description: BrandDescription;
    active?: boolean;
  }): Brand {
    return new Brand(params.id, params.description, params.active ?? true);
  }

  /** Reconstruccion desde la persistencia. */
  static rehydrate(params: {
    id: BrandId;
    description: BrandDescription;
    active: boolean;
  }): Brand {
    return new Brand(params.id, params.description, params.active);
  }

  get id(): BrandId {
    return this._id;
  }

  get description(): BrandDescription {
    return this._description;
  }

  get isActive(): boolean {
    return this._active;
  }

  rename(description: BrandDescription): void {
    this._description = description;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  toSnapshot(): BrandSnapshot {
    return {
      id: this._id.value,
      description: this._description.value,
      active: this._active,
    };
  }
}
