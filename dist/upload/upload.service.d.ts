import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Upload } from 'graphql-upload-ts';
import { UploadResult } from './dto/upload-result.type';
export declare class UploadService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    uploadFile: (file: Upload, folder: string) => Promise<UploadResult>;
    deleteFile: (publicId: string) => Promise<void>;
    uploadBuffer: (buffer: Buffer, folder: string, filename: string) => Promise<UploadResult>;
}
