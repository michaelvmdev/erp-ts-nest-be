import { Module } from '@nestjs/common';
import { GetMonthlySalesUseCase } from './application/get-monthly-sales.use-case';
import { GetMonthlySalesByCategoryUseCase } from './application/get-monthly-sales-by-category.use-case';
import { GetMonthlySalesByUbigeoUseCase } from './application/get-monthly-sales-by-ubigeo.use-case';
import { GetTopClientUseCase } from './application/get-top-client.use-case';
import { GetTopDepartmentUseCase } from './application/get-top-department.use-case';
import { GetTopProductUseCase } from './application/get-top-product.use-case';
import { GetTopProductByMonthUseCase } from './application/get-top-product-by-month.use-case';
import { GetTotalSalesUseCase } from './application/get-total-sales.use-case';
import { DASHBOARD_REPOSITORY } from './domain/dashboard.repository';
import { DashboardController } from './infrastructure/http/dashboard.controller';
import { TypeOrmDashboardRepository } from './infrastructure/persistence/typeorm-dashboard.repository';

/**
 * No importa `TypeOrmModule.forFeature`: el repositorio consulta con SQL directo
 * sobre el `DataSource`, que ya es inyectable en toda la app desde
 * `DatabaseModule`. No hay entidad ORM propia porque el tablero no mapea ningun
 * agregado, solo lee agregaciones.
 */
@Module({
  controllers: [DashboardController],
  providers: [
    TypeOrmDashboardRepository,
    {
      provide: DASHBOARD_REPOSITORY,
      useExisting: TypeOrmDashboardRepository,
    },
    GetTotalSalesUseCase,
    GetTopProductUseCase,
    GetTopDepartmentUseCase,
    GetTopClientUseCase,
    GetMonthlySalesUseCase,
    GetMonthlySalesByUbigeoUseCase,
    GetMonthlySalesByCategoryUseCase,
    GetTopProductByMonthUseCase,
  ],
})
export class DashboardModule {}
