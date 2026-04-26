import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadershipRoleUniqueIndex1774709361454 implements MigrationInterface {
  name = 'AddLeadershipRoleUniqueIndex1774709361454';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Preflight: identify and resolve duplicates before creating unique index
    const duplicates = await queryRunner.query(`
      SELECT "schoolId", "role"
      FROM "users"
      WHERE "isActive" = true
        AND "role" IN ('principal', 'vice_principal', 'head_teacher')
      GROUP BY "schoolId", "role"
      HAVING COUNT(*) > 1
    `);

    if (duplicates.length > 0) {
      for (const dup of duplicates) {
        // Keep the earliest record and deactivate subsequent duplicates
        await queryRunner.query(
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
          [dup.schoolId, dup.role],
        );
      }
    }

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_users_single_active_leadership_role_per_school"
      ON "users" ("schoolId", "role")
      WHERE "isActive" = true
        AND "role" IN ('principal', 'vice_principal', 'head_teacher');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "public"."UQ_users_single_active_leadership_role_per_school";
    `);
  }
}
