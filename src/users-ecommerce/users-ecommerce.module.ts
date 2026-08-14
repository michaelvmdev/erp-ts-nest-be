import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateUserEcommerceUseCase } from './application/create-user-ecommerce.use-case';
import { DeleteUserEcommerceUseCase } from './application/delete-user-ecommerce.use-case';
import { FindUserEcommerceUseCase } from './application/find-user-ecommerce.use-case';
import { GetUserPurchaseHistoryUseCase } from './application/get-user-purchase-history.use-case';
import { ListUsersEcommerceUseCase } from './application/list-users-ecommerce.use-case';
import { UpdateUserEcommerceUseCase } from './application/update-user-ecommerce.use-case';
import { USER_ECOMMERCE_REPOSITORY } from './domain/user-ecommerce.repository';
import { UsersEcommerceController } from './infrastructure/http/users-ecommerce.controller';
import { UserEcommerceOrmEntity } from './infrastructure/persistence/user-ecommerce.orm-entity';
import { TypeOrmUserEcommerceRepository } from './infrastructure/persistence/typeorm-user-ecommerce.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserEcommerceOrmEntity]), AuthModule],
  controllers: [UsersEcommerceController],
  providers: [
    TypeOrmUserEcommerceRepository,
    { provide: USER_ECOMMERCE_REPOSITORY, useExisting: TypeOrmUserEcommerceRepository },
    FindUserEcommerceUseCase,
    ListUsersEcommerceUseCase,
    CreateUserEcommerceUseCase,
    UpdateUserEcommerceUseCase,
    DeleteUserEcommerceUseCase,
    GetUserPurchaseHistoryUseCase,
  ],
  exports: [TypeOrmModule],
})
export class UsersEcommerceModule {}
