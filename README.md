# erp-ts-nest-be

API de ventas construida con NestJS 11, TypeScript y PostgreSQL, siguiendo
arquitectura hexagonal y diseño guiado por el dominio.

## Puesta en marcha

```bash
npm install
```

Copiá `.env.example` a `.env` y completá tus credenciales de PostgreSQL. Después
cargá el esquema y los datos con el runner de `db/`:

```bash
node db/run.mjs --create-db
```

`--create-db` crea la base `dberp` si todavía no existe (se salta si no se
tiene permiso, asumiendo que ya está creada). Sin ese flag, `node db/run.mjs`
ejecuta todo en el orden correcto: esquema (`db.sql`), ubigeo y catálogos
(`db_ubigeo.sql`, `db_data.sql`) y los 20 meses de ventas de `db/sales/`
(enero 2025 a agosto 2026, en orden cronológico). Es reejecutable: cada script
hace `DROP` antes de crear, así que correrlo de nuevo reemplaza todo.

Otros usos, para no recargar lo que no cambió:

```bash
node db/run.mjs --only=schema      # solo db.sql
node db/run.mjs --only=reference   # ubigeo y catálogos, sin ventas
node db/run.mjs --only=sales       # solo db/sales/*.sql
node db/run.mjs --month=2026-08    # un mes concreto de ventas
node db/run.mjs --dry-run          # enumera qué se ejecutaría, sin tocar nada
```

```bash
npm run start:dev
```

| | |
|---|---|
| API | http://localhost:3000 |
| Documentación Swagger | http://localhost:3000/docs |
| Documentación Scalar | http://localhost:3000/reference |
| Estado de la conexión | http://localhost:3000/health/db |

Swagger y Scalar leen el **mismo** documento OpenAPI (`/docs-json`), así que
tienen exactamente los mismos endpoints y ejemplos; son dos formas de leerlo,
no dos definiciones. Ambos solo se publican fuera de producción. Con
`NODE_ENV=production` las rutas `/docs`, `/docs-json`, `/docs-yaml` y
`/reference` ni se registran: responden 404.

## Arquitectura

El código se organiza en **capas concéntricas** y las dependencias apuntan
siempre hacia adentro. El dominio no conoce a nadie; la infraestructura conoce a
todos.

```
src/products/
├── domain/            ← reglas de negocio. Cero imports de NestJS o TypeORM
│   ├── product.ts                    agregado raíz
│   ├── product.errors.ts             errores del negocio
│   ├── product.repository.ts         PUERTOS (interfaces) + tokens de inyección
│   ├── product-search.criteria.ts    criterio de búsqueda
│   └── value-objects/                Money, ProductId, ProductName…
├── application/       ← casos de uso. Orquestan el dominio, no saben de HTTP
│   ├── product.commands.ts           contratos de entrada
│   └── *.use-case.ts                 uno por operación
└── infrastructure/    ← ADAPTADORES. Lo único que conoce el mundo exterior
    ├── persistence/                  TypeORM: entidad ORM, mapeador, repositorio
    └── http/                         controlador y DTOs con Swagger
```

`src/shared/` contiene el núcleo común: la jerarquía de errores de dominio, la
paginación y el filtro que traduce excepciones a respuestas HTTP.

### Por qué así

**El dominio es puro.** `Product` y sus value objects se instancian y testean sin
levantar Nest ni tocar una base. Si mañana la aplicación se expone por gRPC o se
consume desde una cola, esa carpeta no cambia.

**Los puertos los declara el dominio, no la infraestructura.** `ProductRepository`
es una interfaz en `domain/`; `TypeOrmProductRepository` la implementa en
`infrastructure/`. La dependencia queda invertida: la base de datos es un detalle
enchufable y no el centro del diseño. Sustituirla por una implementación en
memoria para tests son dos líneas en `products.module.ts`.

**El modelo de dominio y el de persistencia están separados.** `Product` tiene
value objects y métodos con intención; `ProductOrmEntity` refleja las columnas de
`db/db.sql`. `ProductMapper` traduce entre ambos. Cuesta un archivo más y evita
que las anotaciones de TypeORM contaminen las reglas de negocio.

**El agregado no tiene setters.** Se construye por `Product.create()` (alta nueva)
o `Product.rehydrate()` (viene de la base), y se modifica por métodos con nombre
de intención: `rename`, `reprice`, `deactivate`. No existe un producto a medio
armar.

**Los value objects hacen imposibles los estados inválidos.** `Money` guarda
céntimos como entero en vez de un decimal: con punto flotante `0.1 + 0.2` da
`0.30000000000000004` y un total de venta termina descuadrado por céntimos que
nadie sabe explicar. `ProductId` y `BrandId` son clases distintas, así que pasar
uno donde va el otro es un error de compilación y no un bug en producción.

## Endpoints

### Tipos de comprobante

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/sale-types` | Catálogo completo |

Devuelve un **arreglo plano**, sin envoltorio de paginado:

```json
[
  { "saleTypeId": 1, "saleTypeDescription": "Factura", "saleTypeCode": "FAC" },
  { "saleTypeId": 2, "saleTypeDescription": "Boleta", "saleTypeCode": "BOL" }
]
```

El `saleTypeCode` es el prefijo con el que se numeran las ventas de ese tipo, y
`saleTypeId` es el valor que se envía al registrar una venta.

No se incluye el último número emitido de cada serie: es un dato interno de
facturación, no información del catálogo, y revelaría el volumen de operaciones
a cualquiera que consulte la API.

Es un catálogo fijo, del mismo estilo que tipos de documento: de solo lectura,
arreglo plano y sin paginado.

### Tipos de documento

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/document-types` | Catálogo completo |

Devuelve un **arreglo plano**, sin envoltorio de paginado:

```json
[
  { "documentTypeId": 1, "documentTypeDescription": "DNI" },
  { "documentTypeId": 2, "documentTypeDescription": "RUC" }
]
```

Es un catálogo fijo de dos filas. Paginarlo obligaría al cliente a leer un
`meta` que nunca va a cambiar, así que la asimetría con marcas y productos es
deliberada.

Solo se expone la lectura: las filas se siembran desde `db/db.sql` porque sin
ellas `clients.document_type_id` no puede referenciar nada, y el agregado de
dominio ni siquiera ofrece un método `create`. Eso se documenta acá, no en
Swagger — ver más abajo.

El orden es por identificador —DNI y después RUC— y no alfabético: es el orden
que le dio el negocio.

### Ubigeo

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/ubigeo/departments` | Los 25 departamentos |
| `GET` | `/ubigeo/departments/{departmentId}/provinces` | Provincias de un departamento |
| `GET` | `/ubigeo/provinces/{provinceId}/districts` | Distritos de una provincia |

Los tres niveles cuelgan de un mismo recurso porque son un único concepto
jerárquico: un departamento tiene provincias y una provincia tiene distritos.
Están pensados para poblar **selectores en cascada** —se elige un departamento,
eso carga sus provincias, y esas su distrito—, hasta llegar al `districtId` que
después recibe `POST /sales`.

Cada nivel devuelve un **arreglo plano**, sin paginado, como los demás
catálogos. El orden es alfabético por nombre, que es como mejor se leen en un
desplegable.

Los códigos son los del padrón INEI, con ceros a la izquierda: 2 dígitos el
departamento, 4 la provincia, 6 el distrito. El de cada hijo empieza con el de
su padre —`1501` es una provincia del departamento `15`—, así que el propio
código dice a qué pertenece.

Las rutas anidan esa relación a propósito. Un `departmentId` con formato
inválido responde 400; uno bien formado que no existe responde 404, en vez de un
arreglo vacío que escondería un código mal escrito.

### Ventas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/sales` | Listado paginado con filtros. Solo cabeceras |
| `GET` | `/sales/{saleId}` | Una venta con todas sus líneas |
| `POST` | `/sales` | Emite un comprobante |
| `PATCH` | `/sales/{saleId}` | Corrige los datos corregibles |

Filtros de `GET /sales`: `saleNumber` (exacto), `saleTypeCode`, `clientId`,
`districtId`, `departmentId`, `dateFrom`, `dateTo`, `totalMin`, `totalMax`,
`sortBy`, `sortDirection`, `page`, `limit`.

El listado devuelve solo cabeceras, con `lineCount`; el detalle se obtiene con
`GET /sales/{saleId}`. Veinte ventas de cinco líneas serían cien filas que una
tabla casi nunca usa.

`saleTypeCode` se resuelve como prefijo del número (`LIKE 'FAC-%'`), no como
substring, para que pueda aprovechar el índice de `sale_number`.

#### El cliente no envía importes

Ni `unitPrice`, ni `partial`, ni `subTotal`, ni `igv`, ni `total`. El precio
unitario sale del catálogo y el resto lo calcula el backend. Aceptar un total del
cliente permitiría facturar un televisor en un sol.

El `ValidationPipe` corre con `forbidNonWhitelisted`, así que enviarlos devuelve
400 en lugar de ignorarlos en silencio.

El precio se **congela** en la línea al momento de vender: una venta conserva el
precio al que se hizo aunque el catálogo cambie después.

#### El número lo asigna el backend, de forma atómica

`sale_number` es la identidad fiscal del documento: el código del tipo más el
correlativo de `sale_types`. No se recibe.

Reservar el correlativo y guardar la venta son **una sola transacción**. El
incremento se hace con un `UPDATE … RETURNING`, que toma un bloqueo de fila, así
que dos ventas simultáneas del mismo tipo se serializan y obtienen números
distintos. Leer con `SELECT` y escribir después dejaría una ventana en la que
ambas leen el mismo valor y chocan contra el `UNIQUE`.

Si el guardado falla, la transacción revierte también el incremento: no quedan
huecos en la serie.

#### Qué se puede corregir y qué no

`PATCH` admite el cliente, el distrito y las líneas. **No** el número, la fecha
ni la hora: son la identidad del documento y el momento de su emisión, y
cambiarlos no sería corregir una venta sino inventar otra. En un sistema fiscal
eso se resuelve con una nota de crédito.

Si viene `saleDetails`, **reemplaza por completo** las líneas y recalcula los
importes. No hay parche línea por línea: los importes dependen del conjunto, y
aplicar cambios de a uno dejaría totales incoherentes a mitad de camino.

#### La provincia y el departamento se derivan

Solo se envía `districtId`. Los otros dos salen de sus prefijos —4 y 2 dígitos—
garantizados por los `CHECK` del esquema. La tabla tiene claves foráneas
compuestas, así que un cliente que enviara los tres podría mandar un distrito del
Cusco con el departamento de Lima; derivarlos hace que esa combinación no pueda
existir.

#### `warehouseId` opcional

`POST /sales` acepta un campo opcional `warehouseId` (UUID). Si se envía, el backend
registra automáticamente un movimiento `sale_out` en `stock_movements` con
cantidad negativa para cada línea de la venta. Si se omite, la venta se guarda
normalmente sin afectar el stock.

#### PDF y envío por correo

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/sales/{saleId}/pdf` | Genera el comprobante en PDF, codificado en base64 |
| `POST` | `/sales/{saleId}/send-email` | Genera el PDF y lo envía por correo adjunto |

`GET /sales/{saleId}/pdf` arma el PDF con [pdfkit](https://pdfkit.org/) —
encabezado con los datos de la tienda y el comprobante, cliente y localidad,
tabla de líneas con el nombre real del producto y totales— **enteramente en
memoria**, sin escribirlo a disco, y responde:

```json
{
  "fileName": "FAC-0000007607.pdf",
  "mimeType": "application/pdf",
  "base64": "JVBERi0xLjMKJ..."
}
```

`POST /sales/{saleId}/send-email` recibe `{"email": "cliente@ejemplo.com"}`,
genera el mismo PDF en memoria y lo adjunta a un correo enviado por SMTP con
[nodemailer](https://nodemailer.com/). Responde
`{"to", "messageId", "sentAt"}`. El envío requiere las variables `MAIL_*` del
`.env` (ver [Variables de entorno](#variables-de-entorno)); si faltan, o si el
servidor SMTP rechaza el mensaje, responde 503 `SERVICE_UNAVAILABLE` con un
mensaje que dice cuál es el problema, en vez de un 500 genérico — es una
dependencia externa no disponible, no un fallo del propio backend.

Ambos endpoints reutilizan la misma consulta de lectura (`SalePrintView`), que
resuelve los nombres que el PDF necesita —cliente, tipo de comprobante, ubigeo,
producto— y que el agregado `Sale` no tiene: solo guarda identificadores.

#### Reportes en PDF

Cuatro reportes adicionales, cada uno con su variante de envío por correo. Todos
se generan con pdfkit, enteramente en memoria, sin escribir a disco. El parámetro
`to` es opcional: si se omite, el reporte es del día `from` ("del día"); si se
indica, es "entre las fechas".

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/sales/report?from=YYYY-MM-DD&to=YYYY-MM-DD` | Ventas del periodo: una fila por venta con tipo, fecha, cliente y totales |
| `POST` | `/sales/report/send-email?email=...&from=...&to=...` | Genera el reporte y lo envía por correo adjunto |
| `GET` | `/sales/products-report?from=...&to=...&orderBy=amount\|quantity` | Productos vendidos del periodo, ordenados por monto o por cantidad |
| `POST` | `/sales/products-report/send-email?email=...&from=...&to=...&orderBy=...` | Envía el reporte de productos por correo |
| `GET` | `/sales/clients-amount-report?from=...&to=...` | IGV y monto vendido a cada cliente que compra en el periodo |
| `POST` | `/sales/clients-amount-report/send-email?email=...&from=...&to=...` | Envía el reporte de clientes por correo |
| `GET` | `/sales/sales-by-client-report?clientId=UUID&from=...&to=...` | Detalle de ventas de un cliente concreto |
| `POST` | `/sales/sales-by-client-report/send-email?email=...&clientId=UUID&from=...&to=...` | Envía el detalle por correo |

`clients-amount-report` usa INNER JOIN: solo aparecen los clientes con al menos
una venta en el periodo, ordenados por monto descendente. Columnas: `#`, `Cliente`,
`IGV`, `Monto`.

`sales-by-client-report` requiere `clientId` obligatorio (404 si no existe) y lista
una fila por venta, ordenadas por fecha. Columnas: `#`, `Tipo`, `Nro Doc`, `Cliente`,
`Fecha`, `IGV`, `Monto`.

La respuesta de todos los `GET` es `{ fileName, mimeType, base64 }`. Las variantes
`send-email` responden `{ to, messageId, sentAt }` y necesitan las variables `MAIL_*`
configuradas; si faltan o el servidor SMTP rechaza el mensaje, responden 503
`SERVICE_UNAVAILABLE`. Si `to` < `from`, responden 400 `SALES_REPORT_RANGE_INVALID`.

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/clients` | Listado paginado con filtros |
| `GET` | `/clients/{clientId}` | Consulta un cliente |
| `POST` | `/clients` | Alta |
| `PATCH` | `/clients/{clientId}` | Modificación parcial, activación y desactivación |
| `DELETE` | `/clients/{clientId}` | Baja física |

`DELETE` es baja física. Si el cliente ya figura en ventas registradas, la
clave foránea `fk_sales_client` lo impide y la API responde 409 `CLIENT_IN_USE`
en vez de dejar huérfano ese histórico. Para retirar un cliente conservando su
historial de compras:

```
PATCH /clients/{clientId}   {"clientActive": false}
```

Filtros de `GET /clients`, todos opcionales y combinados con `AND`:
`clientDescription` (parcial), `documentNumber` (**exacto**), `documentTypeId`,
`clientActive`, `sortBy`, `sortDirection`, `page`, `limit`.

La búsqueda por documento es exacta y no parcial: identifica a un único cliente,
así que quien lo escribe completo espera esa fila y no una lista de las que lo
contienen.

#### Tipo y número de documento van juntos

Se modelan como un solo value object, no como dos campos sueltos. La regla que
los relaciona no pertenece a ninguno de los dos por separado: un `"12345678"` no
es válido ni inválido en sí mismo, lo es en función del tipo que lo acompaña.

| Tipo | Regla |
|---|---|
| DNI | exactamente 8 dígitos |
| RUC | exactamente 11 dígitos, empezando en `10` (persona natural) o `20` (persona jurídica) |
| Otro | solo la forma general: 8 u 11 dígitos |

Un tipo que todavía no tiene regla propia —carné de extranjería, pasaporte— pasa
con la validación general, así que agregarlo al catálogo no rompe las altas
mientras se define su regla.

En `PATCH`, el documento se rearma completo aunque venga una sola de sus partes.
Enviar solo `documentTypeId` para pasar de DNI a RUC falla con 400, y está bien
que así sea: el número vigente de 8 dígitos no es un RUC válido. Hay que enviar
ambos.

### Proveedores

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/suppliers` | Listado paginado con filtros |
| `GET` | `/suppliers/{supplierId}` | Consulta un proveedor |
| `POST` | `/suppliers` | Alta |
| `PATCH` | `/suppliers/{supplierId}` | Modificación parcial y desactivación |
| `DELETE` | `/suppliers/{supplierId}` | Baja física |

`DELETE` es baja física. Si el proveedor tiene compras registradas, la clave
foránea lo impide y la API responde 409 `SUPPLIER_IN_USE`. Para retirar un
proveedor conservando su historial:

```
PATCH /suppliers/{supplierId}   {"supplierActive": false}
```

Un proveedor inactivo no admite compras nuevas (responde 409 `SUPPLIER_INACTIVE`),
pero conserva todas las compras ya registradas y aparece en los reportes
históricos.

### Compras

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/purchases` | Listado paginado con filtros. Solo cabeceras |
| `GET` | `/purchases/{purchaseId}` | Una compra con todas sus líneas |
| `POST` | `/purchases` | Registra una compra |
| `PATCH` | `/purchases/{purchaseId}` | Corrección parcial |

#### Diferencias con ventas

A diferencia de una venta, la compra **no es un documento fiscal**: no lleva
número de comprobante y la fecha y la hora sí se pueden corregir con `PATCH`.

La compra **sí recibe `unitPrice`** en cada línea: es el costo pagado al
proveedor, un dato que no está en el catálogo (los productos guardan el precio
de venta, no el de costo). El backend calcula `partial`, `subTotal`, `igv` y
`total`; enviar esos campos en el cuerpo devuelve 400.

#### Reportes en PDF

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/purchases/suppliers-amount-report?from=YYYY-MM-DD&to=YYYY-MM-DD` | Monto de compra por proveedor del periodo |
| `POST` | `/purchases/suppliers-amount-report/send-email?email=...&from=...&to=...` | Envía el reporte por correo |
| `GET` | `/purchases/purchases-by-supplier-report?supplierId=UUID&from=...&to=...` | Detalle de compras de un proveedor concreto |
| `POST` | `/purchases/purchases-by-supplier-report/send-email?email=...&supplierId=UUID&from=...&to=...` | Envía por correo |

`suppliers-amount-report` hace un INNER JOIN entre proveedores y compras: solo
aparecen los que tienen al menos una compra en el periodo, ordenados por monto
descendente. Columnas: `#`, `Proveedor`, `IGV`, `Monto`.

`purchases-by-supplier-report` requiere `supplierId` obligatorio (404 si no
existe) y lista una fila por compra del proveedor en el rango. Columnas: `#`,
`RUC`, `Proveedor`, `Fecha`, `IGV`, `Monto`.

El parámetro `to` es opcional en todos los reportes: si se omite, es el reporte
del día `from`. Todos se arman en memoria, sin escribir a disco. Si `to` < `from`,
responden 400 `PURCHASES_REPORT_RANGE_INVALID`. Si el `supplierId` no existe,
responden 404 `SUPPLIER_NOT_FOUND`. Si el SMTP falla, responden 503
`SERVICE_UNAVAILABLE`.

### Marcas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/brands` | Listado paginado con filtros |
| `GET` | `/brands/{brandId}` | Consulta una marca |
| `POST` | `/brands` | Alta |
| `PATCH` | `/brands/{brandId}` | Modificación parcial y desactivación |
| `DELETE` | `/brands/{brandId}` | Baja física |

`DELETE` es baja física. Si la marca tiene productos asociados, la clave
foránea `fk_products_brand` lo impide y la API responde 409 `BRAND_IN_USE` en
vez de un 500 con un error crudo de PostgreSQL. Para retirar una marca
conservando sus productos y el histórico de ventas:

```
PATCH /brands/{brandId}   {"brandActive": false}
```

Los filtros de `GET /brands` viajan en la query string —`brandDescription`,
`brandActive`, `sortDirection`, `page`, `limit`— porque son planos y de solo
lectura, así que el `GET` queda cacheable. El tamaño de página por defecto es 50
y no 20: las marcas suelen pedirse completas para poblar un desplegable.

La descripción es única ignorando mayúsculas y espacios: "Apple", "apple" y
" Apple " se consideran la misma marca y el alta duplicada responde 409.

#### `brandActive`

El campo recorre los cuatro endpoints:

| Endpoint | Rol de `brandActive` |
|---|---|
| `GET /brands` | Filtro opcional. Omitirlo devuelve activas e inactivas |
| `GET /brands/{brandId}` | Se devuelve siempre, esté activa o no |
| `POST /brands` | Opcional en el cuerpo. Si se omite, la marca nace activa |
| `PATCH /brands/{brandId}` | Enviar `false` la desactiva; `true` la reactiva |

Una marca inactiva no se borra ni pierde sus productos: deja de ofrecerse para
asignaciones nuevas y el histórico de ventas queda intacto.

En la base es `brands.brand_active boolean NOT NULL DEFAULT true`. El seed lo
declara explícitamente en cada fila aunque exista el `DEFAULT`, para que el
estado quede a la vista y no dependa de un valor por omisión que podría cambiar
en el esquema sin que nadie revise el archivo de datos.

### Categorías

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/categories` | Listado paginado con filtros |
| `GET` | `/categories/{categoryId}` | Consulta una categoría |
| `POST` | `/categories` | Alta |
| `PATCH` | `/categories/{categoryId}` | Modificación parcial y desactivación |
| `DELETE` | `/categories/{categoryId}` | Baja física |

Misma arquitectura que marcas, y con la misma pareja PATCH/DELETE: `PATCH`
desactiva sin perder nada (`{"categoryActive": false}`), y `DELETE` es baja
física que responde 409 `CATEGORY_IN_USE` si algún producto la referencia por
`fk_products_category`.

La descripción es única ignorando mayúsculas y espacios, igual que en marcas.
El tamaño de página por defecto también es 50: las categorías suelen pedirse
completas para poblar un desplegable.

`products.category_id` es `NOT NULL`: todo producto pertenece a exactamente una
categoría, obligatoria en `POST /products` y opcional en `PATCH`. El seed
clasifica los 500 productos en 11 categorías por el nombre comercial —
Laptops y Mac, Smartphones, Tablets, Monitores, Componentes, Almacenamiento,
Periféricos, Audio, Redes, Impresión y Accesorios—; la clasificación se hizo
por nombre y no por descripción larga, porque la descripción menciona detalles
técnicos ("cámara de 48MP", "parlantes cuadrafónicos") que arrastraban
productos a la categoría equivocada.

### Productos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/products/{productId}` | Consulta un producto |
| `POST` | `/products/query` | Consulta varios con filtros y paginado |
| `POST` | `/products` | Alta |
| `PATCH` | `/products/{productId}` | Modificación parcial |
| `DELETE` | `/products/{productId}` | Baja física |

### Sobre `POST /products/query`

Una búsqueda por `POST` rompe la expectativa REST de que `GET` es para leer, así
que conviene justificarla: el filtro es un objeto anidado
(`productUnitPrice.min` / `.max`) y va a crecer. Serializar estructuras en la
query string obliga a inventar una convención de codificación, choca con el
límite práctico de longitud de URL y termina siendo más frágil que un JSON.

Devuelve **200, no 201**, precisamente porque no crea nada. La operación es de
solo lectura y no tiene efectos secundarios; lo único que se pierde frente a un
`GET` es la cacheabilidad HTTP.

El subrecurso se llama `/query` y no `/search` ni `/filter` por consistencia con
el nombre que ya usás en el resto de la especificación.

### Filtros disponibles

```json
{
  "productDescription": "inalambrico",
  "productUnitPrice": { "min": 100, "max": 600 },
  "brandId": "9c1e2f40-6b3a-4d21-8f77-1a2b3c4d5e6f",
  "productActive": true,
  "sortBy": "unitPrice",
  "sortDirection": "DESC",
  "page": 1,
  "limit": 20
}
```

Todos son opcionales y se combinan con `AND`. Un cuerpo vacío `{}` devuelve la
primera página del catálogo completo. `productDescription` hace coincidencia
parcial insensible a mayúsculas. `limit` tiene un tope de 100 para que nadie
pueda pedir el catálogo entero de una sola vez.

No hay filtro por `categoryId` todavía: `GET /dashboard/monthly-sales-by-category`
cubre el caso de uso de reportar por categoría, y agregarlo a este filtro queda
pendiente hasta que haya una necesidad concreta de listar productos por
categoría.

### Panel (dashboard)

Indicadores de solo lectura para el front. Ninguno recibe cuerpo; todo viaja
por la ruta o la query string.

**Del mes en curso** — no reciben parámetros, y los `top-*` responden 200 con
`null` cuando el mes todavía no tiene ventas (un tablero muestra "sin datos",
no un error):

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/dashboard/total-sales` | Suma de totales y cantidad de comprobantes del mes |
| `GET` | `/dashboard/top-product` | Producto con más unidades vendidas en el mes |
| `GET` | `/dashboard/top-department` | Departamento con mayor monto comprado en el mes |
| `GET` | `/dashboard/top-client` | Cliente con mayor monto comprado en el mes |

**Series anuales**, para los diagramas del front — todas devuelven **los doce
meses del año indicado**, incluidos los que no tuvieron ventas (con el importe
en `"0.00"` o el producto en `null`), para que el eje del gráfico quede
completo sin que el front tenga que rellenar huecos:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/dashboard/monthly-sales?year=2026` | Ventas mensuales del año |
| `GET` | `/dashboard/monthly-sales-by-ubigeo?year=2026&departmentId=15` | Ventas mensuales de una localidad |
| `GET` | `/dashboard/monthly-sales-by-category?year=2026&categoryId=...` | Ventas mensuales de una categoría |
| `GET` | `/dashboard/top-product-by-month?year=2026` | Producto más vendido de cada mes |
| `GET` | `/dashboard/yearly-sales` | Totales de venta agrupados por año (serie histórica) |

```json
{
  "year": 2026,
  "items": [
    { "month": 1, "total": "0.00" },
    { "month": 7, "total": "7061.12" }
  ]
}
```

`monthly-sales-by-ubigeo` acepta `departmentId` (obligatorio, 2 dígitos),
`provinceId` (opcional, 4) y `districtId` (opcional, 6): sin los opcionales
agrega todo el departamento; con ellos permite el filtro fino
departamento → provincia → distrito. `year` se valida entre 2000 y 2100 en
todos los endpoints de esta sección.

Todas las consultas usan `generate_series(1, 12)` con `LEFT JOIN` hacia las
ventas, en vez de un `GROUP BY` simple: así los meses sin ventas aparecen en la
respuesta con cero, y no faltan del array. `monthly-sales-by-category` suma
`sale_details.partial` —no `sales.total`— porque una misma venta puede mezclar
productos de varias categorías.

**Compras — indicadores del mes** — responden `null` en los `top-*` cuando el mes
no tiene compras:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/dashboard/total-purchases` | Suma de totales y cantidad de compras del mes |
| `GET` | `/dashboard/top-purchased-product` | Producto con más unidades compradas en el mes |
| `GET` | `/dashboard/top-supplier` | Proveedor con mayor monto comprado en el mes |

**Compras — series anuales** — mismo patrón que las de ventas (los doce meses
siempre presentes, con `"0.00"` o `null` en los meses sin compras):

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/dashboard/monthly-purchases?year=2026` | Compras mensuales del año |
| `GET` | `/dashboard/monthly-purchases-by-category?year=2026&categoryId=...` | Compras mensuales de una categoría |
| `GET` | `/dashboard/top-purchased-product-by-month?year=2026` | Producto más comprado de cada mes |
| `GET` | `/dashboard/yearly-purchases` | Totales de compra agrupados por año (serie histórica) |

### Stock

Solo lectura. El stock se actualiza automáticamente al crear una venta con
`warehouseId` (movimiento `sale_out`) o una compra (movimiento `purchase_in`).
Requiere autenticación JWT (`Authorization: Bearer <token>`).

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/stock` | Niveles de stock actuales por almacén y producto |
| `GET` | `/stock/movements` | Historial de movimientos (paginado) |

`GET /stock` acepta `warehouseId` (UUID, opcional) y `productId` (UUID,
opcional) como query params. Responde un arreglo de objetos
`{ productId, productDescription, warehouseId, warehouseName, quantity }`.

`GET /stock/movements` acepta `warehouseId`, `productId`, `movementType`
(`purchase_in` | `sale_out`), `page` y `limit`. Responde en el formato
paginado estándar con `{ items, meta }`.

### Notas de crédito

Corrección de ventas. El correlativo es `NCA-XXXXXXXXXX`, emitido desde la
secuencia PostgreSQL `seq_credit_note_number`. El `unitPrice` de cada línea se
toma directamente de la venta original (`sale_details`) — el cliente no lo
envía. Requiere autenticación JWT.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/credit-notes` | Listado paginado con filtros |
| `GET` | `/credit-notes/{creditNoteId}` | Consulta una nota de crédito |
| `POST` | `/credit-notes` | Emite una nueva nota de crédito |

Cuerpo de `POST /credit-notes`:

```json
{
  "saleId": "UUID de la venta a corregir",
  "items": [
    { "saleDetailId": "UUID de la línea de la venta", "quantity": 2 }
  ]
}
```

### Órdenes de compra

Gestión de pedidos a proveedores con máquina de estados. Requiere
autenticación JWT.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/purchase-orders` | Listado paginado con filtros |
| `GET` | `/purchase-orders/{purchaseOrderId}` | Consulta una orden de compra |
| `POST` | `/purchase-orders` | Crea una orden de compra |
| `PATCH` | `/purchase-orders/{purchaseOrderId}` | Actualiza estado o datos |

Transiciones de estado permitidas:

| Estado actual | Transiciones posibles |
|---|---|
| `pending` | `partial`, `received`, `cancelled` |
| `partial` | `received`, `cancelled` |
| `received` | — (terminal) |
| `cancelled` | — (terminal) |

Cuerpo de `POST /purchase-orders`:

```json
{
  "supplierId": "UUID",
  "items": [
    { "productId": "UUID", "quantity": 10, "unitPrice": 150.00 }
  ]
}
```

`PATCH` acepta `status` y, opcionalmente, los mismos campos del `POST`. Si la
orden ya está en estado terminal (`received` o `cancelled`), el backend
responde 409 `INVALID_PURCHASE_ORDER`.

### Pagos

Registro polimórfico de pagos. Un pago puede estar asociado a una venta, una
compra, una nota de crédito o una orden de compra, indicado con
`referenceType` + `referenceId`. Requiere autenticación JWT.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/payments` | Registra un pago |
| `GET` | `/payments` | Listado paginado con filtros |
| `DELETE` | `/payments/{paymentId}` | Elimina un pago (204 sin cuerpo) |

Cuerpo de `POST /payments`:

```json
{
  "referenceType": "sale",
  "referenceId": "UUID de la venta",
  "amount": 500.00,
  "method": "cash",
  "type": "income",
  "notes": "Pago inicial"
}
```

`referenceType` puede ser `sale`, `purchase`, `credit_note` o
`purchase_order`. `method` puede ser `cash`, `card`, `transfer` u `other`.
`type` puede ser `income` o `expense`.

`GET /payments` acepta `referenceType`, `referenceId`, `method`, `type`,
`page` y `limit` como query params.

`DELETE /payments/{paymentId}` responde 204 sin cuerpo si tiene éxito, o 404
`PAYMENT_NOT_FOUND` si el pago no existe.

### NPS (Net Promoter Score)

Encuestas de satisfacción ligadas a ventas. Una encuesta por venta (clave única
sobre `sale_id`). El score va de 0 a 10: promotores (9–10), pasivos (7–8),
detractores (0–6). La fórmula es `((promotores / total) − (detractores / total))
× 100`, rango −100 a +100.

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/nps/score` | Puntaje NPS global con porcentajes por categoría |
| `GET` | `/nps` | Listado paginado de encuestas con filtros |
| `GET` | `/nps/{surveyId}` | Consulta una encuesta |
| `POST` | `/nps` | Registra una encuesta |

`GET /nps/score` responde `{ promotersPct, passivesPct, detractorsPct, score }`.
Si no hay encuestas, `score` es `null` y los porcentajes son `"0.00"`.

Cuerpo de `POST /nps`:

```json
{
  "saleId": "UUID de la venta",
  "score": 9,
  "comment": "Muy buena atención"
}
```

`score` es obligatorio y debe ser un entero de 0 a 10. `comment` es opcional.
Registrar una segunda encuesta para la misma venta responde 409
`NPS_SURVEY_ALREADY_EXISTS`. Si la venta no existe, responde 404
`NPS_SALE_NOT_FOUND`.

La relación entre usuarios del ecommerce (`user_ecommerce`) y sus respuestas NPS
es indirecta: `user_ecommerce → sales → nps_surveys`, a través de
`sales.user_ecommerce_id`.

### Autenticación y usuarios

Autenticación basada en JWT. El token de acceso se obtiene en `POST
/auth/login` y debe enviarse como `Authorization: Bearer <token>` en los
endpoints protegidos (marcados con 🔒). Los endpoints de esta sección marcados
con 🔒 también requieren el token.

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registra un nuevo usuario |
| `POST` | `/auth/login` | Inicia sesión y devuelve el JWT |
| `GET` | `/auth/me` 🔒 | Devuelve el usuario autenticado actual |
| `GET` | `/users` 🔒 | Listado paginado de usuarios |
| `PATCH` | `/users/{userId}` 🔒 | Actualiza nombre, rol o estado activo |
| `GET` | `/roles` 🔒 | Listado completo de roles (arreglo plano, sin paginado) |

Cuerpo de `POST /auth/register`:

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña",
  "name": "Nombre Apellido",
  "roleId": "UUID del rol"
}
```

Cuerpo de `POST /auth/login`:

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

Respuesta de `POST /auth/login`:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9…",
  "userId": "UUID",
  "email": "usuario@ejemplo.com",
  "roleId": "UUID"
}
```

El payload del JWT contiene `{ sub: userId, email, roleId }`. El token expira
según `JWT_EXPIRES_IN` (por defecto `7d`).

`PATCH /users/{userId}` acepta `name`, `roleId` y `active`. No permite cambiar
el email ni la contraseña.

Si las credenciales son incorrectas o el usuario está inactivo, `POST
/auth/login` responde 401 `INVALID_CREDENTIALS`. Si se intenta registrar un
email ya existente, `POST /auth/register` responde 409 `USER_EMAIL_CONFLICT`.

## Respuestas

| Código | Cuándo |
|---|---|
| `200` | Consulta resuelta, o modificación aplicada |
| `201` | Recurso creado (producto, marca, categoría, cliente, proveedor, usuario, venta, compra, nota de crédito, orden de compra o pago) |
| `204` | Recurso eliminado. Sin cuerpo (baja física de productos, marcas, categorías, clientes, proveedores; eliminación de pagos) |
| `400` | Validación del cuerpo, UUID mal formado, rango de precio invertido, documento inválido |
| `401` | Sin token o token inválido (`INVALID_CREDENTIALS` en login, sin token en rutas protegidas) |
| `404` | El recurso solicitado no existe |
| `409` | Conflicto: duplicado, recurso en uso, cliente o producto inactivo, serie agotada, estado de orden inválido |
| `422` | Error de dominio que no entra en las categorías anteriores |
| `429` | Se superó el límite de peticiones (rate-limiting) |
| `503` | `GET /health/db` cuando la base no responde, o el correo no está configurado o falla |
| `500` | Fallo no previsto |

Todos los errores comparten la misma forma:

```json
{
  "statusCode": 404,
  "code": "PRODUCT_NOT_FOUND",
  "message": "No existe un producto con id 3fa85f64-5717-4562-b3fc-2c963f66afa6.",
  "path": "/products/3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "method": "GET",
  "timestamp": "2026-07-28T02:14:07.123Z"
}
```

`code` es el contrato estable: el cliente debe ramificar sobre él y no sobre el
texto de `message`, que puede reescribirse. Los códigos actuales son:

| Categoría | Códigos |
|---|---|
| No encontrado (404) | `PRODUCT_NOT_FOUND`, `BRAND_NOT_FOUND`, `CATEGORY_NOT_FOUND`, `CLIENT_NOT_FOUND`, `DOCUMENT_TYPE_NOT_FOUND`, `SALE_NOT_FOUND`, `SALE_TYPE_NOT_FOUND`, `DISTRICT_NOT_FOUND`, `DEPARTMENT_NOT_FOUND`, `PROVINCE_NOT_FOUND`, `PURCHASE_NOT_FOUND`, `SUPPLIER_NOT_FOUND`, `PAYMENT_NOT_FOUND`, `USER_NOT_FOUND`, `PURCHASE_ORDER_NOT_FOUND`, `CREDIT_NOTE_NOT_FOUND` |
| Conflicto (409) | `PRODUCT_IN_USE`, `BRAND_IN_USE`, `CATEGORY_IN_USE`, `CLIENT_IN_USE`, `SUPPLIER_IN_USE`, `BRAND_ALREADY_EXISTS`, `CATEGORY_ALREADY_EXISTS`, `CLIENT_DOCUMENT_ALREADY_EXISTS`, `CLIENT_INACTIVE`, `PRODUCT_INACTIVE`, `SUPPLIER_INACTIVE`, `SALE_SERIES_EXHAUSTED`, `USER_EMAIL_CONFLICT`, `INVALID_PURCHASE_ORDER` |
| No autorizado (401) | `INVALID_CREDENTIALS` (credenciales incorrectas o usuario inactivo en login), token ausente o expirado en rutas protegidas |
| Entrada inválida (400) | `VALIDATION_ERROR`, `INVALID_UUID`, `INVALID_MONEY`, `INVALID_PRICE_RANGE`, `INVALID_PAGINATION`, `INVALID_PRODUCT_TEXT`, `INVALID_BRAND_DESCRIPTION`, `INVALID_CATEGORY_DESCRIPTION`, `INVALID_CLIENT_DESCRIPTION`, `INVALID_CLIENT_DOCUMENT`, `INVALID_DOCUMENT_TYPE_ID`, `INVALID_SALE_TYPE_ID`, `INVALID_DOCUMENT_TYPE`, `INVALID_SALE_TYPE`, `INVALID_UBIGEO`, `INVALID_SALE_NUMBER`, `INVALID_SALE_LINE`, `INVALID_SALE_FILTER`, `INVALID_DEPARTMENT_ID`, `INVALID_PROVINCE_ID`, `INVALID_DISTRICT_ID`, `INVALID_UBIGEO_DATA`, `SALES_REPORT_RANGE_INVALID`, `PURCHASES_REPORT_RANGE_INVALID`, `INVALID_PAYMENT`, `INVALID_CREDIT_NOTE` |
| Dominio genérico (422) | `INVALID_SALE`, `UNPROCESSABLE_ENTITY` |
| Límite de peticiones (429) | `TOO_MANY_REQUESTS` |
| Infraestructura | `SERVICE_UNAVAILABLE` (503: base caída o correo no disponible), `INTERNAL_ERROR` (500) |

En un `500` se agrega un `incidentId`. El detalle real queda en el log del
servidor: al cliente no se le filtran trazas ni mensajes del driver.

El `500` está declarado en **todas** las operaciones de Swagger, pero no con un
decorador repetido en cada controlador: se inyecta al construir el documento, en
`src/swagger.ts`. Cualquier endpoint puede fallar de forma imprevista, así que
el `500` es parte del contrato de todos por igual — y un decorador repetido se
olvida justo en el endpoint nuevo. Si una operación declara su propio `500`, se
respeta.

Todas las respuestas de error comparten el esquema `ApiErrorDto`, así que Swagger
mostraría el mismo ejemplo bajo el `400`, el `409` y el `500`. Para evitarlo,
cada respuesta recibe un ejemplo propio construido con la ruta, el método y el
código reales de esa operación: el `409` de `DELETE /products/{productId}` dice
`PRODUCT_IN_USE`, el de `POST /clients` dice `CLIENT_DOCUMENT_ALREADY_EXISTS`, y
`incidentId` aparece solo en el `500`, que es el único que lo lleva.

### Qué no se publica

Swagger describe **el contrato de la API, no su implementación**. Nada de lo que
sale por HTTP nombra tablas, columnas, archivos del repositorio, el motor de base
de datos ni su versión.

No es cosmética. La versión exacta del motor le dice a un atacante qué
vulnerabilidades conocidas aplican, y los nombres de tabla y columna le ahorran
la mitad del trabajo de reconocimiento para una inyección.

Por eso `GET /health/db` responde solo `{ status, latencyMs }`: si la base falla,
el mensaje del driver —que trae host, puerto, usuario y nombre de la base— va al
log del servidor y al cliente le llega un texto genérico.

Al escribir descripciones de Swagger, la regla es hablar en términos del negocio:
«debe corresponder a una marca existente», no «debe existir en `brands`».

### El 409 al eliminar

`DELETE` es baja física en productos, marcas, categorías y clientes. Si el
recurso está referenciado por una clave foránea —un producto en
`sale_details`, una marca o categoría en `products`, un cliente en `sales`—,
PostgreSQL rechaza el `DELETE` y el adaptador traduce esa violación a 409 en
vez de dejar pasar un 500 con un error crudo del driver. Borrarlo dejaría
huérfanas esas filas y falsearía el histórico. Para retirar cualquiera de
estos recursos conservando lo que depende de él, la baja lógica:

```
PATCH /products/{productId}     {"productActive": false}
PATCH /brands/{brandId}         {"brandActive": false}
PATCH /categories/{categoryId}  {"categoryActive": false}
PATCH /clients/{clientId}       {"clientActive": false}
```

### `PATCH` y la diferencia entre omitir y `null`

Omitir un campo y enviarlo en `null` son cosas distintas. Omitir
`productDescription` la deja como está; enviar `"productDescription": null` la
borra. El caso de uso compara contra `undefined` y no por veracidad, para que
`null`, `false` y `0` se apliquen como los valores legítimos que son.

## Rate-limiting

La API limita las peticiones con `@nestjs/throttler`. Por defecto son
**100 peticiones cada 60 segundos, por IP y por endpoint**; ambos números se
configuran con `THROTTLE_TTL` y `THROTTLE_LIMIT`. Al superar el límite responde
`429` con el mismo formato de error que el resto, con
`code: "TOO_MANY_REQUESTS"`.

El conteo es **por combinación de IP y endpoint** —el comportamiento por defecto
de la librería—: agotar el cupo de `GET /sales` no afecta a `POST /clients`. Es
protección contra el martilleo de una ruta concreta, no un presupuesto global de
peticiones por cliente.

El límite se aplica con un **guard global**, no con un decorador por controlador:
igual que el `500`, es parte del contrato de todos los endpoints por igual, y un
decorador repetido se olvida justo en el endpoint nuevo. Por eso el `429` también
se documenta en Swagger en todas las operaciones.

`GET /health/db` queda **exento**: las sondas de salud de un balanceador
consultan esa ruta con frecuencia, y limitarla haría que el propio chequeo
dispare el `429`.

El conteo se guarda **en memoria del proceso**, así que cada instancia lleva el
suyo. Detrás de un balanceador con varias réplicas, el límite efectivo se
multiplica por el número de instancias; para un límite compartido haría falta un
almacén común (por ejemplo Redis), que hoy no está configurado. La IP la toma de
la conexión: detrás de un proxy inverso hay que configurar `trust proxy` para no
contar a todos los clientes bajo la IP del proxy.

## Base de datos

El esquema vive en `db/` y **lo gobierna el SQL, no las entidades**. Por eso
TypeORM corre con `synchronize: false`.

No es una precaución genérica: el esquema tiene restricciones que TypeORM no sabe
representar y borraría al intentar "corregirlo" — los `CHECK` de formato de
`sale_number`, las claves foráneas compuestas que impiden un distrito fuera de su
departamento, y los tipos `char(2)/char(4)/char(6)` del ubigeo. Los cambios de
esquema van por SQL o por migraciones.

| Archivo | Contenido |
|---|---|
| `db/db.sql` | Estructura: tablas, restricciones e índices (incluye `nps_surveys`, `user_ecommerce` y columna `sales.user_ecommerce_id`). Sin datos |
| `db/db_ubigeo.sql` | Ubigeo INEI: 25 departamentos, 196 provincias, 1874 distritos |
| `db/db_data.sql` | Catálogos de referencia, 100 clientes, 50 marcas, 11 categorías y 500 productos |
| `db/db_nps.sql` | Esquema aditivo (`IF NOT EXISTS`) de `nps_surveys` — útil para actualizar bases ya cargadas |
| `db/db_user_ecommerce_schema.sql` | Esquema aditivo de `user_ecommerce` y columna `sales.user_ecommerce_id` |
| `db/db_user_ecommerce.sql` | 500 usuarios ecommerce, asignación round-robin a ventas y 25% de encuestas NPS |
| `db/sales/{2025,2026}/*.sql` | Ventas de prueba, un archivo por mes, de enero de 2025 a agosto de 2026 |
| `db/purchases/*.sql` | Compras de prueba (varios archivos) |
| `db/run.mjs` | Runner en Node que ejecuta estos archivos en el orden correcto (ver [Puesta en marcha](#puesta-en-marcha)) |
`db.sql` solo crea estructuras y los demás solo insertan filas, así que
recargar los datos no obliga a recrear el esquema. El ubigeo va aparte por
volumen —2095 filas— y porque no son datos de prueba sino el padrón del INEI.
Las ventas van en archivos separados por mes porque el correlativo de cada tipo
de comprobante es una serie continua que no se reinicia por año: cada mes
arranca donde terminó el anterior, así que **deben cargarse en orden
cronológico** — motivo por el que existe `db/run.mjs` en vez de dejar que cada
quien concatene los `.sql` a mano.

Dentro de `db_data.sql`, los catálogos de referencia (`document_types` y
`sale_types`) no son datos descartables: sin ellos `clients` no tiene a qué
apuntar y la base queda inutilizable. Por eso van primero, antes de los datos de
prueba propiamente dichos. Las categorías van antes que los productos por la
misma razón: `products.category_id` las referencia por clave foránea.

## Variables de entorno

Documentadas en `.env.example`.

| Variable | Por defecto | |
|---|---|---|
| `NODE_ENV` | `development` | En `production` desactiva Swagger |
| `PORT` | `3000` | |
| `POSTGRES_HOST` | — | Obligatoria |
| `POSTGRES_PORT` | `5432` | |
| `POSTGRES_USER` | — | Obligatoria |
| `POSTGRES_PASSWORD` | — | Obligatoria |
| `POSTGRES_DATABASE` | — | Obligatoria |
| `POSTGRES_LOGGING` | `false` | Imprime cada consulta de TypeORM |
| `THROTTLE_TTL` | `60` | Ventana del rate-limiting, en segundos |
| `THROTTLE_LIMIT` | `100` | Peticiones por IP y por endpoint en esa ventana |
| `SWAGGER_ENABLED` | `true` | Solo apaga; nunca enciende en producción |
| `MAIL_HOST` | — | Necesaria solo para `POST /sales/{saleId}/send-email` |
| `MAIL_PORT` | `587` | `465` para SSL, `587` para STARTTLS |
| `MAIL_SECURE` | `false` | `true` si `MAIL_PORT=465` |
| `MAIL_USER` | — | Usuario SMTP |
| `MAIL_PASSWORD` | — | Con Gmail y verificación en dos pasos, una *App Password*, no la contraseña de la cuenta |
| `MAIL_FROM` | — | Remitente. Si se omite, se usa `MAIL_USER` |
| `JWT_SECRET` | — | Obligatoria. Clave para firmar y verificar los JWT |
| `JWT_EXPIRES_IN` | `7d` | Tiempo de expiración del token (formato `ms`: `7d`, `24h`, `3600`) |

Si falta una obligatoria (las de PostgreSQL y `JWT_SECRET`), el proceso corta al arrancar con
un mensaje que la nombra, en vez de fallar más tarde con un error ilegible del
driver. Las de correo no son obligatorias: la app arranca sin ellas y
`send-email` responde 503 hasta que se completen.

## Comandos

| Comando | |
|---|---|
| `npm run start:dev` | Desarrollo con recarga |
| `npm run start:debug` | Desarrollo con recarga y depurador |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta lo compilado |
| `npm run format` | Prettier sobre `src/` y `test/` |
| `npm run lint` | ESLint con `--fix` |
| `npm test` | Tests unitarios |
| `npm run test:watch` | Tests en modo interactivo |
| `npm run test:cov` | Tests con cobertura |
| `npm run test:e2e` | Tests de extremo a extremo (requiere la base) |
