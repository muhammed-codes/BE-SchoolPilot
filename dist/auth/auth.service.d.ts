import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly mailService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, mailService: MailService);
    register: (input: RegisterInput) => Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    login: (input: LoginInput) => Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens: (userId: string, refreshToken: string) => Promise<{
        user: User;
        accessToken: string;
        refreshToken: string;
    }>;
    logout: (userId: string) => Promise<boolean>;
    updateExpoPushToken: (userId: string, token: string) => Promise<boolean>;
    validateUser: (email: string, password: string) => Promise<User>;
    generateTokens: (user: User) => Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    hashData: (data: string) => Promise<string>;
    forgotPassword: (email: string) => Promise<boolean>;
    resetPassword: (token: string, newPassword: string) => Promise<boolean>;
}
