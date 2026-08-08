import { UuidValueObject } from '../../shared/domain/uuid.value-object';

export class RoleId extends UuidValueObject {
  static of(valor: string): RoleId {
    return new RoleId(this.ensureValid('El id de rol', valor));
  }
}

export interface RoleSnapshot {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
}

export class Role {
  private constructor(
    private readonly _id: RoleId,
    private readonly _name: string,
    private readonly _description: string | null,
  ) {}

  static rehydrate(params: { id: RoleId; name: string; description: string | null }): Role {
    return new Role(params.id, params.name, params.description);
  }

  get id(): RoleId { return this._id; }
  get name(): string { return this._name; }
  get description(): string | null { return this._description; }

  toSnapshot(): RoleSnapshot {
    return { id: this._id.value, name: this._name, description: this._description };
  }
}
