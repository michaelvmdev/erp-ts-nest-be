import { Department } from './department';
import { District } from './district';
import { Province } from './province';
import { DepartmentId } from './value-objects/department-id.value-object';
import { ProvinceId } from './value-objects/province-id.value-object';

/**
 * Puerto de salida del ubigeo.
 *
 * Un solo puerto para los tres niveles, no uno por tabla: departamentos,
 * provincias y distritos son un mismo concepto jerarquico y se consultan
 * encadenados para poblar selectores. Sin paginado: cada nivel devuelve el
 * conjunto completo que necesita el desplegable siguiente.
 *
 * Las consultas de hijos exponen tambien un `*Exists` para que el caso de uso
 * distinga «el padre no existe» (404) de «existe pero no tiene hijos», y no
 * devuelva un arreglo vacio que esconda un codigo mal escrito.
 */
export interface UbigeoRepository {
  findAllDepartments(): Promise<Department[]>;

  departmentExists(id: DepartmentId): Promise<boolean>;
  findProvincesByDepartment(id: DepartmentId): Promise<Province[]>;

  provinceExists(id: ProvinceId): Promise<boolean>;
  findDistrictsByProvince(id: ProvinceId): Promise<District[]>;
}

export const UBIGEO_REPOSITORY = Symbol('UbigeoRepository');
