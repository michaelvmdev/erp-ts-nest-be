import { UserEcommerce } from '../../domain/user-ecommerce';
import { UserEcommerceId } from '../../domain/value-objects/user-ecommerce-id.value-object';
import { UserEcommerceOrmEntity } from './user-ecommerce.orm-entity';

export class UserEcommerceMapper {
  static toDomain(row: UserEcommerceOrmEntity): UserEcommerce {
    return UserEcommerce.rehydrate({
      id: UserEcommerceId.of(row.userEcommerceId),
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      active: row.userActive,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(user: UserEcommerce): UserEcommerceOrmEntity {
    const s = user.toSnapshot();
    const row = new UserEcommerceOrmEntity();
    row.userEcommerceId = s.id;
    row.email = s.email;
    row.firstName = s.firstName;
    row.lastName = s.lastName;
    row.phone = s.phone;
    row.userActive = s.active;
    row.createdAt = s.createdAt;
    return row;
  }
}
