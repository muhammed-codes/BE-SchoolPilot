"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let MailService = MailService_1 = class MailService {
    configService;
    resend;
    logger = new common_1.Logger(MailService_1.name);
    constructor(configService) {
        this.configService = configService;
        this.resend = new resend_1.Resend(this.configService.getOrThrow('RESEND_API_KEY'));
    }
    maskEmail = (email) => {
        const [local, domain] = email.split('@');
        return `${local[0]}***@${domain}`;
    };
    sendPasswordResetEmail = (email, token) => {
        const frontendUrl = this.configService.getOrThrow('FRONTEND_URL');
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
        return this.resend.emails
            .send({
            from: 'SchoolPilot <noreply@schoolpilot.app>',
            to: email,
            subject: 'Reset Your Password',
            html: `
          <h1>Password Reset Request</h1>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
        `,
        })
            .then(() => {
            this.logger.log(`Password reset email sent to ${this.maskEmail(email)}`);
            return true;
        })
            .catch((error) => {
            this.logger.error(`Failed to send password reset email to ${this.maskEmail(email)}`, error.stack);
            throw error;
        });
    };
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map