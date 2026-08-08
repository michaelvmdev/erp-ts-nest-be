import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  addTitle, applyDataRow, applyHeaderRow, applyTotalRow,
  MONEY_FMT, setColumnWidths, workbookToBuffer,
} from '../../../shared/infrastructure/excel/excel.helpers';
import type { ClientSalesAmountReportExcelRenderer } from '../../domain/client-sales-amount-report-view';
import type { ClientSalesAmountReportView } from '../../domain/client-sales-amount-report-view';

@Injectable()
export class ClientSalesAmountReportExcelGenerator implements ClientSalesAmountReportExcelRenderer {
  async render(view: ClientSalesAmountReportView): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AppSales';
    const ws = wb.addWorksheet('Clientes');

    const periodo = view.singleDay
      ? `Día ${view.dateFrom}`
      : `Del ${view.dateFrom} al ${view.dateTo}`;

    addTitle(ws, 'Reporte de Monto de Venta por Cliente', periodo, 4);
    setColumnWidths(ws, [36, 14, 14, 36]);

    const headerRow = ws.addRow(['Cliente', 'IGV', 'Total', 'UUID']);
    applyHeaderRow(headerRow);
    ws.getColumn(4).hidden = true;

    view.rows.forEach((r, i) => {
      const row = ws.addRow([
        r.clientDescription,
        parseFloat(r.igv),
        parseFloat(r.amount),
        r.clientId,
      ]);
      applyDataRow(row, i);
      row.getCell(2).numFmt = MONEY_FMT;
      row.getCell(3).numFmt = MONEY_FMT;
    });

    const totalRow = ws.addRow([
      `Total: ${view.totals.clientCount} cliente${view.totals.clientCount === 1 ? '' : 's'}`,
      parseFloat(view.totals.igv),
      parseFloat(view.totals.amount),
      '',
    ]);
    applyTotalRow(totalRow);
    totalRow.getCell(2).numFmt = MONEY_FMT;
    totalRow.getCell(3).numFmt = MONEY_FMT;

    ws.getColumn(2).alignment = { horizontal: 'right' };
    ws.getColumn(3).alignment = { horizontal: 'right' };

    return workbookToBuffer(wb);
  }
}
