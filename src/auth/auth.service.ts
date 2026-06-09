import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  private generateVerificationToken = (): { raw: string; hashed: string } => {
    const raw = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(raw).digest('hex');
    return { raw, hashed };
  };

  register = (input: RegisterInput) => {
    this.logger.log(`New user registration attempt for email: ${input.email}`);
    return this.usersService
      .findByEmail(input.email)
      .then((existing) => {
        if (existing) {
          this.logger.warn(`Registration failed: Email already exists: ${input.email}`);
          throw new BadRequestException('User with this email already exists');
        }
        return this.hashData(input.password);
      })
      .then((passwordHash) => {
        const { raw, hashed } = this.generateVerificationToken();
        return this.usersService
          .create({
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            role: input.role,
            schoolId: input.schoolId,
            phone: input.phone,
            passwordHash,
            isEmailVerified: false,
            emailVerificationToken: hashed,
          })
          .then((user) =>
            this.mailService
              .sendVerificationEmail(user.email, raw)
              .catch((err) => {
                 this.logger.error(`Failed to send verification email to ${user.email}`, err);
                 return null;
              })
              .then(() => user),
          );
      })
      .then((user) => {
        this.logger.log(`User registered successfully: ${user.email}`);
        return this.generateTokens(user).then((tokens) => ({ ...tokens, user }));
      });
  };

  login = (input: LoginInput) => {
    return this.validateUser(input.email, input.password).then((user) => {
      this.logger.log(`Successful login for user: ${input.email}`);
      return this.generateTokens(user).then((tokens) => ({ ...tokens, user }));
    });
  };

  verifyEmail = (token: string) => {
    return this.usersService.findByEmailVerificationToken(token).then((user) => {
      if (!user) {
        this.logger.warn(`Email verification failed: Invalid or expired token`);
        throw new BadRequestException('Invalid or expired verification token');
      }
      return this.usersService
        .update(user.id, {
          isEmailVerified: true,
          emailVerificationToken: null,
        })
        .then(() => {
          this.logger.log(`Email verified successfully for user ID: ${user.id}`);
          return true;
        });
    });
  };

  resendVerificationEmail = (email: string) => {
    this.logger.log(`Resend verification email requested for: ${email}`);
    return this.usersService.findByEmail(email).then((user) => {
      if (!user) return true;
      if (user.isEmailVerified) return true;

      const { raw, hashed } = this.generateVerificationToken();
      return this.usersService
        .update(user.id, { emailVerificationToken: hashed })
        .then(() => this.mailService.sendVerificationEmail(email, raw))
        .then(() => true);
    });
  };

  refreshTokens = (userId: string, refreshToken: string) => {
    return this.usersService.findById(userId).then((user) => {
      if (!user || !user.refreshToken) {
        this.logger.warn(`Suspicious refresh token attempt for user ID: ${userId}`);
        throw new ForbiddenException('Access denied');
      }

      return bcrypt
        .compare(refreshToken, user.refreshToken)
        .then((matches: boolean) => {
          if (!matches) {
            this.logger.warn(`Failed refresh token attempt (mismatch) for user ID: ${userId}`);
            throw new ForbiddenException('Access denied');
          }
          this.logger.log(`Tokens refreshed for user ID: ${userId}`);
          return this.generateTokens(user).then((tokens) => ({
            ...tokens,
            user,
          }));
        });
    });
  };

  logout = (userId: string) => {
    this.logger.log(`User logged out, ID: ${userId}`);
    return this.usersService
      .update(userId, { refreshToken: null })
      .then(() => true);
  };

  updateExpoPushToken = (userId: string, token: string) => {
    return this.usersService
      .update(userId, { expoPushToken: token })
      .then(() => true);
  };

  validateUser = (email: string, password: string): Promise<User> => {
    return this.usersService.findByEmail(email).then((user) => {
      if (!user) {
        this.logger.warn(`Failed login attempt (invalid email): ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }
      return bcrypt
        .compare(password, user.passwordHash)
        .then((isValid: boolean) => {
          if (!isValid) {
            this.logger.warn(`Failed login attempt (invalid password): ${email}`);
            throw new UnauthorizedException('Invalid credentials');
          }
          return user;
        });
    });
  };

  generateTokens = (user: User) => {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = this.jwtService.sign(
      { ...payload } as Record<string, unknown>,
      {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES',
        ) as never,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id } as Record<string, unknown>,
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES',
        ) as never,
      },
    );

    return this.hashData(refreshToken).then((hashedRefresh) =>
      this.usersService
        .update(user.id, { refreshToken: hashedRefresh })
        .then(() => ({ accessToken, refreshToken })),
    );
  };

  hashData = (data: string): Promise<string> => {
    return bcrypt.hash(data, 12);
  };

  forgotPassword = (email: string) => {
    this.logger.log(`Forgot password requested for: ${email}`);
    return this.usersService.findByEmail(email).then((user) => {
      if (!user) {
        return true;
      }

      const token = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 30);

      return this.usersService
        .update(user.id, {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: expires,
        })
        .then(() => {
          return this.mailService.sendPasswordResetEmail(email, token);
        })
        .then(() => true);
    });
  };

  resetPassword = (token: string, newPassword: string) => {
    return this.usersService.findByResetToken(token).then((user) => {
      if (!user || !user.resetPasswordExpires) {
        this.logger.warn(`Failed password reset attempt (invalid token)`);
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (user.resetPasswordExpires < new Date()) {
        this.logger.warn(`Failed password reset attempt (expired token) for user ID: ${user.id}`);
        throw new BadRequestException('Reset token has expired');
      }

      return bcrypt.hash(newPassword, 12).then((passwordHash: string) => {
        return this.usersService
          .update(user.id, {
            passwordHash,
            refreshToken: null,
            resetPasswordToken: null,
            resetPasswordExpires: null,
          })
          .then(() => {
            this.logger.log(`Password reset successfully for user ID: ${user.id}`);
            return true;
          });
      });
    });
  };
}

