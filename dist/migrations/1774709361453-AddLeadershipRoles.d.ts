import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddLeadershipRoles1774709361453 implements MigrationInterface {
    name: string;
    transaction: boolean;
    up(queryRunner: QueryRunner): Promise<void>;
    down(): Promise<void>;
}
