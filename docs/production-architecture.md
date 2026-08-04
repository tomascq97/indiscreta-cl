# Production architecture

## Current implemented state

The Medusa 2.18 backend supports one Redis connection for four essential
infrastructure responsibilities:

- Redis Event Bus
- Redis Workflow Engine
- Redis distributed locking
- Redis Caching Module Provider

These modules are enabled only when `REDIS_URL` is present. Development and
test can omit Redis and keep the local Medusa providers. Production requires a
valid `redis:` or `rediss:` URL and an explicit `MEDUSA_WORKER_MODE`.
Production also requires `MEDUSA_FF_CACHING=true` so Medusa core uses the
modern Caching Module.

The current architecture intentionally uses one Redis URL for all four modules. This keeps the
initial deployment contract small while allowing the services to be separated
later for capacity, availability, or isolation requirements.

## API and worker process contract

The target topology uses the same compiled backend artifact in two services:

1. A public Medusa API process started with `pnpm run start:server`.
2. A private Medusa worker process started with `pnpm run start:worker`.

Both processes must use the same application version, PostgreSQL database, and
Redis infrastructure. The server mode loads HTTP entrypoints and does not load
background jobs. The worker mode loads background processors and does not load
HTTP entrypoints, so it must not be exposed publicly or use `/health` as its
liveness check.

`pnpm run start:shared` starts HTTP and background processing together. It is
retained for development and the existing commercial CI flow. CI additionally
starts the compiled artifact once as server and once as worker, verifies the
server `/health` endpoint, confirms that both processes remain active, and
always terminates both process groups.

## Environment matrix

| Environment | Worker mode                   | Redis                   | Infrastructure providers                                   |
| ----------- | ----------------------------- | ----------------------- | ---------------------------------------------------------- |
| Development | Defaults to `shared`          | Optional                | Local providers are allowed without Redis                  |
| Test        | Defaults to `shared`          | Optional                | Deterministic unit tests can use local providers           |
| CI          | Explicit `shared`             | Ephemeral Redis service | Event Bus, Workflow Engine, Locking, and Caching use Redis |
| Staging     | Explicit `server` or `worker` | Required managed Redis  | Redis providers must be enabled                            |
| Production  | Explicit `server` or `worker` | Required managed Redis  | Redis providers must be enabled; no local fallback         |

## Deployment rules

- Production must fail during configuration validation when Redis or worker
  mode is absent.
- Redis configuration errors must never include connection values or secrets.
- API and worker separation must use one immutable build and matching versions.
- Redis unavailability in production must not cause a silent fallback to local
  providers.
- A future deployment may give Event Bus, Workflow Engine, Locking, and Caching
  distinct Redis connections without changing their responsibilities.

## File storage

Development and tests without S3 configuration keep Medusa's default local
file provider. Production requires a complete S3-compatible configuration and
never falls back to local disk. Alternative endpoints are supported; services
that require path-style requests can enable `S3_FORCE_PATH_STYLE` together with
`S3_ENDPOINT`.

Medusa 2.18 runtime and documentation use a `providers` array for the File
Module, while its published `FileModuleOptions` type incorrectly declares a
singular `provider`. The project isolates this mismatch in a narrow local type.

The four existing files under `apps/backend/static` are not uploaded or moved
automatically. Before switching a deployed environment to S3, copy required
assets to the bucket, preserve their public URLs or update stored references,
verify retrieval, and only then activate the S3 configuration.

## Remaining production blockers

The current implementation does not make the application production-ready. The following work is
still required:

- deploy separate API and worker services on the selected hosting platform;
- provision and validate the final S3-compatible bucket and migrate existing
  assets;
- add dependency-aware readiness checks;
- define provider-specific deployment, scaling, shutdown, and rollback
  procedures.
