import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import {
  IsIn, IsISO8601, IsNumber, IsOptional, IsString, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { AuditService } from '../../../audit/audit.service';
import { RrhhService } from '../../rrhh.service';

class CreateEmployeeDto {
  @IsString()                                        code!: string;
  @IsString()                                        firstName!: string;
  @IsString()                                        lastName!: string;
  @IsOptional() @IsString()                          documentType?: string;
  @IsString()                                        documentNumber!: string;
  @IsOptional() @IsString()                          email?: string;
  @IsOptional() @IsString()                          phone?: string;
  @IsString()                                        position!: string;
  @IsOptional() @IsString()                          department?: string;
  @IsISO8601()                                       hireDate!: string;
  @IsNumber() @Min(1) @Type(() => Number)             salary!: number;
  @IsOptional() @IsIn(['AFP', 'ONP'])                pensionSystem?: string;
  @IsOptional() @IsString()                          afpName?: string;
}

class TerminateEmployeeDto {
  @IsISO8601()
  terminationDate!: string;
}

@ApiTags('rrhh')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('rrhh')
export class RrhhController {
  constructor(
    private readonly svc: RrhhService,
    private readonly audit: AuditService,
  ) {}

  // ── Employees ─────────────────────────────────────────────────────────────

  @Get('employees')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar empleados' })
  @ApiQuery({ name: 'active',     required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'page',       required: false })
  @ApiQuery({ name: 'limit',      required: false })
  searchEmployees(
    @Query('active')     active?: string,
    @Query('department') department?: string,
    @Query('page')       page?: string,
    @Query('limit')      limit?: string,
  ) {
    const activeFilter = active === undefined ? undefined : active === 'true';
    return this.svc.searchEmployees(activeFilter, department, parseInt(page ?? '1') || 1, parseInt(limit ?? '20') || 20);
  }

  @Get('employees/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener empleado por ID' })
  findEmployee(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.findEmployee(id);
  }

  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar empleado' })
  @ApiBody({ type: CreateEmployeeDto })
  async createEmployee(
    @Body() dto: CreateEmployeeDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const e = await this.svc.createEmployee(dto);
    void this.audit.log('employee', e.employeeId, 'CREATE', req.user?.email ?? 'system', { code: dto.code });
    return e;
  }

  @Patch('employees/:id/terminate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar cese de empleado' })
  async terminate(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: TerminateEmployeeDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const e = await this.svc.terminateEmployee(id, dto.terminationDate);
    void this.audit.log('employee', id, 'UPDATE', req.user?.email ?? 'system', { terminationDate: dto.terminationDate });
    return e;
  }

  // ── Payroll ───────────────────────────────────────────────────────────────

  @Get('payrolls')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar planillas' })
  listPayrolls(
    @Query('page')  page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.listPayrolls(parseInt(page ?? '1') || 1, parseInt(limit ?? '12') || 12);
  }

  @Post('payrolls')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generar planilla mensual', description: 'period = YYYY-MM. Crea líneas para todos los empleados activos.' })
  async generatePayroll(
    @Body('period') period: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const p = await this.svc.generatePayroll(period);
    void this.audit.log('payroll', p.payrollId, 'CREATE', req.user?.email ?? 'system', { period });
    return p;
  }

  @Get('payrolls/:id/lines')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Detalle de líneas de planilla' })
  getPayrollLines(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.svc.getPayrollLines(id);
  }

  @Patch('payrolls/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar planilla' })
  async approvePayroll(
    @Param('id', new ParseUUIDPipe()) id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const p = await this.svc.approvePayroll(id, req.user?.email ?? 'system');
    void this.audit.log('payroll', id, 'UPDATE', req.user?.email ?? 'system', { status: 'approved' });
    return p;
  }
}
