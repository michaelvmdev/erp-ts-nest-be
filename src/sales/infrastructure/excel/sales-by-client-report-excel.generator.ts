import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  addTitle, applyDataRow, applyHeaderRow, applyTotalRow,
  MONEY_FMT, setColumnWidths, workbookToBuffer,
} from '../../../shared/infrastructure/excel/excel.helpers';
import type { SalesByClientReportExcelRenderer } from '../../domain/sales-by-client-report-view';
import type { SalesByClientReportView } from '../../domain/sales-by-client-report-view';

@Injectable()
export class SalesByClientReportExcelGenerator implements SalesByClientReportExcelRenderer {
  async render(view: SalesByClientReportView): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AppSales';
    const ws = wb.addWorksheet('Ventas por Cliente');

    const periodo = view.singleDay
      ? `Día ${view.dateFrom}`
      : `Del ${view.dateFrom} al ${view.dateTo}`;

    addTitle(ws, `Ventas de ${view.clientDescription}`, periodo, 5);
    setColumnWidths(ws, [14, 18, 28, 12, 14]);

    const headerRow = ws.addRow(['Tipo Doc.', 'N° Documento', 'Cliente', 'Fecha', 'IGV', 'Total']);
    applyHeaderRow(headerRow);

    view.rows.forEach((r, i) => {
      const row = ws.addRow([
        r.documentType,
        r.documentNumber,
        r.clientDescription,
        r.saleDate,
        parseFloat(r.igv),
        parseFloat(r.amount),
      ]);
      applyDataRow(row, i);
      row.getCell(5).numFmt = MONEY_FMT;
      row.getCell(6).numFmt = MONEY_FMT;
    });

    const totalRow = ws.addRow([
      `Total: ${view.totals.count} venta${view.totals.count === 1 ? '' : 's'}`,
      '', '', '',
      parseFloat(view.totals.igv),
      parseFloat(view.totals.amount),
    ]);
    applyTotalRow(totalRow);
    totalRow.getCell(5).numFmt = MONEY_FMT;
    totalRow.getCell(6).numFmt = MONEY_FMT;
    ws.mergeCells(totalRow.number, 1, totalRow.number, 4);

    ws.getColumn(5).alignment = { horizontal: 'right' };
    ws.getColumn(6).alignment = { horizontal: 'right' };

    return workbookToBuffer(wb);
  }
}
