import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTimetableModule1790000000000 implements MigrationInterface {
  name = 'CreateTimetableModule1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 0. Ensure timetable resource enum exists
    await queryRunner.query(`
      DO $$
      BEGIN
        ALTER TYPE "role_permissions_resource_enum" ADD VALUE IF NOT EXISTS 'timetable';
      EXCEPTION
        WHEN duplicate_object THEN null;
        WHEN undefined_object THEN null;
      END $$;
    `);

    // 1. Add extra columns to existing tables
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "maxPeriodsPerDay" int DEFAULT 6;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "maxPeriodsPerWeek" int DEFAULT 25;
      ALTER TABLE "subjects" ADD COLUMN IF NOT EXISTS "code" varchar NULL;
      ALTER TABLE "class_subjects" ADD COLUMN IF NOT EXISTS "isDoublePeriod" boolean DEFAULT false;
      ALTER TABLE "class_subjects" ADD COLUMN IF NOT EXISTS "periodsPerWeek" int DEFAULT 4;
      ALTER TABLE "class_subjects" ADD COLUMN IF NOT EXISTS "schoolId" uuid NULL;
    `);

    // 2. Create rooms table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "rooms" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "capacity" int NOT NULL DEFAULT 30,
        "type" varchar NOT NULL DEFAULT 'CLASSROOM',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_rooms_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_rooms_schoolId" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_rooms_schoolId" ON "rooms"("schoolId");
    `);

    // 3. Create school_days table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "school_days" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "dayOfWeek" int NOT NULL,
        "dayName" varchar NOT NULL,
        "isTeachingDay" boolean NOT NULL DEFAULT true,
        "orderIndex" int NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_school_days_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_school_days_school_day" UNIQUE ("schoolId", "dayOfWeek"),
        CONSTRAINT "FK_school_days_schoolId" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_school_days_schoolId" ON "school_days"("schoolId");
    `);

    // 4. Create periods table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "periods" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "startTime" varchar NOT NULL,
        "endTime" varchar NOT NULL,
        "orderIndex" int NOT NULL DEFAULT 1,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_periods_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_periods_schoolId" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_periods_schoolId" ON "periods"("schoolId");
      CREATE INDEX IF NOT EXISTS "IDX_periods_order" ON "periods"("schoolId", "orderIndex");
    `);

    // 5. Create non_teaching_slots table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "non_teaching_slots" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "type" varchar NOT NULL DEFAULT 'BREAK',
        "dayOfWeek" int NULL,
        "periodId" uuid NULL,
        "startTime" varchar NULL,
        "endTime" varchar NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_non_teaching_slots_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_non_teaching_slots_schoolId" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_non_teaching_slots_periodId" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_non_teaching_slots_schoolId" ON "non_teaching_slots"("schoolId");
    `);

    // 6. Create teacher_availabilities table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "teacher_availabilities" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "teacherId" uuid NOT NULL,
        "dayOfWeek" int NOT NULL,
        "periodId" uuid NOT NULL,
        "status" varchar NOT NULL DEFAULT 'AVAILABLE',
        "source" varchar NOT NULL DEFAULT 'SELF_SUBMITTED',
        "approvalStatus" varchar NOT NULL DEFAULT 'PENDING',
        "notes" text NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_teacher_availabilities_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_teacher_availability_slot" UNIQUE ("schoolId", "teacherId", "dayOfWeek", "periodId"),
        CONSTRAINT "FK_teacher_availabilities_schoolId" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_teacher_availabilities_teacherId" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_teacher_availabilities_periodId" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_teacher_availabilities_school_teacher" ON "teacher_availabilities"("schoolId", "teacherId");
    `);

    // 7. Create timetable_entries table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "timetable_entries" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "schoolId" uuid NOT NULL,
        "termId" uuid NOT NULL,
        "classId" uuid NOT NULL,
        "subjectId" uuid NOT NULL,
        "teacherId" uuid NOT NULL,
        "roomId" uuid NULL,
        "dayOfWeek" int NOT NULL,
        "periodId" uuid NOT NULL,
        "isDoublePeriod" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_timetable_entries_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_timetable_entries_schoolId" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_timetable_entries_termId" FOREIGN KEY ("termId") REFERENCES "terms"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_timetable_entries_classId" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_timetable_entries_subjectId" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_timetable_entries_teacherId" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_timetable_entries_roomId" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_timetable_entries_periodId" FOREIGN KEY ("periodId") REFERENCES "periods"("id") ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS "IDX_timetable_entries_school_term_class" ON "timetable_entries"("schoolId", "termId", "classId");
      CREATE INDEX IF NOT EXISTS "IDX_timetable_entries_school_term_teacher" ON "timetable_entries"("schoolId", "termId", "teacherId");
      CREATE INDEX IF NOT EXISTS "IDX_timetable_entries_school_term_room" ON "timetable_entries"("schoolId", "termId", "roomId");
      CREATE INDEX IF NOT EXISTS "IDX_timetable_entries_slot" ON "timetable_entries"("schoolId", "termId", "dayOfWeek", "periodId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "timetable_entries" CASCADE`);
    await queryRunner.query(
      `DROP TABLE IF EXISTS "teacher_availabilities" CASCADE`,
    );
    await queryRunner.query(
      `DROP TABLE IF EXISTS "non_teaching_slots" CASCADE`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "periods" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "school_days" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "rooms" CASCADE`);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "maxPeriodsPerDay";
      ALTER TABLE "users" DROP COLUMN IF EXISTS "maxPeriodsPerWeek";
      ALTER TABLE "subjects" DROP COLUMN IF EXISTS "code";
      ALTER TABLE "class_subjects" DROP COLUMN IF EXISTS "isDoublePeriod";
      ALTER TABLE "class_subjects" DROP COLUMN IF EXISTS "periodsPerWeek";
      ALTER TABLE "class_subjects" DROP COLUMN IF EXISTS "schoolId";
    `);
  }
}
