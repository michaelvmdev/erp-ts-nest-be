import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreateSupplierUseCase } from '../../application/create-supplier.use-case';
import { DeleteSupplierUseCase } from '../../application/delete-supplier.use-case';
import { FindSupplierUseCase } from '../../application/find-supplier.use-case';
import { ListSuppliersUseCase } from '../../application/list-suppliers.use-case';
import { UpdateSupplierUseCase } from '../../application/update-supplier.use-case';
import { CreateSupplierRequestDto } from './dto/create-supplier.request.dto';
import { ListSuppliersQueryDto } from './dto/list-suppliers.query.dto';
import {
  PaginatedSuppliersResponseDto,
  SupplierResponseDto,
} from './dto/supplier.response.dto';
import { UpdateSupplierRequestDto } from './dto/update-supplier.request.dto';

const UUID_EJEMPLO = '9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f';

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly findSupplier: FindSupplierUseCase,
    private readonly listSuppliers: ListSuppliersUseCase,
    private readonly createSupplier: CreateSupplierUseCase,
    private readonly updateSupplier: UpdateSupplierUseCase,
    private readonly deleteSupplier: DeleteSupplierUseCase,
  ) {}

  // La ruta sin parametro va declarada antes que ':supplierId' para que
  // "suppliers" no se interprete como un identificador.
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar proveedores',
    description:
      'Listado paginado. Todos los parametros son opcionales; sin ninguno devuelve los ' +
      'primeros 50 proveedores ordenados alfabeticamente.',
  })
  @ApiOkResponse({
    description: 'Pagina de proveedores. La lista es vacia si nada coincide.',
    type: PaginatedSuppliersResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Parametro invalido: RUC mal formado, estado no booleano, pagina o limite fuera de rango.',
    type: ApiErrorDto,
  })
  async list(
    @Query() query: ListSuppliersQueryDto,
  ): Promise<PaginatedSuppliersResponseDto> {
    const page = await this.listSuppliers.execute({
      supplierDescription: query.supplierDescription,
      supplierRuc: query.supplierRuc,
      supplierActive: query.supplierActive,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((s) => SupplierResponseDto.fromDomain(s)),
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

  @Get(':supplierId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar un proveedor',
    description:
      'Devuelve un proveedor por su identificador, este activo o no.',
  })
  @ApiParam({ name: 'supplierId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Proveedor encontrado.',
    type: SupplierResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe un proveedor con ese id.',
    type: ApiErrorDto,
  })
  async findOne(
    @Param('supplierId', new ParseUUIDPipe({ version: '4' }))
    supplierId: string,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.findSupplier.execute(supplierId);
    return SupplierResponseDto.fromDomain(supplier);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Agregar un proveedor',
    description:
      'Crea un proveedor. El `supplierId` lo genera el backend: no se acepta en el cuerpo. ' +
      'Solo admite empresas: el RUC debe empezar en "20" y su digito verificador debe ' +
      'corresponder (algoritmo modulo 11 de SUNAT).',
  })
  @ApiCreatedResponse({
    description: 'Proveedor creado.',
    type: SupplierResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'El cuerpo no supera la validacion, o el RUC no es valido.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'Ya existe un proveedor con ese RUC.',
    type: ApiErrorDto,
  })
  async create(
    @Body() dto: CreateSupplierRequestDto,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.createSupplier.execute(dto);
    return SupplierResponseDto.fromDomain(supplier);
  }

  @Patch(':supplierId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar o desactivar un proveedor',
    description:
      'Actualizacion parcial: solo se modifican los campos presentes en el cuerpo.\n\n' +
      'Para desactivar un proveedor basta con enviar `{"supplierActive": false}`. ' +
      'Preferible a DELETE cuando el proveedor ya tiene compras: las conserva junto con ' +
      'su historico, mientras que DELETE lo rechaza con 409 en ese caso.',
  })
  @ApiParam({ name: 'supplierId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({
    description: 'Proveedor actualizado.',
    type: SupplierResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Id o cuerpo invalidos.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe un proveedor con ese id.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El nuevo RUC ya pertenece a otro proveedor existente.',
    type: ApiErrorDto,
  })
  async update(
    @Param('supplierId', new ParseUUIDPipe({ version: '4' }))
    supplierId: string,
    @Body() dto: UpdateSupplierRequestDto,
  ): Promise<SupplierResponseDto> {
    const supplier = await this.updateSupplier.execute(supplierId, dto);
    return SupplierResponseDto.fromDomain(supplier);
  }

  @Delete(':supplierId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un proveedor',
    description:
      'Baja fisica. Si el proveedor tiene compras registradas la operacion se rechaza ' +
      'con 409, porque borrarlo dejaria huerfano ese historico. En ese caso corresponde ' +
      'desactivarlo con PATCH enviando `"supplierActive": false`.',
  })
  @ApiParam({ name: 'supplierId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiNoContentResponse({
    description: 'Proveedor eliminado. Sin cuerpo de respuesta.',
  })
  @ApiBadRequestResponse({
    description: 'El id no es un UUID valido.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe un proveedor con ese id.',
    type: ApiErrorDto,
  })
  @ApiConflictResponse({
    description: 'El proveedor esta referenciado por compras registradas.',
    type: ApiErrorDto,
  })
  async remove(
    @Param('supplierId', new ParseUUIDPipe({ version: '4' }))
    supplierId: string,
  ): Promise<void> {
    await this.deleteSupplier.execute(supplierId);
  }
}
