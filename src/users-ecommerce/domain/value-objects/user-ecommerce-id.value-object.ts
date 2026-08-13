import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class UserEcommerceId extends UuidValueObject {
  static of(valor: string): UserEcommerceId {
    return new UserEcommerceId(this.ensureValid('El id de usuario ecommerce', valor));
  }
}
