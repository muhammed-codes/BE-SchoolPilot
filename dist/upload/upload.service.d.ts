import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UploadApiResponse } from 'cloudinary';
export declare class UploadService implements OnModuleInit {
    private readonly configService;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    uploadFile: (fileBuffer: Buffer, folder: string) => Promise<UploadApiResponse>;
    deleteFile: (publicId: string) => Promise<{
        result: string;
    }>;
}
