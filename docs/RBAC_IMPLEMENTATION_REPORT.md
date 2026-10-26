# SchoolRight permissions implementation report

Date: 26 October 2026. Scope: the existing `cloud` branches of BE-SchoolPilot and schoolpilot-admin. No writes to `main`, merges, production database changes, or deployment actions were performed.

## A. Executive summary

The implementation spans authorization services, authenticated identities, GraphQL/REST guards, academic record scope, role defaults, group transactions, dashboard queries, route admission, action controls, staff roles, permission refresh and finance workflow dependencies. The three management identities remain separate; Principal is the canonical configurable School Management profile.

This is an implementation delivery with passing automated checks, not a claim of production acceptance. Database-backed integration/migration/concurrency tests and exhaustive visual/workflow acceptance remain unverified. See I before any release. Existing public/authentication endpoints were preserved. The outdated `permission` branch was not merged.

## B. Confirmed fixes and C. Functionality

- School-specific permission decisions survive startup. Missing school rows deny rather than inheriting global grants. New-school seeding inserts missing rows without overwriting administrator decisions.
- Principal, Vice Principal and Head Teacher use one canonical default profile. Editing it synchronizes the three stored profiles; no staff identity is renamed.
- Active group grants are additive. Inactive groups are excluded. Individual DENY overrides defaults/groups for non-administrators; individual GRANT remains subject to tenant/record restrictions.
- School Admin retains all module actions inside a school; Super Admin retains platform access. School Admin without a school receives no module access.
- Group replacement/deletion/assignment use transactions and a shared group row lock. Assigned groups cannot be deleted. Replacement deduplicates grants. Group names are trimmed and empty names rejected.
- Effective permissions report `administrator`, `default`, `group`, `individual_grant`, `individual_deny` or `none` as their source.
- JWT authorization reloads active users so stale tokens do not preserve old roles, schools or active status. Guards handle HTTP as well as GraphQL and fail closed when neither explicit permission nor role metadata is present.
- Record checks validate school-owned classes, students, subjects, sessions, terms, result sheets and linked references. Class teachers use their class assignments; subject teachers use their subject assignments; parents use linked-child operations.
- Teacher student searches, class/subject lists, result lists, scoring assignments and timetable reads are restricted. Subject result sheets omit other subject scores. Timetable PDFs validate target scope and apply the viewer's record filter.
- Dashboard data is queried only for permitted sections. Teachers receive assignment views instead of school-wide analytics. Finance-only users do not receive unrelated academic/staff dashboard data.
- Admin routes are checked before mounting protected page content. Access management is administrator-only even if a non-admin has an ACCESS grant. Portal admission explicitly recognizes supported active staff identities.
- Permissions refresh on focus, visibility, successful permission mutations and every 30 seconds while visible. Failed permission refresh clears cached grants. Server authorization is authoritative immediately on the next request.
- Independent action gates cover the audited school workflow controls, including specialized actions and all eight dashboard shortcuts. Timetable create/update/delete/configure controls use distinct actions.
- Staff creation, editing and filtering retain Principal/Vice Principal/Head Teacher and now expose Bursar. No SCHOOL_MANAGEMENT user identity is offered.
- A self-service theme mutation permits authenticated users to save Classic/SchoolRight without requiring USERS.UPDATE.
- Fee-specific class/student selector queries allow Bursar finance workflows without broad academic profile access. Their DTOs omit birth dates, addresses, health and guardian information. Teacher access to these lookups remains assignment-scoped; parents cannot use the directory.

## D–E. Repositories, changed files and commits

[Backend cloud](https://github.com/muhammed-codes/BE-SchoolPilot/tree/cloud) · [Admin cloud](https://github.com/muhammed-codes/schoolpilot-admin/tree/cloud)

See [RBAC_CHANGELOG.md](RBAC_CHANGELOG.md) for issue IDs, severity, files, commit SHAs, checks and status. Relevant areas:

- Backend: `src/access/`, `src/auth/strategies/jwt-access.strategy.ts`, `src/common/guards/`, class/student/subject/results services and resolvers, `src/timetable/`, `src/dashboard/`, `src/fees/`, `src/terms/terms.resolver.ts`, `src/users/users.resolver.ts`, `schema.gql`, migration `1793016000000-PreserveSchoolPermissionProfiles.ts`.
- Admin: `src/context/AuthContext.tsx`, `src/lib/access/route-policy.ts`, `src/lib/api.ts`, `src/lib/types.ts`, `src/components/layout/`, access/staff pages, feature action controls, `AssignedClasses` and `ScoringResponsibilities`, `tests/access.test.cjs`.
- Existing reusable UI components and semantic theme tokens are retained. New dashboard responsibilities are separated into focused components. Existing oversized legacy pages were not comprehensively rewritten.

## F. Role and permission matrix

C/R/U/D below are factory role defaults. Existing school customizations are preserved except the reviewed one-time legacy teacher-default migration described in K. Specialized actions are independently granted through groups/overrides; CRUD does not imply APPROVE, PUBLISH, CONFIGURE, GENERATE, IMPORT, PROMOTE, ARCHIVE, ASSIGN or MANAGE.

| Identity | Default profile | Factory permissions | Mandatory scope |
| --- | --- | --- | --- |
| Super Admin | Platform administrator | Full platform authorization | Explicit platform/service context |
| School Admin | School administrator | All school module actions, exempt from individual DENY | Own school |
| Principal | School Management | C/R/U/D except SETTINGS and ACCESS | Own school |
| Vice Principal | School Management | Same canonical profile as Principal | Own school |
| Head Teacher | School Management | Same canonical profile as Principal | Own school |
| Class Teacher | Class Teacher | R: students/results/attendance/classes/subjects/timetable/communication; C: students/results/attendance; U: students/results/attendance/classes; no D | Assigned classes/students |
| Subject Teacher | Subject Teacher | Same academic R set; C/U: results/attendance; no D | Assigned subjects/classes/students |
| Bursar | Bursar | C/R/U/D: fees/expenses | Own-school financial records; minimal fee directory |
| Parent | Parent | R: linked-child academic/fees/communication resources | Linked children and existing parent-only operations; no admin portal |

Precedence for non-admins: school defaults → active group additive grants → individual override. Removing an override restores the underlying default/group result. Tenant and record constraints cannot be removed by a grant.

### Dependencies

READ is separate from write actions: a write-only grant does not automatically open a READ-protected route. Grant the minimal READ dependencies for workflows that need selectors. Terms/sessions are authenticated school-scoped lookup queries, not broad SETTINGS access. Fee selectors use FEES.READ and limited DTOs instead of STUDENTS.READ/CLASSES.READ. Editing access/group settings remains admin-only. Specialized results approvals and timetable configuration require their respective actions. Existing workflow state and role constraints still apply in addition to permissions.

## G. Security verification

Unit tests cover school-default independence, shared management behavior, active/inactive groups, grants/denials, admin exemption, missing school scope, foreign-user inspection, class/subject assignments, linked children, teacher PDF restrictions and minimal finance-directory projections. HTTP guard tests verify anonymous rejection, role enforcement and ownership before a school-admin module exemption.

A static regression test checks all resolver/controller query/mutation/HTTP operations for authentication and matching authorization guards. Explicit exceptions cover public health, registration, login, refresh, recovery, marketing and authenticated self-service operations. This checks decorator coverage; it is not a live API penetration test or proof that every service query is tenant-safe.

## H. Actual commands and results

Final command results are recorded in `RBAC_CHANGELOG.md`. Commands run include:

- Both repositories: `pnpm install --frozen-lockfile`, `pnpm build`.
- Backend: `pnpm test --runInBand`, `pnpm check:schema-contract`, `pnpm lint` and a subsequent non-mutating full ESLint check; targeted ESLint on modified files.
- Admin: `pnpm test`, `pnpm typecheck`, `pnpm lint`.
- Browser: a local Playwright/Chromium fixture test, run against a local Next production server, exercises both themes at widths 390 and 1440, teacher dashboard content, read-only controls, direct access-route denial and horizontal overflow. It uses mocked GraphQL responses and does not validate real persistence.

One backend test invocation with an extra `--` selected no tests; it was corrected to `pnpm test --runInBand`. One Next build hit a local Turbopack persistence-cache error; the generated cache was moved aside and the build rerun. These failed attempts are not counted as passes.

## I. Unresolved/unverified items and full handoff accounting

| Handoff area | Delivery status | Verification limit |
| --- | --- | --- |
| Baseline inspection and branch protection | Completed | Only cloud refs were updated |
| Distinct roles/shared management profile | Implemented and unit tested | Real staff provisioning/edit round trip not exercised against a DB |
| Defaults, groups, overrides and refresh | Implemented; core unit tests pass | Database restart, concurrent edits and transaction rollback require integration checks |
| Endpoint guards and tenant/record rules | Implemented; guard/scope tests and static coverage pass | All-endpoint direct API attack matrix remains unverified |
| Staff forms/options | Implemented; regression checks pass | All-role browser form submissions unverified |
| Routes/navigation/action controls | Implemented across audited pages | Label/source audit and focused tests are not exhaustive interactive action coverage |
| Role-specific dashboards | Implemented; tests and teacher browser smoke pass | Live role/override combinations require acceptance testing |
| Components and themes | Focused new components; semantic tokens retained | Existing oversized files remain; all modals/drawers/theme persistence not exhaustively visually checked |
| Migration | Written, backups included, TypeScript build checked | NOT executed against PostgreSQL; real row shapes, rollback and runtime ordering unverified |
| Builds/tests | See final results | Full backend lint remains failing in unrelated existing files |
| Changelog/final report | Delivered in both repositories | Does not label unverified production behavior as complete |

No PostgreSQL server/container runtime or configured test database was available in this workspace. No production credentials were used to bypass that limitation. Required acceptance before release: migrate a disposable two-school database, seed all nine roles, exercise direct GraphQL/REST calls with foreign IDs, test group deactivation/reactivation/removal and concurrent replacement, verify revoked permissions without logout, and execute staff/payment/result workflows across both themes. Binary brand assets were retained in the remote tree; the private-repository local snapshot did not include every binary asset, so complete asset rendering is not certified by the browser smoke test.

## J. GitHub links

The change log contains exact commit links. Branches: [backend](https://github.com/muhammed-codes/BE-SchoolPilot/tree/cloud) and [admin](https://github.com/muhammed-codes/schoolpilot-admin/tree/cloud).

## K. Migration and safe release considerations — no deployment performed

1. Back up the database and permission tables before executing migrations in a disposable/staging environment.
2. Review `1793016000000-PreserveSchoolPermissionProfiles.ts`. It snapshots relevant legacy teacher rows, narrows grants matching the old factory shape and fills missing school rows without overwriting existing decisions. A custom row identical to the old factory shape cannot be distinguished automatically; compare the backup and restore intentional grants through reviewed school configuration/groups.
3. Principal remains the canonical management default. Historical Vice Principal/Head Teacher rows are retained; subsequent management edits synchronize them. Review divergent historical settings before rollout.
4. The migration's down method intentionally refuses automatic restoration of broad grants. Restore only reviewed rows from `permission_profile_backup_1793016000000` if rollback is necessary.
5. Run PostgreSQL integration/tenant/concurrency tests first. Verify all school-role-resource rows exist; missing rows now deny rather than using a global fallback.
6. Coordinate backend and admin compatibility: the admin uses effective-permission `source`, nullable dashboard sections, the theme mutation and fee-directory fields. The backend additions must be available before the corresponding client is released.
7. No deployment, merge or production migration is authorized or performed by this implementation delivery.
