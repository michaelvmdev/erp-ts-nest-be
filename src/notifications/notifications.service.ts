import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { NotificationOrmEntity } from './infrastructure/persistence/notification.orm-entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly repo: Repository<NotificationOrmEntity>,
  ) {}

  async notify(userEmail: string, type: string, title: string, body: string): Promise<void> {
    const n = new NotificationOrmEntity();
    n.notificationId = randomUUID();
    n.userEmail  = userEmail;
    n.type       = type;
    n.title      = title;
    n.body       = body;
    n.read       = false;
    await this.repo.save(n);
  }

  async listForUser(userEmail: string, page: number, limit: number) {
    const [items, total] = await this.repo.findAndCount({
      where: { userEmail },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { items, total };
  }

  async markRead(notificationId: string, userEmail: string): Promise<boolean> {
    const result = await this.repo.update(
      { notificationId, userEmail },
      { read: true },
    );
    return (result.affected ?? 0) > 0;
  }

  async markAllRead(userEmail: string): Promise<void> {
    await this.repo.update({ userEmail, read: false }, { read: true });
  }

  async unreadCount(userEmail: string): Promise<number> {
    return this.repo.count({ where: { userEmail, read: false } });
  }
}
