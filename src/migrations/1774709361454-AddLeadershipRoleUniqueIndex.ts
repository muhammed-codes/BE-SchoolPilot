import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadershipRoleUniqueIndex1774709361454 implements MigrationInterface {
  name = 'AddLeadershipRoleUniqueIndex1774709361454';

  public up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(
        `
        SELECT "schoolId", "role"
        FROM "users"
        WHERE "isActive" = true
          AND "role" IN ('principal', 'vice_principal', 'head_teacher')
        GROUP BY "schoolId", "role"
        HAVING COUNT(*) > 1
      `,
      )
      .then((rows: Array<{ schoolId: string; role: string }>) =>
        rows.reduce(
          (chain, duplicateRow) =>
            chain.then(() =>
              queryRunner.query(
                `
                  UPDATE "users"
                  SET "isActive" = false
                  WHERE id IN (
                    SELECT id FROM "users"
                    WHERE "schoolId" = $1 AND "role" = $2 AND "isActive" = true
                    ORDER BY "createdAt" ASC
                    OFFSET 1
                  )
                `,
                [duplicateRow.schoolId, duplicateRow.role],
              ),
            ),
          Promise.resolve(),
        ),
      )
      .then(() =>
        queryRunner.query(`
          CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_single_active_leadership_role_per_school"
          ON "users" ("schoolId", "role")
          WHERE "isActive" = true
            AND "role" IN ('principal', 'vice_principal', 'head_teacher');
        `),
      )
      .then(() => undefined);
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(
        `
        DROP INDEX IF EXISTS "public"."UQ_users_single_active_leadership_role_per_school";
      `,
      )
      .then(() => undefined);
  }
}
