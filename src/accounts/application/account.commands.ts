import type { AccountType } from '../domain/account';

export interface CreateAccountCommand {
  readonly code: string;
  readonly name: string;
  readonly type: AccountType;
  readonly parentCode?: string | null;
  readonly active?: boolean;
}

export interface UpdateAccountCommand {
  readonly code?: string;
  readonly name?: string;
  readonly type?: AccountType;
  readonly parentCode?: string | null;
  readonly active?: boolean;
}
