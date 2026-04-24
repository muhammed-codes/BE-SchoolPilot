import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
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
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  register = (input: RegisterInput) => {
    return this.usersService
      .findByEmail(input.email)
      .then((existing) => {
        if (existing) {
          throw new BadRequestException('User with this email already exists');
        }
        return this.hashData(input.password);
      })
      .then((passwordHash) =>
        this.usersService.create({
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          schoolId: input.schoolId,
          phone: input.phone,
          passwordHash,
        }),
      )
      .then((user) =>
        this.generateTokens(user).then((tokens) => ({ ...tokens, user })),
      );
  };

  login = (input: LoginInput) => {
    return this.validateUser(input.email, input.password).then((user) =>
      this.generateTokens(user).then((tokens) => ({ ...tokens, user })),
    );
  };

  refreshTokens = (userId: string, refreshToken: string) => {
    return this.usersService.findById(userId).then((user) => {
      if (!user || !user.refreshToken) {
        throw new ForbiddenException('Access denied');
      }

      return bcrypt
        .compare(refreshToken, user.refreshToken)
        .then((matches: boolean) => {
          if (!matches) {
            throw new ForbiddenException('Access denied');
          }
          return this.generateTokens(user).then((tokens) => ({
            ...tokens,
            user,
          }));
        });
    });
  };

  logout = (userId: string) => {
    return this.usersService
      .update(userId, { refreshToken: null } as any)
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
        throw new UnauthorizedException('Invalid credentials');
      }
      return bcrypt
        .compare(password, user.passwordHash)
        .then((isValid: boolean) => {
          if (!isValid) {
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
        ) as any,
      },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id } as Record<string, unknown>,
      {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES',
        ) as any,
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
    return this.usersService.findByEmail(email).then((user) => {
      if (!user) {
        return true;
      }

      const token = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
      const expires = new Date();
      expires.setHours(expires.getHours() + 1);

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
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (user.resetPasswordExpires < new Date()) {
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
          .then(() => true);
          .then(() => true);
      });
    });
  };
}
