import { Account, AccountId } from '../../domain/account';
import { AccountOrmEntity } from './account.orm-entity';

export class AccountMapper {
  static toDomain(row: AccountOrmEntity): Account {
    return Account.rehydrate({
      id: AccountId.of(row.accountId),
      code: row.code,
      name: row.name,
      type: row.type,
      parentCode: row.parentCode,
      active: row.active,
    });
  }

  static toPersistence(account: Account): AccountOrmEntity {
    const snap = account.toSnapshot();
    const row = new AccountOrmEntity();
    row.accountId = snap.id;
    row.code = snap.code;
    row.name = snap.name;
    row.type = snap.type;
    row.parentCode = snap.parentCode;
    row.active = snap.active;
    return row;
  }
}
