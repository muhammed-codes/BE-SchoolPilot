# RBAC change log

Date: 26 October 2026. All remote commits below are on `cloud` only. Earlier baseline commits c61c06b/caab3af (backend) and 62a5207/e7fd80e (admin) were inspected and retained.

| ID | Severity | Repository / key files | Exact fix | Commit | Test / result | Status |
| --- | --- | --- | --- | --- | --- | --- |
| RBAC-01 | High | BE `access.service.ts`, access specs | Preserve school decisions on restart; canonical School Management profile; no foreign/global school fallback | [61c7782](https://github.com/muhammed-codes/BE-SchoolPilot/commit/61c77821b199fb9356e8079c1471e221a1ba29e0) | Shared profile and per-school permission unit tests pass | Completed/tested at unit level |
| RBAC-02 | Critical | BE JWT strategy, common guards, access module, users resolver | Reload active identity; HTTP/GraphQL guard handling; initial mandatory record ownership; authenticated self-service | [24e766a](https://github.com/muhammed-codes/BE-SchoolPilot/commit/24e766abf3785b2798f84cd67d29db67753aec3e) | Guard and scope tests pass; live API matrix unavailable | Implemented; integration unverified |
| RBAC-03 | High | Admin AuthContext, route-policy, AppShell, Sidebar, SchoolManagement | Protect direct routes and access admin; refresh effective permissions; shared management presentation | [4ffea64](https://github.com/muhammed-codes/schoolpilot-admin/commit/4ffea64c58dd2d27796291125334815d1eeefbe7) | Route tests and direct URL browser smoke pass | Completed/tested within stated scope |
| RBAC-04 | Critical | BE class/student/subject/results services, record-scope service, terms resolver | Restrict assigned academic records and related IDs; isolate academic lookups; narrow factory teacher grants; transactional groups; expose grant source | [7e57e3f](https://github.com/muhammed-codes/BE-SchoolPilot/commit/7e57e3f74f33752f9453ede81d0f95e2919e12ca) | Ownership/default/precedence tests pass; transaction concurrency not run | Implemented; DB concurrency unverified |
| RBAC-05 | High | Admin school workflow pages and feature controls, api/types | Independent action gates; permission-source UI; inactive group unassignment; safe theme preference API | [cf56ab0](https://github.com/muhammed-codes/schoolpilot-admin/commit/cf56ab0cfd16ddbe108a8025d0be183af407052f) | READ-only gate tests pass; all interactive workflows not exhaustively tested | Implemented; broader acceptance unverified |
| RBAC-06 | Critical | BE dashboard service/resolver/DTO/spec; schema snapshot | Do not query or return unauthorized dashboard sections; nullable restricted sections; scoped teacher counts | [17299b6](https://github.com/muhammed-codes/BE-SchoolPilot/commit/17299b669466ae7eaa93b88bd776562a93bfa501) | Dashboard tests pass, including no school finance queries for teacher | Completed/tested at unit level |
| RBAC-07 | Medium | Admin dashboard, AssignedClasses, sidebar and tests | Teacher assignment dashboard; hide empty quick actions/nav groups; route/action regression suite | [b76f01b](https://github.com/muhammed-codes/schoolpilot-admin/commit/b76f01b191a85b5c907d9e9aca3f591b74464b75) | Both themes at 390/1440; 24 frontend tests in final suite | Completed/tested within smoke scope |
| RBAC-08 | Critical | BE timetable service/resolver, result assignments, scope/default specs | Teacher timetable and export filtering; role-specific assignment selection; export target checks; all-role factory-default tests | [784c018](https://github.com/muhammed-codes/BE-SchoolPilot/commit/784c0187eeea15bc5797dfb05a5273360d6cd27e) | Teacher export denials and role-default tests pass | Implemented/tested; live SQL execution unverified |
| RBAC-09 | High | BE fees resolver/service, fee-directory DTO/spec, schema | Fee-only minimal class/student selectors; exclude sensitive profile fields; bind school and teacher scope | [7b0c165](https://github.com/muhammed-codes/BE-SchoolPilot/commit/7b0c16512ae35df102144f0f316c771d449dcaff) | Projection, foreign-class and parent-directory tests pass | Completed/tested at unit level |
| RBAC-10 | High | Admin staff forms/filter, fee pages, timetable controls, ScoringResponsibilities | Expose Bursar; preserve three management identities; fix fee lookup dependencies and timetable action mapping; display subject responsibilities | [769dfc8](https://github.com/muhammed-codes/schoolpilot-admin/commit/769dfc8942393d1ee86e2d490cd8f167ae489574) | Typecheck/build and 24 tests pass; final browser smoke passes | Implemented/tested within stated scope |
| RBAC-11 | High | BE migration `1793016000000-PreserveSchoolPermissionProfiles.ts` | Back up legacy grants; narrow factory-shaped teacher grants once; fill missing school rows; refuse unsafe automatic down | 7e57e3f above | TypeScript build passes; PostgreSQL migration not executed | Implemented/unverified |
| RBAC-12 | Medium | BE unrelated legacy files | Existing full-repository lint debt remains outside RBAC edits | None | Full non-mutating lint: 196 errors, 14 warnings; modified-file lint passes | Unresolved |
| RBAC-13 | High | Both repos / acceptance environment | Database migration/restart/rollback, direct API attacks and group concurrency tests | None | No configured test DB/PostgreSQL/container runtime | Blocked by environment |
| RBAC-14 | Medium | Admin all workflows/themes | Exhaustive role-based visual and persistence acceptance | None | Focused fixture browser tests only; not all modals/drawers/real saves | Partial verification |

## Final verification results

| Repository | Command / check | Result |
| --- | --- | --- |
| Both | `pnpm install --frozen-lockfile` | Pass; already up to date |
| BE | `pnpm test --runInBand` | Pass: 96 tests, 15 suites |
| BE | `pnpm build` | Pass |
| BE | `pnpm check:schema-contract` | Pass; authorization enums match (not full runtime-schema integration) |
| BE | ESLint on modified TypeScript files, then fee additions | Pass |
| BE | `pnpm lint`; later `pnpm exec eslint 'src/**/*.ts' 'test/**/*.ts'` | Full lint not clean: latter reports 196 errors and 14 warnings in existing files. Broad auto-format changes from lint were reverted outside the work scope |
| Admin | `pnpm test` | Pass: 24 tests |
| Admin | `pnpm typecheck` | Pass |
| Admin | `pnpm build` | Pass after moving aside a corrupted local Turbopack cache |
| Admin | `pnpm lint` | Pass with 28 existing warnings, 0 errors |
| Admin | Playwright fixture smoke against local production build | Pass: Classic and SchoolRight × widths 390 and 1440; teacher dashboard, read-only actions, access-route denial, no horizontal overflow |
| Both | Remote tree comparison | Code contents compared against local Git blob hashes; remote binary assets retained |

## Interpretation

"Completed/tested" is limited to the specified tests, not a blanket production security certification. "Implemented/unverified" means code exists and compiles but the stated runtime behavior has not been exercised. The [implementation report](RBAC_IMPLEMENTATION_REPORT.md) covers the entire handoff, role matrix, permission dependencies, genuine blockers and release considerations. No production migration, merge or deployment was performed.
