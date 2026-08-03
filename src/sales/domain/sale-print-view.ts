/**
 * Vista de lectura de una venta pensada para imprimirla.
 *
 * No es el agregado Sale: es un read model plano que ya trae resueltos los
 * nombres (cliente, tipo de comprobante, ubigeo, producto) que el PDF necesita y
 * que el agregado solo guarda como identificadores. Los importes viajan como
 * cadena decimal, igual que en el resto del proyecto.
 */

export interface SalePrintLine {
  item: number;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: string;
  partial: string;
}

export interface SalePrintView {
  saleId: string;
  saleNumber: string;
  saleTypeCode: string;
  saleTypeDescription: string;
  saleDate: string;
  saleHour: string;
  client: {
    id: string;
    description: string;
    documentType: string;
    documentNumber: string;
  };
  location: {
    departmentId: string;
    departmentDescription: string;
    provinceId: string;
    provinceDescription: string;
    districtId: string;
    districtDescription: string;
  };
  subTotal: string;
  igv: string;
  total: string;
  lines: SalePrintLine[];
}

/** Puerto de lectura: arma la vista imprimible de una venta. */
export interface SalePrintViewReader {
  byId(saleId: string): Promise<SalePrintView | null>;
}

export const SALE_PRINT_VIEW_READER = Symbol('SalePrintViewReader');

/**
 * Puerto de salida para convertir la vista en un PDF. La aplicacion depende de
 * esta interfaz y no de pdfkit; el adaptador concreto vive en infraestructura.
 */
export interface SalePdfRenderer {
  render(view: SalePrintView): Promise<Buffer>;
}

export const SALE_PDF_RENDERER = Symbol('SalePdfRenderer');
