import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';
import { PayrollOrmEntity } from './infrastructure/persistence/payroll.orm-entity';
import { PayrollLineOrmEntity } from './infrastructure/persistence/payroll-line.orm-entity';
import { RrhhService } from './rrhh.service';
import { RrhhController } from './infrastructure/http/rrhh.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeOrmEntity, PayrollOrmEntity, PayrollLineOrmEntity]),
    AuthModule,
    AuditModule,
  ],
  controllers: [RrhhController],
  providers:   [RrhhService],
  exports:     [RrhhService],
})
export class RrhhModule {}
