import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';

const AFP_RATE     = 0.13;
const ONP_RATE     = 0.13;
const ESSALUD_RATE = 0.09;
const UIT          = 5_150;
const DAILY_RATE   = 1 / 30;

@Injectable()
export class RrhhLiquidacionService {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly empRepo: Repository<EmployeeOrmEntity>,
  ) {}

  async compute(employeeId: string) {
    const emp = await this.empRepo.findOne({ where: { employeeId } });
    if (!emp) throw new NotFoundException(`Empleado ${employeeId} no encontrado.`);

    const salary      = parseFloat(emp.salary);
    const hireDate    = new Date(emp.hireDate);
    const endDate     = emp.terminationDate ? new Date(emp.terminationDate) : new Date();

    const totalDays   = Math.round((endDate.getTime() - hireDate.getTime()) / 86_400_000);
    const months      = totalDays / 30;
    const years       = totalDays / 365;

    // CTS: 1/6 de la RMB × meses trabajados (simplificado)
    const cts         = salary * (1 / 6) * months;
    // Gratificaciones no pagadas (proporcional)
    const grat        = salary * Math.floor(months / 6) * (salary / 6 / 12 * (months % 6));
    // Vacaciones truncas: 30 días × años trabajados proporcional
    const vacTruncas  = salary * DAILY_RATE * Math.round(years * 30);
    // Indemnización (si es despido): 1.5 sueldos × años (tope 12 sueldos)
    const indemnizacion = emp.terminationDate
      ? Math.min(salary * 1.5 * Math.max(1, Math.round(years)), salary * 12)
      : 0;

    const subtotal    = cts + vacTruncas;
    const pension     = subtotal * (emp.pensionSystem === 'ONP' ? ONP_RATE : AFP_RATE);
    const neto        = subtotal + indemnizacion - pension;

    return {
      employeeId,
      employeeName:   `${emp.firstName} ${emp.lastName}`,
      position:       emp.position,
      salary,
      hireDate:       emp.hireDate,
      endDate:        emp.terminationDate ?? endDate.toISOString().slice(0, 10),
      totalDays,
      months:         Math.round(months * 100) / 100,
      cts:            Math.round(cts * 100) / 100,
      gratificaciones: Math.round(grat * 100) / 100,
      vacacionesTruncas: Math.round(vacTruncas * 100) / 100,
      indemnizacion:  Math.round(indemnizacion * 100) / 100,
      pension:        Math.round(pension * 100) / 100,
      neto:           Math.round(neto * 100) / 100,
    };
  }
}
