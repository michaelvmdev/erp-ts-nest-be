import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';
import { PayrollOrmEntity } from './infrastructure/persistence/payroll.orm-entity';
import { PayrollLineOrmEntity } from './infrastructure/persistence/payroll-line.orm-entity';

// AFP rate: 10% (aporte obligatorio) + 1.74% comisión + 1.68% seguro = ~13.42% (usar 13%)
// ONP rate: 13%
const AFP_RATE    = 0.13;
const ONP_RATE    = 0.13;
const ESSALUD_RATE = 0.09; // 9% sobre sueldo básico (costo empleador)
// CTS: 1/12 del sueldo bruto por mes trabajado
// Gratificación: 1/6 del sueldo bruto por mes (julio y diciembre, pero provisión mensual)
const CTS_FACTOR   = 1 / 12;
const GRAT_FACTOR  = 1 / 6;

@Injectable()
export class RrhhService {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly empRepo: Repository<EmployeeOrmEntity>,
    @InjectRepository(PayrollOrmEntity)
    private readonly payrollRepo: Repository<PayrollOrmEntity>,
    @InjectRepository(PayrollLineOrmEntity)
    private readonly linesRepo: Repository<PayrollLineOrmEntity>,
  ) {}

  // ── Employees ─────────────────────────────────────────────────────────────

  async searchEmployees(active?: boolean, department?: string, page = 1, limit = 20) {
    const qb = this.empRepo.createQueryBuilder('e').orderBy('e.last_name', 'ASC').addOrderBy('e.first_name', 'ASC');
    if (active !== undefined) qb.andWhere('e.active = :active', { active });
    if (department)           qb.andWhere('e.department = :department', { department });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items: items.map(this.mapEmployee), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findEmployee(employeeId: string) {
    const e = await this.empRepo.findOne({ where: { employeeId } });
    if (!e) throw new NotFoundException(`Empleado ${employeeId} no encontrado.`);
    return this.mapEmployee(e);
  }

  async createEmployee(dto: {
    code: string; firstName: string; lastName: string;
    documentType?: string; documentNumber: string;
    email?: string; phone?: string; position: string; department?: string;
    hireDate: string; salary: number; pensionSystem?: string; afpName?: string;
  }) {
    const existing = await this.empRepo.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`El código ${dto.code} ya existe.`);
    const e = new EmployeeOrmEntity();
    e.employeeId    = randomUUID();
    e.code          = dto.code;
    e.firstName     = dto.firstName;
    e.lastName      = dto.lastName;
    e.documentType  = dto.documentType ?? 'DNI';
    e.documentNumber = dto.documentNumber;
    e.email         = dto.email ?? null;
    e.phone         = dto.phone ?? null;
    e.position      = dto.position;
    e.department    = dto.department ?? null;
    e.hireDate      = dto.hireDate;
    e.salary        = dto.salary.toFixed(2);
    e.pensionSystem = dto.pensionSystem ?? 'AFP';
    e.afpName       = dto.afpName ?? null;
    return this.empRepo.save(e);
  }

  async terminateEmployee(employeeId: string, terminationDate: string) {
    const e = await this.empRepo.findOne({ where: { employeeId } });
    if (!e) throw new NotFoundException(`Empleado ${employeeId} no encontrado.`);
    e.terminationDate = terminationDate;
    e.active          = false;
    return this.empRepo.save(e);
  }

  // ── Payroll ───────────────────────────────────────────────────────────────

  calculatePayrollLine(salary: number, pensionSystem: string, overtime = 0, familyAllowance = 0, daysWorked = 30) {
    const basicSalary = (salary / 30) * daysWorked;
    const gross       = basicSalary + overtime + familyAllowance;
    const pension     = gross * (pensionSystem === 'ONP' ? ONP_RATE : AFP_RATE);
    const essalud     = basicSalary * ESSALUD_RATE;
    const incomeTax   = 0; // simplificado — 5ta categoría requiere proyección anual
    const totalDed    = pension + incomeTax;
    const net         = gross - totalDed;
    const cts         = gross * CTS_FACTOR;
    const grat        = gross * GRAT_FACTOR;

    return {
      basicSalary:      Math.round(basicSalary * 100) / 100,
      familyAllowance,
      overtime,
      grossSalary:      Math.round(gross * 100) / 100,
      pensionDeduction: Math.round(pension  * 100) / 100,
      essalud:          Math.round(essalud  * 100) / 100,
      incomeTax:        0,
      otherDeductions:  0,
      totalDeductions:  Math.round(totalDed * 100) / 100,
      netSalary:        Math.round(net  * 100) / 100,
      ctsProvision:     Math.round(cts  * 100) / 100,
      gratificationProv: Math.round(grat * 100) / 100,
      daysWorked,
    };
  }

  async generatePayroll(period: string): Promise<PayrollOrmEntity> {
    const existing = await this.payrollRepo.findOne({ where: { period } });
    if (existing) throw new ConflictException(`Ya existe planilla para el período ${period}.`);

    const employees = await this.empRepo.find({ where: { active: true } });

    const payroll = new PayrollOrmEntity();
    payroll.payrollId = randomUUID();
    payroll.period    = period;
    payroll.status    = 'draft';
    await this.payrollRepo.save(payroll);

    let totalGross = 0, totalDeductions = 0, totalNet = 0;

    for (const emp of employees) {
      const calc = this.calculatePayrollLine(parseFloat(emp.salary), emp.pensionSystem);
      const line = new PayrollLineOrmEntity();
      line.lineId            = randomUUID();
      line.payrollId         = payroll.payrollId;
      line.employeeId        = emp.employeeId;
      line.basicSalary       = calc.basicSalary.toFixed(2);
      line.familyAllowance   = calc.familyAllowance.toFixed(2);
      line.overtime          = calc.overtime.toFixed(2);
      line.grossSalary       = calc.grossSalary.toFixed(2);
      line.pensionDeduction  = calc.pensionDeduction.toFixed(2);
      line.essalud           = calc.essalud.toFixed(2);
      line.incomeTax         = '0.00';
      line.otherDeductions   = '0.00';
      line.totalDeductions   = calc.totalDeductions.toFixed(2);
      line.netSalary         = calc.netSalary.toFixed(2);
      line.ctsProvision      = calc.ctsProvision.toFixed(2);
      line.gratificationProv = calc.gratificationProv.toFixed(2);
      line.daysWorked        = 30;
      await this.linesRepo.save(line);
      totalGross      += calc.grossSalary;
      totalDeductions += calc.totalDeductions;
      totalNet        += calc.netSalary;
    }

    payroll.totalGross      = totalGross.toFixed(2);
    payroll.totalDeductions = totalDeductions.toFixed(2);
    payroll.totalNet        = totalNet.toFixed(2);
    return this.payrollRepo.save(payroll);
  }

  async approvePayroll(payrollId: string, approvedBy: string) {
    const p = await this.payrollRepo.findOne({ where: { payrollId } });
    if (!p) throw new NotFoundException(`Planilla ${payrollId} no encontrada.`);
    if (p.status !== 'draft') throw new ConflictException('Solo se puede aprobar una planilla en estado borrador.');
    p.status     = 'approved';
    p.approvedBy = approvedBy;
    p.approvedAt = new Date();
    return this.payrollRepo.save(p);
  }

  async listPayrolls(page = 1, limit = 12) {
    const [items, total] = await this.payrollRepo.findAndCount({
      order:  { period: 'DESC' },
      skip:   (page - 1) * limit,
      take:   limit,
    });
    return {
      items: items.map((p) => ({
        payrollId:       p.payrollId,
        period:          p.period,
        status:          p.status,
        totalGross:      parseFloat(p.totalGross),
        totalDeductions: parseFloat(p.totalDeductions),
        totalNet:        parseFloat(p.totalNet),
        approvedBy:      p.approvedBy,
        approvedAt:      p.approvedAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPayrollLines(payrollId: string) {
    const lines = await this.linesRepo.find({ where: { payrollId } });
    const result = await Promise.all(lines.map(async (l) => {
      const emp = await this.empRepo.findOne({ where: { employeeId: l.employeeId } });
      return {
        lineId:           l.lineId,
        employeeId:       l.employeeId,
        employeeName:     emp ? `${emp.firstName} ${emp.lastName}` : '—',
        position:         emp?.position ?? '—',
        pensionSystem:    emp?.pensionSystem ?? '—',
        basicSalary:      parseFloat(l.basicSalary),
        familyAllowance:  parseFloat(l.familyAllowance),
        overtime:         parseFloat(l.overtime),
        grossSalary:      parseFloat(l.grossSalary),
        pensionDeduction: parseFloat(l.pensionDeduction),
        essalud:          parseFloat(l.essalud),
        incomeTax:        parseFloat(l.incomeTax),
        totalDeductions:  parseFloat(l.totalDeductions),
        netSalary:        parseFloat(l.netSalary),
        ctsProvision:     parseFloat(l.ctsProvision),
        gratificationProv: parseFloat(l.gratificationProv),
        daysWorked:       l.daysWorked,
      };
    }));
    return result;
  }

  private mapEmployee(e: EmployeeOrmEntity) {
    return {
      employeeId:      e.employeeId,
      code:            e.code,
      firstName:       e.firstName,
      lastName:        e.lastName,
      fullName:        `${e.firstName} ${e.lastName}`,
      documentType:    e.documentType,
      documentNumber:  e.documentNumber,
      email:           e.email,
      phone:           e.phone,
      position:        e.position,
      department:      e.department,
      hireDate:        e.hireDate,
      terminationDate: e.terminationDate,
      salary:          parseFloat(e.salary),
      pensionSystem:   e.pensionSystem,
      afpName:         e.afpName,
      active:          e.active,
    };
  }
}
