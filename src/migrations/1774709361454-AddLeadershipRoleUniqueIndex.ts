import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadershipRoleUniqueIndex1774709361454
  implements MigrationInterface
{
  name = 'AddLeadershipRoleUniqueIndex1774709361454';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
