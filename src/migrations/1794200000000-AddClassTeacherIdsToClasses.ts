import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClassTeacherIdsToClasses1794200000000
  implements MigrationInterface
{
  name = 'AddClassTeacherIdsToClasses1794200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classes" ADD COLUMN IF NOT EXISTS "classTeacherIds" uuid[] NOT NULL DEFAULT '{}'`,
    );

    // Backfill classTeacherIds with classTeacherId if present
    await queryRunner.query(
      `UPDATE "classes" SET "classTeacherIds" = ARRAY["classTeacherId"] WHERE "classTeacherId" IS NOT NULL AND ("classTeacherIds" IS NULL OR cardinality("classTeacherIds") = 0)`,
    );

    // Backfill class_subjects.teacherIds with subjectTeacherId if present
    await queryRunner.query(
      `UPDATE "class_subjects" SET "teacherIds" = ARRAY["subjectTeacherId"] WHERE "subjectTeacherId" IS NOT NULL AND ("teacherIds" IS NULL OR cardinality("teacherIds") = 0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classes" DROP COLUMN IF EXISTS "classTeacherIds"`,
    );
  }
}
