import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { SupplierOrmEntity } from '../suppliers/infrastructure/persistence/supplier.orm-entity';
import { MailModule } from '../mail/mail.module';
import { StockModule } from '../stock/stock.module';
import { CreatePurchaseUseCase } from './application/create-purchase.use-case';
import { FindPurchaseUseCase } from './application/find-purchase.use-case';
import { GeneratePurchasesBySupplierReportPdfUseCase } from './application/generate-purchases-by-supplier-report-pdf.use-case';
import { GenerateSupplierPurchasesAmountReportPdfUseCase } from './application/generate-supplier-purchases-amount-report-pdf.use-case';
import { SearchPurchasesUseCase } from './application/search-purchases.use-case';
import { SendPurchasesBySupplierReportPdfUseCase } from './application/send-purchases-by-supplier-report-pdf.use-case';
import { SendSupplierPurchasesAmountReportPdfUseCase } from './application/send-supplier-purchases-amount-report-pdf.use-case';
import { UpdatePurchaseUseCase } from './application/update-purchase.use-case';
import { GenerateSupplierPurchasesAmountReportExcelUseCase } from './application/generate-supplier-purchases-amount-report-excel.use-case';
import { SendSupplierPurchasesAmountReportExcelUseCase } from './application/send-supplier-purchases-amount-report-excel.use-case';
import { GeneratePurchasesBySupplierReportExcelUseCase } from './application/generate-purchases-by-supplier-report-excel.use-case';
import { SendPurchasesBySupplierReportExcelUseCase } from './application/send-purchases-by-supplier-report-excel.use-case';
import {
  PURCHASES_BY_SUPPLIER_REPORT_PDF_RENDERER,
  PURCHASES_BY_SUPPLIER_REPORT_READER,
  PURCHASES_BY_SUPPLIER_REPORT_EXCEL_RENDERER,
} from './domain/purchases-by-supplier-report-view';
import {
  PURCHASE_CATALOG,
  PURCHASE_REPOSITORY,
} from './domain/purchase.repository';
import {
  SUPPLIER_PURCHASES_AMOUNT_REPORT_PDF_RENDERER,
  SUPPLIER_PURCHASES_AMOUNT_REPORT_READER,
  SUPPLIER_PURCHASES_AMOUNT_REPORT_EXCEL_RENDERER,
} from './domain/supplier-purchases-amount-report-view';
import { PurchasesController } from './infrastructure/http/purchases.controller';
import {
  PurchaseDetailOrmEntity,
  PurchaseOrmEntity,
} from './infrastructure/persistence/purchase.orm-entity';
import { TypeOrmPurchasesBySupplierReportReader } from './infrastructure/persistence/typeorm-purchases-by-supplier-report.reader';
import { TypeOrmPurchaseRepository } from './infrastructure/persistence/typeorm-purchase.repository';
import { TypeOrmSupplierPurchasesAmountReportReader } from './infrastructure/persistence/typeorm-supplier-purchases-amount-report.reader';
import { PurchasesBySupplierReportPdfGenerator } from './infrastructure/pdf/purchases-by-supplier-report-pdf.generator';
import { SupplierPurchasesAmountReportPdfGenerator } from './infrastructure/pdf/supplier-purchases-amount-report-pdf.generator';
import { SupplierPurchasesAmountReportExcelGenerator } from './infrastructure/excel/supplier-purchases-amount-report-excel.generator';
import { PurchasesBySupplierReportExcelGenerator } from './infrastructure/excel/purchases-by-supplier-report-excel.generator';

@Module({
  imports: [
    // Las entidades de proveedores y productos se registran aqui porque el
    // adaptador las consulta para validar existencia y estado. Son lecturas
    // hacia otros agregados, no escrituras: las compras nunca los modifican.
    TypeOrmModule.forFeature([
      PurchaseOrmEntity,
      PurchaseDetailOrmEntity,
      SupplierOrmEntity,
      ProductOrmEntity,
    ]),
    MailModule,
    StockModule,
  ],
  controllers: [PurchasesController],
  providers: [
    TypeOrmPurchaseRepository,
    { provide: PURCHASE_REPOSITORY, useExisting: TypeOrmPurchaseRepository },
    // useExisting: el mismo adaptador satisface los dos puertos y debe
    // compartirse la instancia, no crear una por token.
    { provide: PURCHASE_CATALOG, useExisting: TypeOrmPurchaseRepository },
    // Reporte de monto de compra por proveedor (quienes nos proveen).
    TypeOrmSupplierPurchasesAmountReportReader,
    {
      provide: SUPPLIER_PURCHASES_AMOUNT_REPORT_READER,
      useExisting: TypeOrmSupplierPurchasesAmountReportReader,
    },
    SupplierPurchasesAmountReportPdfGenerator,
    {
      provide: SUPPLIER_PURCHASES_AMOUNT_REPORT_PDF_RENDERER,
      useExisting: SupplierPurchasesAmountReportPdfGenerator,
    },
    // Reporte de compras por proveedor (detalle, filtrable por proveedor).
    TypeOrmPurchasesBySupplierReportReader,
    {
      provide: PURCHASES_BY_SUPPLIER_REPORT_READER,
      useExisting: TypeOrmPurchasesBySupplierReportReader,
    },
    PurchasesBySupplierReportPdfGenerator,
    {
      provide: PURCHASES_BY_SUPPLIER_REPORT_PDF_RENDERER,
      useExisting: PurchasesBySupplierReportPdfGenerator,
    },
    // Excel generators
    SupplierPurchasesAmountReportExcelGenerator,
    { provide: SUPPLIER_PURCHASES_AMOUNT_REPORT_EXCEL_RENDERER, useExisting: SupplierPurchasesAmountReportExcelGenerator },
    PurchasesBySupplierReportExcelGenerator,
    { provide: PURCHASES_BY_SUPPLIER_REPORT_EXCEL_RENDERER, useExisting: PurchasesBySupplierReportExcelGenerator },
    FindPurchaseUseCase,
    SearchPurchasesUseCase,
    CreatePurchaseUseCase,
    UpdatePurchaseUseCase,
    GenerateSupplierPurchasesAmountReportPdfUseCase,
    GeneratePurchasesBySupplierReportPdfUseCase,
    SendSupplierPurchasesAmountReportPdfUseCase,
    SendPurchasesBySupplierReportPdfUseCase,
    GenerateSupplierPurchasesAmountReportExcelUseCase,
    SendSupplierPurchasesAmountReportExcelUseCase,
    GeneratePurchasesBySupplierReportExcelUseCase,
    SendPurchasesBySupplierReportExcelUseCase,
  ],
})
export class PurchasesModule {}
