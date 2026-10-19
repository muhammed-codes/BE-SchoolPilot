import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionAuditLogs1792320000000 implements MigrationInterface {
  name = 'CreatePermissionAuditLogs1792320000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permission_audit_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "schoolId" uuid NOT NULL,
        "actorUserId" uuid NOT NULL,
        "targetType" character varying(64) NOT NULL,
        "targetId" uuid,
        "operation" character varying(64) NOT NULL,
        "beforeState" jsonb,
        "afterState" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_permission_audit_logs" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_permission_audit_logs_school_created" ON "permission_audit_logs" ("schoolId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_permission_audit_logs_target" ON "permission_audit_logs" ("targetType", "targetId")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "permission_audit_logs"`);
  }
}
