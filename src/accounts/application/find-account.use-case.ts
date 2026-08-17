import { Inject, Injectable } from '@nestjs/common';
import { Account, AccountId } from '../domain/account';
import { AccountNotFoundError } from '../domain/account.errors';
import { ACCOUNT_REPOSITORY } from '../domain/account.repository';
import type { AccountRepository } from '../domain/account.repository';

@Injectable()
export class FindAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
  ) {}

  async execute(rawId: string): Promise<Account> {
    const account = await this.accounts.findById(AccountId.of(rawId));
    if (!account) throw new AccountNotFoundError(rawId);
    return account;
  }
}
