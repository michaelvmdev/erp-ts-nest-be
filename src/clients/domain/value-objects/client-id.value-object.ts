import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class ClientId extends UuidValueObject {
  static of(valor: string): ClientId {
    return new ClientId(this.ensureValid('El id de cliente', valor));
  }
}
