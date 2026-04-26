import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    this.resend = new Resend(
      this.configService.getOrThrow<string>('RESEND_API_KEY'),
    );
  }

  private maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  };

  sendPasswordResetEmail = (email: string, token: string) => {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
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
        this.logger.log(
          `Password reset email sent to ${this.maskEmail(email)}`,
        );
        return true;
      })
      .catch((error) => {
        this.logger.error(
          `Failed to send password reset email to ${this.maskEmail(email)}`,
          error.stack,
        );
        throw error;
      });
  };
}
