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

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
    });
  }

  uploadFile = (file: Upload, folder: string): Promise<UploadResult> => {
    return (file as any)
      .then(({ createReadStream }: { createReadStream: () => Readable }) => {
        return new Promise<UploadResult>((resolve, reject) => {
          const stream = createReadStream();
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error, result) => {
              if (error) {
                this.logger.error(`Cloudinary upload failed: ${error.message}`);
                return reject(
                  new HttpException(
                    `File upload failed: ${error.message}`,
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
          this.logger.error(`Cloudinary delete failed: ${error.message}`);
          return reject(
            new HttpException(
              `File deletion failed: ${error.message}`,
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
            this.logger.error(
              `Cloudinary buffer upload failed: ${error.message}`,
            );
            return reject(
              new HttpException(
                `Buffer upload failed: ${error.message}`,
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
