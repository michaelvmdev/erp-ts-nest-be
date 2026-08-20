import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ContractsController } from './infrastructure/http/contracts.controller';
import { ContractEntity } from './infrastructure/orm/contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity]), AuthModule],
  controllers: [ContractsController],
})
export class ContractsModule {}
