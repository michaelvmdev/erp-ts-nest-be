import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiErrorDto } from '../../../shared/infrastructure/http/api-error.dto';
import { ListDepartmentsUseCase } from '../../application/list-departments.use-case';
import { ListDistrictsUseCase } from '../../application/list-districts.use-case';
import { ListProvincesUseCase } from '../../application/list-provinces.use-case';
import { DepartmentResponseDto } from './dto/department.response.dto';
import { DistrictResponseDto } from './dto/district.response.dto';
import { ProvinceResponseDto } from './dto/province.response.dto';

/**
 * Consulta del ubigeo para poblar selectores en cascada.
 *
 * Los tres niveles cuelgan de un mismo recurso porque son un unico concepto
 * jerarquico. Las rutas anidan la relacion: las provincias son de un
 * departamento y los distritos de una provincia. Cada nivel devuelve un arreglo
 * plano, sin paginado, igual que los demas catalogos de la API.
 */
@ApiTags('ubigeo')
@Controller('ubigeo')
export class UbigeoController {
  constructor(
    private readonly listDepartments: ListDepartmentsUseCase,
    private readonly listProvinces: ListProvincesUseCase,
    private readonly listDistricts: ListDistrictsUseCase,
  ) {}

  @Get('departments')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar departamentos',
    description:
      'Devuelve los 25 departamentos del padron INEI, ordenados alfabeticamente por nombre ' +
      'para poblar el primer selector.\n\n' +
      'La respuesta es un arreglo plano, sin envoltorio de paginado: el catalogo es fijo y ' +
      'se pide completo.',
  })
  @ApiOkResponse({
    description: 'Catalogo de departamentos.',
    type: [DepartmentResponseDto],
  })
  async departments(): Promise<DepartmentResponseDto[]> {
    const rows = await this.listDepartments.execute();
    return rows.map((d) => DepartmentResponseDto.fromDomain(d));
  }

  @Get('departments/:departmentId/provinces')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar las provincias de un departamento',
    description:
      'Devuelve las provincias del departamento indicado, ordenadas alfabeticamente. Es el ' +
      'segundo selector de la cascada.',
  })
  @ApiParam({
    name: 'departmentId',
    example: '15',
    description: 'Codigo INEI del departamento: dos digitos.',
  })
  @ApiOkResponse({
    description: 'Provincias del departamento.',
    type: [ProvinceResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'El codigo de departamento no tiene el formato esperado.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe un departamento con ese codigo.',
    type: ApiErrorDto,
  })
  async provinces(
    @Param('departmentId') departmentId: string,
  ): Promise<ProvinceResponseDto[]> {
    const rows = await this.listProvinces.execute(departmentId);
    return rows.map((p) => ProvinceResponseDto.fromDomain(p));
  }

  @Get('provinces/:provinceId/districts')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar los distritos de una provincia',
    description:
      'Devuelve los distritos de la provincia indicada, ordenados alfabeticamente. Es el ' +
      'tercer selector de la cascada, y el `districtId` resultante es lo que se envia al ' +
      'registrar una venta.',
  })
  @ApiParam({
    name: 'provinceId',
    example: '1501',
    description: 'Codigo INEI de la provincia: cuatro digitos.',
  })
  @ApiOkResponse({
    description: 'Distritos de la provincia.',
    type: [DistrictResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'El codigo de provincia no tiene el formato esperado.',
    type: ApiErrorDto,
  })
  @ApiNotFoundResponse({
    description: 'No existe una provincia con ese codigo.',
    type: ApiErrorDto,
  })
  async districts(
    @Param('provinceId') provinceId: string,
  ): Promise<DistrictResponseDto[]> {
    const rows = await this.listDistricts.execute(provinceId);
    return rows.map((d) => DistrictResponseDto.fromDomain(d));
  }
}
