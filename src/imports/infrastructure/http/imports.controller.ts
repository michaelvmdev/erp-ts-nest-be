import {
  Controller, HttpCode, HttpStatus, Post,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags,
} from '@nestjs/swagger';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { ImportsService, ImportResult } from '../../imports.service';

@ApiTags('imports')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('imports')
export class ImportsController {
  constructor(private readonly svc: ImportsService) {}

  @Post('products')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importar productos desde CSV o XLSX',
    description:
      'Columnas: código, descripción, precio_unitario, categoria_id (opcional), unidad_id (opcional). ' +
      'La primera fila es la cabecera y se ignora. Utiliza upsert por código.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async importProducts(@UploadedFile() file: any): Promise<ImportResult> {
    if (!file) return { imported: 0, skipped: 0, errors: [{ row: 0, reason: 'No se recibió ningún archivo.' }] };
    return this.svc.importProducts(file.buffer as Buffer, file.mimetype as string);
  }

  @Post('clients')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importar clientes desde CSV o XLSX',
    description:
      'Columnas: descripción, tipo_documento_id, numero_documento. ' +
      'Upsert por número de documento.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async importClients(@UploadedFile() file: any): Promise<ImportResult> {
    if (!file) return { imported: 0, skipped: 0, errors: [{ row: 0, reason: 'No se recibió ningún archivo.' }] };
    return this.svc.importClients(file.buffer as Buffer, file.mimetype as string);
  }

  @Post('suppliers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importar proveedores desde CSV o XLSX',
    description:
      'Columnas: descripción, ruc. ' +
      'Upsert por RUC.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async importSuppliers(@UploadedFile() file: any): Promise<ImportResult> {
    if (!file) return { imported: 0, skipped: 0, errors: [{ row: 0, reason: 'No se recibió ningún archivo.' }] };
    return this.svc.importSuppliers(file.buffer as Buffer, file.mimetype as string);
  }
}
