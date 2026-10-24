import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replace overly broad seeded teacher permissions with an academic-only
 * baseline. Rows edited by a school administrator are preserved.
 */
export class RestrictTeacherDefaultPermissions1792400000000 implements MigrationInterface {
  name = 'RestrictTeacherDefaultPermissions1792400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const academicResources = `('students', 'results', 'attendance', 'classes', 'subjects', 'timetable')`;
    const creatableResources = `('results', 'attendance')`;

    for (const role of ['class_teacher', 'subject_teacher']) {
      await queryRunner.query(
        `UPDATE "role_permissions"
         SET "canRead" = ("resource" IN ${academicResources}),
             "canCreate" = ("resource" IN ${creatableResources}),
             "canUpdate" = ("resource" IN ${role === 'class_teacher' ? "('results', 'attendance', 'students', 'classes')" : creatableResources}),
             "canDelete" = false
         WHERE "role" = $1
           AND "updatedAt" = "createdAt"`,
        [role],
      );
    }

    await queryRunner.query(
      `UPDATE "role_permissions"
       SET "canRead" = false,
           "canCreate" = false,
           "canUpdate" = false,
           "canDelete" = false
       WHERE "role" = 'school_management'
         AND "resource" = 'access'
         AND "updatedAt" = "createdAt"`,
    );
  }

  async down(): Promise<void> {
    throw new Error(
      "Teacher permission defaults cannot be safely restored without recording each school's previous role configuration.",
    );
  }
}
