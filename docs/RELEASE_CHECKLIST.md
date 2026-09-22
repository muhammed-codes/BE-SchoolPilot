# Release Checklist

## Required

- [ ] Install from committed lockfiles.
- [ ] Configure development, test, staging, and production separately.
- [ ] Supply production secrets only through deployment secret storage.
- [ ] Run migrations against staging before production.
- [ ] Verify `/api/health` and GraphQL startup.
- [ ] Regenerate `schema.gql` and pass `pnpm run check:schema-contract`.
- [ ] Pass backend, Admin, Staff, and Guardian build/type checks.
- [ ] Verify Admin access management and a protected operation.
- [ ] Verify Staff effective permissions and forbidden operations.
- [ ] Verify Guardian child-scoped access.
- [ ] Verify `SCHOOL_ADMIN`, `SUPER_ADMIN`, BURSAR, and PARENT boundaries.
- [ ] Verify cross-school isolation for users, students, permissions, finance,
      communication, files, and documents.
- [ ] Verify finance, results, attendance, timetable, communication, and
      document authorization.
- [ ] Run logged-out, direct-route, refresh, expired-session, and forbidden-action checks.
- [ ] Keep the regression harness at 4 tiers, 22 suites, 84/84 tests.
- [ ] Complete staging smoke tests for Admin, Staff, Guardian, and a forbidden
      cross-school request.

## Current blockers

These remain explicitly unverified:

- Controlled PostgreSQL/CI workflow execution and migration execution.
- Backend runtime and GraphQL schema generation.
- Runtime authorization, tenant isolation, and Guardian child isolation.
- Finance, results, attendance, timetable, communication, and document runtime tests.
- Admin, Staff, and Guardian browser/runtime smoke tests.
- Staff lint baseline: 357 ESLint errors and 155 Prettier findings.
