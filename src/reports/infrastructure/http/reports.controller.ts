import {
  Controller, Get, HttpCode, HttpStatus, Query, Res, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import type { Response } from 'express';
import { DataSource } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';

interface PdtRow {
  sub_total: string;
  igv: string;
  total: string;
  cnt: string;
}

interface SaleRow {
  sale_number: string;
  sale_date: string;
  sub_total: string;
  igv: string;
  total: string;
}

interface PurchaseRow {
  purchase_id: string;
  purchase_date: string;
  sub_total: string;
  igv: string;
  total: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('reports')
export class ReportsController {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
  ) {}

  @Get('pdt621')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'PDT 621 — resumen IGV/Renta mensual',
    description: 'Devuelve los totales de ventas y compras del periodo para preparar el PDT 621.',
  })
  @ApiQuery({ name: 'period', example: '2026-08', description: 'Periodo YYYY-MM' })
  @ApiOkResponse({ description: 'Resumen PDT 621' })
  async pdt621(@Query('period') period: string) {
    if (!/^\d{4}-\d{2}$/.test(period ?? '')) {
      return { error: 'El parámetro period debe tener formato YYYY-MM.' };
    }
    const [year, month] = period.split('-');
    const dateFrom = `${year}-${month}-01`;
    const dateTo   = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    const [ventasRow, comprasRow] = await Promise.all([
      this.ds.query<PdtRow[]>(
        `SELECT COALESCE(SUM(sub_total),0)::TEXT AS sub_total,
                COALESCE(SUM(igv),0)::TEXT        AS igv,
                COALESCE(SUM(total),0)::TEXT       AS total,
                COUNT(*)::TEXT                     AS cnt
           FROM sales
          WHERE sale_date BETWEEN $1 AND $2`,
        [dateFrom, dateTo],
      ),
      this.ds.query<PdtRow[]>(
        `SELECT COALESCE(SUM(sub_total),0)::TEXT AS sub_total,
                COALESCE(SUM(igv),0)::TEXT        AS igv,
                COALESCE(SUM(total),0)::TEXT       AS total,
                COUNT(*)::TEXT                     AS cnt
           FROM purchases
          WHERE purchase_date BETWEEN $1 AND $2`,
        [dateFrom, dateTo],
      ),
    ]);

    const v = ventasRow[0];
    const c = comprasRow[0];
    const igvVentas  = parseFloat(v.igv);
    const igvCompras = parseFloat(c.igv);
    const igvNeto    = igvVentas - igvCompras;

    return {
      period,
      ventas: {
        baseImponible: v.sub_total,
        igv:           v.igv,
        total:         v.total,
        count:         Number(v.cnt),
      },
      compras: {
        baseImponible: c.sub_total,
        igv:           c.igv,
        total:         c.total,
        count:         Number(c.cnt),
      },
      igvDeterminado: igvNeto >= 0 ? igvNeto.toFixed(2) : null,
      saldoAFavor:    igvNeto < 0  ? Math.abs(igvNeto).toFixed(2) : null,
    };
  }

  @Get('ple/ventas')
  @ApiOperation({
    summary: 'PLE 14.1 — Registro de Ventas',
    description: 'Descarga el libro electrónico de ventas en formato texto delimitado por pipes.',
  })
  @ApiQuery({ name: 'period', example: '2026-08', description: 'Periodo YYYY-MM' })
  async pleVentas(@Query('period') period: string, @Res() res: Response) {
    if (!/^\d{4}-\d{2}$/.test(period ?? '')) {
      res.status(400).json({ error: 'El parámetro period debe tener formato YYYY-MM.' });
      return;
    }
    const [year, month] = period.split('-');
    const dateFrom = `${year}-${month}-01`;
    const dateTo   = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    const rows = await this.ds.query<SaleRow[]>(
      `SELECT s.sale_number, s.sale_date, s.sub_total, s.igv, s.total,
              c.document_number AS client_doc, c.client_description
         FROM sales s
         LEFT JOIN clients c ON c.client_id = s.client_id
        WHERE s.sale_date BETWEEN $1 AND $2
        ORDER BY s.sale_date, s.sale_number`,
      [dateFrom, dateTo],
    );

    const periodNoGuion = period.replace('-', '');
    const lines = rows.map((r, i) => {
      const correlativo = String(i + 1).padStart(8, '0');
      // PLE 14.1 simplified fields (pipe-delimited per SUNAT spec)
      return [
        period,                              // 1. Periodo
        correlativo,                         // 2. Correlativo
        r.sale_date?.replace(/-/g, '/') ?? '', // 3. Fecha emisión
        '',                                  // 4. Fecha vcto/pago
        '01',                                // 5. Tipo CDP (01=Factura)
        r.sale_number?.slice(0, 4) ?? '',    // 6. Serie
        r.sale_number?.slice(5) ?? '',       // 7. Número
        '',                                  // 8. Nro final (rangos)
        (r as any).client_doc ?? '',          // 9. RUC/DNI cliente
        (r as any).client_description ?? '', // 10. Razón social cliente
        parseFloat(r.sub_total).toFixed(2),  // 11. Base imponible gravada
        parseFloat(r.igv).toFixed(2),        // 12. IGV
        '0.00',                              // 13. Base imponible exonerada
        '0.00',                              // 14. Base imponible inafecta
        parseFloat(r.total).toFixed(2),      // 15. Importe total
        '1',                                 // 16. Tipo de cambio
        '1',                                 // 17. Estado (1=válido)
      ].join('|');
    });

    const content = lines.join('\r\n');
    const filename = `LE${periodNoGuion}00140100001111_01.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }

  @Get('ple/compras')
  @ApiOperation({
    summary: 'PLE 8.1 — Registro de Compras',
    description: 'Descarga el libro electrónico de compras en formato texto delimitado por pipes.',
  })
  @ApiQuery({ name: 'period', example: '2026-08', description: 'Periodo YYYY-MM' })
  async pleCompras(@Query('period') period: string, @Res() res: Response) {
    if (!/^\d{4}-\d{2}$/.test(period ?? '')) {
      res.status(400).json({ error: 'El parámetro period debe tener formato YYYY-MM.' });
      return;
    }
    const [year, month] = period.split('-');
    const dateFrom = `${year}-${month}-01`;
    const dateTo   = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    const rows = await this.ds.query<PurchaseRow[]>(
      `SELECT p.purchase_id, p.purchase_date, p.sub_total, p.igv, p.total,
              s.supplier_ruc, s.supplier_description
         FROM purchases p
         LEFT JOIN suppliers s ON s.supplier_id = p.supplier_id
        WHERE p.purchase_date BETWEEN $1 AND $2
        ORDER BY p.purchase_date`,
      [dateFrom, dateTo],
    );

    const periodNoGuion = period.replace('-', '');
    const lines = rows.map((r, i) => {
      const correlativo = String(i + 1).padStart(8, '0');
      return [
        period,                                    // 1. Periodo
        correlativo,                               // 2. Correlativo
        r.purchase_date?.replace(/-/g, '/') ?? '', // 3. Fecha emisión
        '',                                        // 4. Fecha vcto
        '01',                                      // 5. Tipo CDP (01=Factura)
        '',                                        // 6. Serie
        correlativo,                               // 7. Número
        (r as any).supplier_ruc ?? '',             // 8. RUC proveedor
        (r as any).supplier_description ?? '',     // 9. Razón social proveedor
        parseFloat(r.sub_total).toFixed(2),        // 10. Base imponible gravada
        parseFloat(r.igv).toFixed(2),              // 11. IGV
        '0.00',                                    // 12. Base imponible no gravada
        parseFloat(r.total).toFixed(2),            // 13. Importe total
        '1',                                       // 14. Tipo de cambio
        '1',                                       // 15. Estado (1=válido)
      ].join('|');
    });

    const content = lines.join('\r\n');
    const filename = `LE${periodNoGuion}00080100001111_01.txt`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }
}
