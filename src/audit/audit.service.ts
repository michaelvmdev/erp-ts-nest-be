import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditEntry {
  auditId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  changedBy: string;
  payload: unknown;
  createdAt: string;
}

export interface AuditQuery {
  entityType?: string;
  action?: AuditAction;
  changedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  async log(
    entityType: string,
    entityId: string,
    action: AuditAction,
    changedBy: string,
    payload?: unknown,
  ): Promise<void> {
    await this.ds.query(
      `INSERT INTO audit_log (entity_type, entity_id, action, changed_by, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [entityType, entityId, action, changedBy, payload ? JSON.stringify(payload) : null],
    );
  }

  async query(params: AuditQuery): Promise<{ items: AuditEntry[]; total: number }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const args: unknown[] = [];
    let idx = 1;

    if (params.entityType) { conditions.push(`entity_type = $${idx++}`); args.push(params.entityType); }
    if (params.action) { conditions.push(`action = $${idx++}`); args.push(params.action); }
    if (params.changedBy) { conditions.push(`changed_by ILIKE $${idx++}`); args.push(`%${params.changedBy}%`); }
    if (params.dateFrom) { conditions.push(`created_at >= $${idx++}`); args.push(params.dateFrom); }
    if (params.dateTo) { conditions.push(`created_at <= $${idx++}`); args.push(params.dateTo); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, countRows] = await Promise.all([
      this.ds.query<Array<{
        audit_id: string; entity_type: string; entity_id: string;
        action: string; changed_by: string; payload: unknown; created_at: string;
      }>>(
        `SELECT audit_id, entity_type, entity_id, action, changed_by, payload, created_at
         FROM audit_log ${where}
         ORDER BY created_at DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...args, limit, offset],
      ),
      this.ds.query<Array<{ total: string }>>(
        `SELECT COUNT(*)::text AS total FROM audit_log ${where}`,
        args,
      ),
    ]);

    return {
      items: rows.map((r) => ({
        auditId: r.audit_id,
        entityType: r.entity_type,
        entityId: r.entity_id,
        action: r.action as AuditAction,
        changedBy: r.changed_by,
        payload: r.payload,
        createdAt: r.created_at,
      })),
      total: parseInt(countRows[0]?.total ?? '0', 10),
    };
  }
}
