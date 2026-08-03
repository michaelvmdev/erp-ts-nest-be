import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  SalePrintLine,
  SalePrintView,
  SalePrintViewReader,
} from '../../domain/sale-print-view';

/**
 * Lado de lectura: arma la vista imprimible con SQL directo sobre el DataSource.
 *
 * Se hace en dos consultas (cabecera y lineas) en vez de rehidratar el agregado
 * Sale, porque este solo tiene identificadores y el PDF necesita los nombres:
 * cliente, tipo de comprobante, ubigeo y producto. El id viaja parametrizado.
 */
@Injectable()
export class TypeOrmSalePrintViewReader implements SalePrintViewReader {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async byId(saleId: string): Promise<SalePrintView | null> {
    const cabeceras: Array<{
      saleId: string;
      saleNumber: string;
      saleTypeCode: string;
      saleTypeDescription: string;
      saleDate: string;
      saleHour: string;
      clientId: string;
      clientDescription: string;
      documentType: string;
      documentNumber: string;
      departmentId: string;
      departmentDescription: string;
      provinceId: string;
      provinceDescription: string;
      districtId: string;
      districtDescription: string;
      subTotal: string;
      igv: string;
      total: string;
    }> = await this.dataSource.query(
      `SELECT s.sale_id                                  AS "saleId",
              s.sale_number                              AS "saleNumber",
              substring(s.sale_number from 1 for 3)      AS "saleTypeCode",
              st.sale_type_description                   AS "saleTypeDescription",
              to_char(s.sale_date, 'YYYY-MM-DD')         AS "saleDate",
              to_char(s.sale_hour, 'HH24:MI:SS')         AS "saleHour",
              c.client_id                                AS "clientId",
              c.client_description                       AS "clientDescription",
              dt.document_type_description               AS "documentType",
              c.document_number                          AS "documentNumber",
              s.department_id                            AS "departmentId",
              dep.department_description                 AS "departmentDescription",
              s.province_id                              AS "provinceId",
              prov.province_description                  AS "provinceDescription",
              s.district_id                              AS "districtId",
              dist.district_description                  AS "districtDescription",
              s.sub_total::text                          AS "subTotal",
              s.igv::text                                AS "igv",
              s.total::text                              AS "total"
         FROM sales s
         JOIN clients c        ON c.client_id = s.client_id
         JOIN document_types dt ON dt.document_type_id = c.document_type_id
         JOIN sale_types st     ON st.sale_type_code = substring(s.sale_number from 1 for 3)
         JOIN departments dep   ON dep.department_id = s.department_id
         JOIN provinces prov    ON prov.province_id = s.province_id
         JOIN districts dist    ON dist.district_id = s.district_id
        WHERE s.sale_id = $1`,
      [saleId],
    );

    if (cabeceras.length === 0) return null;
    const h = cabeceras[0];

    const filas: Array<{
      item: number;
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: string;
      partial: string;
    }> = await this.dataSource.query(
      `SELECT sd.item              AS "item",
              sd.product_id        AS "productId",
              p.product_name       AS "productName",
              sd.quantity          AS "quantity",
              sd.unit_price::text  AS "unitPrice",
              sd.partial::text     AS "partial"
         FROM sale_details sd
         JOIN products p ON p.product_id = sd.product_id
        WHERE sd.sale_id = $1
        ORDER BY sd.item`,
      [saleId],
    );

    const lines: SalePrintLine[] = filas.map((f) => ({
      item: f.item,
      productId: f.productId,
      productName: f.productName,
      quantity: f.quantity,
      unitPrice: f.unitPrice,
      partial: f.partial,
    }));

    return {
      saleId: h.saleId,
      saleNumber: h.saleNumber,
      // Los char(n) del ubigeo y del codigo pueden venir con relleno; se recortan.
      saleTypeCode: h.saleTypeCode.trim(),
      saleTypeDescription: h.saleTypeDescription,
      saleDate: h.saleDate,
      saleHour: h.saleHour,
      client: {
        id: h.clientId,
        description: h.clientDescription,
        documentType: h.documentType,
        documentNumber: h.documentNumber,
      },
      location: {
        departmentId: h.departmentId.trim(),
        departmentDescription: h.departmentDescription,
        provinceId: h.provinceId.trim(),
        provinceDescription: h.provinceDescription,
        districtId: h.districtId.trim(),
        districtDescription: h.districtDescription,
      },
      subTotal: h.subTotal,
      igv: h.igv,
      total: h.total,
      lines,
    };
  }
}
