import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { AttachmentOrmEntity } from './infrastructure/persistence/attachment.orm-entity';
import { AttachmentsController } from './infrastructure/http/attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttachmentOrmEntity]),
    AuthModule,
  ],
  controllers: [AttachmentsController],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
