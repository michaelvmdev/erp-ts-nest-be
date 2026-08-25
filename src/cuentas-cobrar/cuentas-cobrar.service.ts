import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

interface AgingBucket { current: number; days30: number; days60: number; days90: number; over90: number }

@Injectable()
export class CuentasCobrarService {
  constructor(private readonly ds: DataSource) {}

  async aging(clientId?: string) {
    const params: unknown[] = [];
    let where = "s.payment_status NOT IN ('paid') AND s.status != 'cancelled'";
    if (clientId) { params.push(clientId); where += ` AND s.client_id = $${params.length}`; }

    const rows = await this.ds.query<Array<{
      sale_id: string; serie_number: string; issue_date: string;
      total: string; client_name: string; client_id: string; days_overdue: string;
    }>>(`
      SELECT
        s.sale_id, s.serie_number, s.issue_date::text,
        s.total::numeric as total,
        COALESCE(c.business_name, c.first_name || ' ' || c.last_name, 'Sin cliente') as client_name,
        s.client_id,
        GREATEST(0, NOW()::date - s.issue_date)::int as days_overdue
      FROM sales s
      LEFT JOIN clients c ON c.client_id = s.client_id
      WHERE ${where}
      ORDER BY days_overdue DESC
    `, params);

    const buckets: AgingBucket = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    const items = rows.map((r) => {
      const days = parseInt(r.days_overdue);
      const total = parseFloat(r.total);
      if (days <= 0)       buckets.current += total;
      else if (days <= 30) buckets.days30  += total;
      else if (days <= 60) buckets.days60  += total;
      else if (days <= 90) buckets.days90  += total;
      else                 buckets.over90  += total;
      return { ...r, total, daysOverdue: days };
    });

    return {
      items,
      aging: {
        current: Math.round(buckets.current * 100) / 100,
        days1_30: Math.round(buckets.days30 * 100) / 100,
        days31_60: Math.round(buckets.days60 * 100) / 100,
        days61_90: Math.round(buckets.days90 * 100) / 100,
        over90: Math.round(buckets.over90 * 100) / 100,
        total: Math.round(Object.values(buckets).reduce((a, b) => a + b, 0) * 100) / 100,
      },
    };
  }

  async agingPagar(supplierId?: string) {
    const params: unknown[] = [];
    let where = "p.payment_status NOT IN ('paid') AND p.status != 'cancelled'";
    if (supplierId) { params.push(supplierId); where += ` AND p.supplier_id = $${params.length}`; }

    const rows = await this.ds.query<Array<{
      purchase_id: string; purchase_number: string; purchase_date: string;
      total: string; supplier_name: string; supplier_id: string; days_overdue: string;
    }>>(`
      SELECT
        p.purchase_id, p.purchase_number, p.purchase_date::text,
        p.total::numeric as total,
        COALESCE(s.business_name, s.first_name || ' ' || s.last_name, 'Sin proveedor') as supplier_name,
        p.supplier_id,
        GREATEST(0, NOW()::date - p.purchase_date)::int as days_overdue
      FROM purchases p
      LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
      WHERE ${where}
      ORDER BY days_overdue DESC
    `, params);

    const buckets: AgingBucket = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
    const items = rows.map((r) => {
      const days = parseInt(r.days_overdue);
      const total = parseFloat(r.total);
      if (days <= 0)       buckets.current += total;
      else if (days <= 30) buckets.days30  += total;
      else if (days <= 60) buckets.days60  += total;
      else if (days <= 90) buckets.days90  += total;
      else                 buckets.over90  += total;
      return { ...r, total, daysOverdue: days };
    });

    return {
      items,
      aging: {
        current: Math.round(buckets.current * 100) / 100,
        days1_30: Math.round(buckets.days30 * 100) / 100,
        days31_60: Math.round(buckets.days60 * 100) / 100,
        days61_90: Math.round(buckets.days90 * 100) / 100,
        over90: Math.round(buckets.over90 * 100) / 100,
        total: Math.round(Object.values(buckets).reduce((a, b) => a + b, 0) * 100) / 100,
      },
    };
  }
}
