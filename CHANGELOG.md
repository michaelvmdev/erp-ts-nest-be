# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido

#### Backend

- Proyecto NestJS 11 con TypeScript en modo estricto, ESLint y Prettier.
- Scripts de `build`, `start:dev`, `start:prod`, `lint`, `test` y `test:e2e`.
- Documentación OpenAPI con Swagger en `/docs`, y el esquema en `/docs-json`
  y `/docs-yaml`. **Solo fuera de producción**: con `NODE_ENV=production` las
  rutas ni siquiera se registran y responden 404. Se puede apagar en desarrollo
  con `SWAGGER_ENABLED=false`.
- Imagen de reemplazo para productos sin foto en
  `public/img/product-placeholder.svg` (SVG, se adapta a tema claro y oscuro).
- Conexión a PostgreSQL con TypeORM, configurada por variables de entorno
  mediante `@nestjs/config`. `synchronize` queda desactivado: el esquema es el
  de `db/db.sql` y lo gobierna el SQL, no las entidades.
- Validación de variables de entorno al arrancar: si falta alguna obligatoria,
  el proceso corta con un mensaje que la nombra.
- Endpoint `GET /health/db` para comprobar la conexión. Devuelve 503 si la base
  no responde.
- `.env.example` con todas las variables documentadas.
- Módulo `products` con arquitectura hexagonal y DDD: dominio sin dependencias
  de framework, casos de uso en la capa de aplicación, y TypeORM y HTTP como
  adaptadores. Cinco endpoints: consulta individual, consulta paginada con
  filtros, alta, modificación parcial y baja.
- Respuestas de error unificadas en un solo formato con `code` estable,
  producidas por un filtro global que traduce errores de dominio a códigos HTTP.
- La respuesta `500` se declara en todas las operaciones de Swagger, inyectada
  al construir el documento en vez de con un decorador repetido por controlador.
- Cada respuesta de error lleva su propio ejemplo, generado con la ruta, el
  método y el código reales de la operación. Antes todas compartían el ejemplo
  de `ApiErrorDto`, que describía un 404 de producto y mostraba `incidentId`
  incluso en códigos que no lo devuelven.
- `message` se documenta como `string` o lista de `string`, que es lo que
  realmente devuelve según venga del dominio o de la validación del cuerpo.
- `ValidationPipe` global que rechaza campos no declarados en los DTOs.
- Módulo `brands` con la misma arquitectura que `products`. Cuatro endpoints:
  listado paginado con filtros por query string, consulta individual, alta y
  modificación parcial. No expone `DELETE`: la baja es lógica.
- Columna `brands.brand_active` en `db/db.sql`, necesaria para la baja lógica.
  Lleva `DEFAULT true`, así que los `INSERT` del seed no cambian.
- La descripción de marca es única ignorando mayúsculas y espacios; el alta o el
  renombrado duplicado responden 409 `BRAND_ALREADY_EXISTS`.

- Módulo `sales` con la misma arquitectura. Cuatro endpoints: listado paginado
  con filtros, consulta individual con detalle, emisión y corrección parcial.
  La venta y sus líneas son un único agregado.
- Los importes no se reciben nunca: el precio sale del catálogo y el backend
  calcula parcial, subtotal, IGV y total. El precio se congela en la línea.
- El número de comprobante se asigna reservando el correlativo de `sale_types`
  con un `UPDATE … RETURNING` en la misma transacción que el guardado. Dos ventas
  simultáneas obtienen números distintos, y un fallo revierte el incremento.
- `PATCH` no permite cambiar número, fecha ni hora: son la identidad fiscal del
  documento. Sí el cliente, el distrito y las líneas, que recalculan importes.
- La provincia y el departamento se derivan del código de distrito, de modo que
  las claves foráneas compuestas no pueden recibir una combinación incoherente.
- `Money` se movió a `src/shared/domain/`: lo usan productos y ventas, y no
  pertenece a ningún agregado. `products` lo reexporta para que exista una sola
  clase.
- Módulo `clients` con la misma arquitectura. Cuatro endpoints: listado paginado
  con filtros, consulta individual, alta y modificación parcial —que es donde se
  activa o desactiva—. No expone `DELETE`: la baja es lógica.
- El tipo y el número de documento se modelan como un único value object, de
  modo que la regla que los relaciona no puede quedar suelta: DNI de 8 dígitos,
  RUC de 11 empezando en 10 o 20, y validación general para tipos aún sin regla.
- El número de documento es único entre clientes; el alta duplicada responde 409
  `CLIENT_DOCUMENT_ALREADY_EXISTS`.
- Módulo `document-types` con un único endpoint `GET /document-types`, que
  devuelve el catálogo completo como arreglo plano. Es de solo lectura: el
  agregado no expone `create` porque las filas las siembra `db/db.sql`.
- Tablas `document_types` y `sale_types` con sus datos de referencia, y las
  columnas `document_type_id` y `document_number` en `clients` con su clave
  foránea, restricción de formato y unicidad del documento.

#### Base de datos — esquema (`db/db.sql`)

- Esquema PostgreSQL de `dbSales` con 10 tablas: `brands`, `products`, `clients`,
  `document_types`, `sale_types`,
  `departments`, `provinces`, `districts`, `sales` y `sale_details`.
- Claves primarias en todas las tablas. `sale_details` usa PK compuesta
  `(sale_id, item)`.
- Claves foráneas con la jerarquía de ubigeo completa. `sales` referencia
  provincia y distrito con FK **compuestas**, de modo que la base impide guardar
  una venta cuyo distrito no pertenezca al departamento elegido.
- `sale_details` se borra en cascada al eliminar su venta.
- Restricciones `CHECK` de integridad:
  - `sale_number` con formato `FAC-0000000001` (`^[A-Z]{3}-[0-9]{10}$`): el
    código de `sale_types` seguido de su correlativo.
  - `total = sub_total + igv`.
  - `partial = quantity * unit_price` en cada línea de detalle.
  - Importes y precios no negativos, `item` desde 1, `quantity` mayor que 0.
  - Códigos de ubigeo numéricos y con el prefijo del padre.
- `UNIQUE` sobre `sale_number`.
- 13 índices: sobre `product_name`, todas las columnas `*_description` y las
  claves foráneas, que PostgreSQL no indexa automáticamente.
- El script es reejecutable: hace `DROP` de todo antes de crear.

#### Base de datos — datos (`db/db_ubigeo.sql`)

- Ubigeo completo del Perú en codificación INEI: 25 departamentos,
  196 provincias y 1874 distritos.
- Se corrigieron tres nombres respecto de la fuente: la provincia `1608` es
  Putumayo (creada en 2014 por la Ley 30186, la fuente aún la rotulaba Maynas),
  `1103` usa la grafía «Nasca» del INEI, y `0701` el nombre formal
  «Prov. Const. del Callao».
- Se restauraron 5 nombres de provincia que la fuente entregaba truncados a
  20 caracteres.

#### Base de datos — datos (`db/db_data.sql`)

- Catálogos de referencia (`document_types` y `sale_types`), 100 clientes,
  50 marcas y 500 productos de informática: laptops y Mac,
  smartphones, tablets, monitores, componentes, almacenamiento, periféricos,
  audio, redes, impresión y accesorios.
- 25 productos y 10 clientes quedan inactivos, para que los filtros por estado
  tengan datos de ambos tipos sin necesidad de prepararlos.
- Los datos de prueba se separaron de la estructura: `db/db.sql` solo crea
  tablas y `db/db_data.sql` solo inserta filas, así que recargar el catálogo no
  obliga a recrear el esquema.

### Notas de diseño

Decisiones tomadas al convertir el borrador inicial a PostgreSQL:

- **Nomenclatura `snake_case`.** PostgreSQL pasa a minúsculas todo identificador
  sin comillas, así que `productName` obligaría a escribir `"productName"` en
  cada consulta. TypeORM y Prisma mapean `product_name` a `productName` en
  TypeScript, de modo que las entidades Nest conservan camelCase.
- **`uuid` en lugar de `varchar(32)`** para las claves primarias.
- **`boolean` en lugar de `bit`** para los indicadores de activo.
- **`numeric(12,2)` en lugar de `decimal(4,2)`** para importes: el tipo original
  topaba en 99.99.
- **`time` en lugar de `varchar(8)`** para `sale_hour`.
- **`char(6)` para `district_id`**: el ubigeo de distrito tiene 6 dígitos.
- `partial` se valida con un `CHECK` en vez de ser columna generada, porque
  `GENERATED ... STORED` requiere PostgreSQL 12 y el objetivo es la 10.1.

### Pendiente

- Módulo de consulta del ubigeo, para poblar los selectores de departamento,
  provincia y distrito.
- Notas de crédito, que es la vía correcta para anular o corregir una venta ya
  emitida.
- Las URLs de `product_image` quedan como cadena vacía.
- Los nombres de distrito están sin tildes: la fuente del padrón no las trae.
- Evaluar unificar `sale_date` y `sale_hour` en un solo `timestamptz`.

[Sin publicar]: https://github.com/michaelvargas7/crud-ts-nest-be
