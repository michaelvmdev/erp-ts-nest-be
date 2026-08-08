import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  addTitle, applyDataRow, applyHeaderRow, applyTotalRow,
  MONEY_FMT, NUMBER_FMT, setColumnWidths, workbookToBuffer,
} from '../../../shared/infrastructure/excel/excel.helpers';
import type { SalesReportExcelRenderer } from '../../domain/sales-report-view';
import type { SalesReportView } from '../../domain/sales-report-view';

@Injectable()
export class SalesReportExcelGenerator implements SalesReportExcelRenderer {
  async render(view: SalesReportView): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AppSales';
    const ws = wb.addWorksheet('Ventas');

    const periodo = view.singleDay
      ? `Día ${view.dateFrom}`
      : `Del ${view.dateFrom} al ${view.dateTo}`;

    addTitle(ws, 'Reporte de Ventas', periodo, 9);
    setColumnWidths(ws, [14, 10, 14, 12, 12, 28, 12, 12, 14]);

    const headerRow = ws.addRow([
      'N° Comprobante', 'Tipo', 'Código', 'Fecha', 'Hora',
      'Cliente', 'Subtotal', 'IGV', 'Total',
    ]);
    applyHeaderRow(headerRow);

    view.rows.forEach((r, i) => {
      const row = ws.addRow([
        r.saleNumber, r.saleTypeCode, r.saleTypeDescription,
        r.saleDate, r.saleHour, r.clientDescription,
        parseFloat(r.subTotal), parseFloat(r.igv), parseFloat(r.total),
      ]);
      applyDataRow(row, i);
      row.getCell(7).numFmt = MONEY_FMT;
      row.getCell(8).numFmt = MONEY_FMT;
      row.getCell(9).numFmt = MONEY_FMT;
    });

    const totalRow = ws.addRow([
      `Total: ${view.totals.count} comprobante${view.totals.count === 1 ? '' : 's'}`,
      '', '', '', '', '',
      parseFloat(view.totals.subTotal),
      parseFloat(view.totals.igv),
      parseFloat(view.totals.total),
    ]);
    applyTotalRow(totalRow);
    totalRow.getCell(7).numFmt = MONEY_FMT;
    totalRow.getCell(8).numFmt = MONEY_FMT;
    totalRow.getCell(9).numFmt = MONEY_FMT;
    ws.mergeCells(totalRow.number, 1, totalRow.number, 6);

    ws.getColumn(7).alignment = { horizontal: 'right' };
    ws.getColumn(8).alignment = { horizontal: 'right' };
    ws.getColumn(9).alignment = { horizontal: 'right' };

    return workbookToBuffer(wb);
  }
}
