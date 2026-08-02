import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetTopClientUseCase } from '../../application/get-top-client.use-case';
import { GetTopDepartmentUseCase } from '../../application/get-top-department.use-case';
import { GetTopProductUseCase } from '../../application/get-top-product.use-case';
import { GetTotalSalesUseCase } from '../../application/get-total-sales.use-case';
import { TopClientResponseDto } from './dto/top-client.response.dto';
import { TopDepartmentResponseDto } from './dto/top-department.response.dto';
import { TopProductResponseDto } from './dto/top-product.response.dto';
import { TotalSalesResponseDto } from './dto/total-sales.response.dto';

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
  ) {}

  @Get('total-sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ventas totales del mes',
    description:
      'Suma de los totales y cantidad de comprobantes emitidos en el mes en curso.',
  })
  @ApiOkResponse({
    description: 'Ventas del mes. Con cero ventas, `amount` es "0.00" y `count` 0.',
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
}
