import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IsDateString, IsOptional } from 'class-validator';

class DateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.map(escape).join(',')];
  for (const row of rows) lines.push(row.map(escape).join(','));
  return lines.join('\r\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function csvResponse(res: any, filename: string, csv: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + csv); // BOM for Excel UTF-8
}

@ApiTags('exports')
@Controller('exports')
export class ExportsController {
  constructor(@InjectDataSource() private readonly ds: DataSource) {}

  @Get('sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exportar ventas a CSV' })
  async exportSales(
    @Query() q: DateRangeQueryDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() res: any,
  ) {
    const params: unknown[] = [];
    let where = '1=1';
    if (q.dateFrom) { params.push(q.dateFrom); where += ` AND s.sale_date >= $${params.length}::date`; }
    if (q.dateTo)   { params.push(q.dateTo);   where += ` AND s.sale_date <= $${params.length}::date`; }

    const rows: Array<{
      sale_id: string; serie: string; number: string; date: string;
      client: string; total: string; status: string;
    }> = await this.ds.query(
      `SELECT s.sale_id, s.serie, s.number,
              TO_CHAR(s.sale_date, 'YYYY-MM-DD') AS date,
              c.description AS client,
              s.total::text,
              s.sale_status AS status
         FROM sales s
         JOIN clients c ON c.client_id = s.client_id
        WHERE ${where}
        ORDER BY s.sale_date DESC, s.serie, s.number`,
      params,
    );

    const csv = toCsv(
      ['ID', 'Serie', 'Número', 'Fecha', 'Cliente', 'Total', 'Estado'],
      rows.map((r) => [r.sale_id, r.serie, r.number, r.date, r.client, r.total, r.status]),
    );
    csvResponse(res, 'ventas.csv', csv);
  }

  @Get('purchases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exportar compras a CSV' })
  async exportPurchases(
    @Query() q: DateRangeQueryDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Res() res: any,
  ) {
    const params: unknown[] = [];
    let where = '1=1';
    if (q.dateFrom) { params.push(q.dateFrom); where += ` AND p.purchase_date >= $${params.length}::date`; }
    if (q.dateTo)   { params.push(q.dateTo);   where += ` AND p.purchase_date <= $${params.length}::date`; }

    const rows: Array<{
      purchase_id: string; invoice: string; date: string;
      supplier: string; total: string;
    }> = await this.ds.query(
      `SELECT p.purchase_id, p.invoice_number AS invoice,
              TO_CHAR(p.purchase_date, 'YYYY-MM-DD') AS date,
              s.description AS supplier,
              p.total::text
         FROM purchases p
         JOIN suppliers s ON s.supplier_id = p.supplier_id
        WHERE ${where}
        ORDER BY p.purchase_date DESC`,
      params,
    );

    const csv = toCsv(
      ['ID', 'N° Factura', 'Fecha', 'Proveedor', 'Total'],
      rows.map((r) => [r.purchase_id, r.invoice, r.date, r.supplier, r.total]),
    );
    csvResponse(res, 'compras.csv', csv);
  }

  @Get('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exportar productos a CSV' })
  async exportProducts(@Res() res: Response) {
    const rows: Array<{
      product_id: string; name: string; description: string;
      category: string; unit: string; brand: string;
    }> = await this.ds.query(
      `SELECT p.product_id, p.name, p.description,
              c.name AS category, u.unit_description AS unit,
              b.brand_name AS brand
         FROM products p
         JOIN categories c ON c.category_id = p.category_id
         JOIN units      u ON u.unit_id = p.unit_id
         LEFT JOIN brands b ON b.brand_id = p.brand_id
        ORDER BY c.name, p.name`,
    );

    const csv = toCsv(
      ['ID', 'Nombre', 'Descripción', 'Categoría', 'Unidad', 'Marca'],
      rows.map((r) => [r.product_id, r.name, r.description, r.category, r.unit, r.brand]),
    );
    csvResponse(res, 'productos.csv', csv);
  }

  @Get('clients')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exportar clientes a CSV' })
  async exportClients(@Res() res: Response) {
    const rows: Array<{
      client_id: string; description: string; document_number: string;
      doc_type: string; email: string; phone: string; address: string;
    }> = await this.ds.query(
      `SELECT c.client_id, c.description, c.document_number,
              dt.type_description AS doc_type,
              COALESCE(c.email, '') AS email,
              COALESCE(c.phone, '') AS phone,
              COALESCE(c.address, '') AS address
         FROM clients c
         JOIN document_types dt ON dt.document_type_id = c.document_type_id
        ORDER BY c.description`,
    );

    const csv = toCsv(
      ['ID', 'Nombre/Razón social', 'Nro. Documento', 'Tipo Doc.', 'Email', 'Teléfono', 'Dirección'],
      rows.map((r) => [r.client_id, r.description, r.document_number, r.doc_type, r.email, r.phone, r.address]),
    );
    csvResponse(res, 'clientes.csv', csv);
  }
}
