import { Inject, Injectable } from '@nestjs/common';
import { AccountId } from '../domain/account';
import { AccountNotFoundError } from '../domain/account.errors';
import { ACCOUNT_REPOSITORY } from '../domain/account.repository';
import type { AccountRepository } from '../domain/account.repository';

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
  ) {}

  async execute(rawId: string): Promise<void> {
    const id = AccountId.of(rawId);
    const account = await this.accounts.findById(id);
    if (!account) throw new AccountNotFoundError(rawId);
    await this.accounts.softDelete(id);
  }
}
