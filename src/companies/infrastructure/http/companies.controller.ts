import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, ParseUUIDPipe, Patch, Post, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtGuard } from '../../../auth/infrastructure/guards/jwt.guard';
import { CompanyEntity } from '../orm/company.entity';

@ApiTags('companies')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('companies')
export class CompaniesController {
  constructor(
    @InjectRepository(CompanyEntity)
    private readonly repo: Repository<CompanyEntity>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar empresas' })
  async list() {
    return this.repo.find({ order: { isDefault: 'DESC', companyName: 'ASC' } });
  }

  @Get('default')
  @ApiOperation({ summary: 'Empresa activa / por defecto' })
  async getDefault() {
    const company = await this.repo.findOne({ where: { isDefault: true, isActive: true } });
    return company ?? this.repo.findOne({ where: { isActive: true }, order: { createdAt: 'ASC' } });
  }

  @Get(':id')
  async getOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.repo.findOneOrFail({ where: { companyId: id } });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear empresa' })
  async create(@Body() body: Partial<CompanyEntity>) {
    const entity = this.repo.create(body);
    return this.repo.save(entity);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de empresa' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() body: Partial<CompanyEntity>) {
    await this.repo.update(id, body);
    return this.repo.findOneOrFail({ where: { companyId: id } });
  }

  @Patch(':id/set-default')
  @ApiOperation({ summary: 'Establecer empresa como activa/por defecto' })
  async setDefault(@Param('id', ParseUUIDPipe) id: string) {
    await this.repo.update({}, { isDefault: false });
    await this.repo.update(id, { isDefault: true });
    return this.repo.findOneOrFail({ where: { companyId: id } });
  }
}
