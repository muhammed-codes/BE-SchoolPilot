import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixClassManagementPermissions1779200000000 implements MigrationInterface {
  name = 'FixClassManagementPermissions1779200000000';

  public up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`
        UPDATE "role_permissions"
        SET "canUpdate" = true
        WHERE "resource" = 'classes'
          AND "role" IN ('school_admin', 'principal', 'vice_principal', 'head_teacher', 'class_teacher')
      `)
      .then(() =>
        queryRunner.query(`
          UPDATE "role_permissions"
          SET "canUpdate" = false
          WHERE "resource" = 'classes'
            AND "role" = 'subject_teacher'
        `),
      )
      .then(() => undefined);
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`
        UPDATE "role_permissions"
        SET "canUpdate" = false
        WHERE "resource" = 'classes'
          AND "role" IN ('principal', 'vice_principal', 'head_teacher', 'class_teacher')
      `)
      .then(() => undefined);
  }
}
