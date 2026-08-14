# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-14

### Added

#### Security
- **RBAC (Role-Based Access Control)**: `@Roles()` decorator + `RolesGuard` enforcing role checks on all protected controllers. Roles: `administrador`, `vendedor`, `almacenero`, `contador`.
- **Helmet**: HTTP security headers via `helmet()` middleware applied globally.
- **CORS**: Restricted to `FRONTEND_URL` env var (default `http://localhost:3001`) with `credentials: true`.
- **JWT rate-limiting**: `POST /auth/login` limited to 5 requests / 60 s via `@nestjs/throttler`.

#### Auth
- `GET /auth/me` now returns `roleName` field (read from already-verified JWT payload — no extra DB lookup).
- `POST /auth/forgot-password` and `POST /auth/reset-password` endpoints for password reset via email.
- Refresh-token rotation via `POST /auth/refresh` (httpOnly cookie).

#### Health
- `GET /health` returns `{ status: "ok" }`.
- `GET /health/db` runs a live DB query and returns `{ status: "ok", db: "reachable" }` (used by Docker healthcheck).

#### Audit
- `GET /audit` lists all CREATE / UPDATE / DELETE events with filters (entity, action, user, date range, pagination).

#### NPS
- Full CRUD for NPS surveys, responses, and analytics endpoints.

#### E-commerce users
- `GET /users-ecommerce` — paginated list of e-commerce customers with search.

#### Modules
- Sales, Purchases, Purchase Orders, Warehouses, Units, Price Lists, Payments, Dashboard — full CRUD with pagination and sorting.

### Changed
- All feature modules import `AuthModule` so `RolesGuard` and `JwtGuard` are resolvable via NestJS DI.
- `UserResponseDto.fromDomain` accepts an optional `roleName` parameter (defaults to `''`) — `POST /auth/register` is unaffected.

### Fixed
- `users.controller.ts` map callback typed correctly after `fromDomain` gained an optional parameter.

### Tests
- `test/rbac.e2e-spec.ts`: 20 E2E tests covering 401 (no token), 401 (invalid token), 403 (wrong role) and 200 (correct role) for all four roles across all permission levels.

## [0.0.1] - 2026-01-01

### Added
- Initial project scaffold (NestJS + TypeORM + PostgreSQL).
- Basic auth (register / login / refresh / logout) with JWT.
- Domain entities: User, Role, Sale, Purchase, Product, Client, Supplier, Warehouse, Unit, PriceList, Payment, NPS.
