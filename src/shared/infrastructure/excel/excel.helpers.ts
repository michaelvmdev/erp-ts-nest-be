import ExcelJS from 'exceljs';

const BRAND_COLOR = '2F3A4A';
const TOTAL_BG    = 'E8EDF2';
const ALT_ROW_BG  = 'F5F6F8';

export function applyHeaderRow(row: ExcelJS.Row): void {
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${BRAND_COLOR}` } };
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF000000' } } };
  });
  row.height = 28;
}

export function applyDataRow(row: ExcelJS.Row, index: number): void {
  const bg = index % 2 === 0 ? ALT_ROW_BG : 'FFFFFFFF';
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bg}` } };
    cell.font = { size: 10 };
    cell.alignment = { vertical: 'middle' };
  });
  row.height = 20;
}

export function applyTotalRow(row: ExcelJS.Row): void {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${TOTAL_BG}` } };
    cell.font = { bold: true, size: 10 };
    cell.alignment = { vertical: 'middle' };
    cell.border = { top: { style: 'thin', color: { argb: 'FF2F3A4A' } } };
  });
  row.height = 22;
}

export function addTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string, colCount: number): void {
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: `FF${BRAND_COLOR}` } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(1).height = 32;

  ws.mergeCells(2, 1, 2, colCount);
  const subCell = ws.getCell(2, 1);
  subCell.value = subtitle;
  subCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(2).height = 20;

  ws.addRow([]);
}

export function setColumnWidths(ws: ExcelJS.Worksheet, widths: number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

export const MONEY_FMT = '#,##0.00';
export const NUMBER_FMT = '#,##0';

export async function workbookToBuffer(wb: ExcelJS.Workbook): Promise<Buffer> {
  const ab = await wb.xlsx.writeBuffer();
  return Buffer.from(ab);
}
