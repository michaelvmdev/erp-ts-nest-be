import { InvalidInputError, NotFoundError } from '../../shared/domain/domain.error';
import { UuidValueObject } from '../../shared/domain/uuid.value-object';

export class UserId extends UuidValueObject {
  static of(valor: string): UserId {
    return new UserId(this.ensureValid('El id de usuario', valor));
  }
}

export class UserNotFoundError extends NotFoundError {
  readonly code = 'USER_NOT_FOUND';
  constructor(id: string) { super(`El usuario ${id} no existe.`); }
}

export class UserEmailConflictError extends InvalidInputError {
  readonly code = 'USER_EMAIL_CONFLICT';
  constructor(email: string) { super(`El correo ${email} ya está en uso.`); }
}

export class InvalidCredentialsError extends InvalidInputError {
  readonly code = 'INVALID_CREDENTIALS';
  constructor() { super('Credenciales incorrectas.'); }
}

export interface UserSnapshot {
  readonly id: string;
  readonly roleId: string;
  readonly email: string;
  readonly name: string;
  readonly passwordHash: string;
  readonly active: boolean;
  readonly createdAt: Date;
}

export class User {
  private constructor(
    private readonly _id: UserId,
    private _roleId: string,
    private readonly _email: string,
    private _name: string,
    private readonly _passwordHash: string,
    private _active: boolean,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    id: UserId;
    roleId: string;
    email: string;
    name: string;
    passwordHash: string;
  }): User {
    return new User(
      params.id, params.roleId, params.email.toLowerCase().trim(),
      params.name.trim(), params.passwordHash, true, new Date(),
    );
  }

  static rehydrate(params: {
    id: UserId;
    roleId: string;
    email: string;
    name: string;
    passwordHash: string;
    active: boolean;
    createdAt: Date;
  }): User {
    return new User(
      params.id, params.roleId, params.email, params.name,
      params.passwordHash, params.active, params.createdAt,
    );
  }

  update(params: { name?: string; roleId?: string; active?: boolean }): void {
    if (params.name !== undefined) this._name = params.name.trim();
    if (params.roleId !== undefined) this._roleId = params.roleId;
    if (params.active !== undefined) this._active = params.active;
  }

  get id(): UserId { return this._id; }
  get roleId(): string { return this._roleId; }
  get email(): string { return this._email; }
  get name(): string { return this._name; }
  get passwordHash(): string { return this._passwordHash; }
  get active(): boolean { return this._active; }
  get createdAt(): Date { return this._createdAt; }

  toSnapshot(): UserSnapshot {
    return {
      id: this._id.value, roleId: this._roleId, email: this._email,
      name: this._name, passwordHash: this._passwordHash,
      active: this._active, createdAt: this._createdAt,
    };
  }
}
