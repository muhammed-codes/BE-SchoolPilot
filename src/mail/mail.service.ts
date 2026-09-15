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

  sendWelcomeParentEmail = (
    email: string,
    parentName: string,
    studentName: string,
    schoolName: string,
    tempPassword: string,
  ) => {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://schoolpilot.app';

    return this.resend.emails
      .send({
        from: 'SchoolPilot <noreply@schoolpilot.app>',
        to: email,
        subject: `Welcome to SchoolPilot - Parent Portal Access for ${studentName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">Welcome to SchoolPilot</h2>
              <p style="color: #475569; font-size: 14px; margin: 0;">Parent &amp; Guardian Academic Portal</p>
            </div>
            
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Dear <strong>${parentName}</strong>,</p>
            
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
              An official parent portal account has been created for you as the guardian of <strong>${studentName}</strong> at <strong>${schoolName}</strong>.
            </p>
            
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 20px; margin: 24px 0;">
              <p style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600;">Your Sign-In Credentials</p>
              <div style="margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 14px;">Portal URL: </span>
                <a href="${frontendUrl}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${frontendUrl}</a>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="color: #64748b; font-size: 14px;">Login Email: </span>
                <strong style="color: #0f172a; font-size: 14px;">${email}</strong>
              </div>
              <div>
                <span style="color: #64748b; font-size: 14px;">Temporary Password: </span>
                <code style="background-color: #e2e8f0; color: #0f172a; padding: 3px 8px; border-radius: 4px; font-size: 14px; font-weight: 700; font-family: monospace;">${tempPassword}</code>
              </div>
            </div>
            
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              With this account, you can monitor your child's published term results, download official PDF report cards, review attendance analytics, and check weekly class timetables.
            </p>
            
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
              For your security, please sign in and update your password immediately in your account settings.
            </p>
          </div>
        `,
      })
      .then((result) => {
        if (result.error) {
          this.logger.error(
            `Failed to send parent welcome email to ${this.maskEmail(email)}: ${result.error.message}`,
          );
          return false;
        }
        this.logger.log(
          `Parent welcome email sent to ${this.maskEmail(email)}`,
        );
        return true;
      })
      .catch((error) => {
        const errorStack =
          error instanceof Error ? error.stack : 'Unknown error';
        this.logger.error(
          `Failed to send parent welcome email to ${this.maskEmail(email)}`,
          errorStack,
        );
        return false;
      });
  };
}
