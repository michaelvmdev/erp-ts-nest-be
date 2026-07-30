import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../../domain/department';
import { District } from '../../domain/district';
import { Province } from '../../domain/province';
import { UbigeoRepository } from '../../domain/ubigeo.repository';
import { DepartmentId } from '../../domain/value-objects/department-id.value-object';
import { ProvinceId } from '../../domain/value-objects/province-id.value-object';
import { DepartmentOrmEntity } from './department.orm-entity';
import { DistrictOrmEntity } from './district.orm-entity';
import { ProvinceOrmEntity } from './province.orm-entity';
import { UbigeoMapper } from './ubigeo.mapper';

@Injectable()
export class TypeOrmUbigeoRepository implements UbigeoRepository {
  constructor(
    @InjectRepository(DepartmentOrmEntity)
    private readonly departments: Repository<DepartmentOrmEntity>,
    @InjectRepository(ProvinceOrmEntity)
    private readonly provinces: Repository<ProvinceOrmEntity>,
    @InjectRepository(DistrictOrmEntity)
    private readonly districts: Repository<DistrictOrmEntity>,
  ) {}

  async findAllDepartments(): Promise<Department[]> {
    // Se ordena por descripcion y no por codigo: un selector se lee mejor
    // alfabetico. El codigo desempata para que el orden sea estable. La columna
    // *_description esta indexada, asi que el ORDER BY aprovecha el indice.
    const rows = await this.departments.find({
      order: { departmentDescription: 'ASC', departmentId: 'ASC' },
    });
    return rows.map((row) => UbigeoMapper.departmentToDomain(row));
  }

  departmentExists(id: DepartmentId): Promise<boolean> {
    return this.departments.existsBy({ departmentId: id.value });
  }

  async findProvincesByDepartment(id: DepartmentId): Promise<Province[]> {
    const rows = await this.provinces.find({
      where: { departmentId: id.value },
      order: { provinceDescription: 'ASC', provinceId: 'ASC' },
    });
    return rows.map((row) => UbigeoMapper.provinceToDomain(row));
  }

  provinceExists(id: ProvinceId): Promise<boolean> {
    return this.provinces.existsBy({ provinceId: id.value });
  }

  async findDistrictsByProvince(id: ProvinceId): Promise<District[]> {
    const rows = await this.districts.find({
      where: { provinceId: id.value },
      order: { districtDescription: 'ASC', districtId: 'ASC' },
    });
    return rows.map((row) => UbigeoMapper.districtToDomain(row));
  }
}
