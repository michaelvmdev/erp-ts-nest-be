import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrmEntity } from '../clients/infrastructure/persistence/client.orm-entity';
import { MailModule } from '../mail/mail.module';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { StockModule } from '../stock/stock.module';
import { CreateSaleUseCase } from './application/create-sale.use-case';
import { FindSaleUseCase } from './application/find-sale.use-case';
import { GenerateClientSalesAmountReportPdfUseCase } from './application/generate-client-sales-amount-report-pdf.use-case';
import { GenerateProductSalesReportPdfUseCase } from './application/generate-product-sales-report-pdf.use-case';
import { GenerateSalePdfUseCase } from './application/generate-sale-pdf.use-case';
import { GenerateSalesByClientReportPdfUseCase } from './application/generate-sales-by-client-report-pdf.use-case';
import { GenerateSalesReportPdfUseCase } from './application/generate-sales-report-pdf.use-case';
import { SearchSalesUseCase } from './application/search-sales.use-case';
import { SendClientSalesAmountReportPdfUseCase } from './application/send-client-sales-amount-report-pdf.use-case';
import { SendProductSalesReportPdfUseCase } from './application/send-product-sales-report-pdf.use-case';
import { SendSalePdfUseCase } from './application/send-sale-pdf.use-case';
import { SendSalesByClientReportPdfUseCase } from './application/send-sales-by-client-report-pdf.use-case';
import { SendSalesReportPdfUseCase } from './application/send-sales-report-pdf.use-case';
import { UpdateSaleUseCase } from './application/update-sale.use-case';
import { SALE_CATALOG, SALE_REPOSITORY } from './domain/sale.repository';
import {
  SALE_PDF_RENDERER,
  SALE_PRINT_VIEW_READER,
} from './domain/sale-print-view';
import {
  CLIENT_SALES_AMOUNT_REPORT_PDF_RENDERER,
  CLIENT_SALES_AMOUNT_REPORT_READER,
} from './domain/client-sales-amount-report-view';
import {
  PRODUCT_SALES_REPORT_PDF_RENDERER,
  PRODUCT_SALES_REPORT_READER,
} from './domain/product-sales-report-view';
import {
  SALES_BY_CLIENT_REPORT_PDF_RENDERER,
  SALES_BY_CLIENT_REPORT_READER,
} from './domain/sales-by-client-report-view';
import {
  SALES_REPORT_PDF_RENDERER,
  SALES_REPORT_READER,
} from './domain/sales-report-view';
import { SalesController } from './infrastructure/http/sales.controller';
import { ClientSalesAmountReportPdfGenerator } from './infrastructure/pdf/client-sales-amount-report-pdf.generator';
import { ProductSalesReportPdfGenerator } from './infrastructure/pdf/product-sales-report-pdf.generator';
import { SalePdfGenerator } from './infrastructure/pdf/sale-pdf.generator';
import { SalesByClientReportPdfGenerator } from './infrastructure/pdf/sales-by-client-report-pdf.generator';
import { SalesReportPdfGenerator } from './infrastructure/pdf/sales-report-pdf.generator';
import {
  SaleDetailOrmEntity,
  SaleOrmEntity,
} from './infrastructure/persistence/sale.orm-entity';
import { TypeOrmClientSalesAmountReportReader } from './infrastructure/persistence/typeorm-client-sales-amount-report.reader';
import { TypeOrmProductSalesReportReader } from './infrastructure/persistence/typeorm-product-sales-report.reader';
import { TypeOrmSalePrintViewReader } from './infrastructure/persistence/typeorm-sale-print-view.reader';
import { TypeOrmSalesByClientReportReader } from './infrastructure/persistence/typeorm-sales-by-client-report.reader';
import { TypeOrmSalesReportReader } from './infrastructure/persistence/typeorm-sales-report.reader';
import { TypeOrmSaleRepository } from './infrastructure/persistence/typeorm-sale.repository';

@Module({
  imports: [
    // Las entidades de clientes y productos se registran aqui porque el
    // adaptador las consulta para resolver precios y estados. Son lecturas hacia
    // otros agregados, no escrituras: las ventas nunca modifican un producto.
    TypeOrmModule.forFeature([
      SaleOrmEntity,
      SaleDetailOrmEntity,
      ClientOrmEntity,
      ProductOrmEntity,
    ]),
    MailModule,
    StockModule,
  ],
  controllers: [SalesController],
  providers: [
    TypeOrmSaleRepository,
    { provide: SALE_REPOSITORY, useExisting: TypeOrmSaleRepository },
    // useExisting: el mismo adaptador satisface los dos puertos y debe
    // compartirse la instancia, no crear una por token.
    { provide: SALE_CATALOG, useExisting: TypeOrmSaleRepository },
    // Lado de lectura e impresion del comprobante.
    TypeOrmSalePrintViewReader,
    {
      provide: SALE_PRINT_VIEW_READER,
      useExisting: TypeOrmSalePrintViewReader,
    },
    SalePdfGenerator,
    { provide: SALE_PDF_RENDERER, useExisting: SalePdfGenerator },
    // Lado de lectura y armado del reporte de ventas por rango de fechas.
    TypeOrmSalesReportReader,
    { provide: SALES_REPORT_READER, useExisting: TypeOrmSalesReportReader },
    SalesReportPdfGenerator,
    {
      provide: SALES_REPORT_PDF_RENDERER,
      useExisting: SalesReportPdfGenerator,
    },
    // Lado de lectura y armado del reporte de productos vendidos por rango.
    TypeOrmProductSalesReportReader,
    {
      provide: PRODUCT_SALES_REPORT_READER,
      useExisting: TypeOrmProductSalesReportReader,
    },
    ProductSalesReportPdfGenerator,
    {
      provide: PRODUCT_SALES_REPORT_PDF_RENDERER,
      useExisting: ProductSalesReportPdfGenerator,
    },
    // Reporte de monto de venta por cliente (quienes nos compran).
    TypeOrmClientSalesAmountReportReader,
    {
      provide: CLIENT_SALES_AMOUNT_REPORT_READER,
      useExisting: TypeOrmClientSalesAmountReportReader,
    },
    ClientSalesAmountReportPdfGenerator,
    {
      provide: CLIENT_SALES_AMOUNT_REPORT_PDF_RENDERER,
      useExisting: ClientSalesAmountReportPdfGenerator,
    },
    // Reporte de ventas por cliente (detalle, filtrable por cliente).
    TypeOrmSalesByClientReportReader,
    {
      provide: SALES_BY_CLIENT_REPORT_READER,
      useExisting: TypeOrmSalesByClientReportReader,
    },
    SalesByClientReportPdfGenerator,
    {
      provide: SALES_BY_CLIENT_REPORT_PDF_RENDERER,
      useExisting: SalesByClientReportPdfGenerator,
    },
    FindSaleUseCase,
    SearchSalesUseCase,
    CreateSaleUseCase,
    UpdateSaleUseCase,
    GenerateSalePdfUseCase,
    GenerateSalesReportPdfUseCase,
    GenerateProductSalesReportPdfUseCase,
    GenerateClientSalesAmountReportPdfUseCase,
    GenerateSalesByClientReportPdfUseCase,
    SendSalePdfUseCase,
    SendSalesReportPdfUseCase,
    SendProductSalesReportPdfUseCase,
    SendClientSalesAmountReportPdfUseCase,
    SendSalesByClientReportPdfUseCase,
  ],
})
export class SalesModule {}
