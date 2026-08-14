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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/guards/roles.decorator';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { CreatePriceListUseCase } from '../../application/create-price-list.use-case';
import { FindPriceListUseCase } from '../../application/find-price-list.use-case';
import { ListPriceListsUseCase } from '../../application/list-price-lists.use-case';
import { RemovePriceListItemUseCase } from '../../application/remove-price-list-item.use-case';
import { SetPriceListItemsUseCase } from '../../application/set-price-list-items.use-case';
import { UpdatePriceListUseCase } from '../../application/update-price-list.use-case';
import { CreatePriceListRequestDto } from './dto/create-price-list.request.dto';
import { ListPriceListsQueryDto } from './dto/list-price-lists.query.dto';
import {
  PaginatedPriceListsResponseDto,
  PriceListResponseDto,
} from './dto/price-list.response.dto';
import { SetPriceListItemsRequestDto } from './dto/set-price-list-items.request.dto';
import { UpdatePriceListRequestDto } from './dto/update-price-list.request.dto';

const UUID_EJEMPLO = 'd4000000-0000-4000-8000-000000000001';

@ApiTags('price-lists')
@ApiBearerAuth()
@Roles('administrador', 'almacenero', 'contador')
@UseGuards(JwtGuard, RolesGuard)
@Controller('price-lists')
export class PriceListsController {
  constructor(
    private readonly findPriceList: FindPriceListUseCase,
    private readonly listPriceLists: ListPriceListsUseCase,
    private readonly createPriceList: CreatePriceListUseCase,
    private readonly updatePriceList: UpdatePriceListUseCase,
    private readonly setPriceListItems: SetPriceListItemsUseCase,
    private readonly removePriceListItem: RemovePriceListItemUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar listas de precio',
    description: 'Devuelve las listas sin sus items. Para ver los items usar GET /:id.',
  })
  @ApiOkResponse({ type: PaginatedPriceListsResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async list(@Query() query: ListPriceListsQueryDto): Promise<PaginatedPriceListsResponseDto> {
    const page = await this.listPriceLists.execute({
      priceListName: query.priceListName,
      priceListActive: query.priceListActive,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((pl) => PriceListResponseDto.fromDomain(pl)),
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

  @Get(':priceListId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar una lista de precio con sus items' })
  @ApiParam({ name: 'priceListId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ type: PriceListResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async findOne(
    @Param('priceListId', new ParseUUIDPipe({ version: '4' })) priceListId: string,
  ): Promise<PriceListResponseDto> {
    const pl = await this.findPriceList.execute(priceListId);
    return PriceListResponseDto.fromDomain(pl);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una lista de precio' })
  @ApiCreatedResponse({ type: PriceListResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ description: 'Ya existe una lista con ese nombre.', type: ApiErrorDto })
  async create(@Body() dto: CreatePriceListRequestDto): Promise<PriceListResponseDto> {
    const pl = await this.createPriceList.execute(dto);
    return PriceListResponseDto.fromDomain(pl);
  }

  @Patch(':priceListId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar nombre, descripcion o estado de la lista' })
  @ApiParam({ name: 'priceListId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ type: PriceListResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ description: 'El nuevo nombre ya esta en uso.', type: ApiErrorDto })
  async update(
    @Param('priceListId', new ParseUUIDPipe({ version: '4' })) priceListId: string,
    @Body() dto: UpdatePriceListRequestDto,
  ): Promise<PriceListResponseDto> {
    const pl = await this.updatePriceList.execute(priceListId, dto);
    return PriceListResponseDto.fromDomain(pl);
  }

  @Put(':priceListId/items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reemplazar todos los items de una lista',
    description: 'Borra los items existentes y los sustituye por los enviados en el cuerpo.',
  })
  @ApiParam({ name: 'priceListId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ type: PriceListResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ description: 'Uno o mas productIds no existen.', type: ApiErrorDto })
  async setItems(
    @Param('priceListId', new ParseUUIDPipe({ version: '4' })) priceListId: string,
    @Body() dto: SetPriceListItemsRequestDto,
  ): Promise<PriceListResponseDto> {
    const pl = await this.setPriceListItems.execute({ priceListId, items: dto.items });
    return PriceListResponseDto.fromDomain(pl);
  }

  @Delete(':priceListId/items/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Quitar un producto de la lista de precio' })
  @ApiParam({ name: 'priceListId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiParam({ name: 'productId', format: 'uuid', example: '00000000-0000-4000-8000-000000000001' })
  @ApiOkResponse({ description: 'Lista actualizada sin el producto.', type: PriceListResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async removeItem(
    @Param('priceListId', new ParseUUIDPipe({ version: '4' })) priceListId: string,
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
  ): Promise<PriceListResponseDto> {
    const pl = await this.removePriceListItem.execute({ priceListId, productId });
    return PriceListResponseDto.fromDomain(pl);
  }
}
