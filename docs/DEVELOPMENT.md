# Development and Validation

## Setup

Each application is independently deployed. Use the package manager and
lockfile in that repository:

```bash
cd BE-SchoolPilot && pnpm install --frozen-lockfile
cd admin-SchoolPilot && pnpm install --frozen-lockfile
cd FE-SchoolPilot && pnpm install --frozen-lockfile
cd guardian-SchoolPilot && pnpm install --frozen-lockfile
```

Copy the relevant `.env.example` to a local environment file. Never commit
`.env` files or secrets.

## Backend and database

```bash
cd BE-SchoolPilot
docker compose -f docker-compose.test.yml up -d
set -a
. ./.env.test.example
set +a
pnpm run migration:run
SEED_ADMIN_PASSWORD='use-a-test-only-password' pnpm run seed
pnpm run build
pnpm run start:prod
```

Important migrations:

```text
1791000000000-PermissionGroupsAndOverrides
1791100000000-CreateCommunicationAnnouncements
```

The seed requires `SEED_ADMIN_PASSWORD` and never prints the password. The
backend generates `schema.gql` during startup when `VERCEL` is not set. Run
`pnpm run check:schema-contract` after startup and do not edit generated schema
output manually. Stop the isolated database with:

```bash
docker compose -f docker-compose.test.yml down -v
```

## Application commands

```bash
# Backend
pnpm run lint
pnpm run build
pnpm exec jest --watchman=false

# Admin
pnpm exec tsc --noEmit
pnpm run lint
pnpm exec next build --webpack

# Staff
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build:web

# Guardian
pnpm run typecheck
pnpm run build:web
```

The root regression harness is run with `node tests/e2e/runner.js`.

## CI runtime validation

`.github/workflows/backend-runtime-validation.yml` provisions PostgreSQL 16,
runs migrations, starts the compiled backend, checks `/api/health`, validates
the generated GraphQL schema contract, and runs backend and E2E tests. Its
execution remains an external CI gate until it runs in GitHub Actions.
