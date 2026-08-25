import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { EmployeeOrmEntity } from './infrastructure/persistence/employee.orm-entity';
import { VacationRequestOrmEntity } from './infrastructure/persistence/vacation-request.orm-entity';

@Injectable()
export class RrhhVacacionesService {
  constructor(
    @InjectRepository(VacationRequestOrmEntity)
    private readonly repo: Repository<VacationRequestOrmEntity>,
    @InjectRepository(EmployeeOrmEntity)
    private readonly empRepo: Repository<EmployeeOrmEntity>,
  ) {}

  async list(employeeId?: string, status?: string, page = 1, limit = 20) {
    const qb = this.repo.createQueryBuilder('v').orderBy('v.createdAt', 'DESC');
    if (employeeId) qb.andWhere('v.employeeId = :employeeId', { employeeId });
    if (status)     qb.andWhere('v.status = :status', { status });
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    const enriched = await Promise.all(items.map(async (v) => {
      const emp = await this.empRepo.findOne({ where: { employeeId: v.employeeId } });
      return { ...this.map(v), employeeName: emp ? `${emp.firstName} ${emp.lastName}` : '—' };
    }));
    return { items: enriched, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async request(dto: { employeeId: string; startDate: string; endDate: string; reason?: string }) {
    const emp = await this.empRepo.findOne({ where: { employeeId: dto.employeeId } });
    if (!emp) throw new NotFoundException(`Empleado ${dto.employeeId} no encontrado.`);
    const days = this.calcDays(dto.startDate, dto.endDate);
    const v = new VacationRequestOrmEntity();
    v.requestId  = randomUUID();
    v.employeeId = dto.employeeId;
    v.startDate  = dto.startDate;
    v.endDate    = dto.endDate;
    v.days       = days;
    v.status     = 'pending';
    v.reason     = dto.reason ?? null;
    v.approvedBy = null;
    v.approvedAt = null;
    await this.repo.save(v);
    return { ...this.map(v), employeeName: `${emp.firstName} ${emp.lastName}` };
  }

  async approve(requestId: string, approvedBy: string) {
    const v = await this.repo.findOne({ where: { requestId } });
    if (!v) throw new NotFoundException(`Solicitud ${requestId} no encontrada.`);
    v.status     = 'approved';
    v.approvedBy = approvedBy;
    v.approvedAt = new Date();
    await this.repo.save(v);
    return this.map(v);
  }

  async reject(requestId: string) {
    const v = await this.repo.findOne({ where: { requestId } });
    if (!v) throw new NotFoundException(`Solicitud ${requestId} no encontrada.`);
    v.status = 'rejected';
    await this.repo.save(v);
    return this.map(v);
  }

  async accrualBalance(employeeId: string) {
    const emp = await this.empRepo.findOne({ where: { employeeId } });
    if (!emp) throw new NotFoundException(`Empleado ${employeeId} no encontrado.`);
    const hireDate    = new Date(emp.hireDate);
    const today       = new Date();
    const monthsWorked = (today.getFullYear() - hireDate.getFullYear()) * 12 + (today.getMonth() - hireDate.getMonth());
    const accrued     = Math.floor(monthsWorked * (30 / 12)); // 30 días/año
    const used = await this.repo.createQueryBuilder('v')
      .select('COALESCE(SUM(v.days), 0)', 'total')
      .where('v.employeeId = :employeeId', { employeeId })
      .andWhere("v.status = 'approved'")
      .getRawOne<{ total: string }>();
    const usedDays = parseInt(used?.total ?? '0', 10);
    return {
      employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      hireDate:     emp.hireDate,
      monthsWorked,
      accrued,
      used:      usedDays,
      balance:   accrued - usedDays,
      available: accrued - usedDays,
    };
  }

  private calcDays(start: string, end: string): number {
    const ms = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.round(ms / 86_400_000) + 1);
  }

  private map(v: VacationRequestOrmEntity) {
    return {
      requestId:   v.requestId,
      employeeId:  v.employeeId,
      startDate:   v.startDate,
      endDate:     v.endDate,
      days:        v.days,
      status:      v.status,
      reason:      v.reason,
      approvedBy:  v.approvedBy,
      approvedAt:  v.approvedAt,
      createdAt:   v.createdAt,
    };
  }
}
