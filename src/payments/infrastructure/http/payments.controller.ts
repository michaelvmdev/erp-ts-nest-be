import {
  Body, Controller, Delete, Get, HttpCode, Param, Post, Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreatePaymentUseCase } from '../../application/create-payment.use-case';
import { DeletePaymentUseCase } from '../../application/delete-payment.use-case';
import { SearchPaymentsUseCase } from '../../application/search-payments.use-case';
import type { PaymentMethod, PaymentType, ReferenceType } from '../../domain/payment';
import { CreatePaymentRequestDto } from './dto/create-payment.request.dto';
import { PaginatedPaymentsResponseDto, PaymentResponseDto } from './dto/payment.response.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createUC: CreatePaymentUseCase,
    private readonly searchUC: SearchPaymentsUseCase,
    private readonly deleteUC: DeletePaymentUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Register a payment' })
  async create(@Body() dto: CreatePaymentRequestDto): Promise<PaymentResponseDto> {
    const payment = await this.createUC.run(dto);
    return PaymentResponseDto.fromDomain(payment);
  }

  @Get()
  @ApiOperation({ summary: 'Search payments' })
  async search(
    @Query('referenceType') referenceType?: ReferenceType,
    @Query('referenceId') referenceId?: string,
    @Query('paymentType') paymentType?: PaymentType,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedPaymentsResponseDto> {
    const result = await this.searchUC.run({
      referenceType, referenceId, paymentType, paymentMethod,
      dateFrom, dateTo,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return {
      items: result.items.map(PaymentResponseDto.fromDomain),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
      },
    };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a payment' })
  async delete(@Param('id') id: string): Promise<void> {
    await this.deleteUC.run(id);
  }
}
