import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BankStatementLineOrmEntity } from './infrastructure/persistence/bank-statement-line.orm-entity';
import { ConciliacionService } from './conciliacion.service';
import { ConciliacionController } from './infrastructure/http/conciliacion.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BankStatementLineOrmEntity]), AuthModule],
  controllers: [ConciliacionController],
  providers:   [ConciliacionService],
  exports:     [ConciliacionService],
})
export class ConciliacionModule {}
