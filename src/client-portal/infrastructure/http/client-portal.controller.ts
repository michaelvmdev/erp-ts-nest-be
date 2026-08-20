import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Post, Query, Req, UseGuards, UnauthorizedException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ClientPortalUserEntity } from '../orm/client-portal-user.entity';

@ApiTags('client-portal')
@Controller('portal')
export class ClientPortalController {
  constructor(
    @InjectRepository(ClientPortalUserEntity)
    private readonly portalUsers: Repository<ClientPortalUserEntity>,
    @InjectDataSource() private readonly ds: DataSource,
    private readonly jwt: JwtService,
  ) {}

  /* ─── AUTH (público) ─────────────────────────────────────────────── */

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login del portal de clientes' })
  @ApiBody({ schema: { example: { email: 'cliente@empresa.com', password: 'pass123' } } })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.portalUsers.findOne({ where: { email: body.email, isActive: true } });
    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales incorrectas');

    await this.portalUsers.update(user.portalUserId, { lastLoginAt: new Date() });

    const token = this.jwt.sign({
      sub:      user.portalUserId,
      email:    user.email,
      clientId: user.clientId,
      role:     'portal',
    });

    const [client] = await this.ds.query<{ client_description: string }[]>(
      `SELECT client_description FROM clients WHERE client_id = $1`, [user.clientId],
    );

    return { access_token: token, client: client?.client_description, email: user.email };
  }

  /* ─── GESTIÓN (solo admins ERP) ──────────────────────────────────── */

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear usuario del portal (admin ERP)' })
  async createPortalUser(
    @Body() body: { clientId: string; email: string; password: string },
  ) {
    const hash = await bcrypt.hash(body.password, 10);
    const user = this.portalUsers.create({
      clientId:     body.clientId,
      email:        body.email,
      passwordHash: hash,
    });
    const saved = await this.portalUsers.save(user);
    return { portalUserId: saved.portalUserId, email: saved.email, clientId: saved.clientId };
  }

  @Get('users')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuarios del portal (admin ERP)' })
  async listUsers() {
    return this.portalUsers.find({ order: { createdAt: 'DESC' } });
  }

  /* ─── VISTAS DEL CLIENTE (token portal) ─────────────────────────── */

  @Get('my/invoices')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Facturas del cliente autenticado en el portal' })
  @ApiQuery({ name: 'page',  required: false })
  @ApiQuery({ name: 'limit', required: false })
  async myInvoices(
    @Req() req: any,
    @Query('page')  page  = '1',
    @Query('limit') limit = '20',
  ) {
    const clientId = req.user?.clientId;
    if (!clientId) throw new UnauthorizedException('Token de portal requerido');
    const take  = Math.min(Number(limit) || 20, 50);
    const skip  = (Math.max(Number(page), 1) - 1) * take;
    const [rows] = await Promise.all([
      this.ds.query(
        `SELECT s.sale_id, s.sale_number, s.sale_date, s.sub_total, s.igv, s.total,
                s.status, s.payment_status
           FROM sales s
          WHERE s.client_id = $1
          ORDER BY s.sale_date DESC
          LIMIT $2 OFFSET $3`,
        [clientId, take, skip],
      ),
    ]);
    return rows;
  }

  @Get('my/quotes')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cotizaciones del cliente autenticado en el portal' })
  async myQuotes(@Req() req: any) {
    const clientId = req.user?.clientId;
    if (!clientId) throw new UnauthorizedException('Token de portal requerido');
    return this.ds.query(
      `SELECT q.quote_id, q.quote_number, q.quote_date, q.total, q.status, q.valid_until
         FROM quotes q
        WHERE q.client_id = $1
        ORDER BY q.quote_date DESC
        LIMIT 50`,
      [clientId],
    );
  }

  @Get('my/profile')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil del cliente en el portal' })
  async myProfile(@Req() req: any) {
    const clientId = req.user?.clientId;
    if (!clientId) throw new UnauthorizedException('Token de portal requerido');
    const [client] = await this.ds.query(
      `SELECT client_id, client_description, document_number, address, email, phone
         FROM clients WHERE client_id = $1`,
      [clientId],
    );
    return client ?? null;
  }
}
