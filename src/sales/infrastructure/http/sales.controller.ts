import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateSaleUseCase } from '../../application/create-sale.use-case';
import { FindSaleUseCase } from '../../application/find-sale.use-case';
import { GenerateSalePdfUseCase } from '../../application/generate-sale-pdf.use-case';
import { GenerateSalesReportPdfUseCase } from '../../application/generate-sales-report-pdf.use-case';
import { SearchSalesUseCase } from '../../application/search-sales.use-case';
import { SendSalePdfUseCase } from '../../application/send-sale-pdf.use-case';
import { SendSalesReportPdfUseCase } from '../../application/send-sales-report-pdf.use-case';
import { UpdateSaleUseCase } from '../../application/update-sale.use-case';
import { CreateSaleRequestDto } from './dto/create-sale.request.dto';
import {
  PaginatedSalesResponseDto,
  SaleResponseDto,
  SaleSummaryResponseDto,
} from './dto/sale.response.dto';
import { SalePdfResponseDto } from './dto/sale-pdf.response.dto';
import { SalesReportPdfResponseDto } from './dto/sales-report-pdf.response.dto';
import { SalesReportQueryDto } from './dto/sales-report.query.dto';
import { SearchSalesQueryDto } from './dto/search-sales.query.dto';
import { SendSalesReportEmailQueryDto } from './dto/send-sales-report-email.query.dto';
import { SendSalesReportEmailResponseDto } from './dto/send-sales-report-email.response.dto';
import { SendSaleEmailRequestDto } from './dto/send-sale-email.request.dto';
import { SendSaleEmailResponseDto } from './dto/send-sale-email.response.dto';
import { UpdateSaleRequestDto } from './dto/update-sale.request.dto';

const UUID_EJEMPLO = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

@ApiTags('sales')
@Controller('sales')
export class SalesController {
  constructor(
    private readonly findSale: FindSaleUseCase,
    private readonly searchSales: SearchSalesUseCase,
    private readonly createSale: CreateSaleUseCase,
    private readonly updateSale: UpdateSaleUseCase,
    private readonly generateSalePdf: GenerateSalePdfUseCase,
    private readonly generateSalesReportPdf: GenerateSalesReportPdfUseCase,
    private readonly sendSalePdf: SendSalePdfUseCase,
    private readonly sendSalesReportPdf: SendSalesReportPdfUseCase,
  ) {}

  // La ruta sin parametro va antes que ':saleId' para que no se interprete como
  // un identificador.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar varias ventas',
    description:
      'Listado paginado. Todos los filtros son opcionales y se combinan con AND; sin ' +
      'ninguno devuelve las ventas mas recientes.\n\n' +
      'La respuesta trae solo las cabeceras, con `lineCount` para saber cuantos items ' +
      'tiene cada venta. El detalle completo se obtiene con `GET /sales/{saleId}`: veinte ' +
      'ventas de cinco lineas serian cien filas que una tabla casi nunca usa.',
  })
  @ApiOkResponse({
    description: 'Pagina de ventas. La lista es vacia si nada coincide.',
    type: PaginatedSalesResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Filtro invalido: fecha mal formada, rango invertido o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async list(
    @Query() query: SearchSalesQueryDto,
  ): Promise<PaginatedSalesResponseDto> {
    const page = await this.searchSales.execute({
      saleNumber: query.saleNumber,
      saleTypeCode: query.saleTypeCode,
      clientId: query.clientId,
      districtId: query.districtId,
      departmentId: query.departmentId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      totalMin: query.totalMin,
      totalMax: query.totalMax,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((s) => SaleSummaryResponseDto.fromSummary(s)),
      meta: {
        page: page.page,
        limit: page.limit,
        total: page.total,
        totalPages: page.totalPages,
        hasNextPage: page.page < page.totalPages,
        hasPreviousPage: page.page > 1,
      },
    };
  }

  // 'report' va antes que ':saleId' para que la ruta estatica no caiga en el
  // parametro y el ParseUUIDPipe la rechace como UUID invalido.
  @Get('report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar el PDF de un reporte de ventas por rango de fechas',
    description:
      'Genera un reporte en PDF de las ventas emitidas en un rango de fechas y lo ' +
      'devuelve en base64. `from` es obligatorio; `to` opcional: si se omite, el ' +
      'reporte es del dia `from` ("ventas del dia"). El PDF lista una fila por ' +
      'venta (numero, fecha, cliente, tipo) con subtotal, IGV y total, y cierra ' +
      'con los totales del periodo. Se arma en memoria; no se guarda en el servidor.',
  })
  @ApiOkResponse({
    description: 'PDF del reporte en base64.',
    type: SalesReportPdfResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Alguna fecha esta mal formada, o el rango esta invertido (`to` anterior a `from`).',
    type: ApiErrorDto,
  })
  async report(
    @Query() query: SalesReportQueryDto,
  ): Promise<SalesReportPdfResponseDto> {
    const output = await this.generateSalesReportPdf.execute(
      query.from,
      query.to,
    );
    return SalesReportPdfResponseDto.fromOutput(output);
  }

  // Ruta estatica de dos segmentos: no colisiona con ':saleId'. Va aqui, junto
  // al reporte, y antes de las rutas con parametro por claridad.
  @Post('report/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar por correo el reporte de ventas por rango de fechas',
    description:
      'Genera el reporte en PDF de las ventas de un rango de fechas (en memoria, ' +
      'sin guardarlo en disco) y lo adjunta a un correo. El destinatario y las ' +
      'fechas viajan en la query string: `email` y `from` son obligatorios; `to` ' +
      'opcional (si se omite, es el reporte del dia `from`).',
  })
  @ApiOkResponse({
    description: 'Correo despachado con el reporte en PDF adjunto.',
    type: SendSalesReportEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El correo no es valido, alguna fecha esta mal formada o el rango esta ' +
      'invertido (`to` anterior a `from`).',
    type: ApiErrorDto,
  })
  @ApiServiceUnavailableResponse({
    description:
      'El correo no esta configurado (faltan las variables MAIL_*) o el servidor ' +
      'SMTP no acepto el mensaje.',
    type: ApiErrorDto,
  })
  async sendReportEmail(
    @Query() query: SendSalesReportEmailQueryDto,
  ): Promise<SendSalesReportEmailResponseDto> {
    const output = await this.sendSalesReportPdf.execute(
      query.email,
      query.from,
      query.to,
    );
    return SendSalesReportEmailResponseDto.fromOutput(output);
  }

  @Get(':saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar una venta',
    description: 'Devuelve la venta con todas sus lineas de detalle.',
  })
  @ApiParam({ name: 'saleId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Venta encontrada.', type: SaleResponseDto })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una venta con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('saleId', new ParseUUIDPipe({ version: '4' })) saleId: string,
  ): Promise<SaleResponseDto> {
    const sale = await this.findSale.execute(saleId);
    return SaleResponseDto.fromDomain(sale);
  }

  @Get(':saleId/pdf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar el PDF de una venta',
    description:
      'Genera el comprobante en PDF (con su detalle) y lo devuelve codificado en ' +
      'base64. El PDF se arma en memoria; no se guarda en el servidor.',
  })
  @ApiParam({ name: 'saleId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'PDF del comprobante en base64.',
    type: SalePdfResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una venta con ese id.',
    type: ApiErrorDto,
  })
  async pdf(
    @Param('saleId', new ParseUUIDPipe({ version: '4' })) saleId: string,
  ): Promise<SalePdfResponseDto> {
    const output = await this.generateSalePdf.execute(saleId);
    return SalePdfResponseDto.fromOutput(output);
  }

  @Post(':saleId/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar el PDF de una venta por correo',
    description:
      'Genera el comprobante en PDF (base64 en memoria, sin guardarlo en disco) y ' +
      'lo adjunta a un correo dirigido a la direccion indicada en el cuerpo.',
  })
  @ApiParam({ name: 'saleId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Correo despachado con el PDF adjunto.',
    type: SendSaleEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido o el correo no es valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una venta con ese id.',
    type: ApiErrorDto,
  })
  @ApiServiceUnavailableResponse({
    description:
      'El correo no esta configurado (faltan las variables MAIL_*) o el servidor ' +
      'SMTP no acepto el mensaje.',
    type: ApiErrorDto,
  })
  async sendEmail(
    @Param('saleId', new ParseUUIDPipe({ version: '4' })) saleId: string,
    @Body() dto: SendSaleEmailRequestDto,
  ): Promise<SendSaleEmailResponseDto> {
    const output = await this.sendSalePdf.execute(saleId, dto.email);
    return SendSaleEmailResponseDto.fromOutput(output);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una venta',
    description:
      'Emite un comprobante. El cuerpo lleva el tipo, el cliente, el distrito y las lineas ' +
      'con producto y cantidad.\n\n' +
      '**No se envian importes.** El precio unitario sale del catalogo y el parcial, el ' +
      'subtotal, el IGV y el total los calcula el backend. Enviarlos devuelve 400.\n\n' +
      '**Tampoco se envia el numero.** Lo asigna el backend consumiendo el correlativo del ' +
      'tipo, de forma atomica: dos ventas simultaneas obtienen numeros distintos, y si el ' +
      'guardado falla el correlativo no avanza y no queda un hueco en la serie.\n\n' +
      'La provincia y el departamento se derivan del codigo de distrito.',
  })
  @ApiCreatedResponse({
    description: 'Venta registrada.',
    type: SaleResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no supera la validacion, o un producto se repite en dos lineas.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description:
      'No existe el tipo de comprobante, el cliente, el distrito o algun producto.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El cliente o alguno de los productos esta inactivo.',
    type: ApiErrorDto,
  })
  async create(@Body() dto: CreateSaleRequestDto): Promise<SaleResponseDto> {
    const sale = await this.createSale.execute(dto);
    return SaleResponseDto.fromDomain(sale);
  }

  @Patch(':saleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Corregir una venta',
    description:
      'Actualizacion parcial de los datos corregibles: el cliente, el distrito y las lineas.\n\n' +
      'El numero de comprobante, la fecha y la hora **no se pueden modificar**: son la ' +
      'identidad fiscal del documento y el momento de su emision. Corregirlos no seria ' +
      'editar una venta sino inventar otra; en un sistema fiscal eso se resuelve con una ' +
      'nota de credito.\n\n' +
      'Si viene `saleDetails`, reemplaza por completo las lineas y recalcula los importes.',
  })
  @ApiParam({ name: 'saleId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ description: 'Venta actualizada.', type: SaleResponseDto })
  @ApiBadRequestResponse({
    description: 'Id o cuerpo invalidos.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description:
      'No existe la venta, el cliente, el distrito o algun producto.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El cliente o alguno de los productos esta inactivo.',
    type: ApiErrorDto,
  })
  async update(
    @Param('saleId', new ParseUUIDPipe({ version: '4' })) saleId: string,
    @Body() dto: UpdateSaleRequestDto,
  ): Promise<SaleResponseDto> {
    const sale = await this.updateSale.execute(saleId, dto);
    return SaleResponseDto.fromDomain(sale);
  }
}
