/**
 * Integración RBAC completa:
 * - Controlador real (UsersController) con los decoradores @Roles + @UseGuards
 * - Guards reales (JwtGuard + RolesGuard) con JwtModule real
 * - Middleware completo: Helmet, ValidationPipe, DomainExceptionFilter
 * - Solo el repositorio y el caso de uso están mockeados (sin DB)
 *
 * Diferencia con rbac.e2e-spec.ts: aquí el controlador bajo prueba es el
 * real, con su stack real de middleware, no un controlador de andamio.
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { User, UserId } from '../src/auth/domain/user';
import { USER_REPOSITORY } from '../src/auth/domain/user.repository';
import { UpdateUserUseCase } from '../src/auth/application/update-user.use-case';
import { JwtGuard } from '../src/auth/infrastructure/guards/jwt.guard';
import { RolesGuard } from '../src/auth/infrastructure/guards/roles.guard';
import { UsersController } from '../src/auth/infrastructure/http/users.controller';
import { DomainExceptionFilter } from '../src/shared/infrastructure/http/domain-exception.filter';
import { Page } from '../src/shared/domain/pagination';

const SECRET = 'rbac-full-integration-secret';

function makeToken(svc: JwtService, roleName: string): string {
  return svc.sign({
    sub: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: `${roleName}@test.com`,
    roleId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    roleName,
    type: 'access',
  });
}

function makeUser(): User {
  return User.rehydrate({
    id: UserId.of('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
    roleId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    email: 'admin@test.com',
    name: 'Admin Test',
    passwordHash: 'hash',
    active: true,
    createdAt: new Date('2024-01-01'),
  });
}

const mockUserRepo = {
  search: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  insert: jest.fn(),
  save: jest.fn(),
  updatePassword: jest.fn(),
};

const mockUpdateUC = { run: jest.fn() };

async function buildApp(): Promise<{ app: INestApplication<App>; jwt: JwtService }> {
  const module = await Test.createTestingModule({
    imports: [JwtModule.register({ secret: SECRET, signOptions: { expiresIn: '1h' } })],
    controllers: [UsersController],
    providers: [
      JwtGuard,
      RolesGuard,
      Reflector,
      { provide: USER_REPOSITORY, useValue: mockUserRepo },
      { provide: UpdateUserUseCase, useValue: mockUpdateUC },
    ],
  }).compile();

  const app = module.createNestApplication<INestApplication<App>>();

  // Mismo stack de middleware que producción
  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: false },
    validationError: { target: false, value: false },
  }));
  app.useGlobalFilters(new DomainExceptionFilter());

  await app.init();
  return { app: app as INestApplication<App>, jwt: module.get(JwtService) };
}

describe('RBAC integración completa — UsersController real', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;

  beforeAll(async () => {
    ({ app, jwt } = await buildApp());
    mockUserRepo.search.mockResolvedValue(
      new Page([makeUser()], 1, 1, 20),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  // ── 401: sin token ────────────────────────────────────────────────────────

  it('GET /users sin token → 401', () =>
    request(app.getHttpServer())
      .get('/users')
      .expect(401));

  it('GET /users con token malformado → 401', () =>
    request(app.getHttpServer())
      .get('/users')
      .set('Authorization', 'Bearer not.a.real.jwt')
      .expect(401));

  // ── 403: rol incorrecto ───────────────────────────────────────────────────

  it('GET /users con rol "vendedor" → 403', () =>
    request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${makeToken(jwt, 'vendedor')}`)
      .expect(403));

  it('GET /users con rol "almacenero" → 403', () =>
    request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${makeToken(jwt, 'almacenero')}`)
      .expect(403));

  it('GET /users con rol "contador" → 403', () =>
    request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${makeToken(jwt, 'contador')}`)
      .expect(403));

  // ── 200: administrador ────────────────────────────────────────────────────

  it('GET /users con rol "administrador" → 200 con cuerpo paginado', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${makeToken(jwt, 'administrador')}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.meta).toMatchObject({
      page: 1,
      limit: 20,
      total: 1,
    });
  });

  // ── Helmet activo en el controlador real ──────────────────────────────────

  it('respuesta del controlador real incluye headers de Helmet', async () => {
    const res = await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${makeToken(jwt, 'administrador')}`)
      .expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  // ── ValidationPipe activo ─────────────────────────────────────────────────

  it('PATCH /users/:id con cuerpo inválido → 400', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/aaaaaaaa-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${makeToken(jwt, 'administrador')}`)
      .send({ campoInventado: 'valor' })
      .expect(400);

    expect(res.body.statusCode).toBe(400);
  });
});
