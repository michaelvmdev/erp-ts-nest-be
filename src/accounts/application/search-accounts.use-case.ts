import { Inject, Injectable } from '@nestjs/common';
import { Page, PageRequest } from '../../shared/domain/pagination';
import { Account } from '../domain/account';
import { ACCOUNT_REPOSITORY } from '../domain/account.repository';
import type { AccountRepository } from '../domain/account.repository';
import type { AccountType } from '../domain/account';

export interface SearchAccountsQuery {
  readonly code?: string | null;
  readonly name?: string | null;
  readonly type?: AccountType | null;
  readonly parentCode?: string | null;
  readonly active?: boolean | null;
  readonly sortDirection?: 'ASC' | 'DESC';
  readonly page?: number;
  readonly limit?: number;
}

@Injectable()
export class SearchAccountsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
  ) {}

  async execute(query: SearchAccountsQuery): Promise<Page<Account>> {
    return this.accounts.search({
      code: query.code ?? null,
      name: query.name ?? null,
      type: query.type ?? null,
      parentCode: query.parentCode ?? null,
      active: query.active ?? null,
      sortDirection: query.sortDirection ?? 'ASC',
      page: PageRequest.of(query.page, query.limit),
    });
  }
}
