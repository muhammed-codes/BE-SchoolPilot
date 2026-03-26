import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
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
    private extractSubFromRefreshToken;
}
