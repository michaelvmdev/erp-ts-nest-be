import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CompaniesController } from './infrastructure/http/companies.controller';
import { CompanyEntity } from './infrastructure/orm/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyEntity]), AuthModule],
  controllers: [CompaniesController],
  exports: [TypeOrmModule],
})
export class CompaniesModule {}
