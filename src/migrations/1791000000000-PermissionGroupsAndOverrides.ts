import { MigrationInterface, QueryRunner } from 'typeorm';

export class PermissionGroupsAndOverrides1791000000000 implements MigrationInterface {
  name = 'PermissionGroupsAndOverrides1791000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'access'`,
    );
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permission_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "schoolId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_permission_groups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permission_groups_school_name" UNIQUE ("schoolId", "name")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permission_groups_schoolId" ON "permission_groups" ("schoolId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permission_group_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "groupId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "resource" "public"."role_permissions_resource_enum" NOT NULL,
        "action" varchar NOT NULL,
        CONSTRAINT "PK_permission_group_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_permission_group_permissions" UNIQUE ("groupId", "resource", "action")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permission_group_permissions_groupId" ON "permission_group_permissions" ("groupId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_permission_group_permissions_schoolId" ON "permission_group_permissions" ("schoolId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_permission_groups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "groupId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        CONSTRAINT "PK_user_permission_groups" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_permission_groups" UNIQUE ("userId", "groupId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_permission_groups_userId" ON "user_permission_groups" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_permission_groups_groupId" ON "user_permission_groups" ("groupId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_permission_groups_schoolId" ON "user_permission_groups" ("schoolId")`,
    );

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."permission_effect_enum" AS ENUM ('grant', 'deny');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "schoolId" uuid NOT NULL,
        "resource" "public"."role_permissions_resource_enum" NOT NULL,
        "action" varchar NOT NULL,
        "effect" "public"."permission_effect_enum" NOT NULL DEFAULT 'grant',
        CONSTRAINT "PK_user_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_permissions" UNIQUE ("userId", "resource", "action")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_permissions_userId" ON "user_permissions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_user_permissions_schoolId" ON "user_permissions" ("schoolId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions"`);
    await queryRunner.query(
      `DROP TYPE IF EXISTS "public"."permission_effect_enum"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permission_groups"`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "permission_group_permissions"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "permission_groups"`);
  }
}
