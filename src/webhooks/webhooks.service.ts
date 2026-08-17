import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID, createHmac } from 'node:crypto';
import { Repository } from 'typeorm';
import { WebhookOrmEntity } from './infrastructure/persistence/webhook.orm-entity';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    @InjectRepository(WebhookOrmEntity)
    private readonly repo: Repository<WebhookOrmEntity>,
  ) {}

  async list() {
    return this.repo.find({ where: { active: true }, order: { createdAt: 'DESC' } });
  }

  async create(url: string, events: string[], secret?: string): Promise<WebhookOrmEntity> {
    const w = new WebhookOrmEntity();
    w.webhookId = randomUUID();
    w.url       = url;
    w.events    = events;
    w.secret    = secret ?? null;
    w.active    = true;
    return this.repo.save(w);
  }

  async deactivate(webhookId: string): Promise<boolean> {
    const result = await this.repo.update({ webhookId }, { active: false });
    return (result.affected ?? 0) > 0;
  }

  async dispatch(event: string, payload: unknown): Promise<void> {
    const hooks = await this.repo.find({ where: { active: true } });
    const matching = hooks.filter((h) => h.events.includes(event) || h.events.includes('*'));

    const body = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });

    await Promise.allSettled(
      matching.map(async (hook) => {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-ERP-Event': event,
        };
        if (hook.secret) {
          headers['X-ERP-Signature'] = `sha256=${createHmac('sha256', hook.secret).update(body).digest('hex')}`;
        }
        try {
          const response = await fetch(hook.url, { method: 'POST', headers, body, signal: AbortSignal.timeout(10_000) });
          if (!response.ok) {
            this.logger.warn(`Webhook ${hook.webhookId} → ${hook.url} returned ${response.status}`);
          }
        } catch (err) {
          this.logger.error(`Webhook ${hook.webhookId} → ${hook.url} failed: ${(err as Error).message}`);
        }
      }),
    );
  }
}
