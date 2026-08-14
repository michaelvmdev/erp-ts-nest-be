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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/guards/roles.decorator';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreatePurchaseUseCase } from '../../application/create-purchase.use-case';
import { FindPurchaseUseCase } from '../../application/find-purchase.use-case';
import { GeneratePurchasesBySupplierReportPdfUseCase } from '../../application/generate-purchases-by-supplier-report-pdf.use-case';
import { GenerateSupplierPurchasesAmountReportPdfUseCase } from '../../application/generate-supplier-purchases-amount-report-pdf.use-case';
import { SearchPurchasesUseCase } from '../../application/search-purchases.use-case';
import { SendPurchasesBySupplierReportPdfUseCase } from '../../application/send-purchases-by-supplier-report-pdf.use-case';
import { SendSupplierPurchasesAmountReportPdfUseCase } from '../../application/send-supplier-purchases-amount-report-pdf.use-case';
import { UpdatePurchaseUseCase } from '../../application/update-purchase.use-case';
import { GenerateSupplierPurchasesAmountReportExcelUseCase } from '../../application/generate-supplier-purchases-amount-report-excel.use-case';
import { SendSupplierPurchasesAmountReportExcelUseCase } from '../../application/send-supplier-purchases-amount-report-excel.use-case';
import { GeneratePurchasesBySupplierReportExcelUseCase } from '../../application/generate-purchases-by-supplier-report-excel.use-case';
import { SendPurchasesBySupplierReportExcelUseCase } from '../../application/send-purchases-by-supplier-report-excel.use-case';
import { CreatePurchaseRequestDto } from './dto/create-purchase.request.dto';
import { PurchasesBySupplierReportPdfResponseDto } from './dto/purchases-by-supplier-report-pdf.response.dto';
import { PurchasesBySupplierReportQueryDto } from './dto/purchases-by-supplier-report.query.dto';
import {
  PaginatedPurchasesResponseDto,
  PurchaseResponseDto,
  PurchaseSummaryResponseDto,
} from './dto/purchase.response.dto';
import { SearchPurchasesQueryDto } from './dto/search-purchases.query.dto';
import { SendPurchasesBySupplierReportEmailQueryDto } from './dto/send-purchases-by-supplier-report-email.query.dto';
import { SendPurchasesBySupplierReportEmailResponseDto } from './dto/send-purchases-by-supplier-report-email.response.dto';
import { SendSuppliersAmountReportEmailQueryDto } from './dto/send-suppliers-amount-report-email.query.dto';
import { SendSuppliersAmountReportEmailResponseDto } from './dto/send-suppliers-amount-report-email.response.dto';
import { SuppliersAmountReportPdfResponseDto } from './dto/suppliers-amount-report-pdf.response.dto';
import { SuppliersAmountReportQueryDto } from './dto/suppliers-amount-report.query.dto';
import { UpdatePurchaseRequestDto } from './dto/update-purchase.request.dto';
import { SuppliersAmountReportExcelResponseDto } from './dto/suppliers-amount-report-excel.response.dto';
import { PurchasesBySupplierReportExcelResponseDto } from './dto/purchases-by-supplier-report-excel.response.dto';

const UUID_EJEMPLO = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

@ApiTags('purchases')
@ApiBearerAuth()
@Roles('administrador', 'almacenero')
@UseGuards(JwtGuard, RolesGuard)
@Controller('purchases')
export class PurchasesController {
  constructor(
    private readonly findPurchase: FindPurchaseUseCase,
    private readonly searchPurchases: SearchPurchasesUseCase,
    private readonly createPurchase: CreatePurchaseUseCase,
    private readonly updatePurchase: UpdatePurchaseUseCase,
    private readonly generateSuppliersAmountReportPdf: GenerateSupplierPurchasesAmountReportPdfUseCase,
    private readonly generatePurchasesBySupplierReportPdf: GeneratePurchasesBySupplierReportPdfUseCase,
    private readonly sendSuppliersAmountReportPdf: SendSupplierPurchasesAmountReportPdfUseCase,
    private readonly sendPurchasesBySupplierReportPdf: SendPurchasesBySupplierReportPdfUseCase,
    private readonly generateSuppliersAmountReportExcel: GenerateSupplierPurchasesAmountReportExcelUseCase,
    private readonly sendSuppliersAmountReportExcel: SendSupplierPurchasesAmountReportExcelUseCase,
    private readonly generatePurchasesBySupplierReportExcel: GeneratePurchasesBySupplierReportExcelUseCase,
    private readonly sendPurchasesBySupplierReportExcel: SendPurchasesBySupplierReportExcelUseCase,
  ) {}

  // --- Reporte de monto de compras por proveedor ---

  @Get('suppliers-amount-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar el PDF del reporte de monto de compra por proveedor',
    description:
      'Genera un reporte en PDF con el IGV y el monto comprado a cada proveedor ' +
      'en un rango de fechas. `from` es obligatorio; `to` opcional (si se omite, ' +
      'es el reporte del dia `from`). Se arma en memoria; no se guarda.',
  })
  @ApiOkResponse({
    description: 'PDF del reporte en base64.',
    type: SuppliersAmountReportPdfResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Alguna fecha esta mal formada o el rango esta invertido (`to` anterior a `from`).',
    type: ApiErrorDto,
  })
  async suppliersAmountReport(
    @Query() query: SuppliersAmountReportQueryDto,
  ): Promise<SuppliersAmountReportPdfResponseDto> {
    const output = await this.generateSuppliersAmountReportPdf.execute(
      query.from,
      query.to,
    );
    return SuppliersAmountReportPdfResponseDto.fromOutput(output);
  }

  @Post('suppliers-amount-report/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar por correo el reporte de monto de compra por proveedor',
    description:
      'Genera el reporte de monto por proveedor en PDF (en memoria) y lo adjunta ' +
      'a un correo. El destinatario y las fechas viajan en la query string: ' +
      '`email` y `from` son obligatorios; `to` opcional.',
  })
  @ApiOkResponse({
    description: 'Correo despachado con el reporte en PDF adjunto.',
    type: SendSuppliersAmountReportEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El correo no es valido, alguna fecha esta mal formada o el rango esta invertido.',
    type: ApiErrorDto,
  })
  @ApiServiceUnavailableResponse({
    description:
      'El correo no esta configurado (faltan las variables MAIL_*) o el servidor ' +
      'SMTP no acepto el mensaje.',
    type: ApiErrorDto,
  })
  async sendSuppliersAmountReportEmail(
    @Query() query: SendSuppliersAmountReportEmailQueryDto,
  ): Promise<SendSuppliersAmountReportEmailResponseDto> {
    const output = await this.sendSuppliersAmountReportPdf.execute(
      query.email,
      query.from,
      query.to,
    );
    return SendSuppliersAmountReportEmailResponseDto.fromOutput(output);
  }

  @Get('suppliers-amount-report-excel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descargar el reporte de monto de compra por proveedor en Excel',
    description:
      'Genera el reporte de monto por proveedor en Excel y lo devuelve en base64. ' +
      '`from` es obligatorio; `to` opcional.',
  })
  @ApiOkResponse({ description: 'Excel del reporte en base64.', type: SuppliersAmountReportExcelResponseDto })
  @ApiBadRequestResponse({ description: 'Fecha mal formada o rango invertido.', type: ApiErrorDto })
  async suppliersAmountReportExcel(
    @Query() query: SuppliersAmountReportQueryDto,
  ): Promise<SuppliersAmountReportExcelResponseDto> {
    const output = await this.generateSuppliersAmountReportExcel.execute(query.from, query.to);
    return SuppliersAmountReportExcelResponseDto.fromOutput(output);
  }

  @Post('suppliers-amount-report-excel/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar por correo el reporte de monto por proveedor en Excel',
    description:
      'Genera el reporte de monto por proveedor en Excel (en memoria) y lo adjunta a un correo. ' +
      '`email` y `from` son obligatorios; `to` opcional.',
  })
  @ApiOkResponse({ description: 'Correo despachado con el Excel adjunto.', type: SendSuppliersAmountReportEmailResponseDto })
  @ApiBadRequestResponse({ description: 'Correo o fechas invalidos.', type: ApiErrorDto })
  @ApiServiceUnavailableResponse({ description: 'Servidor SMTP no disponible.', type: ApiErrorDto })
  async sendSuppliersAmountReportExcelEmail(
    @Query() query: SendSuppliersAmountReportEmailQueryDto,
  ): Promise<SendSuppliersAmountReportEmailResponseDto> {
    const output = await this.sendSuppliersAmountReportExcel.execute(query.email, query.from, query.to);
    return SendSuppliersAmountReportEmailResponseDto.fromOutput(output as any);
  }

  // --- Reporte de compras por proveedor (detalle de un proveedor concreto) ---

  @Get('purchases-by-supplier-report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generar el PDF del reporte de compras de un proveedor',
    description:
      'Genera un reporte en PDF con el detalle de compras de un proveedor (RUC, ' +
      'fecha, IGV y monto) en un rango de fechas. `supplierId` y `from` son ' +
      'obligatorios; `to` opcional (si se omite, es el reporte del dia `from`). ' +
      'Se arma en memoria; no se guarda.',
  })
  @ApiOkResponse({
    description: 'PDF del reporte en base64.',
    type: PurchasesBySupplierReportPdfResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      '`supplierId` no es un UUID valido, alguna fecha esta mal formada o el rango esta invertido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'El `supplierId` indicado no existe.',
    type: ApiErrorDto,
  })
  async purchasesBySupplierReport(
    @Query() query: PurchasesBySupplierReportQueryDto,
  ): Promise<PurchasesBySupplierReportPdfResponseDto> {
    const output = await this.generatePurchasesBySupplierReportPdf.execute(
      query.supplierId,
      query.from,
      query.to,
    );
    return PurchasesBySupplierReportPdfResponseDto.fromOutput(output);
  }

  @Post('purchases-by-supplier-report/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar por correo el reporte de compras de un proveedor',
    description:
      'Genera el reporte de compras de un proveedor en PDF (en memoria) y lo ' +
      'adjunta a un correo. El destinatario, el proveedor y las fechas viajan en ' +
      'la query string: `email`, `supplierId` y `from` son obligatorios; `to` opcional.',
  })
  @ApiOkResponse({
    description: 'Correo despachado con el reporte en PDF adjunto.',
    type: SendPurchasesBySupplierReportEmailResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El correo no es valido, `supplierId` no es un UUID, alguna fecha esta mal ' +
      'formada o el rango esta invertido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'El `supplierId` indicado no existe.',
    type: ApiErrorDto,
  })
  @ApiServiceUnavailableResponse({
    description:
      'El correo no esta configurado (faltan las variables MAIL_*) o el servidor ' +
      'SMTP no acepto el mensaje.',
    type: ApiErrorDto,
  })
  async sendPurchasesBySupplierReportEmail(
    @Query() query: SendPurchasesBySupplierReportEmailQueryDto,
  ): Promise<SendPurchasesBySupplierReportEmailResponseDto> {
    const output = await this.sendPurchasesBySupplierReportPdf.execute(
      query.email,
      query.supplierId,
      query.from,
      query.to,
    );
    return SendPurchasesBySupplierReportEmailResponseDto.fromOutput(output);
  }

  @Get('purchases-by-supplier-report-excel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Descargar el reporte de compras de un proveedor en Excel',
    description:
      'Genera el reporte de compras de un proveedor en Excel y lo devuelve en base64. ' +
      '`supplierId` y `from` son obligatorios; `to` opcional.',
  })
  @ApiOkResponse({ description: 'Excel del reporte en base64.', type: PurchasesBySupplierReportExcelResponseDto })
  @ApiBadRequestResponse({ description: 'UUID, fecha invalidos o rango invertido.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'El `supplierId` no existe.', type: ApiErrorDto })
  async purchasesBySupplierReportExcel(
    @Query() query: PurchasesBySupplierReportQueryDto,
  ): Promise<PurchasesBySupplierReportExcelResponseDto> {
    const output = await this.generatePurchasesBySupplierReportExcel.execute(query.supplierId, query.from, query.to);
    return PurchasesBySupplierReportExcelResponseDto.fromOutput(output);
  }

  @Post('purchases-by-supplier-report-excel/send-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar por correo el reporte de compras de un proveedor en Excel',
    description:
      'Genera el reporte de compras de un proveedor en Excel (en memoria) y lo adjunta a un correo. ' +
      '`email`, `supplierId` y `from` son obligatorios; `to` opcional.',
  })
  @ApiOkResponse({ description: 'Correo despachado con el Excel adjunto.', type: SendPurchasesBySupplierReportEmailResponseDto })
  @ApiBadRequestResponse({ description: 'Correo, UUID o fechas invalidos.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'El `supplierId` no existe.', type: ApiErrorDto })
  @ApiServiceUnavailableResponse({ description: 'Servidor SMTP no disponible.', type: ApiErrorDto })
  async sendPurchasesBySupplierReportExcelEmail(
    @Query() query: SendPurchasesBySupplierReportEmailQueryDto,
  ): Promise<SendPurchasesBySupplierReportEmailResponseDto> {
    const output = await this.sendPurchasesBySupplierReportExcel.execute(query.email, query.supplierId, query.from, query.to);
    return SendPurchasesBySupplierReportEmailResponseDto.fromOutput(output as any);
  }

  // La ruta sin parametro va antes que ':purchaseId' para que no se interprete
  // como un identificador.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar varias compras',
    description:
      'Listado paginado. Todos los filtros son opcionales y se combinan con AND; sin ' +
      'ninguno devuelve las compras mas recientes.\n\n' +
      'La respuesta trae solo las cabeceras, con `lineCount` para saber cuantos items ' +
      'tiene cada compra. El detalle completo se obtiene con `GET /purchases/{purchaseId}`.',
  })
  @ApiOkResponse({
    description: 'Pagina de compras. La lista es vacia si nada coincide.',
    type: PaginatedPurchasesResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Filtro invalido: fecha mal formada, rango invertido o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async list(
    @Query() query: SearchPurchasesQueryDto,
  ): Promise<PaginatedPurchasesResponseDto> {
    const page = await this.searchPurchases.execute({
      supplierId: query.supplierId,
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
      items: page.items.map((p) => PurchaseSummaryResponseDto.fromSummary(p)),
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

  @Get(':purchaseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar una compra',
    description: 'Devuelve la compra con todas sus lineas de detalle.',
  })
  @ApiParam({ name: 'purchaseId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Compra encontrada.',
    type: PurchaseResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una compra con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('purchaseId', new ParseUUIDPipe({ version: '4' }))
    purchaseId: string,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.findPurchase.execute(purchaseId);
    return PurchaseResponseDto.fromDomain(purchase);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una compra',
    description:
      'Registra una compra a un proveedor. El cuerpo lleva el proveedor y las lineas con ' +
      'producto, cantidad y **costo unitario**.\n\n' +
      '**A diferencia de una venta, aqui si se envia el `unitPrice`**: es el costo pagado ' +
      'al proveedor, un dato que no esta en el catalogo (products solo guarda el precio de ' +
      'venta). El `partial`, el `subTotal`, el `igv` y el `total` los calcula el backend; ' +
      'enviarlos devuelve 400.\n\n' +
      'La compra no lleva numero de comprobante: no es un documento fiscal que esta API emita.',
  })
  @ApiCreatedResponse({
    description: 'Compra registrada.',
    type: PurchaseResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo no supera la validacion, o un producto se repite en dos lineas.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe el proveedor o alguno de los productos.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El proveedor esta inactivo.',
    type: ApiErrorDto,
  })
  async create(
    @Body() dto: CreatePurchaseRequestDto,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.createPurchase.execute(dto);
    return PurchaseResponseDto.fromDomain(purchase);
  }

  @Patch(':purchaseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Corregir una compra',
    description:
      'Actualizacion parcial: solo se modifican los campos presentes en el cuerpo. Se ' +
      'pueden corregir el proveedor, la fecha, la hora y las lineas.\n\n' +
      'A diferencia de una venta, la fecha y la hora **si** se pueden corregir: una compra ' +
      'no es un documento fiscal. Los importes no se reciben; si viene `purchaseDetails`, ' +
      'reemplaza por completo las lineas y recalcula subtotal, IGV y total.',
  })
  @ApiParam({ name: 'purchaseId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Compra actualizada.',
    type: PurchaseResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Id o cuerpo invalidos.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe la compra, el proveedor o algun producto.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El proveedor esta inactivo.',
    type: ApiErrorDto,
  })
  async update(
    @Param('purchaseId', new ParseUUIDPipe({ version: '4' }))
    purchaseId: string,
    @Body() dto: UpdatePurchaseRequestDto,
  ): Promise<PurchaseResponseDto> {
    const purchase = await this.updatePurchase.execute(purchaseId, dto);
    return PurchaseResponseDto.fromDomain(purchase);
  }
}
