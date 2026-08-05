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
import { GetTopClientUseCase } from '../../application/get-top-client.use-case';
import { GetTopDepartmentUseCase } from '../../application/get-top-department.use-case';
import { GetTopProductUseCase } from '../../application/get-top-product.use-case';
import { GetTopProductByMonthUseCase } from '../../application/get-top-product-by-month.use-case';
import { GetTotalSalesUseCase } from '../../application/get-total-sales.use-case';
import { GetYearlySalesUseCase } from '../../application/get-yearly-sales.use-case';
import { MonthlySalesByCategoryQueryDto } from './dto/monthly-sales-by-category.query.dto';
import { MonthlySalesByUbigeoQueryDto } from './dto/monthly-sales-by-ubigeo.query.dto';
import { MonthlySalesResponseDto } from './dto/monthly-sales.response.dto';
import { TopClientResponseDto } from './dto/top-client.response.dto';
import { TopDepartmentResponseDto } from './dto/top-department.response.dto';
import { TopProductByMonthResponseDto } from './dto/top-product-by-month.response.dto';
import { TopProductResponseDto } from './dto/top-product.response.dto';
import { TotalSalesResponseDto } from './dto/total-sales.response.dto';
import { YearQueryDto } from './dto/year.query.dto';
import { YearlySalesResponseDto } from './dto/yearly-sales.response.dto';

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
}
