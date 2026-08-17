import {
  Controller, Get, HttpCode, HttpStatus, Param,
  ParseUUIDPipe, Patch, Post, Query, Req, UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { NotificationsService } from '../../notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar notificaciones del usuario autenticado' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async list(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userEmail = req.user?.email ?? '';
    const p = Math.max(1, parseInt(page ?? '1') || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20') || 20));
    const { items, total } = await this.svc.listForUser(userEmail, p, l);
    const totalPages = Math.ceil(total / l);
    return {
      items: items.map((n) => ({
        id:        n.notificationId,
        type:      n.type,
        title:     n.title,
        body:      n.body,
        read:      n.read,
        createdAt: n.createdAt,
      })),
      meta: { page: p, limit: l, total, totalPages, hasNextPage: p < totalPages, hasPreviousPage: p > 1 },
    };
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Número de notificaciones no leídas' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async unreadCount(@Req() req: any) {
    const count = await this.svc.unreadCount(req.user?.email ?? '');
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async markRead(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: any) {
    const ok = await this.svc.markRead(id, req.user?.email ?? '');
    return { ok };
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar todas las notificaciones como leídas' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async markAllRead(@Req() req: any) {
    await this.svc.markAllRead(req.user?.email ?? '');
  }
}
