import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMultipleClassTeacherAssignments1792500000000
  implements MigrationInterface
{
  name = 'CreateMultipleClassTeacherAssignments1792500000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "class_teachers" (
        "classId" uuid NOT NULL,
        "teacherId" uuid NOT NULL,
        CONSTRAINT "PK_class_teachers_class_teacher" PRIMARY KEY ("classId", "teacherId"),
        CONSTRAINT "FK_class_teachers_class" FOREIGN KEY ("classId")
          REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT "FK_class_teachers_teacher" FOREIGN KEY ("teacherId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
    await queryRunner.query(`
      INSERT INTO "class_teachers" ("classId", "teacherId")
      SELECT "id", "classTeacherId"
      FROM "classes"
      WHERE "classTeacherId" IS NOT NULL
      ON CONFLICT ("classId", "teacherId") DO NOTHING
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "class_teachers"`);
  }
}
