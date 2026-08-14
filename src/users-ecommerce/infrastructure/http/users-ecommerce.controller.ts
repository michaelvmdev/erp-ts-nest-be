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
import { CreateUserEcommerceUseCase } from '../../application/create-user-ecommerce.use-case';
import { DeleteUserEcommerceUseCase } from '../../application/delete-user-ecommerce.use-case';
import { FindUserEcommerceUseCase } from '../../application/find-user-ecommerce.use-case';
import { GetUserPurchaseHistoryUseCase } from '../../application/get-user-purchase-history.use-case';
import { ListUsersEcommerceUseCase } from '../../application/list-users-ecommerce.use-case';
import { UpdateUserEcommerceUseCase } from '../../application/update-user-ecommerce.use-case';
import {
  PaginatedUsersEcommerceResponseDto,
  UserEcommerceResponseDto,
} from './dto/user-ecommerce.response.dto';
import { CreateUserEcommerceRequestDto } from './dto/create-user-ecommerce.request.dto';
import { ListUsersEcommerceQueryDto } from './dto/list-users-ecommerce.query.dto';
import { UpdateUserEcommerceRequestDto } from './dto/update-user-ecommerce.request.dto';

const UUID_EJEMPLO = '181e2a56-6b4b-42b1-9e56-5ecf0bbf47b3';

@ApiTags('users-ecommerce')
@ApiBearerAuth()
@Roles('administrador')
@UseGuards(JwtGuard, RolesGuard)
@Controller('users-ecommerce')
export class UsersEcommerceController {
  constructor(
    private readonly findUser: FindUserEcommerceUseCase,
    private readonly listUsers: ListUsersEcommerceUseCase,
    private readonly createUser: CreateUserEcommerceUseCase,
    private readonly updateUser: UpdateUserEcommerceUseCase,
    private readonly deleteUser: DeleteUserEcommerceUseCase,
    private readonly getPurchaseHistory: GetUserPurchaseHistoryUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar usuarios ecommerce', description: 'Listado paginado con filtros opcionales.' })
  @ApiOkResponse({ description: 'Pagina de usuarios.', type: PaginatedUsersEcommerceResponseDto })
  @ApiBadRequestResponse({ description: 'Parametro invalido.', type: ApiErrorDto })
  async list(
    @Query() query: ListUsersEcommerceQueryDto,
  ): Promise<PaginatedUsersEcommerceResponseDto> {
    const page = await this.listUsers.execute({
      email: query.email,
      firstName: query.firstName,
      lastName: query.lastName,
      active: query.active ?? null,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((u) => UserEcommerceResponseDto.fromDomain(u)),
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

  @Get(':userEcommerceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un usuario ecommerce por id.' })
  @ApiParam({ name: 'userEcommerceId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ type: UserEcommerceResponseDto })
  @ApiBadRequestResponse({ description: 'Id no valido.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe el usuario.', type: ApiErrorDto })
  async findOne(
    @Param('userEcommerceId', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<UserEcommerceResponseDto> {
    const user = await this.findUser.execute(id);
    return UserEcommerceResponseDto.fromDomain(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un usuario ecommerce.' })
  @ApiCreatedResponse({ type: UserEcommerceResponseDto })
  @ApiBadRequestResponse({ description: 'Cuerpo invalido.', type: ApiErrorDto })
  @ApiConflictResponse({ description: 'El email ya esta registrado.', type: ApiErrorDto })
  async create(
    @Body() dto: CreateUserEcommerceRequestDto,
  ): Promise<UserEcommerceResponseDto> {
    const user = await this.createUser.execute({
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone ?? null,
      active: dto.active,
    });
    return UserEcommerceResponseDto.fromDomain(user);
  }

  @Patch(':userEcommerceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Modificar o desactivar un usuario ecommerce.',
    description: 'Actualizacion parcial. Enviar `{"active": false}` desactiva el usuario.',
  })
  @ApiParam({ name: 'userEcommerceId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiOkResponse({ type: UserEcommerceResponseDto })
  @ApiBadRequestResponse({ description: 'Id o cuerpo invalidos.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe el usuario.', type: ApiErrorDto })
  @ApiConflictResponse({ description: 'El email nuevo ya pertenece a otro usuario.', type: ApiErrorDto })
  async update(
    @Param('userEcommerceId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserEcommerceRequestDto,
  ): Promise<UserEcommerceResponseDto> {
    const user = await this.updateUser.execute(id, {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      active: dto.active,
    });
    return UserEcommerceResponseDto.fromDomain(user);
  }

  @Delete(':userEcommerceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar un usuario ecommerce.',
    description:
      'Baja fisica. Si el usuario esta referenciado en ventas se rechaza con 409. ' +
      'En ese caso desactivalo con PATCH enviando `"active": false`.',
  })
  @ApiParam({ name: 'userEcommerceId', format: 'uuid', example: UUID_EJEMPLO })
  @ApiNoContentResponse({ description: 'Usuario eliminado.' })
  @ApiBadRequestResponse({ description: 'Id no valido.', type: ApiErrorDto })
  @ApiNotFoundResponse({ description: 'No existe el usuario.', type: ApiErrorDto })
  @ApiConflictResponse({ description: 'El usuario esta referenciado por ventas.', type: ApiErrorDto })
  async remove(
    @Param('userEcommerceId', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.deleteUser.execute(id);
  }

  @Get(':userEcommerceId/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Historial de compras del usuario ecommerce' })
  @ApiOkResponse({ description: 'Lista de ventas asociadas al usuario.' })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async purchaseHistory(
    @Param('userEcommerceId', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.getPurchaseHistory.execute(id);
  }
}
