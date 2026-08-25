import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { BrandsModule } from './brands/brands.module';
import { CategoriesModule } from './categories/categories.module';
import { ClientsModule } from './clients/clients.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DatabaseModule } from './database/database.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';
import { PurchasesModule } from './purchases/purchases.module';
import { SaleTypesModule } from './sale-types/sale-types.module';
import { SalesModule } from './sales/sales.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { UbigeoModule } from './ubigeo/ubigeo.module';
import { UnitsModule } from './units/units.module';
import { WarehousesModule } from './warehouses/warehouses.module';
import { PriceListsModule } from './price-lists/price-lists.module';
import { StockModule } from './stock/stock.module';
import { CreditNotesModule } from './credit-notes/credit-notes.module';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { NpsModule } from './nps/nps.module';
import { UsersEcommerceModule } from './users-ecommerce/users-ecommerce.module';
import { ExportsModule } from './exports/exports.module';
import { SearchModule } from './search/search.module';
import { AuditModule } from './audit/audit.module';
import { AccountsModule } from './accounts/accounts.module';
import { PurchaseReturnsModule } from './purchase-returns/purchase-returns.module';
import { QuotesModule } from './quotes/quotes.module';
import { LotsModule } from './lots/lots.module';
import { JournalModule } from './journal/journal.module';
import { ReportsModule } from './reports/reports.module';
import { SunatModule } from './sunat/sunat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ImportsModule } from './imports/imports.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { DetraccionesModule } from './detracciones/detracciones.module';
import { TesoreriaModule } from './tesoreria/tesoreria.module';
import { ActivosFijosModule } from './activos-fijos/activos-fijos.module';
import { RrhhModule } from './rrhh/rrhh.module';
import { CrmModule } from './crm/crm.module';
import { ExchangeRatesModule } from './exchange-rates/exchange-rates.module';
import { RetencionesModule } from './retenciones/retenciones.module';
import { GuiasRemisionModule } from './guias-remision/guias-remision.module';
import { CuentasCobrarModule } from './cuentas-cobrar/cuentas-cobrar.module';
import { ConciliacionModule } from './conciliacion/conciliacion.module';
import { CostCentersModule } from './cost-centers/cost-centers.module';
import { PosModule } from './pos/pos.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { RecurringBillingModule } from './recurring-billing/recurring-billing.module';
import { ClientPortalModule } from './client-portal/client-portal.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Global: cualquier modulo puede inyectar ConfigService sin reimportarlo.
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      // Corta el arranque si falta o esta mal una variable obligatoria.
      validate: validateEnv,
    }),
    // Rate-limiting global. El TTL de la config de throttler va en milisegundos;
    // THROTTLE_TTL se expresa en segundos por ser mas legible en el .env.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.getOrThrow<number>('THROTTLE_TTL') * 1000,
            limit: config.getOrThrow<number>('THROTTLE_LIMIT'),
          },
        ],
        errorMessage:
          'Demasiadas peticiones. Espera unos segundos y vuelve a intentar.',
      }),
    }),
    DatabaseModule,
    HealthModule,
    DocumentTypesModule,
    ClientsModule,
    BrandsModule,
    UnitsModule,
    WarehousesModule,
    PriceListsModule,
    StockModule,
    CreditNotesModule,
    PurchaseOrdersModule,
    PaymentsModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    PurchasesModule,
    SaleTypesModule,
    SalesModule,
    SuppliersModule,
    UbigeoModule,
    DashboardModule,
    NpsModule,
    UsersEcommerceModule,
    ExportsModule,
    SearchModule,
    AuditModule,
    AccountsModule,
    PurchaseReturnsModule,
    QuotesModule,
    LotsModule,
    JournalModule,
    ReportsModule,
    SunatModule,
    NotificationsModule,
    ImportsModule,
    AttachmentsModule,
    WebhooksModule,
    DetraccionesModule,
    TesoreriaModule,
    ActivosFijosModule,
    RrhhModule,
    CrmModule,
    ExchangeRatesModule,
    RetencionesModule,
    GuiasRemisionModule,
    CuentasCobrarModule,
    ConciliacionModule,
    CostCentersModule,
    PosModule,
    ProjectsModule,
    ContractsModule,
    RecurringBillingModule,
    ClientPortalModule,
    CompaniesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Guard global: el rate-limiting aplica a todos los endpoints por igual, sin
    // un decorador por controlador que se olvide justo en el endpoint nuevo.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
