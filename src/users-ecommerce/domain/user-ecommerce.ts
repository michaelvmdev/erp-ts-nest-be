import { UserEcommerceId } from './value-objects/user-ecommerce-id.value-object';

export interface UserEcommerceSnapshot {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string | null;
  readonly active: boolean;
  readonly createdAt: Date;
}

export class UserEcommerce {
  private constructor(
    private readonly _id: UserEcommerceId,
    private _email: string,
    private _firstName: string,
    private _lastName: string,
    private _phone: string | null,
    private _active: boolean,
    private readonly _createdAt: Date,
  ) {}

  static create(params: {
    id: UserEcommerceId;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    active?: boolean;
  }): UserEcommerce {
    return new UserEcommerce(
      params.id,
      params.email.toLowerCase().trim(),
      params.firstName.trim(),
      params.lastName.trim(),
      params.phone?.trim() || null,
      params.active ?? true,
      new Date(),
    );
  }

  static rehydrate(params: {
    id: UserEcommerceId;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    active: boolean;
    createdAt: Date;
  }): UserEcommerce {
    return new UserEcommerce(
      params.id,
      params.email,
      params.firstName,
      params.lastName,
      params.phone,
      params.active,
      params.createdAt,
    );
  }

  get id(): UserEcommerceId { return this._id; }
  get email(): string { return this._email; }
  get firstName(): string { return this._firstName; }
  get lastName(): string { return this._lastName; }
  get phone(): string | null { return this._phone; }
  get isActive(): boolean { return this._active; }
  get createdAt(): Date { return this._createdAt; }

  changeEmail(email: string): void {
    this._email = email.toLowerCase().trim();
  }

  rename(firstName: string, lastName: string): void {
    this._firstName = firstName.trim();
    this._lastName = lastName.trim();
  }

  changePhone(phone: string | null): void {
    this._phone = phone?.trim() || null;
  }

  activate(): void { this._active = true; }
  deactivate(): void { this._active = false; }

  toSnapshot(): UserEcommerceSnapshot {
    return {
      id: this._id.value,
      email: this._email,
      firstName: this._firstName,
      lastName: this._lastName,
      phone: this._phone,
      active: this._active,
      createdAt: this._createdAt,
    };
  }
}
