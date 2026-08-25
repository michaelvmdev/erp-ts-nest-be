import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';
import { PayrollOrmEntity } from './infrastructure/persistence/payroll.orm-entity';
import { PayrollLineOrmEntity } from './infrastructure/persistence/payroll-line.orm-entity';
import { AttendanceOrmEntity } from './infrastructure/persistence/attendance.orm-entity';
import { VacationRequestOrmEntity } from './infrastructure/persistence/vacation-request.orm-entity';
import { RrhhService } from './rrhh.service';
import { RrhhAsistenciaService } from './rrhh-asistencia.service';
import { RrhhVacacionesService } from './rrhh-vacaciones.service';
import { RrhhLiquidacionService } from './rrhh-liquidacion.service';
import { RrhhController } from './infrastructure/http/rrhh.controller';
import { RrhhAsistenciaController } from './infrastructure/http/rrhh-asistencia.controller';
import { RrhhVacacionesController } from './infrastructure/http/rrhh-vacaciones.controller';
import { PayrollSlipPdfGenerator } from './infrastructure/pdf/payroll-slip-pdf.generator';
import { PlamePdfGenerator } from './infrastructure/pdf/plame-pdf.generator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeOrmEntity, PayrollOrmEntity, PayrollLineOrmEntity,
      AttendanceOrmEntity, VacationRequestOrmEntity,
    ]),
    AuthModule,
    AuditModule,
  ],
  controllers: [RrhhController, RrhhAsistenciaController, RrhhVacacionesController],
  providers:   [
    RrhhService, RrhhAsistenciaService, RrhhVacacionesService, RrhhLiquidacionService,
    PayrollSlipPdfGenerator, PlamePdfGenerator,
  ],
  exports: [RrhhService, RrhhAsistenciaService, RrhhVacacionesService, RrhhLiquidacionService],
})
export class RrhhModule {}
