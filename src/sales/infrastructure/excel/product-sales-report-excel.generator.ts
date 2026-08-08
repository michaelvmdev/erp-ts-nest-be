import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import {
  addTitle, applyDataRow, applyHeaderRow, applyTotalRow,
  MONEY_FMT, NUMBER_FMT, setColumnWidths, workbookToBuffer,
} from '../../../shared/infrastructure/excel/excel.helpers';
import type { ProductSalesReportExcelRenderer } from '../../domain/product-sales-report-view';
import type { ProductSalesReportView } from '../../domain/product-sales-report-view';

@Injectable()
export class ProductSalesReportExcelGenerator implements ProductSalesReportExcelRenderer {
  async render(view: ProductSalesReportView): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'AppSales';
    const ws = wb.addWorksheet('Productos');

    const periodo = view.singleDay
      ? `Día ${view.dateFrom}`
      : `Del ${view.dateFrom} al ${view.dateTo}`;
    const ordenLabel = view.orderBy === 'amount' ? 'monto' : 'cantidad';

    addTitle(ws, 'Reporte de Productos Vendidos', `${periodo} — ordenado por ${ordenLabel}`, 5);
    setColumnWidths(ws, [36, 12, 12, 14, 14]);

    const headerRow = ws.addRow(['Producto', 'Cantidad', 'IGV', 'Total', 'UUID']);
    applyHeaderRow(headerRow);
    ws.getColumn(5).hidden = true;

    view.rows.forEach((r, i) => {
      const row = ws.addRow([
        r.productName,
        r.quantity,
        parseFloat(r.igv),
        parseFloat(r.total),
        r.productId,
      ]);
      applyDataRow(row, i);
      row.getCell(2).numFmt = NUMBER_FMT;
      row.getCell(3).numFmt = MONEY_FMT;
      row.getCell(4).numFmt = MONEY_FMT;
    });

    const totalRow = ws.addRow([
      `Total: ${view.totals.productCount} producto${view.totals.productCount === 1 ? '' : 's'}`,
      view.totals.quantity,
      parseFloat(view.totals.igv),
      parseFloat(view.totals.total),
      '',
    ]);
    applyTotalRow(totalRow);
    totalRow.getCell(2).numFmt = NUMBER_FMT;
    totalRow.getCell(3).numFmt = MONEY_FMT;
    totalRow.getCell(4).numFmt = MONEY_FMT;

    ws.getColumn(2).alignment = { horizontal: 'right' };
    ws.getColumn(3).alignment = { horizontal: 'right' };
    ws.getColumn(4).alignment = { horizontal: 'right' };

    return workbookToBuffer(wb);
  }
}
