import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientOrmEntity } from '../clients/infrastructure/persistence/client.orm-entity';
import { MailModule } from '../mail/mail.module';
import { ProductOrmEntity } from '../products/infrastructure/persistence/product.orm-entity';
import { CreateSaleUseCase } from './application/create-sale.use-case';
import { FindSaleUseCase } from './application/find-sale.use-case';
import { GenerateSalePdfUseCase } from './application/generate-sale-pdf.use-case';
import { SearchSalesUseCase } from './application/search-sales.use-case';
import { SendSalePdfUseCase } from './application/send-sale-pdf.use-case';
import { UpdateSaleUseCase } from './application/update-sale.use-case';
import { SALE_CATALOG, SALE_REPOSITORY } from './domain/sale.repository';
import {
  SALE_PDF_RENDERER,
  SALE_PRINT_VIEW_READER,
} from './domain/sale-print-view';
import { SalesController } from './infrastructure/http/sales.controller';
import { SalePdfGenerator } from './infrastructure/pdf/sale-pdf.generator';
import {
  SaleDetailOrmEntity,
  SaleOrmEntity,
} from './infrastructure/persistence/sale.orm-entity';
import { TypeOrmSalePrintViewReader } from './infrastructure/persistence/typeorm-sale-print-view.reader';
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
    FindSaleUseCase,
    SearchSalesUseCase,
    CreateSaleUseCase,
    UpdateSaleUseCase,
    GenerateSalePdfUseCase,
    SendSalePdfUseCase,
  ],
})
export class SalesModule {}
