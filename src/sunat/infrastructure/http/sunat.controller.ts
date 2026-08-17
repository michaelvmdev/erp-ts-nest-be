import {
  Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe,
  Query, Res, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import type { Response } from 'express';
import { DataSource } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { buildUblInvoiceXml } from '../../domain/ubl-invoice.builder';
import { validateDniFormat, validateRucFormat } from '../../domain/ruc-validator';
import { ConfigService } from '@nestjs/config';

@ApiTags('sunat')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('sunat')
export class SunatController {
  constructor(
    @InjectDataSource()
    private readonly ds: DataSource,
    private readonly config: ConfigService,
  ) {}

  @Get('validate/ruc')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar RUC', description: 'Valida formato y dígito verificador del RUC.' })
  @ApiQuery({ name: 'numero', example: '20600897360' })
  async validateRuc(@Query('numero') numero: string) {
    const local = validateRucFormat(numero ?? '');
    return {
      numero: numero ?? '',
      ...local,
      source: 'local',
    };
  }

  @Get('validate/dni')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar DNI', description: 'Valida formato del DNI (8 dígitos).' })
  @ApiQuery({ name: 'numero', example: '12345678' })
  async validateDni(@Query('numero') numero: string) {
    const local = validateDniFormat(numero ?? '');
    return {
      numero: numero ?? '',
      ...local,
      source: 'local',
    };
  }

  @Get('facturas/:saleId/xml')
  @ApiOperation({
    summary: 'Generar XML UBL 2.1 para una venta',
    description:
      'Genera el XML de factura/boleta electrónica conforme al estándar SUNAT. ' +
      'El XML NO está firmado digitalmente; configurar el certificado digital en SUNAT_CERT_PATH para habilitar la firma y envío al OSE.',
  })
  async generateXml(
    @Param('saleId', new ParseUUIDPipe()) saleId: string,
    @Res() res: Response,
  ) {
    const rows = await this.ds.query<{
      sale_number: string; sale_date: string;
      sub_total: string; igv: string; total: string;
      client_description: string; document_number: string; document_type_id: number;
    }[]>(
      `SELECT s.sale_number, s.sale_date, s.sub_total, s.igv, s.total,
              c.client_description, c.document_number, c.document_type_id
         FROM sales s
         JOIN clients c ON c.client_id = s.client_id
        WHERE s.sale_id = $1`,
      [saleId],
    );

    if (rows.length === 0) {
      res.status(404).json({ error: 'Venta no encontrada.' });
      return;
    }
    const sale = rows[0];

    const detailRows = await this.ds.query<{
      item: number; quantity: number; unit_price: string; partial: string;
      product_description: string; unit_code: string;
    }[]>(
      `SELECT sd.item, sd.quantity, sd.unit_price, sd.partial,
              p.product_description, u.unit_code
         FROM sale_details sd
         JOIN products p ON p.product_id = sd.product_id
         LEFT JOIN units u ON u.unit_id = p.unit_id
        WHERE sd.sale_id = $1
        ORDER BY sd.item`,
      [saleId],
    );

    const IGV_RATE = 0.18;
    const subTotal = parseFloat(sale.sub_total);
    const igv      = parseFloat(sale.igv);
    const total    = parseFloat(sale.total);

    // Tipo de comprobante: F... = 01 Factura, B... = 03 Boleta
    const invoiceTypeCode: '01' | '03' = sale.sale_number.startsWith('F') ? '01' : '03';

    // Tipo de documento cliente: documento_type_id=6 → RUC, 1 → DNI
    const customerDocType: '6' | '1' = sale.document_type_id === 6 ? '6' : '1';

    const supplierRuc  = this.config.get<string>('SUNAT_RUC', '00000000000');
    const supplierName = this.config.get<string>('SUNAT_RAZON_SOCIAL', 'EMPRESA SIN CONFIGURAR S.A.C.');

    const lines = detailRows.map((d) => {
      const lineSubTotal = parseFloat(d.partial);
      return {
        lineNumber:          d.item,
        quantity:            d.quantity,
        unitCode:            d.unit_code ?? 'NIU',
        description:         d.product_description,
        unitPrice:           parseFloat(d.unit_price),
        lineExtensionAmount: lineSubTotal,
        taxAmount:           Math.round(lineSubTotal * IGV_RATE * 100) / 100,
      };
    });

    const xml = buildUblInvoiceXml({
      invoiceId:            sale.sale_number,
      issueDate:            sale.sale_date,
      invoiceTypeCode,
      documentCurrencyCode: 'PEN',
      supplierRuc,
      supplierName,
      customerDocType,
      customerDoc:          sale.document_number,
      customerName:         sale.client_description,
      subTotal,
      igv,
      total,
      lines,
    });

    const filename = `${supplierRuc}-${invoiceTypeCode}-${sale.sale_number}.xml`;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(xml);
  }
}
