import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateAccountUseCase } from './application/create-account.use-case';
import { DeleteAccountUseCase } from './application/delete-account.use-case';
import { FindAccountUseCase } from './application/find-account.use-case';
import { SearchAccountsUseCase } from './application/search-accounts.use-case';
import { UpdateAccountUseCase } from './application/update-account.use-case';
import { ACCOUNT_REPOSITORY } from './domain/account.repository';
import { AccountsController } from './infrastructure/http/accounts.controller';
import { AccountOrmEntity } from './infrastructure/persistence/account.orm-entity';
import { TypeOrmAccountRepository } from './infrastructure/persistence/typeorm-account.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AccountOrmEntity])],
  controllers: [AccountsController],
  providers: [
    TypeOrmAccountRepository,
    { provide: ACCOUNT_REPOSITORY, useExisting: TypeOrmAccountRepository },
    FindAccountUseCase,
    SearchAccountsUseCase,
    CreateAccountUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
  ],
})
export class AccountsModule {}
