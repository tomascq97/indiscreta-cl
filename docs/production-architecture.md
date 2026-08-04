# Production architecture

## P1.5B1 implemented state

The Medusa 2.18 backend supports one Redis connection for three essential
infrastructure responsibilities:

- Redis Event Bus
- Redis Workflow Engine
- Redis distributed locking

These modules are enabled only when `REDIS_URL` is present. Development and
test can omit Redis and keep the local Medusa providers. Production requires a
valid `redis:` or `rediss:` URL and an explicit `MEDUSA_WORKER_MODE`.

P1.5B1 intentionally uses one Redis URL for all three modules. This keeps the
initial deployment contract small while allowing the services to be separated
later for capacity, availability, or isolation requirements.

## Future API and worker topology

The target topology uses the same compiled backend artifact in two services:

1. A public Medusa API process with `MEDUSA_WORKER_MODE=server`.
2. A private Medusa worker process with `MEDUSA_WORKER_MODE=worker`.

Both processes must use the same application version, PostgreSQL database, and
Redis infrastructure. The worker must not be exposed publicly. P1.5B1 does not
deploy or run these services separately; the current CI continues to exercise
the backend in `shared` mode.

## Environment matrix

| Environment | Worker mode                   | Redis                   | Infrastructure providers                           |
| ----------- | ----------------------------- | ----------------------- | -------------------------------------------------- |
| Development | Defaults to `shared`          | Optional                | Local providers are allowed without Redis          |
| Test        | Defaults to `shared`          | Optional                | Deterministic unit tests can use local providers   |
| CI          | Explicit `shared`             | Ephemeral Redis service | Event Bus, Workflow Engine, and Locking use Redis  |
| Staging     | Explicit `server` or `worker` | Required managed Redis  | Redis providers must be enabled                    |
| Production  | Explicit `server` or `worker` | Required managed Redis  | Redis providers must be enabled; no local fallback |

## Deployment rules

- Production must fail during configuration validation when Redis or worker
  mode is absent.
- Redis configuration errors must never include connection values or secrets.
- API and worker separation must use one immutable build and matching versions.
- Redis unavailability in production must not cause a silent fallback to local
  providers.
- A future deployment may give Event Bus, Workflow Engine, and Locking distinct
  Redis connections without changing their business responsibilities.

## Remaining production blockers

P1.5B1 does not make the application production-ready. The following work is
still required:

- deploy and validate separate API and worker services;
- add the Redis Caching Module;
- replace local file storage with persistent S3-compatible storage;
- add dependency-aware readiness checks;
- define provider-specific deployment, scaling, shutdown, and rollback
  procedures.
