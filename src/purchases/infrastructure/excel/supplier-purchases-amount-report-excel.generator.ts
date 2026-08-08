import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  addTitle, applyDataRow, applyHeaderRow, applyTotalRow,
  MONEY_FMT, setColumnWidths, workbookToBuffer,
} from '../../../shared/infrastructure/excel/excel.helpers';
import type { SupplierPurchasesAmountReportExcelRenderer } from '../../domain/supplier-purchases-amount-report-view';
import type { SupplierPurchasesAmountReportView } from '../../domain/supplier-purchases-amount-report-view';

@Injectable()
export class SupplierPurchasesAmountReportExcelGenerator implements SupplierPurchasesAmountReportExcelRenderer {
  async render(view: SupplierPurchasesAmountReportView): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AppSales';
    const ws = wb.addWorksheet('Proveedores');

    const periodo = view.singleDay
      ? `Día ${view.dateFrom}`
      : `Del ${view.dateFrom} al ${view.dateTo}`;

    addTitle(ws, 'Reporte de Monto de Compra por Proveedor', periodo, 4);
    setColumnWidths(ws, [36, 14, 14, 36]);

    const headerRow = ws.addRow(['Proveedor', 'IGV', 'Total', 'UUID']);
    applyHeaderRow(headerRow);
    ws.getColumn(4).hidden = true;

    view.rows.forEach((r, i) => {
      const row = ws.addRow([
        r.supplierDescription,
        parseFloat(r.igv),
        parseFloat(r.amount),
        r.supplierId,
      ]);
      applyDataRow(row, i);
      row.getCell(2).numFmt = MONEY_FMT;
      row.getCell(3).numFmt = MONEY_FMT;
    });

    const totalRow = ws.addRow([
      `Total: ${view.totals.supplierCount} proveedor${view.totals.supplierCount === 1 ? '' : 'es'}`,
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
