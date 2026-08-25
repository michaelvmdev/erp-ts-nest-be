import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';

const DAILY_RATE = 1 / 30;

@Injectable()
export class RrhhLiquidacionService {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly empRepo: Repository<EmployeeOrmEntity>,
  ) {}

  async compute(employeeId: string, terminationDate?: string) {
    const emp = await this.empRepo.findOne({ where: { employeeId } });
    if (!emp) throw new NotFoundException(`Empleado ${employeeId} no encontrado.`);

    const salary    = parseFloat(emp.salary);
    const hireDate  = new Date(emp.hireDate);
    const endDate   = terminationDate
      ? new Date(terminationDate)
      : (emp.terminationDate ? new Date(emp.terminationDate) : new Date());

    const totalDays = Math.round((endDate.getTime() - hireDate.getTime()) / 86_400_000);
    const months    = totalDays / 30;
    const years     = totalDays / 365;

    const cts           = salary * (1 / 6) * months;
    const grat          = salary * Math.floor(months / 6) * (salary / 6 / 12 * (months % 6));
    const vacTruncas    = salary * DAILY_RATE * Math.round(years * 30);
    const indemnizacion = (terminationDate || emp.terminationDate)
      ? Math.min(salary * 1.5 * Math.max(1, Math.round(years)), salary * 12)
      : 0;

    const round = (n: number) => Math.round(n * 100) / 100;

    return {
      employeeId,
      employeeName:      `${emp.firstName} ${emp.lastName}`,
      hireDate:          emp.hireDate,
      terminationDate:   endDate.toISOString().slice(0, 10),
      grossSalary:       round(salary),
      cts:               round(cts),
      gratificaciones:   round(grat),
      vacacionesTruncas: round(vacTruncas),
      indemnizacion:     round(indemnizacion),
      total:             round(cts + grat + vacTruncas + indemnizacion),
    };
  }
}
