# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el proyecto se adhiere al [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido

#### Analítica y reporting

- **Rentabilidad por producto/categoría** (`GET /dashboard/profitability`): margen bruto, unidades vendidas, ingresos y costo promedio por producto, agrupados con su categoría. Filtros por rango de fechas.
- **Comparativa MoM/YoY** (`GET /dashboard/comparison`): para un mes y año dados devuelve el importe y conteo de ventas vs. el mes anterior y el mismo mes del año previo, con los porcentajes de variación calculados.
- **Exportación CSV** (`GET /exports/sales|purchases|products|clients`): descarga directa con cabeceras `Content-Disposition` y BOM UTF-8 para compatibilidad con Excel.

#### Operaciones

- **Alertas de stock** (`GET /stock/alerts`): lista de productos cuyo stock actual está por debajo del `minimum_stock` definido en cada producto, ordenados por mayor déficit.
- **Flujo PO → stock**: al marcar una orden de compra como `received` (con `warehouseId` opcional en el body), se generan automáticamente movimientos `purchase_in` en el almacén indicado.
- **Devoluciones → stock**: al crear una nota de crédito (con `warehouseId` opcional), se generan movimientos `return_in` en el almacén indicado.
- Migración `db/db_product_minimum_stock.sql`: añade columna `minimum_stock INTEGER DEFAULT 0` a la tabla `products`.
- Migración `db/db_purchase_order_status_fix.sql`: corrige el `CHECK` de `purchase_order_status` para incluir `received` (antes `completed`).

#### Ecommerce / clientes

- **Historial de compras por usuario** (`GET /users-ecommerce/:id/history`): devuelve todas las ventas asociadas a un usuario ecommerce con estado, total y puntuación NPS si existe.
- **Campaña de email por segmento NPS** (`POST /nps/campaign`): obtiene los emails de usuarios activos en el segmento indicado (`promoter` | `passive` | `detractor`) y simula el envío, devolviendo la lista de destinatarios.

#### UX / calidad

- **Búsqueda global** (`GET /search?q=`): busca en productos, clientes, proveedores y usuarios ecommerce de forma unificada; devuelve hasta 10 resultados por entidad, mínimo 2 caracteres.
- **Auditoría de cambios** (`GET /audit`): listado paginado del log de auditoría con filtros por entidad, acción (`CREATE` | `UPDATE` | `DELETE`), usuario y rango de fechas. Migración `db/db_audit_log.sql` crea la tabla `audit_log`.

### Añadido (anterior)

#### Backend — Módulo de autenticación, usuarios y roles

- **Auth** (`/auth`): `POST /auth/register` crea un usuario (email, contraseña,
  nombre, roleId); `POST /auth/login` devuelve un JWT con payload
  `{ sub: userId, email, roleId }`; `GET /auth/me` devuelve el usuario
  autenticado actual (requiere token).
- **Usuarios** (`/users`): `GET /users` listado paginado; `PATCH /users/:id`
  actualiza nombre, rol y estado activo. El email y la contraseña nunca se
  modifican por esta ruta.
- **Roles** (`/roles`): `GET /roles` devuelve el catálogo completo como arreglo
  plano (sin paginado). De solo lectura vía API.
- Autenticación con `@nestjs/jwt` + `bcryptjs` (pure JS, sin compilación nativa).
- `JwtGuard` extrae el Bearer token del encabezado y adjunta el payload
  verificado como `request.user` en todos los controladores protegidos.
- Tablas `roles` (`role_id`, `role_name`, `role_description`) y `users`
  (`user_id`, `role_id FK`, `user_email UNIQUE`, `user_name`, `password_hash`,
  `user_active DEFAULT true`, `created_at`).
- Nuevas variables de entorno: `JWT_SECRET` (obligatoria) y `JWT_EXPIRES_IN`
  (por defecto `7d`).
- Errores nuevos: `INVALID_CREDENTIALS` (401), `USER_NOT_FOUND` (404),
  `USER_EMAIL_CONFLICT` (409).
- Nuevos paquetes: `@nestjs/jwt`, `bcryptjs`; dev: `@types/bcryptjs`.

#### Backend — Módulo de pagos

- **Pagos** (`/payments`): `POST /payments` registra un pago polimórfico con
  `referenceType` + `referenceId` (apunta a `sale`, `purchase`, `credit_note`
  o `purchase_order`), `amount`, `method` (`cash` | `card` | `transfer` |
  `other`) y `type` (`income` | `expense`).
- `GET /payments` listado paginado con filtros por `referenceType`,
  `referenceId`, `method` y `type`.
- `DELETE /payments/:id` elimina un pago y responde 204 sin cuerpo.
- Error nuevo: `PAYMENT_NOT_FOUND` (404), `INVALID_PAYMENT` (400).
- Tabla `payments` con las columnas correspondientes.

#### Backend — Módulo de órdenes de compra

- **Órdenes de compra** (`/purchase-orders`): `GET` lista, `GET` uno, `POST`
  crea, `PATCH` actualiza.
- Máquina de estados: `pending` → `partial` | `received` | `cancelled`;
  `partial` → `received` | `cancelled`; `received` y `cancelled` son terminales.
  Intentar una transición inválida responde 409 `INVALID_PURCHASE_ORDER`.
- `POST` recibe `supplierId` e `items[]` con `productId`, `quantity` y
  `unitPrice`.
- Errores nuevos: `PURCHASE_ORDER_NOT_FOUND` (404), `INVALID_PURCHASE_ORDER`
  (409 para estado terminal o transición inválida).

#### Backend — Módulo de notas de crédito

- **Notas de crédito** (`/credit-notes`): `GET` lista paginada, `GET` una,
  `POST` emite.
- El correlativo se asigna desde la secuencia PostgreSQL
  `seq_credit_note_number` con formato `NCA-XXXXXXXXXX`.
- El `unitPrice` de cada línea se toma de `sale_details` de la venta original;
  el cliente solo envía `saleId` e `items[]` con `saleDetailId` y `quantity`.
- Errores nuevos: `CREDIT_NOTE_NOT_FOUND` (404), `INVALID_CREDIT_NOTE` (400).

#### Backend — Módulo de stock

- **Stock** (`/stock`): `GET /stock` devuelve niveles actuales por almacén y
  producto (filtros: `warehouseId`, `productId`). `GET /stock/movements`
  devuelve el historial paginado de movimientos (filtros: `warehouseId`,
  `productId`, `movementType`).
- Los movimientos se generan automáticamente al crear una venta con
  `warehouseId` (tipo `sale_out`, cantidad negativa por línea) o una compra
  (tipo `purchase_in`, cantidad positiva por línea).
- Tabla `stock_movements` con `product_id`, `warehouse_id`, `movement_type`,
  `quantity` y `reference_id`.

#### Backend — Analítica NPS por categoría y producto

- `GET /nps/analytics` — devuelve NPS desglosado por categoría de producto y por
  producto (top 20). Acepta filtros opcionales `dateFrom` y `dateTo`.
  - `byCategory[]`: por cada categoría, conteos de promotores/pasivos/detractores
    y `npsScore` calculado (−100 a +100, null si sin datos).
  - `byProduct[]`: misma estructura para los 20 productos con más encuestas.
  - Usa `COUNT(DISTINCT survey_id)` para que una encuesta no se cuente más de una
    vez cuando la venta incluye varios productos de la misma categoría.
  - Join: `nps_surveys → sales → sale_details → products → categories`.
- Caso de uso `GetNpsAnalyticsUseCase` y tipos de dominio `NpsCategoryStats` /
  `NpsProductStats` en `nps-survey.repository.ts`.

#### Backend — Módulo usuarios ecommerce

- **Usuarios ecommerce** (`/users-ecommerce`): CRUD completo sobre la tabla `user_ecommerce`.
  - `GET /users-ecommerce` — listado paginado con filtros por `email`, `firstName`, `lastName`,
    `active` (ILIKE parcial) y ordenamiento por cualquier campo + paginacion.
  - `GET /users-ecommerce/:userEcommerceId` — detalle de un usuario.
  - `POST /users-ecommerce` — alta de nuevo usuario; el `userEcommerceId` lo genera el backend;
    el email se normaliza a minusculas y se valida unicidad con 409 en conflicto.
  - `PATCH /users-ecommerce/:userEcommerceId` — actualizacion parcial; todos los campos son
    opcionales; `{"active": false}` desactiva el usuario sin borrarlo.
  - `DELETE /users-ecommerce/:userEcommerceId` — baja fisica; si el usuario esta referenciado
    en ventas se responde 409 con sugerencia de desactivar.
- Arquitectura hexagonal identica a los demas modulos: entidad `UserEcommerce` en dominio,
  `TypeOrmUserEcommerceRepository` en infrastructura, `UserEcommerceOrmEntity` mapeado a la
  tabla `user_ecommerce` existente (sin migraciones adicionales).
- Errores de dominio: `USER_ECOMMERCE_NOT_FOUND` (404), `USER_ECOMMERCE_EMAIL_ALREADY_EXISTS` (409),
  `USER_ECOMMERCE_IN_USE` (409).

#### Backend — Módulo NPS (Net Promoter Score)

- Módulo `nps` con arquitectura hexagonal y DDD completo (dominio, aplicación e
  infraestructura).
- `GET /nps/score` — puntaje NPS global: `promotersPct`, `passivesPct`,
  `detractorsPct` y `score` (−100 a +100, redondeado a 2 decimales). Si no hay
  encuestas, `score` es `null` y los porcentajes son `"0.00"`. La ruta se
  declara **antes** de `GET /nps/:surveyId` para evitar que "score" se interprete
  como UUID.
- `GET /nps` — listado paginado de encuestas con filtros.
- `GET /nps/:surveyId` — consulta individual de una encuesta.
- `POST /nps` — registra una encuesta vinculada a una venta (`score` 0–10,
  `comment` opcional). Una encuesta por venta; el segundo intento responde 409
  `NPS_SURVEY_ALREADY_EXISTS`. Venta inexistente responde 404 `NPS_SALE_NOT_FOUND`.
- Fórmula: `((promotores / total) − (detractores / total)) × 100`. Categorías:
  promotores 9–10, pasivos 7–8, detractores 0–6.
- Estadísticas calculadas con `COUNT(*) FILTER (WHERE ...)` en una sola consulta
  SQL (via `DataSource`), sin cargar todas las encuestas en memoria.
- La relación con `user_ecommerce` es indirecta:
  `user_ecommerce → sales → nps_surveys` a través de `sales.user_ecommerce_id`.

#### Backend — Reportes en PDF de compras a proveedores

- `GET /purchases/suppliers-amount-report?from&to` — PDF con IGV y monto de
  compra por proveedor del periodo; solo incluye proveedores con al menos una
  compra (INNER JOIN), ordenados por monto descendente.
- `POST /purchases/suppliers-amount-report/send-email?email&from&to` — envía
  ese PDF por correo.
- `GET /purchases/purchases-by-supplier-report?supplierId=UUID&from&to` — PDF
  con el detalle de compras de un proveedor concreto (`supplierId` obligatorio;
  404 `SUPPLIER_NOT_FOUND` si no existe). Columnas: `#`, `RUC`, `Proveedor`,
  `Fecha`, `IGV`, `Monto`.
- `POST /purchases/purchases-by-supplier-report/send-email?email&supplierId&from&to`
  — envía ese PDF por correo.
- Error de dominio: `InvalidPurchasesReportRangeError`
  (`PURCHASES_REPORT_RANGE_INVALID`, 400) cuando `to` < `from`.

#### Backend — Reportes en PDF de ventas por cliente

- `GET /sales/clients-amount-report?from&to` — PDF con IGV y monto vendido a
  cada cliente que compra en el periodo (INNER JOIN), ordenados por monto
  descendente.
- `POST /sales/clients-amount-report/send-email?email&from&to`
- `GET /sales/sales-by-client-report?clientId=UUID&from&to` — PDF con el
  detalle de ventas de un cliente concreto (`clientId` obligatorio; 404 si no
  existe). Columnas: `#`, `Tipo`, `Nro Doc`, `Cliente`, `Fecha`, `IGV`, `Monto`.
- `POST /sales/sales-by-client-report/send-email?email&clientId&from&to`
- Actualización de los generadores PDF existentes para mejorar layout y añadir
  truncado de texto largo con `recortar()`.

#### Backend — Reporte de productos vendidos

- `GET /sales/products-report?from&to&orderBy=amount|quantity` — PDF con los
  productos vendidos en el periodo, ordenados por monto (defecto) o por
  cantidad. Columnas: `#`, `Código`, `Producto`, `Categoría`, `Unidades`,
  `Monto`.
- `POST /sales/products-report/send-email?email&from&to&orderBy`

#### Backend — Logo, favicon y rebranding

- Logo `erp-mv-dev-logo.png` y favicon `erp-mv-dev.ico` incluidos en PDFs,
  Swagger (topbar) y Scalar. Assets servidos estáticamente en `/assets`.
- Nombre de la empresa en PDFs y documentación: **Michael Dev S.A.C.**
- Función `brandLogoPng()` con caché en `src/shared/infrastructure/assets.ts`.
- Renombrado de `crud-ts-nest-be` a `erp-ts-nest-be` (app, `package.json`,
  Swagger/Scalar).

#### Backend — Primer reporte PDF de ventas

- `GET /sales/report?from=YYYY-MM-DD&to=YYYY-MM-DD` — resumen de ventas del
  periodo (una fila por comprobante). Respuesta: `{ fileName, mimeType, base64 }`.
- `POST /sales/report/send-email?email&from&to` — genera el PDF y lo adjunta a
  un correo. Respuesta: `{ to, messageId, sentAt }`.
- Patrón PDF establecido para todos los reportes: pdfkit, en memoria, sin
  escritura a disco.
- Error 400 `SALES_REPORT_RANGE_INVALID` cuando `to` < `from`.
- Error 503 `SERVICE_UNAVAILABLE` cuando el SMTP no está configurado o falla.

#### Backend — Módulo de compras y proveedores

- **Proveedores** (`/suppliers`): GET lista, GET uno, POST, PATCH, DELETE. DELETE
  es baja física; si el proveedor tiene compras registradas responde 409
  `SUPPLIER_IN_USE`. Un proveedor inactivo no admite compras nuevas
  (409 `SUPPLIER_INACTIVE`).
- **Compras** (`/purchases`): GET lista, GET uno, POST, PATCH. Sin número de
  comprobante (no es documento fiscal). `unitPrice` se recibe en cada línea;
  el backend calcula `partial`, `subTotal`, `igv` y `total`. La fecha y la hora
  sí se pueden corregir con `PATCH` (diferencia clave con ventas).
- Dashboard ampliado con indicadores de compras:
  - Del mes: `total-purchases`, `top-purchased-product`, `top-supplier`.
  - Series anuales: `monthly-purchases`, `monthly-purchases-by-category`,
    `top-purchased-product-by-month`, `yearly-purchases`.
- `GET /dashboard/yearly-sales` — totales de venta por año (serie histórica).

#### Backend

- Proyecto NestJS 11 con TypeScript en modo estricto, ESLint y Prettier.
- Scripts de `build`, `start:dev`, `start:prod`, `lint`, `test` y `test:e2e`.
- Documentación OpenAPI con Swagger en `/docs`, y el esquema en `/docs-json`
  y `/docs-yaml`. **Solo fuera de producción**: con `NODE_ENV=production` las
  rutas ni siquiera se registran y responden 404. Se puede apagar en desarrollo
  con `SWAGGER_ENABLED=false`.
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
- Rate-limiting con `@nestjs/throttler`: 100 peticiones por IP y por endpoint
  cada 60 segundos por defecto, configurable con `THROTTLE_TTL` y
  `THROTTLE_LIMIT`. Se aplica con un guard global —no un decorador por
  controlador—, y al superarse responde 429 `TOO_MANY_REQUESTS` en el formato de
  error unificado. El 429 se inyecta en todas las operaciones de Swagger, igual
  que el 500. `GET /health/db` queda exento con `@SkipThrottle` para no
  interferir con las sondas de salud.
- Módulo `brands` con la misma arquitectura que `products`. Cuatro endpoints:
  listado paginado con filtros por query string, consulta individual, alta y
  modificación parcial.
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
  activa o desactiva—.
- El tipo y el número de documento se modelan como un único value object, de
  modo que la regla que los relaciona no puede quedar suelta: DNI de 8 dígitos,
  RUC de 11 empezando en 10 o 20, y validación general para tipos aún sin regla.
- El número de documento es único entre clientes; el alta duplicada responde 409
  `CLIENT_DOCUMENT_ALREADY_EXISTS`.
- Módulo `document-types` con un único endpoint `GET /document-types`, que
  devuelve el catálogo completo como arreglo plano. Es de solo lectura: el
  agregado no expone `create` porque las filas las siembra `db/db.sql`.
- Módulo `sale-types` con un único endpoint `GET /sale-types`, que devuelve el
  catálogo de tipos de comprobante como arreglo plano. Mismo criterio que
  `document-types`: catálogo fijo, de solo lectura, sin paginado. El
  correlativo de cada serie no se expone: es un dato interno de facturación y
  revelaría el volumen de operaciones.
- Módulo `ubigeo` con la consulta del padrón en tres niveles bajo un mismo
  recurso: `GET /ubigeo/departments`,
  `GET /ubigeo/departments/{departmentId}/provinces` y
  `GET /ubigeo/provinces/{provinceId}/districts`. Están pensados para poblar
  selectores en cascada hasta el `districtId` que recibe `POST /sales`.
  Departamentos, provincias y distritos son un mismo concepto jerárquico, así
  que van en un solo módulo y no en tres. De solo lectura, arreglo plano y sin
  paginado, como los demás catálogos.
- Las rutas del ubigeo anidan la jerarquía: un código de padre mal formado
  responde 400 y uno inexistente 404, en vez de un arreglo vacío que escondería
  el error. La coherencia de prefijos —el código del hijo empieza con el del
  padre— se verifica también al rehidratar el dominio.
- Tablas `document_types` y `sale_types` con sus datos de referencia, y las
  columnas `document_type_id` y `document_number` en `clients` con su clave
  foránea, restricción de formato y unicidad del documento.
- Módulo `categories` con la misma arquitectura hexagonal que `brands`. Cinco
  endpoints: listado paginado con filtros, consulta individual, alta,
  modificación parcial y baja física. La descripción es única ignorando
  mayúsculas y espacios, igual que en marcas; el alta o el renombrado duplicado
  responden 409 `CATEGORY_ALREADY_EXISTS`.
- `products.category_id` pasa a ser `NOT NULL`: todo producto pertenece a
  exactamente una categoría, obligatoria en `POST /products` y opcional en
  `PATCH`. Se valida su existencia igual que `brandId`, con un
  `CategoryExistenceChecker` propio: no puede compartir el `exists` del
  `BrandExistenceChecker` porque el tipo del argumento difiere.
- `DELETE` en `brands`, `categories` y `clients`, con el mismo patrón que ya
  tenía `products`: baja física que responde 409 (`BRAND_IN_USE`,
  `CATEGORY_IN_USE`, `CLIENT_IN_USE`) si el recurso está referenciado por
  clave foránea —productos para marca y categoría, ventas para cliente—, en
  vez de dejar pasar el 500 crudo de PostgreSQL. `PATCH … Active: false` sigue
  siendo la baja recomendada cuando el recurso ya tiene historial.
- Módulo `dashboard` para indicadores del tablero. Cuatro endpoints del mes en
  curso (`total-sales`, `top-product`, `top-department`, `top-client`, que
  responden `null` cuando el mes todavía no tiene ventas) y cuatro series
  anuales para los gráficos del front: `monthly-sales`,
  `monthly-sales-by-ubigeo` (filtra por departamento y opcionalmente por
  provincia y distrito), `monthly-sales-by-category` y `top-product-by-month`,
  todas parametrizadas por `year` y siempre con los doce meses del año,
  incluidos los que no tuvieron ventas (con el importe en `"0.00"` o el
  producto en `null`). Las consultas usan `generate_series(1, 12)` con
  `LEFT JOIN` hacia las ventas para que ningún mes falte del arreglo.
- `GET /sales/{saleId}/pdf`: genera el comprobante en PDF con
  [pdfkit](https://pdfkit.org/) —encabezado, cliente, localidad, tabla de
  líneas con el nombre real del producto y totales— enteramente en memoria, y
  lo devuelve codificado en base64. Se apoya en una vista de lectura nueva
  (`SalePrintView`) que resuelve los nombres que el agregado `Sale` no tiene:
  solo guarda identificadores.
- `POST /sales/{saleId}/send-email`: genera el mismo PDF en memoria y lo
  adjunta a un correo enviado por SMTP con
  [nodemailer](https://nodemailer.com/), en un módulo `mail` nuevo detrás de un
  puerto `Mailer`. Si faltan las variables `MAIL_*` o el servidor SMTP rechaza
  el mensaje, responde 503 `SERVICE_UNAVAILABLE` con el motivo, no un 500
  genérico.
- Documentación con [Scalar](https://scalar.com/) en `/reference`, como
  alternativa a Swagger UI. No genera un segundo documento OpenAPI: es una
  página que embebe el bundle de Scalar por CDN apuntando al mismo
  `/docs-json` que ya publica Swagger, así que hereda los mismos endpoints y
  ejemplos. Se optó por el embed en vez del paquete
  `@scalar/nestjs-api-reference` porque su build para CommonJS hace `require`
  de una dependencia que solo se distribuye como ESM y hace fallar el arranque
  bajo el CommonJS con el que corre este proyecto. Sujeta a la misma condición
  que Swagger: no se publica en producción.

#### Base de datos — esquema (`db/db.sql`)

- Esquema PostgreSQL de `dberp` con 11 tablas: `brands`, `categories`,
  `products`, `clients`, `document_types`, `sale_types`,
  `departments`, `provinces`, `districts`, `sales` y `sale_details`.
- Claves primarias en todas las tablas. `sale_details` usa PK compuesta
  `(sale_id, item)`.
- Tabla `categories` (`category_id`, `category_description` con `UNIQUE`,
  `category_active` con `DEFAULT true`) y columna `products.category_id`
  `NOT NULL` con su clave foránea `fk_products_category` e índice
  `ix_products_category`. Va antes que `products` en el script porque
  `products.category_id` la referencia.
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
- 15 índices: sobre `product_name`, todas las columnas `*_description` y las
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
  50 marcas, 11 categorías y 500 productos de informática.
- Las 11 categorías y cuántos productos tiene cada una: Componentes (84),
  Periféricos (70), Almacenamiento (69), Monitores (59), Laptops y Mac (56),
  Audio (39), Redes (35), Accesorios (33), Impresión (25), Smartphones (16) y
  Tablets (14). La clasificación se hizo por el nombre comercial del producto
  y no por la descripción larga: la descripción menciona detalles técnicos
  ("cámara de 48MP", "parlantes cuadrafónicos") que arrastraban productos a la
  categoría equivocada cuando se probó clasificar por ahí primero.
- 25 productos y 10 clientes quedan inactivos, para que los filtros por estado
  tengan datos de ambos tipos sin necesidad de prepararlos.
- Los datos de prueba se separaron de la estructura: `db/db.sql` solo crea
  tablas y `db/db_data.sql` solo inserta filas, así que recargar el catálogo no
  obliga a recrear el esquema.

#### Base de datos — ventas (`db/sales/`)

- Ventas de prueba en 20 archivos, uno por mes, de enero de 2025 a agosto de
  2026 (`db/sales/2025/sales.2025-01.sql` … `db/sales/2026/sales.2026-08.sql`):
  10 405 ventas y 31 073 líneas de detalle en total.
- El correlativo de cada tipo de comprobante es una serie continua que no se
  reinicia por año: cada archivo mensual arranca donde terminó el anterior, así
  que **deben cargarse en orden cronológico** y no por orden alfabético de ruta
  (`2026/sales.2026-01.sql` iría antes que `sales.2025-01.sql` si se ordenara
  por ruta, porque `"2"` antecede a `"s"`).
- `db/run.mjs`: runner en Node que reemplaza invocar `psql` a mano. Ejecuta
  `db.sql`, `db_ubigeo.sql`, `db_data.sql` y los archivos de `db/sales/` en el
  orden correcto —ordenando por el `YYYY-MM` del nombre, no por la ruta—, y
  reutiliza el driver `pg` que ya usa el proyecto en vez de exigir tener `psql`
  instalado. Admite `--create-db`, `--only=schema|reference|sales`,
  `--month=YYYY-MM`, `--env=` para apuntar a otro archivo de variables, y
  `--dry-run` para listar qué se ejecutaría sin tocar nada. Al terminar,
  imprime cuántas filas quedaron por tabla y el último correlativo de cada
  tipo de comprobante, para verificar la carga de un vistazo.

#### Base de datos — NPS y usuarios ecommerce

- Tabla `nps_surveys`: PK `survey_id` (UUID), FK `sale_id → sales` con
  restricción `UNIQUE` (una encuesta por venta), `score SMALLINT CHECK (0–10)`,
  `comment TEXT` opcional y `created_at TIMESTAMPTZ`.
- Tabla `user_ecommerce`: `user_ecommerce_id` (UUID PK), `email` (UNIQUE),
  `first_name`, `last_name`, `phone` (nullable), `user_active DEFAULT true` y
  `created_at`.
- Columna `sales.user_ecommerce_id` (UUID nullable): FK hacia `user_ecommerce`,
  relaciona cada venta con su comprador del ecommerce.
- Scripts aditivos (idempotentes con `IF NOT EXISTS`): `db/db_nps.sql` y
  `db/db_user_ecommerce_schema.sql`; útiles para actualizar entornos ya cargados
  sin destruir datos.
- `db/db_user_ecommerce.sql`: inserta 500 usuarios ecommerce, asigna ventas en
  round-robin determinista (por `ROW_NUMBER() OVER (ORDER BY sale_date)` + módulo)
  y genera encuestas NPS para el 25% de las ventas con scores y comentarios
  reproducibles mediante `hashtext()` y UUIDs derivados de `md5()`.

### Cambiado

- La base de datos pasa de `dbSales` / `dbsales` a **`dberp`** en todos los
  entornos: `.env.example`, `.env.cloud` y referencias en este archivo. Aplicado
  con `ALTER DATABASE dbsales RENAME TO dberp` tanto en local como en Supabase
  (cloud), preservando todos los datos existentes.

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

- Las URLs de `product_image` quedan como cadena vacía.
- Los nombres de distrito están sin tildes: la fuente del padrón no las trae.
- Evaluar unificar `sale_date` y `sale_hour` en un solo `timestamptz`.
- `error-examples.ts` no tiene entrada para los recursos `sales` ni
  `categories`: su 404 y su 409 se documentan en Swagger con ejemplos
  genéricos en vez de con sus códigos reales (`SALE_NOT_FOUND`,
  `CATEGORY_IN_USE`, etc.).
- El rate-limiting cuenta en memoria de cada proceso: detrás de un balanceador
  con varias réplicas el límite efectivo se multiplica. Para un límite
  compartido haría falta un almacén común (Redis), aún sin configurar.
- `POST /products/query` no filtra por `categoryId`.
  `GET /dashboard/monthly-sales-by-category` cubre el caso de reportar por
  categoría; agregar el filtro queda para cuando haya una necesidad concreta
  de listar productos por categoría.
- La UI de Scalar en `/reference` carga su bundle desde
  `cdn.jsdelivr.net`: el navegador necesita salida a internet para verla,
  aunque el resto de la API funcione sin ella. Un self-host del bundle
  eliminaría esa dependencia.

[Sin publicar]: https://github.com/michaelvmdev/erp-ts-nest-be
