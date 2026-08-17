import {
  Controller, Delete, Get, HttpCode, HttpStatus,
  NotFoundException, Param, ParseUUIDPipe,
  Post, Query, Res, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse,
  ApiOperation, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { AttachmentsService } from '../../attachments.service';

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly svc: AttachmentsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar adjuntos de una entidad' })
  @ApiQuery({ name: 'entityType', example: 'sale' })
  @ApiQuery({ name: 'entityId' })
  @ApiOkResponse({ description: 'Lista de adjuntos' })
  list(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ) {
    return this.svc.listForEntity(entityType, entityId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Subir adjunto',
    description: 'Requiere los query params entityType (ej. sale) y entityId (UUID).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @ApiCreatedResponse({ description: 'Adjunto creado' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @UploadedFile() file: any,
  ) {
    if (!file) throw new NotFoundException('Archivo no recibido.');
    return this.svc.upload({
      entityType,
      entityId,
      originalName: file.originalname as string,
      mimeType:     file.mimetype as string,
      buffer:       file.buffer as Buffer,
    });
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar adjunto' })
  async download(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    const att = await this.svc.findById(id);
    if (!att) throw new NotFoundException('Adjunto no encontrado.');
    const buf = await this.svc.readFile(att);
    res.setHeader('Content-Type', att.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${att.originalName}"`);
    res.send(buf);
  }
}
