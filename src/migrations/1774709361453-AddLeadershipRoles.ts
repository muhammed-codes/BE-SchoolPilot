import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLeadershipRoles1774709361453 implements MigrationInterface {
  name = 'AddLeadershipRoles1774709361453';
  transaction = false;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'users_role_enum'
            AND e.enumlabel = 'vice_principal'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE 'vice_principal';
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_type t
          JOIN pg_enum e ON t.oid = e.enumtypid
          WHERE t.typname = 'users_role_enum'
            AND e.enumlabel = 'head_teacher'
        ) THEN
          ALTER TYPE "public"."users_role_enum" ADD VALUE 'head_teacher';
        END IF;
      END
      $$;
    `);
  }

  public async down(): Promise<void> {
    // Postgres enum values are not dropped in down migrations to avoid breaking data.
  }
}
