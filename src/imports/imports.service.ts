import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import * as ExcelJS from 'exceljs';
import { DataSource } from 'typeorm';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

function toStr(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object' && 'text' in (v as object)) return (v as { text: string }).text.trim();
  return String(v);
}

async function parseWorkbook(buffer: Buffer): Promise<ExcelJS.Row[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as any);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error('El archivo no contiene hojas.');
  const rows: ExcelJS.Row[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber > 1) rows.push(row); // skip header
  });
  return rows;
}

async function parseCsv(buffer: Buffer): Promise<string[][]> {
  const text = buffer.toString('utf-8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  return lines.slice(1).map((l) =>
    l.split(',').map((c) => c.trim().replace(/^"|"$/g, '')),
  );
}

@Injectable()
export class ImportsService {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  async importProducts(buffer: Buffer, mimetype: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    const rows = await this.readRows(buffer, mimetype);

    for (const { idx, cells } of rows) {
      const code        = cells[0] ?? '';
      const description = cells[1] ?? '';
      const unitPrice   = parseFloat(cells[2] ?? '');
      const categoryId  = cells[3] ?? null;
      const unitId      = cells[4] ?? null;

      if (!code || !description) {
        result.errors.push({ row: idx, reason: 'Código y descripción son obligatorios.' });
        result.skipped++;
        continue;
      }
      if (isNaN(unitPrice) || unitPrice < 0) {
        result.errors.push({ row: idx, reason: `Precio inválido: "${cells[2]}".` });
        result.skipped++;
        continue;
      }

      try {
        await this.ds.query(
          `INSERT INTO products (product_id, product_code, product_description, product_unit_price, category_id, unit_id, product_active)
           VALUES ($1,$2,$3,$4,$5,$6,true)
           ON CONFLICT (product_code) DO UPDATE SET
             product_description = EXCLUDED.product_description,
             product_unit_price  = EXCLUDED.product_unit_price`,
          [randomUUID(), code, description, unitPrice.toFixed(2), categoryId || null, unitId || null],
        );
        result.imported++;
      } catch (e: unknown) {
        result.errors.push({ row: idx, reason: (e as Error).message });
        result.skipped++;
      }
    }

    return result;
  }

  async importClients(buffer: Buffer, mimetype: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
    const rows = await this.readRows(buffer, mimetype);

    for (const { idx, cells } of rows) {
      const description  = cells[0] ?? '';
      const documentTypeId = parseInt(cells[1] ?? '6');
      const documentNumber = cells[2] ?? '';

      if (!description || !documentNumber) {
        result.errors.push({ row: idx, reason: 'Descripción y número de documento son obligatorios.' });
        result.skipped++;
        continue;
      }

      try {
        await this.ds.query(
          `INSERT INTO clients (client_id, client_description, document_type_id, document_number, client_active)
           VALUES ($1,$2,$3,$4,true)
           ON CONFLICT (document_number) DO UPDATE SET
             client_description = EXCLUDED.client_description`,
          [randomUUID(), description, documentTypeId, documentNumber],
        );
        result.imported++;
      } catch (e: unknown) {
        result.errors.push({ row: idx, reason: (e as Error).message });
        result.skipped++;
      }
    }

    return result;
  }

  async importSuppliers(buffer: Buffer, mimetype: string): Promise<ImportResult> {
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };
    const rows = await this.readRows(buffer, mimetype);

    for (const { idx, cells } of rows) {
      const description = cells[0] ?? '';
      const ruc         = cells[1] ?? '';

      if (!description || !ruc) {
        result.errors.push({ row: idx, reason: 'Descripción y RUC son obligatorios.' });
        result.skipped++;
        continue;
      }
      if (!/^\d{11}$/.test(ruc)) {
        result.errors.push({ row: idx, reason: `RUC inválido: "${ruc}" (debe tener 11 dígitos).` });
        result.skipped++;
        continue;
      }

      try {
        await this.ds.query(
          `INSERT INTO suppliers (supplier_id, supplier_description, supplier_ruc, supplier_active)
           VALUES ($1,$2,$3,true)
           ON CONFLICT (supplier_ruc) DO UPDATE SET
             supplier_description = EXCLUDED.supplier_description`,
          [randomUUID(), description, ruc],
        );
        result.imported++;
      } catch (e: unknown) {
        result.errors.push({ row: idx, reason: (e as Error).message });
        result.skipped++;
      }
    }

    return result;
  }

  private async readRows(
    buffer: Buffer,
    mimetype: string,
  ): Promise<{ idx: number; cells: string[] }[]> {
    const isXlsx = mimetype.includes('spreadsheet') || mimetype.includes('excel') || mimetype.includes('xlsx');

    if (isXlsx) {
      const rows = await parseWorkbook(buffer);
      return rows.map((row, i) => ({
        idx: i + 2,
        cells: (row.values as ExcelJS.CellValue[]).slice(1).map(toStr),
      }));
    } else {
      const rows = await parseCsv(buffer);
      return rows.map((cells, i) => ({ idx: i + 2, cells }));
    }
  }
}
