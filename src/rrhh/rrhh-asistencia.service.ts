import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AttendanceOrmEntity } from './infrastructure/persistence/attendance.orm-entity';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';

@Injectable()
export class RrhhAsistenciaService {
  constructor(
    @InjectRepository(AttendanceOrmEntity)
    private readonly repo: Repository<AttendanceOrmEntity>,
    @InjectRepository(EmployeeOrmEntity)
    private readonly empRepo: Repository<EmployeeOrmEntity>,
  ) {}

  async list(employeeId?: string, month?: string, page = 1, limit = 30) {
    const qb = this.repo.createQueryBuilder('a').orderBy('a.date', 'DESC');
    if (employeeId) qb.andWhere('a.employeeId = :employeeId', { employeeId });
    if (month)      qb.andWhere("LEFT(a.date::text, 7) = :month", { month });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    const enriched = await Promise.all(items.map(async (a) => {
      const emp = await this.empRepo.findOne({ where: { employeeId: a.employeeId } });
      return { ...this.map(a), employeeName: emp ? `${emp.firstName} ${emp.lastName}` : '—' };
    }));
    return { items: enriched, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async register(dto: {
    employeeId: string; date: string; checkIn?: string; checkOut?: string;
    status?: string; notes?: string;
  }) {
    const existing = await this.repo.findOne({ where: { employeeId: dto.employeeId, date: dto.date } });
    if (existing) throw new ConflictException(`Ya existe registro de asistencia para este empleado en ${dto.date}.`);
    const hoursWorked = this.calcHours(dto.checkIn, dto.checkOut);
    const overtime    = Math.max(0, hoursWorked - 8);
    const a = new AttendanceOrmEntity();
    a.attendanceId = randomUUID();
    a.employeeId   = dto.employeeId;
    a.date         = dto.date;
    a.checkIn      = dto.checkIn ?? null;
    a.checkOut     = dto.checkOut ?? null;
    a.hoursWorked  = hoursWorked.toFixed(2);
    a.overtimeHours = overtime.toFixed(2);
    a.status       = dto.status ?? 'present';
    a.notes        = dto.notes ?? null;
    await this.repo.save(a);
    return this.map(a);
  }

  async monthlyReport(month: string) {
    const rows = await this.repo.createQueryBuilder('a')
      .select('a.employeeId')
      .addSelect("SUM(CASE WHEN a.status IN ('present','late') THEN 1 ELSE 0 END)", 'days_present')
      .addSelect("SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END)", 'days_absent')
      .addSelect('SUM(a.hoursWorked)', 'total_hours')
      .addSelect('SUM(a.overtimeHours)', 'total_overtime')
      .where("LEFT(a.date::text, 7) = :month", { month })
      .groupBy('a.employeeId')
      .getRawMany<{ a_employee_id: string; days_present: string; days_absent: string; total_hours: string; total_overtime: string }>();
    return Promise.all(rows.map(async (r) => {
      const emp = await this.empRepo.findOne({ where: { employeeId: r.a_employee_id } });
      return {
        employeeId:    r.a_employee_id,
        employeeName:  emp ? `${emp.firstName} ${emp.lastName}` : '—',
        totalPresent:  parseInt(r.days_present ?? '0', 10),
        totalAbsent:   parseInt(r.days_absent ?? '0', 10),
        totalHours:    parseFloat(r.total_hours ?? '0'),
        totalOvertime: parseFloat(r.total_overtime ?? '0'),
      };
    }));
  }

  private calcHours(checkIn?: string, checkOut?: string): number {
    if (!checkIn || !checkOut) return 0;
    const [ih, im] = checkIn.split(':').map(Number);
    const [oh, om] = checkOut.split(':').map(Number);
    return Math.max(0, (oh * 60 + om - ih * 60 - im) / 60);
  }

  private map(a: AttendanceOrmEntity) {
    return {
      attendanceId:  a.attendanceId,
      employeeId:    a.employeeId,
      date:          a.date,
      checkIn:       a.checkIn,
      checkOut:      a.checkOut,
      hoursWorked:   parseFloat(a.hoursWorked),
      overtimeHours: parseFloat(a.overtimeHours),
      status:        a.status,
      notes:         a.notes,
    };
  }
}
