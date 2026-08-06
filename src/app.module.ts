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
    CategoriesModule,
    ProductsModule,
    PurchasesModule,
    SaleTypesModule,
    SalesModule,
    SuppliersModule,
    UbigeoModule,
    DashboardModule,
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
