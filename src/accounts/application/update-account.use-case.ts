import { Inject, Injectable } from '@nestjs/common';
import { Account, AccountId } from '../domain/account';
import { AccountCodeAlreadyExistsError, AccountNotFoundError } from '../domain/account.errors';
import { ACCOUNT_REPOSITORY } from '../domain/account.repository';
import type { AccountRepository } from '../domain/account.repository';
import { UpdateAccountCommand } from './account.commands';

@Injectable()
export class UpdateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
  ) {}

  async execute(rawId: string, command: UpdateAccountCommand): Promise<Account> {
    const id = AccountId.of(rawId);
    const account = await this.accounts.findById(id);
    if (!account) throw new AccountNotFoundError(rawId);

    if (command.code !== undefined) {
      const dup = await this.accounts.findByCode(command.code, id);
      if (dup) throw new AccountCodeAlreadyExistsError(command.code);
      account.recode(command.code);
    }

    if (command.name !== undefined) account.rename(command.name);
    if (command.type !== undefined) account.retype(command.type);
    if (command.parentCode !== undefined) account.reparent(command.parentCode);

    if (command.active !== undefined) {
      if (command.active) {
        account.activate();
      } else {
        account.deactivate();
      }
    }

    await this.accounts.update(account);
    return account;
  }
}
