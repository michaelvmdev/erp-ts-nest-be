import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Post, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl } from 'class-validator';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { WebhooksService } from '../../webhooks.service';

class CreateWebhookDto {
  @IsUrl()
  url!: string;

  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @IsOptional()
  @IsString()
  secret?: string;
}

@ApiTags('webhooks')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly svc: WebhooksService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar webhooks activos' })
  @ApiOkResponse({ description: 'Lista de webhooks' })
  list() { return this.svc.list(); }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar webhook',
    description:
      'Eventos disponibles: sale.created, purchase.created, purchase_order.approved, ' +
      'stock.low, lot.expiring, quote.accepted, * (todos).',
  })
  @ApiCreatedResponse({ description: 'Webhook registrado' })
  create(@Body() dto: CreateWebhookDto) {
    return this.svc.create(dto.url, dto.events, dto.secret);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar webhook' })
  @ApiNoContentResponse()
  async deactivate(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.svc.deactivate(id);
  }
}
