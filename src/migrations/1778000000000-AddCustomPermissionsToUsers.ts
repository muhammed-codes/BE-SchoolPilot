import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomPermissionsToUsers1778000000000
  implements MigrationInterface
{
  name = 'AddCustomPermissionsToUsers1778000000000';

  public up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`ALTER TABLE "users" ADD "customPermissions" text[]`)
      .then(() => undefined);
  }

  public down(queryRunner: QueryRunner): Promise<void> {
    return queryRunner
      .query(`ALTER TABLE "users" DROP COLUMN "customPermissions"`)
      .then(() => undefined);
  }
}
