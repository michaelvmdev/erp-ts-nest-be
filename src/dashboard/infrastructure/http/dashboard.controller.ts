import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { GetMonthlySalesUseCase } from '../../application/get-monthly-sales.use-case';
import { GetMonthlySalesByCategoryUseCase } from '../../application/get-monthly-sales-by-category.use-case';
import { GetMonthlySalesByUbigeoUseCase } from '../../application/get-monthly-sales-by-ubigeo.use-case';
import { GetMonthlyPurchasesUseCase } from '../../application/get-monthly-purchases.use-case';
import { GetMonthlyPurchasesByCategoryUseCase } from '../../application/get-monthly-purchases-by-category.use-case';
import { GetTopClientUseCase } from '../../application/get-top-client.use-case';
import { GetTopDepartmentUseCase } from '../../application/get-top-department.use-case';
import { GetTopProductUseCase } from '../../application/get-top-product.use-case';
import { GetTopProductByMonthUseCase } from '../../application/get-top-product-by-month.use-case';
import { GetTopPurchasedProductUseCase } from '../../application/get-top-purchased-product.use-case';
import { GetTopPurchasedProductByMonthUseCase } from '../../application/get-top-purchased-product-by-month.use-case';
import { GetTopSupplierUseCase } from '../../application/get-top-supplier.use-case';
import { GetTotalSalesUseCase } from '../../application/get-total-sales.use-case';
import { GetTotalPurchasesUseCase } from '../../application/get-total-purchases.use-case';
import { GetYearlySalesUseCase } from '../../application/get-yearly-sales.use-case';
import { GetYearlyPurchasesUseCase } from '../../application/get-yearly-purchases.use-case';
import { MonthlySalesByCategoryQueryDto } from './dto/monthly-sales-by-category.query.dto';
import { MonthlySalesByUbigeoQueryDto } from './dto/monthly-sales-by-ubigeo.query.dto';
import { MonthlySalesResponseDto } from './dto/monthly-sales.response.dto';
import { MonthlyPurchasesByCategoryQueryDto } from './dto/monthly-purchases-by-category.query.dto';
import { MonthlyPurchasesResponseDto } from './dto/monthly-purchases.response.dto';
import { TopClientResponseDto } from './dto/top-client.response.dto';
import { TopDepartmentResponseDto } from './dto/top-department.response.dto';
import { TopProductByMonthResponseDto } from './dto/top-product-by-month.response.dto';
import { TopProductResponseDto } from './dto/top-product.response.dto';
import { TopPurchasedProductByMonthResponseDto } from './dto/top-purchased-product-by-month.response.dto';
import { TopPurchasedProductResponseDto } from './dto/top-purchased-product.response.dto';
import { TopSupplierResponseDto } from './dto/top-supplier.response.dto';
import { TotalSalesResponseDto } from './dto/total-sales.response.dto';
import { TotalPurchasesResponseDto } from './dto/total-purchases.response.dto';
import { YearQueryDto } from './dto/year.query.dto';
import { YearlySalesResponseDto } from './dto/yearly-sales.response.dto';
import { YearlyPurchasesResponseDto } from './dto/yearly-purchases.response.dto';

/**
 * Indicadores del mes actual para el tablero del front.
 *
 * Cuatro endpoints separados, uno por tarjeta, para que cada una refresque por
 * su lado. Todos son de solo lectura y se refieren al mes en curso; no reciben
 * parametros. Los `top-*` responden 200 con `null` cuando el mes aun no tiene
 * ventas: el tablero muestra "sin datos", no un error.
 */
@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getTotalSales: GetTotalSalesUseCase,
    private readonly getTopProduct: GetTopProductUseCase,
    private readonly getTopDepartment: GetTopDepartmentUseCase,
    private readonly getTopClient: GetTopClientUseCase,
    private readonly getMonthlySales: GetMonthlySalesUseCase,
    private readonly getMonthlySalesByUbigeo: GetMonthlySalesByUbigeoUseCase,
    private readonly getMonthlySalesByCategory: GetMonthlySalesByCategoryUseCase,
    private readonly getTopProductByMonth: GetTopProductByMonthUseCase,
    private readonly getYearlySales: GetYearlySalesUseCase,
    private readonly getTotalPurchases: GetTotalPurchasesUseCase,
    private readonly getTopPurchasedProduct: GetTopPurchasedProductUseCase,
    private readonly getTopSupplier: GetTopSupplierUseCase,
    private readonly getMonthlyPurchases: GetMonthlyPurchasesUseCase,
    private readonly getMonthlyPurchasesByCategory: GetMonthlyPurchasesByCategoryUseCase,
    private readonly getTopPurchasedProductByMonth: GetTopPurchasedProductByMonthUseCase,
    private readonly getYearlyPurchases: GetYearlyPurchasesUseCase,
  ) {}

  @Get('total-sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ventas totales del mes',
    description:
      'Suma de los totales y cantidad de comprobantes emitidos en el mes en curso.',
  })
  @ApiOkResponse({
    description:
      'Ventas del mes. Con cero ventas, `amount` es "0.00" y `count` 0.',
    type: TotalSalesResponseDto,
  })
  async totalSales(): Promise<TotalSalesResponseDto> {
    const m = await this.getTotalSales.execute();
    return TotalSalesResponseDto.fromReadModel(m);
  }

  @Get('top-product')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Producto más vendido del mes',
    description:
      'Producto con más unidades vendidas en el mes en curso, sumando todas las ventas.',
  })
  @ApiOkResponse({
    description: 'Producto más vendido, o `null` si el mes no tiene ventas.',
    type: TopProductResponseDto,
  })
  async topProduct(): Promise<TopProductResponseDto | null> {
    const m = await this.getTopProduct.execute();
    return m ? TopProductResponseDto.fromReadModel(m) : null;
  }

  @Get('top-department')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Departamento con más compras del mes',
    description:
      'Departamento con mayor monto total comprado en el mes en curso.',
  })
  @ApiOkResponse({
    description: 'Departamento líder, o `null` si el mes no tiene ventas.',
    type: TopDepartmentResponseDto,
  })
  async topDepartment(): Promise<TopDepartmentResponseDto | null> {
    const m = await this.getTopDepartment.execute();
    return m ? TopDepartmentResponseDto.fromReadModel(m) : null;
  }

  @Get('top-client')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cliente con más compras del mes',
    description: 'Cliente con mayor monto total comprado en el mes en curso.',
  })
  @ApiOkResponse({
    description: 'Cliente líder, o `null` si el mes no tiene ventas.',
    type: TopClientResponseDto,
  })
  async topClient(): Promise<TopClientResponseDto | null> {
    const m = await this.getTopClient.execute();
    return m ? TopClientResponseDto.fromReadModel(m) : null;
  }

  // --- Diagramas anuales para el front ---
  //
  // Cada uno devuelve una serie de los 12 meses del ano indicado. Los meses sin
  // ventas vienen igual, con total en cero, para que el eje del grafico quede
  // completo sin que el front tenga que rellenar huecos.

  @Get('monthly-sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ventas mensuales del ano',
    description:
      'Suma de los totales de venta por mes para el ano indicado. Diagrama ' +
      '"Ventas Mensuales del Ano YYYY": [month, total].',
  })
  @ApiOkResponse({
    description: 'Serie de 12 meses con el total de cada uno.',
    type: MonthlySalesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ano falta o esta fuera de rango.',
    type: ApiErrorDto,
  })
  async monthlySales(
    @Query() query: YearQueryDto,
  ): Promise<MonthlySalesResponseDto> {
    const rows = await this.getMonthlySales.execute(query.year);
    return MonthlySalesResponseDto.build(query.year, rows);
  }

  @Get('monthly-sales-by-ubigeo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ventas mensuales por localidad (ubigeo) del ano',
    description:
      'Suma de los totales de venta por mes, filtrando por localidad. ' +
      '`departmentId` es obligatorio; `provinceId` y `districtId` permiten ' +
      'afinar el filtro. Diagrama "Ventas Totales por Localidad del Ano YYYY".',
  })
  @ApiOkResponse({
    description: 'Serie de 12 meses con el total de la localidad en cada uno.',
    type: MonthlySalesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ano o algun codigo de ubigeo es invalido.',
    type: ApiErrorDto,
  })
  async monthlySalesByUbigeo(
    @Query() query: MonthlySalesByUbigeoQueryDto,
  ): Promise<MonthlySalesResponseDto> {
    const rows = await this.getMonthlySalesByUbigeo.execute(query.year, {
      departmentId: query.departmentId,
      provinceId: query.provinceId,
      districtId: query.districtId,
    });
    return MonthlySalesResponseDto.build(query.year, rows);
  }

  @Get('monthly-sales-by-category')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ventas mensuales por categoria del ano',
    description:
      'Suma de los importes de linea (sale_details) por mes para los productos ' +
      'de la categoria indicada. Diagrama "Ventas Totales por Categoria del Ano YYYY".',
  })
  @ApiOkResponse({
    description: 'Serie de 12 meses con el total de la categoria en cada uno.',
    type: MonthlySalesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ano o el categoryId es invalido.',
    type: ApiErrorDto,
  })
  async monthlySalesByCategory(
    @Query() query: MonthlySalesByCategoryQueryDto,
  ): Promise<MonthlySalesResponseDto> {
    const rows = await this.getMonthlySalesByCategory.execute(
      query.year,
      query.categoryId,
    );
    return MonthlySalesResponseDto.build(query.year, rows);
  }

  @Get('top-product-by-month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Producto mas vendido por mes del ano',
    description:
      'Producto con mas unidades vendidas en cada mes del ano. Diagrama ' +
      '"Producto mas vendido por Mes del Ano YYYY": [month, productDescription]. ' +
      'Los meses sin ventas traen el producto en null.',
  })
  @ApiOkResponse({
    description: 'Serie de 12 meses con el producto lider de cada uno.',
    type: TopProductByMonthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ano falta o esta fuera de rango.',
    type: ApiErrorDto,
  })
  async topProductByMonth(
    @Query() query: YearQueryDto,
  ): Promise<TopProductByMonthResponseDto> {
    const rows = await this.getTopProductByMonth.execute(query.year);
    return TopProductByMonthResponseDto.build(query.year, rows);
  }

  @Get('yearly-sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ventas por ano',
    description:
      'Suma de los totales de venta por ano, sin filtros. Diagrama lineal ' +
      '"Ventas por Ano": [year, total].',
  })
  @ApiOkResponse({
    description: 'Serie de anos en orden ascendente con el total de cada uno.',
    type: YearlySalesResponseDto,
  })
  async yearlySales(): Promise<YearlySalesResponseDto> {
    const rows = await this.getYearlySales.execute();
    return YearlySalesResponseDto.build(rows);
  }

  // ==========================================================================
  //  Compras
  //  Los mismos indicadores y diagramas que ventas, ahora sobre `purchases`.
  //  No hay contrapartes de "top-department" ni "monthly-sales-by-ubigeo":
  //  las compras no tienen ubigeo. El "quien" del mes es el proveedor.
  // ==========================================================================

  @Get('total-purchases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compras totales del mes',
    description:
      'Suma de los totales y cantidad de compras registradas en el mes en curso.',
  })
  @ApiOkResponse({
    description:
      'Compras del mes. Sin compras, `amount` es "0.00" y `count` 0.',
    type: TotalPurchasesResponseDto,
  })
  async totalPurchases(): Promise<TotalPurchasesResponseDto> {
    const m = await this.getTotalPurchases.execute();
    return TotalPurchasesResponseDto.fromReadModel(m);
  }

  @Get('top-purchased-product')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Producto más comprado del mes',
    description:
      'Producto con más unidades compradas en el mes en curso, sumando todas las compras.',
  })
  @ApiOkResponse({
    description: 'Producto más comprado, o `null` si el mes no tiene compras.',
    type: TopPurchasedProductResponseDto,
  })
  async topPurchasedProduct(): Promise<TopPurchasedProductResponseDto | null> {
    const m = await this.getTopPurchasedProduct.execute();
    return m ? TopPurchasedProductResponseDto.fromReadModel(m) : null;
  }

  @Get('top-supplier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Proveedor con más compras del mes',
    description:
      'Proveedor con mayor monto total comprado en el mes en curso. Contraparte ' +
      'de "top-client" del lado de ventas.',
  })
  @ApiOkResponse({
    description: 'Proveedor líder, o `null` si el mes no tiene compras.',
    type: TopSupplierResponseDto,
  })
  async topSupplier(): Promise<TopSupplierResponseDto | null> {
    const m = await this.getTopSupplier.execute();
    return m ? TopSupplierResponseDto.fromReadModel(m) : null;
  }

  @Get('monthly-purchases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compras mensuales del ano',
    description:
      'Suma de los totales de compra por mes para el ano indicado. Diagrama ' +
      '"Compras Mensuales del Ano YYYY": [month, total].',
  })
  @ApiOkResponse({
    description: 'Serie de 12 meses con el total de cada uno.',
    type: MonthlyPurchasesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ano falta o esta fuera de rango.',
    type: ApiErrorDto,
  })
  async monthlyPurchases(
    @Query() query: YearQueryDto,
  ): Promise<MonthlyPurchasesResponseDto> {
    const rows = await this.getMonthlyPurchases.execute(query.year);
    return MonthlyPurchasesResponseDto.build(query.year, rows);
  }

  @Get('monthly-purchases-by-category')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compras mensuales por categoria del ano',
    description:
      'Suma de los importes de linea (purchase_details) por mes para los ' +
      'productos de la categoria indicada. Diagrama "Compras Totales por ' +
      'Categoria del Ano YYYY".',
  })
  @ApiOkResponse({
    description: 'Serie de 12 meses con el total de la categoria en cada uno.',
    type: MonthlyPurchasesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ano o el categoryId es invalido.',
    type: ApiErrorDto,
  })
  async monthlyPurchasesByCategory(
    @Query() query: MonthlyPurchasesByCategoryQueryDto,
  ): Promise<MonthlyPurchasesResponseDto> {
    const rows = await this.getMonthlyPurchasesByCategory.execute(
      query.year,
      query.categoryId,
    );
    return MonthlyPurchasesResponseDto.build(query.year, rows);
  }

  @Get('top-purchased-product-by-month')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Producto mas comprado por mes del ano',
    description:
      'Producto con mas unidades compradas en cada mes del ano. Diagrama ' +
      '"Producto mas comprado por Mes del Ano YYYY": [month, productDescription]. ' +
      'Los meses sin compras traen el producto en null.',
  })
  @ApiOkResponse({
    description: 'Serie de 12 meses con el producto lider de cada uno.',
    type: TopPurchasedProductByMonthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El ano falta o esta fuera de rango.',
    type: ApiErrorDto,
  })
  async topPurchasedProductByMonth(
    @Query() query: YearQueryDto,
  ): Promise<TopPurchasedProductByMonthResponseDto> {
    const rows = await this.getTopPurchasedProductByMonth.execute(query.year);
    return TopPurchasedProductByMonthResponseDto.build(query.year, rows);
  }

  @Get('yearly-purchases')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compras por ano',
    description:
      'Suma de los totales de compra por ano, sin filtros. Diagrama lineal ' +
      '"Compras por Ano": [year, total].',
  })
  @ApiOkResponse({
    description: 'Serie de anos en orden ascendente con el total de cada uno.',
    type: YearlyPurchasesResponseDto,
  })
  async yearlyPurchases(): Promise<YearlyPurchasesResponseDto> {
    const rows = await this.getYearlyPurchases.execute();
    return YearlyPurchasesResponseDto.build(rows);
  }
}
