import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddResetPasswordFields1776996113137 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
