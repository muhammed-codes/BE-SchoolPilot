import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddLeadershipRoleUniqueIndex1774709361454 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
