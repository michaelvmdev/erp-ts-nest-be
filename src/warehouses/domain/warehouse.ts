import { WarehouseCode } from './value-objects/warehouse-code.value-object';
import { WarehouseDescription } from './value-objects/warehouse-description.value-object';
import { WarehouseId } from './value-objects/warehouse-id.value-object';

export interface WarehouseSnapshot {
  readonly id: string;
  readonly code: string;
  readonly description: string;
  readonly active: boolean;
}

export class Warehouse {
  private constructor(
    private readonly _id: WarehouseId,
    private readonly _code: WarehouseCode,
    private _description: WarehouseDescription,
    private _active: boolean,
  ) {}

  static create(params: {
    id: WarehouseId;
    code: WarehouseCode;
    description: WarehouseDescription;
    active?: boolean;
  }): Warehouse {
    return new Warehouse(params.id, params.code, params.description, params.active ?? true);
  }

  static rehydrate(params: {
    id: WarehouseId;
    code: WarehouseCode;
    description: WarehouseDescription;
    active: boolean;
  }): Warehouse {
    return new Warehouse(params.id, params.code, params.description, params.active);
  }

  get id(): WarehouseId {
    return this._id;
  }

  get code(): WarehouseCode {
    return this._code;
  }

  get description(): WarehouseDescription {
    return this._description;
  }

  get isActive(): boolean {
    return this._active;
  }

  changeDescription(description: WarehouseDescription): void {
    this._description = description;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  toSnapshot(): WarehouseSnapshot {
    return {
      id: this._id.value,
      code: this._code.value,
      description: this._description.value,
      active: this._active,
    };
  }
}
