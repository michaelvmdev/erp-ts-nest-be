import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Account, AccountId } from '../domain/account';
import { AccountCodeAlreadyExistsError } from '../domain/account.errors';
import { ACCOUNT_REPOSITORY } from '../domain/account.repository';
import type { AccountRepository } from '../domain/account.repository';
import { CreateAccountCommand } from './account.commands';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accounts: AccountRepository,
  ) {}

  async execute(command: CreateAccountCommand): Promise<Account> {
    const existing = await this.accounts.findByCode(command.code);
    if (existing) throw new AccountCodeAlreadyExistsError(command.code);

    const account = Account.create({
      id: AccountId.of(randomUUID()),
      code: command.code,
      name: command.name,
      type: command.type,
      parentCode: command.parentCode,
      active: command.active,
    });

    await this.accounts.insert(account);
    return account;
  }
}
