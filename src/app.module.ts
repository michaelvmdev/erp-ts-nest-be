import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { validateEnv } from './config/env.validation';
import { BrandsModule } from './brands/brands.module';
import { ClientsModule } from './clients/clients.module';
import { DatabaseModule } from './database/database.module';
import { DocumentTypesModule } from './document-types/document-types.module';
import { HealthModule } from './health/health.module';
import { ProductsModule } from './products/products.module';

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
    DatabaseModule,
    HealthModule,
    DocumentTypesModule,
    ClientsModule,
    BrandsModule,
    ProductsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
