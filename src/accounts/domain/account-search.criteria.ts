import type { AccountType } from './account';
import type { PageRequest } from '../../shared/domain/pagination';

export interface AccountSearchCriteria {
  readonly code?: string | null;
  readonly name?: string | null;
  readonly type?: AccountType | null;
  readonly parentCode?: string | null;
  readonly active?: boolean | null;
  readonly sortDirection: 'ASC' | 'DESC';
  readonly page: PageRequest;
}
