export type AccountType =
  | 'activo'
  | 'pasivo'
  | 'patrimonio'
  | 'ingresos'
  | 'gastos'
  | 'orden';

export interface AccountSnapshot {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly type: AccountType;
  readonly parentCode: string | null;
  readonly active: boolean;
}

export class AccountId {
  private constructor(readonly value: string) {}
  static of(v: string): AccountId {
    return new AccountId(v);
  }
}

export class Account {
  private constructor(
    private readonly _id: AccountId,
    private _code: string,
    private _name: string,
    private _type: AccountType,
    private _parentCode: string | null,
    private _active: boolean,
  ) {}

  static create(params: {
    id: AccountId;
    code: string;
    name: string;
    type: AccountType;
    parentCode?: string | null;
    active?: boolean;
  }): Account {
    return new Account(
      params.id,
      params.code,
      params.name,
      params.type,
      params.parentCode ?? null,
      params.active ?? true,
    );
  }

  static rehydrate(params: {
    id: AccountId;
    code: string;
    name: string;
    type: AccountType;
    parentCode: string | null;
    active: boolean;
  }): Account {
    return new Account(
      params.id,
      params.code,
      params.name,
      params.type,
      params.parentCode,
      params.active,
    );
  }

  get id(): AccountId { return this._id; }
  get code(): string { return this._code; }
  get name(): string { return this._name; }
  get type(): AccountType { return this._type; }
  get parentCode(): string | null { return this._parentCode; }
  get isActive(): boolean { return this._active; }

  rename(name: string): void { this._name = name; }
  recode(code: string): void { this._code = code; }
  retype(type: AccountType): void { this._type = type; }
  reparent(parentCode: string | null): void { this._parentCode = parentCode; }
  activate(): void { this._active = true; }
  deactivate(): void { this._active = false; }

  toSnapshot(): AccountSnapshot {
    return {
      id: this._id.value,
      code: this._code,
      name: this._name,
      type: this._type,
      parentCode: this._parentCode,
      active: this._active,
    };
  }
}
