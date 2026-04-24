"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddResetPasswordFields1776996113137 = void 0;
class AddResetPasswordFields1776996113137 {
    name = 'AddResetPasswordFields1776996113137';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordExpires" TIMESTAMP`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordExpires"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordToken"`);
    }
}
exports.AddResetPasswordFields1776996113137 = AddResetPasswordFields1776996113137;
//# sourceMappingURL=1776996113137-AddResetPasswordFields.js.map