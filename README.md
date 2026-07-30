# crud-ts-nest-be

API de ventas construida con NestJS 11, TypeScript y PostgreSQL, siguiendo
arquitectura hexagonal y diseño guiado por el dominio.

## Puesta en marcha

```bash
npm install
```

Copiá `.env.example` a `.env` y completá tus credenciales de PostgreSQL. Después
creá la base con su esquema:

```bash
psql -h localhost -U postgres -c 'CREATE DATABASE "dbSales" ENCODING UTF8'
```

```bash
psql -h localhost -U postgres -d dbSales -f db/db.sql -f db/db_ubigeo.sql -f db/db_data.sql
```

El orden importa: `db.sql` crea las tablas y los otros dos las pueblan.

```bash
npm run start:dev
```

| | |
|---|---|
| API | http://localhost:3000 |
| Documentación Swagger | http://localhost:3000/docs |
| Estado de la conexión | http://localhost:3000/health/db |

Swagger solo se publica fuera de producción. Con `NODE_ENV=production` las rutas
`/docs`, `/docs-json` y `/docs-yaml` ni se registran: responden 404.

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

### Clientes

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/clients` | Listado paginado con filtros |
| `GET` | `/clients/{clientId}` | Consulta un cliente |
| `POST` | `/clients` | Alta |
| `PATCH` | `/clients/{clientId}` | Modificación parcial, activación y desactivación |

Sin `DELETE`, por la misma razón que en marcas: un cliente desactivado conserva
su historial de compras.

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

### Marcas

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/brands` | Listado paginado con filtros |
| `GET` | `/brands/{brandId}` | Consulta una marca |
| `POST` | `/brands` | Alta |
| `PATCH` | `/brands/{brandId}` | Modificación parcial y desactivación |

**No hay `DELETE`, y es deliberado.** Los productos referencian la marca por
clave foránea y el histórico de ventas depende de ellos, así que la única baja
posible es lógica:

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

## Respuestas

| Código | Cuándo |
|---|---|
| `200` | Consulta resuelta, o modificación aplicada |
| `201` | Producto creado |
| `204` | Producto eliminado. Sin cuerpo |
| `400` | Validación del cuerpo, UUID mal formado, rango de precio invertido |
| `404` | El producto o la marca no existen |
| `409` | El producto está referenciado por ventas registradas |
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
texto de `message`, que puede reescribirse. Los códigos actuales son
`PRODUCT_NOT_FOUND`, `BRAND_NOT_FOUND`, `CLIENT_NOT_FOUND`,
`DOCUMENT_TYPE_NOT_FOUND`, `PRODUCT_IN_USE`, `BRAND_ALREADY_EXISTS`,
`CLIENT_DOCUMENT_ALREADY_EXISTS`, `VALIDATION_ERROR`, `INVALID_UUID`,
`INVALID_MONEY`, `INVALID_PRICE_RANGE`, `INVALID_PAGINATION`,
`INVALID_PRODUCT_TEXT`, `INVALID_BRAND_DESCRIPTION`,
`INVALID_CLIENT_DESCRIPTION`, `INVALID_CLIENT_DOCUMENT`,
`INVALID_DOCUMENT_TYPE_ID` e `INTERNAL_ERROR`.

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

`DELETE` es baja física. Si el producto ya aparece en `sale_details`, la clave
foránea lo impide y la API responde 409 en lugar de un 500 con un error crudo de
PostgreSQL. Borrarlo dejaría huérfanas esas líneas de venta y falsearía el
histórico. Para retirar un producto de la venta conservando su historia:

```
PATCH /products/{productId}   {"productActive": false}
```

### `PATCH` y la diferencia entre omitir y `null`

Omitir un campo y enviarlo en `null` son cosas distintas. Omitir
`productDescription` la deja como está; enviar `"productDescription": null` la
borra. El caso de uso compara contra `undefined` y no por veracidad, para que
`null`, `false` y `0` se apliquen como los valores legítimos que son.

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
| `db/db.sql` | Estructura: 10 tablas, restricciones e índices. Sin datos |
| `db/db_ubigeo.sql` | Ubigeo INEI: 25 departamentos, 196 provincias, 1874 distritos |
| `db/db_data.sql` | Catálogos de referencia, 100 clientes, 50 marcas y 500 productos |

`db.sql` solo crea estructuras y `db_data.sql` solo inserta filas, así que
recargar los datos no obliga a recrear el esquema. El ubigeo va aparte por
volumen —2095 filas— y porque no son datos de prueba sino el padrón del INEI.

Dentro de `db_data.sql`, los catálogos de referencia (`document_types` y
`sale_types`) no son datos descartables: sin ellos `clients` no tiene a qué
apuntar y la base queda inutilizable. Por eso van primero, antes de los datos de
prueba propiamente dichos.

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
| `SWAGGER_ENABLED` | `true` | Solo apaga; nunca enciende en producción |

Si falta una obligatoria, el proceso corta al arrancar con un mensaje que la
nombra, en vez de fallar más tarde con un error ilegible del driver.

## Comandos

| Comando | |
|---|---|
| `npm run start:dev` | Desarrollo con recarga |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta lo compilado |
| `npm run lint` | ESLint con `--fix` |
| `npm test` | Tests unitarios |
| `npm run test:e2e` | Tests de extremo a extremo (requiere la base) |

## Imagen de reemplazo

`product_image` puede ser `null`. En ese caso el frontend debe usar
`public/img/product-placeholder.svg`, que se adapta a tema claro y oscuro.

La ruta del placeholder no se guarda en la base a propósito: mezclaría "no tiene
imagen" con "tiene esta imagen" y después no habría forma de saber cuáles quedan
por cargar.
