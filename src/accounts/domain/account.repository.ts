import type { Page } from '../../shared/domain/pagination';
import type { Account, AccountId } from './account';
import type { AccountSearchCriteria } from './account-search.criteria';

export const ACCOUNT_REPOSITORY = 'ACCOUNT_REPOSITORY';

export interface AccountRepository {
  findById(id: AccountId): Promise<Account | null>;
  findByCode(code: string, excludeId?: AccountId): Promise<Account | null>;
  search(criteria: AccountSearchCriteria): Promise<Page<Account>>;
  insert(account: Account): Promise<void>;
  update(account: Account): Promise<void>;
  softDelete(id: AccountId): Promise<void>;
}
