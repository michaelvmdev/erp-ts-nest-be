import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import helmet from 'helmet';
import request from 'supertest';
import type { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { HealthController } from '../src/health/health.controller';

const mockDataSource = { query: jest.fn() };

async function buildApp(): Promise<INestApplication<App>> {
  const module = await Test.createTestingModule({
    imports: [ThrottlerModule.forRoot([{ limit: 100, ttl: 60_000 }])],
    controllers: [HealthController],
    providers: [{ provide: DataSource, useValue: mockDataSource }],
  }).compile();

  const app = module.createNestApplication<INestApplication<App>>();
  app.use(helmet());
  await app.init();
  return app;
}

describe('Health endpoint E2E', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Comportamiento funcional ───────────────────────────────────────────────

  it('GET /health/db → 200 cuando la DB responde', async () => {
    mockDataSource.query.mockResolvedValueOnce([{ '?column?': 1 }]);
    const res = await request(app.getHttpServer())
      .get('/health/db')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(typeof res.body.latencyMs).toBe('number');
    expect(mockDataSource.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('GET /health/db → 503 cuando la DB no responde', async () => {
    mockDataSource.query.mockRejectedValueOnce(new Error('Connection refused'));
    const res = await request(app.getHttpServer())
      .get('/health/db')
      .expect(503);

    expect(res.body.statusCode).toBe(503);
  });

  // ── Headers de Helmet ─────────────────────────────────────────────────────
  // Verifica que Helmet está activo Y que no rompe el endpoint de salud.

  it('respuesta incluye los headers de seguridad de Helmet', async () => {
    mockDataSource.query.mockResolvedValueOnce([]);
    const res = await request(app.getHttpServer())
      .get('/health/db')
      .expect(200);

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-dns-prefetch-control']).toBe('off');
    expect(res.headers['x-download-options']).toBe('noopen');
    expect(res.headers['x-permitted-cross-domain-policies']).toBe('none');
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('Helmet no quita el header Content-Type de la respuesta JSON', async () => {
    mockDataSource.query.mockResolvedValueOnce([]);
    const res = await request(app.getHttpServer())
      .get('/health/db')
      .expect(200);

    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('Helmet elimina el header X-Powered-By', async () => {
    mockDataSource.query.mockResolvedValueOnce([]);
    const res = await request(app.getHttpServer())
      .get('/health/db')
      .expect(200);

    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
