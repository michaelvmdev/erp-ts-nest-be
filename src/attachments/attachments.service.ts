import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { Repository } from 'typeorm';
import { AttachmentOrmEntity } from './infrastructure/persistence/attachment.orm-entity';

@Injectable()
export class AttachmentsService {
  private readonly storagePath: string;

  constructor(
    @InjectRepository(AttachmentOrmEntity)
    private readonly repo: Repository<AttachmentOrmEntity>,
    private readonly config: ConfigService,
  ) {
    this.storagePath = this.config.get<string>('ATTACHMENTS_PATH', './attachments');
  }

  async upload(params: {
    entityType: string;
    entityId: string;
    originalName: string;
    mimeType: string;
    buffer: Buffer;
  }): Promise<AttachmentOrmEntity> {
    const id   = randomUUID();
    const ext  = extname(params.originalName) || '';
    const dir  = join(this.storagePath, params.entityType, params.entityId);
    const path = join(dir, `${id}${ext}`);

    await mkdir(dir, { recursive: true });
    await writeFile(path, params.buffer);

    const att = new AttachmentOrmEntity();
    att.attachmentId = id;
    att.entityType   = params.entityType;
    att.entityId     = params.entityId;
    att.originalName = params.originalName;
    att.mimeType     = params.mimeType;
    att.sizeBytes    = params.buffer.length;
    att.storagePath  = path;

    return this.repo.save(att);
  }

  async listForEntity(entityType: string, entityId: string): Promise<AttachmentOrmEntity[]> {
    return this.repo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<AttachmentOrmEntity | null> {
    return this.repo.findOne({ where: { attachmentId: id } });
  }

  async readFile(att: AttachmentOrmEntity): Promise<Buffer> {
    return readFile(att.storagePath);
  }
}
