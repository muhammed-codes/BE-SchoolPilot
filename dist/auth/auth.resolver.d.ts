import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { LoginInput } from './dto/login.input';
export declare class AuthResolver {
    private readonly authService;
    constructor(authService: AuthService);
    register(input: RegisterInput): Promise<{
        user: import("../users/entities/user.entity").User;
        accessToken: string;
        refreshToken: string;
    }>;
    login(input: LoginInput): Promise<{
        user: import("../users/entities/user.entity").User;
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(refreshToken: string): Promise<{
        user: import("../users/entities/user.entity").User;
        accessToken: string;
        refreshToken: string;
    }>;
    logout(user: {
        sub: string;
    }): Promise<boolean>;
    updateExpoPushToken(user: {
        sub: string;
    }, token: string): Promise<boolean>;
    forgotPassword(input: ForgotPasswordInput): Promise<boolean>;
    resetPassword(input: ResetPasswordInput): Promise<boolean>;
    private extractSubFromRefreshToken;
}
