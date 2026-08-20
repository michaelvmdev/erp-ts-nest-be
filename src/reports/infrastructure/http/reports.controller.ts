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

  @Get('estado-resultados')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estado de Resultados mensual o acumulado' })
  @ApiQuery({ name: 'period', example: '2026-08', description: 'Periodo YYYY-MM (un mes)', required: false })
  @ApiQuery({ name: 'year',   example: '2026',    description: 'Año completo YYYY',        required: false })
  async estadoResultados(
    @Query('period') period?: string,
    @Query('year')   year?: string,
  ) {
    let dateFrom: string;
    let dateTo: string;
    let label: string;

    if (period && /^\d{4}-\d{2}$/.test(period)) {
      const [y, m] = period.split('-');
      dateFrom = `${y}-${m}-01`;
      dateTo   = new Date(Number(y), Number(m), 0).toISOString().slice(0, 10);
      label    = period;
    } else if (year && /^\d{4}$/.test(year)) {
      dateFrom = `${year}-01-01`;
      dateTo   = `${year}-12-31`;
      label    = year;
    } else {
      const now = new Date();
      dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      dateTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      label    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const [ventasRow, comprasRow, jlRows] = await Promise.all([
      this.ds.query<{ sub_total: string; igv: string; total: string }[]>(
        `SELECT COALESCE(SUM(sub_total),0)::TEXT AS sub_total,
                COALESCE(SUM(igv),0)::TEXT        AS igv,
                COALESCE(SUM(total),0)::TEXT       AS total
           FROM sales WHERE sale_date BETWEEN $1 AND $2`,
        [dateFrom, dateTo],
      ),
      this.ds.query<{ sub_total: string }[]>(
        `SELECT COALESCE(SUM(sub_total),0)::TEXT AS sub_total
           FROM purchases WHERE purchase_date BETWEEN $1 AND $2`,
        [dateFrom, dateTo],
      ),
      this.ds.query<{ account_code: string; saldo: string }[]>(
        `SELECT a.account_code,
                COALESCE(SUM(jl.debit - jl.credit), 0)::TEXT AS saldo
           FROM journal_lines jl
           JOIN journal_entries je ON je.entry_id = jl.entry_id
           JOIN accounts a ON a.account_id = jl.account_id
          WHERE je.entry_date BETWEEN $1 AND $2
          GROUP BY a.account_code`,
        [dateFrom, dateTo],
      ),
    ]);

    const sumByPrefix = (prefix: string): number =>
      jlRows
        .filter(r => r.account_code.startsWith(prefix))
        .reduce((acc, r) => acc + parseFloat(r.saldo), 0);

    const ventasJL     = Math.abs(sumByPrefix('70'));
    const otrosIngJL   = Math.abs(sumByPrefix('75') + sumByPrefix('77'));
    const costoVentasJL = Math.abs(sumByPrefix('69'));
    const gastosOpJL   = Math.abs(
      sumByPrefix('60') + sumByPrefix('61') + sumByPrefix('62') +
      sumByPrefix('63') + sumByPrefix('64') + sumByPrefix('65') +
      sumByPrefix('66') + sumByPrefix('67') + sumByPrefix('68'),
    );

    const ventasDirectas  = parseFloat(ventasRow[0].sub_total);
    const comprasDirectas = parseFloat(comprasRow[0].sub_total);

    const ingresos      = ventasJL  > 0 ? ventasJL  : ventasDirectas;
    const costoVentas   = costoVentasJL > 0 ? costoVentasJL : comprasDirectas;
    const otrosIngresos = otrosIngJL;
    const gastosOp      = gastosOpJL;

    const utilidadBruta      = ingresos - costoVentas;
    const utilidadOperativa  = utilidadBruta - gastosOp;
    const utilidadNeta       = utilidadOperativa + otrosIngresos;

    return {
      periodo: label,
      ingresos: {
        ventasNetas:   ingresos.toFixed(2),
        otrosIngresos: otrosIngresos.toFixed(2),
        total:         (ingresos + otrosIngresos).toFixed(2),
      },
      costos: {
        costoVentas:       costoVentas.toFixed(2),
        gastosOperativos:  gastosOp.toFixed(2),
        total:             (costoVentas + gastosOp).toFixed(2),
      },
      resultados: {
        utilidadBruta:     utilidadBruta.toFixed(2),
        utilidadOperativa: utilidadOperativa.toFixed(2),
        utilidadNeta:      utilidadNeta.toFixed(2),
      },
      fuente: ventasJL > 0 ? 'journal_lines' : 'tablas_directas',
    };
  }

  @Get('balance-general')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Balance General a una fecha de corte' })
  @ApiQuery({ name: 'date', example: '2026-08-31', description: 'Fecha de corte YYYY-MM-DD', required: false })
  async balanceGeneral(@Query('date') date?: string) {
    const corte = date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : new Date().toISOString().slice(0, 10);

    const [jlRows, treasuryRow, salesRow, purchasesRow] = await Promise.all([
      this.ds.query<{ account_code: string; nombre: string; saldo: string }[]>(
        `SELECT a.account_code, a.account_name AS nombre,
                COALESCE(SUM(jl.debit - jl.credit), 0)::TEXT AS saldo
           FROM journal_lines jl
           JOIN journal_entries je ON je.entry_id = jl.entry_id
           JOIN accounts a ON a.account_id = jl.account_id
          WHERE je.entry_date <= $1
          GROUP BY a.account_code, a.account_name
          ORDER BY a.account_code`,
        [corte],
      ),
      this.ds.query<{ total: string }[]>(
        `SELECT COALESCE(SUM(balance),0)::TEXT AS total FROM treasury_accounts`,
        [],
      ),
      this.ds.query<{ total: string }[]>(
        `SELECT COALESCE(SUM(total),0)::TEXT AS total FROM sales WHERE sale_date <= $1`,
        [corte],
      ),
      this.ds.query<{ total: string }[]>(
        `SELECT COALESCE(SUM(total),0)::TEXT AS total FROM purchases WHERE purchase_date <= $1`,
        [corte],
      ),
    ]);

    const sumByPrefix = (prefix: string): number =>
      jlRows
        .filter(r => r.account_code.startsWith(prefix))
        .reduce((acc, r) => acc + parseFloat(r.saldo), 0);

    const hasJL = jlRows.length > 0;

    const efectivo        = hasJL ? Math.abs(sumByPrefix('10')) : parseFloat(treasuryRow[0].total);
    const cuentasCobrar   = hasJL ? Math.abs(sumByPrefix('12')) : parseFloat(salesRow[0].total) * 0.3;
    const inventarios     = hasJL ? Math.abs(sumByPrefix('20') + sumByPrefix('21') + sumByPrefix('24') + sumByPrefix('25')) : 0;
    const otrosActCte     = hasJL ? Math.abs(sumByPrefix('16') + sumByPrefix('18') + sumByPrefix('19')) : 0;
    const activoFijo      = hasJL ? Math.abs(sumByPrefix('33') + sumByPrefix('32') + sumByPrefix('31')) : 0;
    const intangibles     = hasJL ? Math.abs(sumByPrefix('34') + sumByPrefix('38')) : 0;

    const cuentasPagar    = hasJL ? Math.abs(sumByPrefix('42') + sumByPrefix('41')) : parseFloat(purchasesRow[0].total) * 0.3;
    const tributosXPagar  = hasJL ? Math.abs(sumByPrefix('40')) : 0;
    const otrosPassCte    = hasJL ? Math.abs(sumByPrefix('44') + sumByPrefix('45')) : 0;
    const deudasLP        = hasJL ? Math.abs(sumByPrefix('46') + sumByPrefix('47')) : 0;

    const capital         = hasJL ? Math.abs(sumByPrefix('50')) : 0;
    const reservas        = hasJL ? Math.abs(sumByPrefix('57')) : 0;
    const resultadoAcum   = hasJL ? Math.abs(sumByPrefix('59')) : 0;

    const activoCorriente    = efectivo + cuentasCobrar + inventarios + otrosActCte;
    const activoNoCorriente  = activoFijo + intangibles;
    const totalActivo        = activoCorriente + activoNoCorriente;

    const pasivoCorriente    = cuentasPagar + tributosXPagar + otrosPassCte;
    const pasivoNoCorriente  = deudasLP;
    const totalPasivo        = pasivoCorriente + pasivoNoCorriente;

    const totalPatrimonio     = capital + reservas + resultadoAcum;
    const totalPasivoPatrim   = totalPasivo + totalPatrimonio;

    return {
      fechaCorte: corte,
      activo: {
        corriente: {
          efectivo:      efectivo.toFixed(2),
          cuentasCobrar: cuentasCobrar.toFixed(2),
          inventarios:   inventarios.toFixed(2),
          otros:         otrosActCte.toFixed(2),
          subtotal:      activoCorriente.toFixed(2),
        },
        noCorriente: {
          activoFijo:   activoFijo.toFixed(2),
          intangibles:  intangibles.toFixed(2),
          subtotal:     activoNoCorriente.toFixed(2),
        },
        total: totalActivo.toFixed(2),
      },
      pasivo: {
        corriente: {
          cuentasPagar:   cuentasPagar.toFixed(2),
          tributosXPagar: tributosXPagar.toFixed(2),
          otros:          otrosPassCte.toFixed(2),
          subtotal:       pasivoCorriente.toFixed(2),
        },
        noCorriente: {
          deudasLP:  deudasLP.toFixed(2),
          subtotal:  pasivoNoCorriente.toFixed(2),
        },
        total: totalPasivo.toFixed(2),
      },
      patrimonio: {
        capital:         capital.toFixed(2),
        reservas:        reservas.toFixed(2),
        resultadoAcum:   resultadoAcum.toFixed(2),
        total:           totalPatrimonio.toFixed(2),
      },
      totalPasivoPatrimonio: totalPasivoPatrim.toFixed(2),
      cuadra: Math.abs(totalActivo - totalPasivoPatrim) < 0.01,
      fuente: hasJL ? 'journal_lines' : 'estimacion_tablas_directas',
    };
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
