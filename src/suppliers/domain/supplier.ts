import { SupplierDescription } from './value-objects/supplier-description.value-object';
import { SupplierId } from './value-objects/supplier-id.value-object';
import { SupplierRuc } from './value-objects/supplier-ruc.value-object';

export interface SupplierSnapshot {
  readonly id: string;
  readonly description: string;
  readonly ruc: string;
  readonly active: boolean;
}

/**
 * Raiz del agregado Proveedor.
 *
 * Sigue las mismas reglas que Brand y Category: sin constructor publico, sin
 * setters, y los cambios pasan por metodos con nombre de intencion. No importa
 * nada de NestJS ni de TypeORM.
 *
 * A diferencia de Brand, la unicidad no se evalua sobre la descripcion sino
 * sobre el RUC: es el identificador real de la empresa, y dos proveedores
 * pueden coincidir en el nombre comercial sin ser el mismo.
 */
export class Supplier {
  private constructor(
    private readonly _id: SupplierId,
    private _description: SupplierDescription,
    private _ruc: SupplierRuc,
    private _active: boolean,
  ) {}

  /** Alta de un proveedor nuevo. Nace activo salvo indicacion contraria. */
  static create(params: {
    id: SupplierId;
    description: SupplierDescription;
    ruc: SupplierRuc;
    active?: boolean;
  }): Supplier {
    return new Supplier(
      params.id,
      params.description,
      params.ruc,
      params.active ?? true,
    );
  }

  /** Reconstruccion desde la persistencia. */
  static rehydrate(params: {
    id: SupplierId;
    description: SupplierDescription;
    ruc: SupplierRuc;
    active: boolean;
  }): Supplier {
    return new Supplier(
      params.id,
      params.description,
      params.ruc,
      params.active,
    );
  }

  get id(): SupplierId {
    return this._id;
  }

  get description(): SupplierDescription {
    return this._description;
  }

  get ruc(): SupplierRuc {
    return this._ruc;
  }

  get isActive(): boolean {
    return this._active;
  }

  rename(description: SupplierDescription): void {
    this._description = description;
  }

  changeRuc(ruc: SupplierRuc): void {
    this._ruc = ruc;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  toSnapshot(): SupplierSnapshot {
    return {
      id: this._id.value,
      description: this._description.value,
      ruc: this._ruc.value,
      active: this._active,
    };
  }
}
