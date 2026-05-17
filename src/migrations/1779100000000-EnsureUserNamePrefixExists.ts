import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureUserNamePrefixExists1779100000000 implements MigrationInterface {
  name = 'EnsureUserNamePrefixExists1779100000000';

  public up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_namespace n ON n.oid = t.typnamespace
            WHERE t.typname = 'users_nameprefix_enum' AND n.nspname = 'public'
          ) THEN
            CREATE TYPE "public"."users_nameprefix_enum" AS ENUM ('mr', 'mrs', 'miss');
          END IF;
        END
        $$;
      `)
      .then(() =>
        queryRunner.query(`
          ALTER TABLE "users"
          ADD COLUMN IF NOT EXISTS "namePrefix" "public"."users_nameprefix_enum"
        `),
      )
      .then(() => undefined);
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`
        ALTER TABLE "users"
        DROP COLUMN IF EXISTS "namePrefix"
      `)
      .then(() =>
        queryRunner.query(`
          DO $$
          BEGIN
            IF EXISTS (
              SELECT 1
              FROM pg_type t
              JOIN pg_namespace n ON n.oid = t.typnamespace
              WHERE t.typname = 'users_nameprefix_enum' AND n.nspname = 'public'
            ) THEN
              DROP TYPE "public"."users_nameprefix_enum";
            END IF;
          END
          $$;
        `),
      )
      .then(() => undefined);
  }
}
