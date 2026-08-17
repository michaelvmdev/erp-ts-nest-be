import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation,
  ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { AuditService } from '../../../audit/audit.service';
import { TesoreriaService } from '../../tesoreria.service';

class CreateAccountDto {
  @IsString()
  name!: string;

  @IsIn(['cash', 'bank'])
  type!: string;

  @IsOptional() @IsString()
  currency?: string;

  @IsOptional() @IsString()
  bankName?: string;

  @IsOptional() @IsString()
  accountNumber?: string;

  @IsOptional() @IsNumber() @Min(0) @Type(() => Number)
  initialBalance?: number;
}

class CreateMovementDto {
  @IsString()
  accountId!: string;

  @IsIn(['income', 'expense', 'transfer'])
  type!: string;

  @IsNumber() @Min(0.01) @Type(() => Number)
  amount!: number;

  @IsString()
  description!: string;

  @IsOptional() @IsString()
  reference?: string;

  @IsOptional() @IsString()
  category?: string;

  @IsISO8601()
  movementDate!: string;

  @IsOptional() @IsString()
  relatedAccountId?: string;
}

@ApiTags('tesoreria')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('tesoreria')
export class TesoreriaController {
  constructor(
    private readonly svc: TesoreriaService,
    private readonly audit: AuditService,
  ) {}

  @Get('accounts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar cuentas (cajas y bancos) con saldo actual' })
  listAccounts() { return this.svc.listAccounts(); }

  @Post('accounts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear cuenta de caja o bancaria' })
  @ApiBody({ type: CreateAccountDto })
  async createAccount(
    @Body() dto: CreateAccountDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const a = await this.svc.createAccount(dto);
    void this.audit.log('treasury_account', a.accountId, 'CREATE', req.user?.email ?? 'system');
    return a;
  }

  @Get('movements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar movimientos de tesorería' })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'type',      required: false, enum: ['income', 'expense', 'transfer'] })
  @ApiQuery({ name: 'dateFrom',  required: false })
  @ApiQuery({ name: 'dateTo',    required: false })
  @ApiQuery({ name: 'page',      required: false })
  @ApiQuery({ name: 'limit',     required: false })
  searchMovements(
    @Query('accountId') accountId?: string,
    @Query('type')      type?: string,
    @Query('dateFrom')  dateFrom?: string,
    @Query('dateTo')    dateTo?: string,
    @Query('page')      page?: string,
    @Query('limit')     limit?: string,
  ) {
    return this.svc.searchMovements(accountId, type, dateFrom, dateTo, parseInt(page ?? '1') || 1, parseInt(limit ?? '20') || 20);
  }

  @Post('movements')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar movimiento de tesorería' })
  @ApiBody({ type: CreateMovementDto })
  async createMovement(
    @Body() dto: CreateMovementDto,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
  ) {
    const m = await this.svc.createMovement(dto);
    void this.audit.log('treasury_movement', m.movementId, 'CREATE', req.user?.email ?? 'system', { type: dto.type, amount: dto.amount });
    return m;
  }

  @Get('cash-flow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Flujo de caja mensual por año' })
  @ApiQuery({ name: 'year', description: 'Año (ej. 2026)' })
  cashFlow(@Query('year') year?: string) {
    return this.svc.cashFlow(parseInt(year ?? String(new Date().getFullYear())));
  }
}
