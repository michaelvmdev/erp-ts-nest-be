import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { ForgotPasswordUseCase, PASSWORD_RESET_STORE } from '../src/auth/application/forgot-password.use-case';
import type { PasswordResetStore, PasswordResetEntry } from '../src/auth/application/forgot-password.use-case';
import { LoginUseCase } from '../src/auth/application/login.use-case';
import { RegisterUserUseCase } from '../src/auth/application/register-user.use-case';
import { ResetPasswordUseCase } from '../src/auth/application/reset-password.use-case';
import { USER_REPOSITORY } from '../src/auth/domain/user.repository';
import { JwtGuard } from '../src/auth/infrastructure/guards/jwt.guard';
import { AuthController } from '../src/auth/infrastructure/http/auth.controller';
import { MAILER } from '../src/mail/mailer.port';

const mockUserRepo = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  search: jest.fn(),
  insert: jest.fn(),
  save: jest.fn(),
  updatePassword: jest.fn(),
};

const mockMailer = { send: jest.fn() };

const inMemoryStore = new Map<string, PasswordResetEntry>();

const mockStore: PasswordResetStore = {
  set: (k, v) => inMemoryStore.set(k, v),
  get: (k) => inMemoryStore.get(k),
  delete: (k) => { inMemoryStore.delete(k); },
};

async function buildApp(): Promise<INestApplication<App>> {
  const module = await Test.createTestingModule({
    imports: [
      JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } }),
    ],
    controllers: [AuthController],
    providers: [
      RegisterUserUseCase,
      LoginUseCase,
      ForgotPasswordUseCase,
      ResetPasswordUseCase,
      JwtGuard,
      { provide: USER_REPOSITORY, useValue: mockUserRepo },
      { provide: MAILER, useValue: mockMailer },
      { provide: PASSWORD_RESET_STORE, useValue: mockStore },
    ],
  }).compile();

  const app = module.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();
  return app as INestApplication<App>;
}

describe('Auth E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    inMemoryStore.clear();
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  describe('POST /auth/login — validation', () => {
    it('returns 400 when body is empty', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('returns 400 when email is malformed', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: 'secret123' })
        .expect(400);
    });
  });

  describe('POST /auth/register — validation', () => {
    it('returns 400 when body is empty', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({})
        .expect(400);
    });
  });

  // ── JWT Guard ────────────────────────────────────────────────────────────────

  describe('GET /auth/me — JWT guard', () => {
    it('returns 401 with no token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('returns 401 with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });

  // ── Forgot password ──────────────────────────────────────────────────────────

  describe('POST /auth/forgot-password', () => {
    it('returns 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({})
        .expect(400);
    });

    it('returns 400 when email is malformed', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'not-valid' })
        .expect(400);
    });

    it('returns 204 for valid email even when user does not exist (no enumeration)', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'unknown@test.com' })
        .expect(204);
      // Email should NOT have been sent
      expect(mockMailer.send).not.toHaveBeenCalled();
    });

    it('sends email and returns 204 for existing active user', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: { value: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa' },
        email: 'admin@test.com',
        name: 'Admin',
        active: true,
      });
      mockMailer.send.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'admin@test.com' })
        .expect(204);

      expect(mockMailer.send).toHaveBeenCalledOnce?.() ?? expect(mockMailer.send).toHaveBeenCalledTimes(1);
    });
  });

  // ── Reset password ───────────────────────────────────────────────────────────

  describe('POST /auth/reset-password', () => {
    it('returns 400 when body is empty', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({})
        .expect(400);
    });

    it('returns 400 when newPassword is shorter than 8 chars', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'sometoken', newPassword: 'short' })
        .expect(400);
    });

    it('returns 422 for unknown token', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'nonexistent', newPassword: 'newpassword123' })
        .expect(422);
    });

    it('returns 422 for expired token', async () => {
      const expiredAt = new Date(Date.now() - 1000);
      inMemoryStore.set('expired-token', {
        userId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        expiresAt: expiredAt,
      });

      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'expired-token', newPassword: 'newpassword123' })
        .expect(422);
    });

    it('returns 204 and updates password for valid token', async () => {
      const validEntry = {
        userId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        expiresAt: new Date(Date.now() + 60_000),
      };
      inMemoryStore.set('valid-token', validEntry);
      mockUserRepo.updatePassword.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'newpassword123' })
        .expect(204);

      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(
        'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
        expect.any(String),
      );
      expect(inMemoryStore.has('valid-token')).toBe(false);
    });
  });
});
