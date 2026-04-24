import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private configService;
    private resend;
    private readonly logger;
    constructor(configService: ConfigService);
    sendPasswordResetEmail(email: string, token: string): Promise<void>;
}
