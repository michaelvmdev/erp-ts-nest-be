import { UuidValueObject } from '../../../shared/domain/uuid.value-object';

export class ProductId extends UuidValueObject {
  static of(valor: string): ProductId {
    return new ProductId(
      UuidValueObject.ensureValid('El id de producto', valor),
    );
  }
}

export class BrandId extends UuidValueObject {
  static of(valor: string): BrandId {
    return new BrandId(UuidValueObject.ensureValid('El id de marca', valor));
  }
}
