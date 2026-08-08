import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  addTitle, applyDataRow, applyHeaderRow, applyTotalRow,
  MONEY_FMT, setColumnWidths, workbookToBuffer,
} from '../../../shared/infrastructure/excel/excel.helpers';
import type { PurchasesBySupplierReportExcelRenderer } from '../../domain/purchases-by-supplier-report-view';
import type { PurchasesBySupplierReportView } from '../../domain/purchases-by-supplier-report-view';

@Injectable()
export class PurchasesBySupplierReportExcelGenerator implements PurchasesBySupplierReportExcelRenderer {
  async render(view: PurchasesBySupplierReportView): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AppSales';
    const ws = wb.addWorksheet('Compras por Proveedor');

    const periodo = view.singleDay
      ? `Día ${view.dateFrom}`
      : `Del ${view.dateFrom} al ${view.dateTo}`;

    addTitle(ws, `Compras de ${view.supplierDescription}`, periodo, 5);
    setColumnWidths(ws, [14, 28, 14, 14, 14]);

    const headerRow = ws.addRow(['RUC', 'Proveedor', 'Fecha', 'IGV', 'Total']);
    applyHeaderRow(headerRow);

    view.rows.forEach((r, i) => {
      const row = ws.addRow([
        r.supplierRuc,
        r.supplierDescription,
        r.purchaseDate,
        parseFloat(r.igv),
        parseFloat(r.amount),
      ]);
      applyDataRow(row, i);
      row.getCell(4).numFmt = MONEY_FMT;
      row.getCell(5).numFmt = MONEY_FMT;
    });

    const totalRow = ws.addRow([
      `Total: ${view.totals.count} compra${view.totals.count === 1 ? '' : 's'}`,
      '', '',
      parseFloat(view.totals.igv),
      parseFloat(view.totals.amount),
    ]);
    applyTotalRow(totalRow);
    totalRow.getCell(4).numFmt = MONEY_FMT;
    totalRow.getCell(5).numFmt = MONEY_FMT;
    ws.mergeCells(totalRow.number, 1, totalRow.number, 3);

    ws.getColumn(4).alignment = { horizontal: 'right' };
    ws.getColumn(5).alignment = { horizontal: 'right' };

    return workbookToBuffer(wb);
  }
}
