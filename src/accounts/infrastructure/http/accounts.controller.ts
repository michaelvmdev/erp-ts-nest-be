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
import { CreateAccountUseCase } from '../../application/create-account.use-case';
import { DeleteAccountUseCase } from '../../application/delete-account.use-case';
import { FindAccountUseCase } from '../../application/find-account.use-case';
import { SearchAccountsUseCase } from '../../application/search-accounts.use-case';
import { UpdateAccountUseCase } from '../../application/update-account.use-case';
import { AccountResponseDto } from './dto/account.response.dto';
import { CreateAccountRequestDto } from './dto/create-account.request.dto';
import { QueryAccountsRequestDto } from './dto/query-accounts.request.dto';
import { UpdateAccountRequestDto } from './dto/update-account.request.dto';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(
    private readonly findAccount: FindAccountUseCase,
    private readonly searchAccounts: SearchAccountsUseCase,
    private readonly createAccount: CreateAccountUseCase,
    private readonly updateAccount: UpdateAccountUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar cuentas contables con filtros' })
  @ApiOkResponse({ type: [AccountResponseDto] })
  async findAll(@Query() query: QueryAccountsRequestDto): Promise<object> {
    const page = await this.searchAccounts.execute({
      code: query.code,
      name: query.name,
      type: query.type,
      parentCode: query.parentCode,
      active: query.active,
      sortDirection: query.sortDirection,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: page.items.map((a) => AccountResponseDto.fromDomain(a)),
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

  @Get(':accountId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Consultar una cuenta contable' })
  @ApiParam({ name: 'accountId', format: 'uuid' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada.', type: ApiErrorDto })
  async findOne(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
  ): Promise<AccountResponseDto> {
    const account = await this.findAccount.execute(accountId);
    return AccountResponseDto.fromDomain(account);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una cuenta contable' })
  @ApiCreatedResponse({ type: AccountResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiConflictResponse({ description: 'El codigo ya existe.', type: ApiErrorDto })
  async create(@Body() dto: CreateAccountRequestDto): Promise<AccountResponseDto> {
    const account = await this.createAccount.execute(dto);
    return AccountResponseDto.fromDomain(account);
  }

  @Patch(':accountId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modificar una cuenta contable' })
  @ApiParam({ name: 'accountId', format: 'uuid' })
  @ApiOkResponse({ type: AccountResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async update(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
    @Body() dto: UpdateAccountRequestDto,
  ): Promise<AccountResponseDto> {
    const account = await this.updateAccount.execute(accountId, dto);
    return AccountResponseDto.fromDomain(account);
  }

  @Delete(':accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una cuenta contable (soft delete)' })
  @ApiParam({ name: 'accountId', format: 'uuid' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ type: ApiErrorDto })
  async remove(
    @Param('accountId', new ParseUUIDPipe({ version: '4' })) accountId: string,
  ): Promise<void> {
    await this.deleteAccount.execute(accountId);
  }
}
