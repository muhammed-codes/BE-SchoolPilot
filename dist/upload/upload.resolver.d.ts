import { UploadService } from './upload.service';
import { UploadResult } from './dto/upload-result.type';
import { Upload } from 'graphql-upload-ts';
export declare class UploadResolver {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    singleUpload(file: Upload, folder: string): Promise<UploadResult>;
}
