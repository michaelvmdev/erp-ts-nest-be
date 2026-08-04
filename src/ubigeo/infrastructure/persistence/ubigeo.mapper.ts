import { Department } from '../../domain/department';
import { District } from '../../domain/district';
import { Province } from '../../domain/province';
import { DepartmentId } from '../../domain/value-objects/department-id.value-object';
import { DistrictId } from '../../domain/value-objects/district-id.value-object';
import { ProvinceId } from '../../domain/value-objects/province-id.value-object';
import { DepartmentOrmEntity } from './department.orm-entity';
import { DistrictOrmEntity } from './district.orm-entity';
import { ProvinceOrmEntity } from './province.orm-entity';

/**
 * Traduce las filas de las tres tablas del ubigeo a sus agregados de dominio.
 *
 * Las columnas char(n) vuelven rellenadas con espacios a la derecha; los VO de
 * identidad hacen `trim` al construirse, asi que el mapeo no necesita limpiarlas
 * aparte.
 */
export class UbigeoMapper {
  static departmentToDomain(row: DepartmentOrmEntity): Department {
    return Department.rehydrate({
      id: DepartmentId.of(row.departmentId),
      description: row.departmentDescription,
    });
  }

  static provinceToDomain(row: ProvinceOrmEntity): Province {
    return Province.rehydrate({
      id: ProvinceId.of(row.provinceId),
      departmentId: DepartmentId.of(row.departmentId),
      description: row.provinceDescription,
    });
  }

  static districtToDomain(row: DistrictOrmEntity): District {
    return District.rehydrate({
      id: DistrictId.of(row.districtId),
      provinceId: ProvinceId.of(row.provinceId),
      description: row.districtDescription,
    });
  }
}
