import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrmEntity } from '../clients/infrastructure/persistence/client.orm-entity';
import { MailModule } from '../mail/mail.module';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { CreateSaleUseCase } from './application/create-sale.use-case';
import { FindSaleUseCase } from './application/find-sale.use-case';
import { GenerateProductSalesReportPdfUseCase } from './application/generate-product-sales-report-pdf.use-case';
import { GenerateSalePdfUseCase } from './application/generate-sale-pdf.use-case';
import { GenerateSalesReportPdfUseCase } from './application/generate-sales-report-pdf.use-case';
import { SearchSalesUseCase } from './application/search-sales.use-case';
import { SendProductSalesReportPdfUseCase } from './application/send-product-sales-report-pdf.use-case';
import { SendSalePdfUseCase } from './application/send-sale-pdf.use-case';
import { SendSalesReportPdfUseCase } from './application/send-sales-report-pdf.use-case';
import { UpdateSaleUseCase } from './application/update-sale.use-case';
import { SALE_CATALOG, SALE_REPOSITORY } from './domain/sale.repository';
import {
  SALE_PDF_RENDERER,
  SALE_PRINT_VIEW_READER,
} from './domain/sale-print-view';
import {
  PRODUCT_SALES_REPORT_PDF_RENDERER,
  PRODUCT_SALES_REPORT_READER,
} from './domain/product-sales-report-view';
import {
  SALES_REPORT_PDF_RENDERER,
  SALES_REPORT_READER,
} from './domain/sales-report-view';
import { SalesController } from './infrastructure/http/sales.controller';
import { ProductSalesReportPdfGenerator } from './infrastructure/pdf/product-sales-report-pdf.generator';
import { SalePdfGenerator } from './infrastructure/pdf/sale-pdf.generator';
import { SalesReportPdfGenerator } from './infrastructure/pdf/sales-report-pdf.generator';
import {
  SaleDetailOrmEntity,
  SaleOrmEntity,
} from './infrastructure/persistence/sale.orm-entity';
import { TypeOrmProductSalesReportReader } from './infrastructure/persistence/typeorm-product-sales-report.reader';
import { TypeOrmSalePrintViewReader } from './infrastructure/persistence/typeorm-sale-print-view.reader';
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
    // Envio de correo para adjuntar el comprobante en PDF.
    MailModule,
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
    FindSaleUseCase,
    SearchSalesUseCase,
    CreateSaleUseCase,
    UpdateSaleUseCase,
    GenerateSalePdfUseCase,
    GenerateSalesReportPdfUseCase,
    GenerateProductSalesReportPdfUseCase,
    SendSalePdfUseCase,
    SendSalesReportPdfUseCase,
    SendProductSalesReportPdfUseCase,
  ],
})
export class SalesModule {}
