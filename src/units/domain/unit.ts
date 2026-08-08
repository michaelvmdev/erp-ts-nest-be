import { UnitCode } from './value-objects/unit-code.value-object';
import { UnitDescription } from './value-objects/unit-description.value-object';
import { UnitId } from './value-objects/unit-id.value-object';

export interface UnitSnapshot {
  readonly id: string;
  readonly code: string;
  readonly description: string;
  readonly active: boolean;
}

export class Unit {
  private constructor(
    private readonly _id: UnitId,
    private readonly _code: UnitCode,
    private _description: UnitDescription,
    private _active: boolean,
  ) {}

  static create(params: {
    id: UnitId;
    code: UnitCode;
    description: UnitDescription;
    active?: boolean;
  }): Unit {
    return new Unit(params.id, params.code, params.description, params.active ?? true);
  }

  static rehydrate(params: {
    id: UnitId;
    code: UnitCode;
    description: UnitDescription;
    active: boolean;
  }): Unit {
    return new Unit(params.id, params.code, params.description, params.active);
  }

  get id(): UnitId {
    return this._id;
  }

  get code(): UnitCode {
    return this._code;
  }

  get description(): UnitDescription {
    return this._description;
  }

  get isActive(): boolean {
    return this._active;
  }

  changeDescription(description: UnitDescription): void {
    this._description = description;
  }

  activate(): void {
    this._active = true;
  }

  deactivate(): void {
    this._active = false;
  }

  toSnapshot(): UnitSnapshot {
    return {
      id: this._id.value,
      code: this._code.value,
      description: this._description.value,
      active: this._active,
    };
  }
}
