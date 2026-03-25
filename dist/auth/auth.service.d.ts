import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}
export declare class AuthService {
    private readonly jwtService;
    private readonly configService;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateTokens: (payload: JwtPayload) => TokenPair;
    verifyRefreshToken: (token: string) => JwtPayload;
}
