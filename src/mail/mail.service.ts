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
          <p>This link will expire in 30 minutes.</p>
        `,
      })
      .then((result) => {
        if (result.error) {
          this.logger.error(
            `Failed to send password reset email to ${this.maskEmail(email)}: ${result.error.message}`,
          );
          throw new Error(result.error.message);
        }
        this.logger.log(
          `Password reset email sent to ${this.maskEmail(email)}`,
        );
        return true;
      })
      .catch((error) => {
        const errorStack =
          error instanceof Error ? error.stack : 'Unknown error';
        this.logger.error(
          `Failed to send password reset email to ${this.maskEmail(email)}`,
          errorStack,
        );
        throw error;
      });
  };

  sendVerificationEmail = (email: string, token: string) => {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    return this.resend.emails
      .send({
        from: 'SchoolPilot <noreply@schoolpilot.app>',
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <h1>Welcome to SchoolPilot!</h1>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verifyUrl}">Verify Email</a>
          <p>If you did not create an account, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `,
      })
      .then((result) => {
        if (result.error) {
          this.logger.error(
            `Failed to send verification email to ${this.maskEmail(email)}: ${result.error.message}`,
          );
          throw new Error(result.error.message);
        }
        this.logger.log(`Verification email sent to ${this.maskEmail(email)}`);
        return true;
      })
      .catch((error) => {
        const errorStack =
          error instanceof Error ? error.stack : 'Unknown error';
        this.logger.error(
          `Failed to send verification email to ${this.maskEmail(email)}`,
          errorStack,
        );
        throw error;
      });
  };
}

