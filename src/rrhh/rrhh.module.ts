import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';
import { PayrollOrmEntity } from './infrastructure/persistence/payroll.orm-entity';
import { PayrollLineOrmEntity } from './infrastructure/persistence/payroll-line.orm-entity';
import { RrhhService } from './rrhh.service';
import { RrhhController } from './infrastructure/http/rrhh.controller';
import { PayrollSlipPdfGenerator } from './infrastructure/pdf/payroll-slip-pdf.generator';
import { PlamePdfGenerator } from './infrastructure/pdf/plame-pdf.generator';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeOrmEntity, PayrollOrmEntity, PayrollLineOrmEntity]),
    AuthModule,
    AuditModule,
  ],
  controllers: [RrhhController],
  providers:   [RrhhService, PayrollSlipPdfGenerator, PlamePdfGenerator],
  exports:     [RrhhService],
})
export class RrhhModule {}
