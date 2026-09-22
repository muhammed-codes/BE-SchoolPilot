# School Pilot Architecture

## Applications

```text
School Pilot
├── admin-SchoolPilot       School administration and configuration
├── FE-SchoolPilot          Staff day-to-day operations
├── guardian-SchoolPilot    Guardian child-specific portal
└── BE-SchoolPilot          Shared GraphQL backend and domain contracts
```

Admin owns school configuration, staff and access management, structural
student administration, guardian management, academic configuration, timetable
and finance administration, results administration, attendance oversight,
communication, settings, and platform administration.

Staff operates within the configured school system: assigned students/classes,
attendance, score entry and submission, operational timetable and availability,
authorized finance views, notifications, and profile/security.

Guardians access only their own account and backend-authorized children’s
results, attendance, timetable, invoices, payments, receipts, and profile.

The backend owns authentication, authorization, tenant isolation, GraphQL
operations, persistence, and child-ownership checks. Frontend checks control UX
only and are not security boundaries.

## Authorization model

```text
Effective permissions =
  legacy role permissions
  + permission-group permissions
  + individual allows
  - individual denies
```

Individual deny takes precedence. `SCHOOL_ADMIN` and `SUPER_ADMIN` retain
unrestricted behavior according to their backend scope. Legacy BURSAR
role-permission rows remain additive for migration compatibility; there is no
hard-coded BURSAR bypass.

Guardian contracts including `PARENT`, `parentId`, `StudentParent`, and
child-scoped operations are shared domain contracts and do not grant Staff or
Admin access.
