import {
  Injectable,
  OnModuleInit,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { Upload } from 'graphql-upload-ts';
import { UploadResult } from './dto/upload-result.type';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private readonly getCloudinaryErrorMessage = (rawMessage?: string) => {
    const message = rawMessage || 'Unknown Cloudinary error';
    const normalized = message.toLowerCase();
    if (
      normalized.includes('invalid cloud_name') ||
      normalized.includes('cloud_name mismatch')
    ) {
      return 'Cloudinary configuration mismatch: CLOUDINARY_CLOUD_NAME must match the same Cloudinary product environment as CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET';
    }
    return message;
  };

  constructor(private readonly configService: ConfigService) {}

  private readonly validateCloudinaryConnection = (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.api.ping((error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  };

  onModuleInit = (): Promise<void> => {
    cloudinary.config({
      cloud_name: this.configService
        .getOrThrow<string>('CLOUDINARY_CLOUD_NAME')
        .trim(),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY').trim(),
      api_secret: this.configService
        .getOrThrow<string>('CLOUDINARY_API_SECRET')
        .trim(),
    });
    return this.validateCloudinaryConnection()
      .then(() => {
        this.logger.log('Cloudinary startup validation passed');
      })
      .catch((error) => {
        const cloudinaryError = this.getCloudinaryErrorMessage(error.message);
        this.logger.error(
          `Cloudinary startup validation failed: ${cloudinaryError}`,
        );
        throw new HttpException(
          `Cloudinary startup validation failed: ${cloudinaryError}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  };

  uploadFile = (file: Upload, folder: string): Promise<UploadResult> => {
    return (file as any)
      .then(({ createReadStream }: { createReadStream: () => Readable }) => {
        return new Promise<UploadResult>((resolve, reject) => {
          const stream = createReadStream();
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error, result) => {
              if (error) {
                const cloudinaryError = this.getCloudinaryErrorMessage(
                  error.message,
                );
                this.logger.error(`Cloudinary upload failed: ${cloudinaryError}`);
                return reject(
                  new HttpException(
                    `File upload failed: ${cloudinaryError}`,
                    HttpStatus.BAD_REQUEST,
                  ),
                );
              }
              resolve({ url: result!.secure_url, publicId: result!.public_id });
            },
          );
          stream.pipe(uploadStream);
        });
      })
      .catch((error: any) => {
        if (error instanceof HttpException) throw error;
        this.logger.error(`Upload processing failed: ${error.message}`);
        throw new HttpException(
          'File upload processing failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  };

  deleteFile = (publicId: string): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error) => {
        if (error) {
          const cloudinaryError = this.getCloudinaryErrorMessage(error.message);
          this.logger.error(`Cloudinary delete failed: ${cloudinaryError}`);
          return reject(
            new HttpException(
              `File deletion failed: ${cloudinaryError}`,
              HttpStatus.BAD_REQUEST,
            ),
          );
        }
        resolve();
      });
    }).catch((error) => {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Delete processing failed: ${error.message}`);
      throw new HttpException(
        'File deletion processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  };

  uploadBuffer = (
    buffer: Buffer,
    folder: string,
    filename: string,
  ): Promise<UploadResult> => {
    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto', public_id: filename },
        (error, result) => {
          if (error) {
            const cloudinaryError = this.getCloudinaryErrorMessage(
              error.message,
            );
            this.logger.error(
              `Cloudinary buffer upload failed: ${cloudinaryError}`,
            );
            return reject(
              new HttpException(
                `Buffer upload failed: ${cloudinaryError}`,
                HttpStatus.BAD_REQUEST,
              ),
            );
          }
          resolve({ url: result!.secure_url, publicId: result!.public_id });
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    }).catch((error) => {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Buffer upload processing failed: ${error.message}`);
      throw new HttpException(
        'Buffer upload processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  };
}
