import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { dataSourceOptions } from '../src/database/data-source';

type IdRow = { id: string };
type PermissionRow = {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};
type UserRoleRow = {
  role: string;
  permissionReviewRequired: boolean;
};

const run = async () => {
  const testUrl = process.env.MIGRATION_TEST_DATABASE_URL;
  if (!testUrl) {
    throw new Error(
      'Set MIGRATION_TEST_DATABASE_URL to an isolated test database',
    );
  }
  const databaseName = new URL(testUrl).pathname.replace(/^\//, '');
  if (!/test/i.test(databaseName)) {
    throw new Error(
      'Refusing to run migration verification outside a test database',
    );
  }

  const postgresOptions = dataSourceOptions as PostgresConnectionOptions;
  const dataSource = new DataSource({
    ...dataSourceOptions,
    type: 'postgres',
    url: testUrl,
    ssl: process.env.DATABASE_SSL === 'false' ? false : postgresOptions.ssl,
  } as PostgresConnectionOptions);

  await dataSource.initialize();
  try {
    const migrations = [...dataSource.migrations];
    const setMigrations = (items: typeof migrations) => {
      Object.defineProperty(dataSource, 'migrations', {
        configurable: true,
        value: items,
        writable: true,
      });
    };
    const migrationTimestamp = (migration: (typeof migrations)[number]) =>
      Number(migration.name?.match(/\d{13}$/)?.[0] || 0);
    setMigrations(
      migrations.filter(
        (migration) => migrationTimestamp(migration) < 1792263000000,
      ),
    );
    await dataSource.runMigrations({ transaction: 'each' });

    const schoolIds: string[] = [];
    for (const name of [
      'Merge School',
      'Principal School',
      'Vice School',
      'Head School',
    ]) {
      const schoolRows: unknown = await dataSource.query(
        `INSERT INTO "schools" ("name", "uniqueQrCode") VALUES ($1, $2) RETURNING "id"`,
        [name, `migration-${name.toLowerCase().replaceAll(' ', '-')}`],
      );
      const [school] = schoolRows as IdRow[];
      schoolIds.push(school.id);
    }
    const [mergeSchoolId, principalSchoolId, viceSchoolId, headSchoolId] =
      schoolIds;

    for (const [role, values] of [
      ['principal', [true, true, true, false]],
      ['vice_principal', [false, true, false, false]],
      ['head_teacher', [true, true, false, true]],
    ] as const) {
      await dataSource.query(
        `INSERT INTO "role_permissions" ("role", "resource", "schoolId", "canCreate", "canRead", "canUpdate", "canDelete") VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [role, 'students', mergeSchoolId, ...values],
      );
    }

    const legacyStaff = [
      ['principal', principalSchoolId, 'principal'],
      ['vice_principal', viceSchoolId, 'vice-principal'],
      ['head_teacher', headSchoolId, 'head-teacher'],
      ['bursar', mergeSchoolId, 'bursar'],
    ] as const;
    for (const [role, schoolId, emailPrefix] of legacyStaff) {
      await dataSource.query(
        `INSERT INTO "users" ("email", "firstName", "lastName", "passwordHash", "role", "schoolId") VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `${emailPrefix}@migration-test.invalid`,
          'Legacy',
          'Staff',
          'test-hash',
          role,
          schoolId,
        ],
      );
    }
    await dataSource.query(
      `INSERT INTO "role_permissions" ("role", "resource", "schoolId", "canCreate", "canRead", "canUpdate", "canDelete") VALUES ('bursar', 'fees', $1, true, true, true, true)`,
      [mergeSchoolId],
    );

    setMigrations(migrations);
    await dataSource.runMigrations({ transaction: 'each' });

    const consolidatedRows: unknown = await dataSource.query(
      `SELECT "canCreate", "canRead", "canUpdate", "canDelete" FROM "role_permissions" WHERE "role" = 'school_management' AND "resource" = 'students' AND "schoolId" = $1`,
      [mergeSchoolId],
    );
    const consolidated = consolidatedRows as PermissionRow[];
    if (
      consolidated.length !== 1 ||
      consolidated[0].canCreate !== false ||
      consolidated[0].canRead !== true ||
      consolidated[0].canUpdate !== false ||
      consolidated[0].canDelete !== false
    ) {
      throw new Error(
        'Leadership permission migration did not use the intersection policy',
      );
    }

    const userRows: unknown = await dataSource.query(
      `SELECT "role", "permissionReviewRequired" FROM "users" ORDER BY "email"`,
    );
    const users = userRows as UserRoleRow[];
    if (
      users.filter((user) => user.role === 'school_management').length !== 3 ||
      users.filter(
        (user) => user.role === 'bursar' && user.permissionReviewRequired,
      ).length !== 1
    ) {
      throw new Error('Legacy staff assignments were not preserved safely');
    }

    const bursarPermissionRows: unknown = await dataSource.query(
      `SELECT "canCreate", "canRead", "canUpdate", "canDelete" FROM "role_permissions" WHERE "role" = 'bursar' AND "schoolId" = $1`,
      [mergeSchoolId],
    );
    const bursarPermissions = bursarPermissionRows as PermissionRow[];
    if (
      bursarPermissions.some((permission: Record<string, boolean>) =>
        Object.values(permission).some(Boolean),
      )
    ) {
      throw new Error('Legacy Bursar permissions were not cleared for review');
    }

    console.log('Role consolidation migration verification passed.');
  } finally {
    await dataSource.destroy();
  }
};

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
