import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { JwtGuard } from '../src/auth/infrastructure/guards/jwt.guard';
import { RolesGuard } from '../src/auth/infrastructure/guards/roles.guard';
import { Roles } from '../src/auth/infrastructure/guards/roles.decorator';

const SECRET = 'rbac-e2e-test-secret';

@Controller('rbac-test')
class TestController {
  @Get('admin')
  @Roles('administrador')
  @UseGuards(JwtGuard, RolesGuard)
  adminOnly() { return { ok: true }; }

  @Get('vendedor')
  @Roles('administrador', 'vendedor')
  @UseGuards(JwtGuard, RolesGuard)
  adminOrVendedor() { return { ok: true }; }

  @Get('almacen')
  @Roles('administrador', 'almacenero')
  @UseGuards(JwtGuard, RolesGuard)
  adminOrAlmacenero() { return { ok: true }; }

  @Get('contador')
  @Roles('administrador', 'contador')
  @UseGuards(JwtGuard, RolesGuard)
  adminOrContador() { return { ok: true }; }
}

function makeToken(svc: JwtService, roleName: string): string {
  return svc.sign({
    sub: 'test-user-id',
    email: `${roleName}@test.com`,
    roleId: 'role-uuid',
    roleName,
    type: 'access',
  });
}

async function buildApp(): Promise<{ app: INestApplication<App>; jwt: JwtService }> {
  const module = await Test.createTestingModule({
    imports: [JwtModule.register({ secret: SECRET, signOptions: { expiresIn: '1h' } })],
    controllers: [TestController],
    providers: [JwtGuard, RolesGuard, Reflector],
  }).compile();

  const app = module.createNestApplication();
  await app.init();
  return { app: app as INestApplication<App>, jwt: module.get(JwtService) };
}

describe('RBAC Guards E2E', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  beforeAll(async () => {
    ({ app, jwt } = await buildApp());
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Sin token ─────────────────────────────────────────────────────────────────

  describe('sin token', () => {
    it('GET /rbac-test/admin → 401', () =>
      request(app.getHttpServer()).get('/rbac-test/admin').expect(401));

    it('GET /rbac-test/vendedor → 401', () =>
      request(app.getHttpServer()).get('/rbac-test/vendedor').expect(401));

    it('GET /rbac-test/almacen → 401', () =>
      request(app.getHttpServer()).get('/rbac-test/almacen').expect(401));
  });

  // ── Token inválido ────────────────────────────────────────────────────────────

  it('token inválido → 401', () =>
    request(app.getHttpServer())
      .get('/rbac-test/admin')
      .set('Authorization', 'Bearer not.a.valid.token')
      .expect(401));

  // ── administrador: accede a todo ──────────────────────────────────────────────

  describe('rol: administrador', () => {
    let token: string;
    beforeAll(() => { token = makeToken(jwt, 'administrador'); });

    it('GET /rbac-test/admin → 200', () =>
      request(app.getHttpServer()).get('/rbac-test/admin')
        .set('Authorization', `Bearer ${token}`).expect(200));

    it('GET /rbac-test/vendedor → 200', () =>
      request(app.getHttpServer()).get('/rbac-test/vendedor')
        .set('Authorization', `Bearer ${token}`).expect(200));

    it('GET /rbac-test/almacen → 200', () =>
      request(app.getHttpServer()).get('/rbac-test/almacen')
        .set('Authorization', `Bearer ${token}`).expect(200));

    it('GET /rbac-test/contador → 200', () =>
      request(app.getHttpServer()).get('/rbac-test/contador')
        .set('Authorization', `Bearer ${token}`).expect(200));
  });

  // ── vendedor: solo endpoints de ventas/nps ────────────────────────────────────

  describe('rol: vendedor', () => {
    let token: string;
    beforeAll(() => { token = makeToken(jwt, 'vendedor'); });

    it('GET /rbac-test/admin → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/admin')
        .set('Authorization', `Bearer ${token}`).expect(403));

    it('GET /rbac-test/vendedor → 200', () =>
      request(app.getHttpServer()).get('/rbac-test/vendedor')
        .set('Authorization', `Bearer ${token}`).expect(200));

    it('GET /rbac-test/almacen → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/almacen')
        .set('Authorization', `Bearer ${token}`).expect(403));

    it('GET /rbac-test/contador → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/contador')
        .set('Authorization', `Bearer ${token}`).expect(403));
  });

  // ── almacenero: solo endpoints de almacén/compras ─────────────────────────────

  describe('rol: almacenero', () => {
    let token: string;
    beforeAll(() => { token = makeToken(jwt, 'almacenero'); });

    it('GET /rbac-test/admin → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/admin')
        .set('Authorization', `Bearer ${token}`).expect(403));

    it('GET /rbac-test/vendedor → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/vendedor')
        .set('Authorization', `Bearer ${token}`).expect(403));

    it('GET /rbac-test/almacen → 200', () =>
      request(app.getHttpServer()).get('/rbac-test/almacen')
        .set('Authorization', `Bearer ${token}`).expect(200));

    it('GET /rbac-test/contador → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/contador')
        .set('Authorization', `Bearer ${token}`).expect(403));
  });

  // ── contador: solo endpoints de pagos/dashboard/listas de precio ──────────────

  describe('rol: contador', () => {
    let token: string;
    beforeAll(() => { token = makeToken(jwt, 'contador'); });

    it('GET /rbac-test/admin → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/admin')
        .set('Authorization', `Bearer ${token}`).expect(403));

    it('GET /rbac-test/vendedor → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/vendedor')
        .set('Authorization', `Bearer ${token}`).expect(403));

    it('GET /rbac-test/almacen → 403', () =>
      request(app.getHttpServer()).get('/rbac-test/almacen')
        .set('Authorization', `Bearer ${token}`).expect(403));

    it('GET /rbac-test/contador → 200', () =>
      request(app.getHttpServer()).get('/rbac-test/contador')
        .set('Authorization', `Bearer ${token}`).expect(200));
  });
});
