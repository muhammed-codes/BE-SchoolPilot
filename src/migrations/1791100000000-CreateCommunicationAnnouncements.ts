import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCommunicationAnnouncements1791100000000 implements MigrationInterface {
  name = 'CreateCommunicationAnnouncements1791100000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "public"."role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'communication'`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."announcement_audience_enum" AS ENUM ('school', 'staff', 'guardians', 'class'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await queryRunner.query(`DO $$ BEGIN CREATE TYPE "public"."announcement_status_enum" AS ENUM ('draft', 'published'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await queryRunner.query(`CREATE TABLE IF NOT EXISTS "announcements" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
      "schoolId" uuid NOT NULL,
      "createdById" uuid NOT NULL,
      "title" varchar NOT NULL,
      "body" text NOT NULL,
      "audience" "public"."announcement_audience_enum" NOT NULL,
      "targetClassId" uuid,
      "status" "public"."announcement_status_enum" NOT NULL DEFAULT 'draft',
      "publishedAt" TIMESTAMP,
      CONSTRAINT "PK_announcements" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_announcements_school_status" ON "announcements" ("schoolId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_announcements_target_class" ON "announcements" ("targetClassId")`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_announcements_target_class"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_announcements_school_status"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "announcements"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."announcement_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."announcement_audience_enum"`);
  }
}
