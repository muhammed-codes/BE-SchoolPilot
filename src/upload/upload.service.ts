import {
  Injectable,
  OnModuleInit,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { FileUpload, Upload } from 'graphql-upload-ts';
import { UploadResult } from './dto/upload-result.type';

@Injectable()
export class UploadService implements OnModuleInit {
  private readonly logger = new Logger(UploadService.name);
  private readonly pdfUrlDurationSeconds = 60 * 60 * 24 * 7;
  private readonly getErrorMessage = (error: unknown) => {
    return error instanceof Error ? error.message : 'Unknown error';
  };
  private readonly getCloudinaryErrorMessage = (rawMessage?: string) => {
    const message = rawMessage || 'Unknown Cloudinary error';
    this.logger.error(`Cloudinary raw error: ${message}`);
    const normalized = message.toLowerCase();
    if (
      normalized.includes('invalid cloud_name') ||
      normalized.includes('cloud_name mismatch')
    ) {
      return 'Cloudinary configuration mismatch: CLOUDINARY_CLOUD_NAME must match the same Cloudinary product environment as CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET';
    }
    return 'Cloudinary provider error';
  };
  private readonly getDeliveryUrl = (result: UploadApiResponse) => {
    const format = (result?.format || '').toLowerCase();
    const base = { url: result?.secure_url || '' };
    if (format !== 'pdf') return base;

    const expiresAt =
      Math.floor(Date.now() / 1000) + this.pdfUrlDurationSeconds;
    const pdfPrivateUrl = cloudinary.utils.private_download_url(
      result.public_id,
      format,
      {
        resource_type: result.resource_type || 'image',
        type: result.type || 'upload',
        expires_at: expiresAt,
        attachment: true,
      },
    );
    return { ...base, pdfPrivateUrl, expiresAt };
  };
  private readonly resolveFileUpload = (
    file: Upload | Promise<FileUpload> | FileUpload,
  ): Promise<FileUpload> => {
    if (!file) {
      return Promise.reject(
        new HttpException('No file provided', HttpStatus.BAD_REQUEST),
      );
    }

    const uploadWithPromise = file as { promise?: Promise<FileUpload> };
    if (
      uploadWithPromise.promise &&
      typeof (uploadWithPromise.promise as Promise<FileUpload>).then ===
        'function'
    ) {
      return uploadWithPromise.promise;
    }

    const thenable = file as Promise<FileUpload>;
    if (typeof thenable.then === 'function') {
      return thenable;
    }

    const fileUpload = file as FileUpload;
    if (typeof fileUpload.createReadStream === 'function') {
      return Promise.resolve(fileUpload);
    }

    return Promise.reject(
      new HttpException(
        'Invalid file upload payload',
        HttpStatus.BAD_REQUEST,
      ),
    );
  };

  constructor(private readonly configService: ConfigService) {}

  private readonly validateCloudinaryConnection = (): Promise<void> => {
    return cloudinary.api.ping().then(() => undefined);
  };

  onModuleInit = (): Promise<void> => {
    cloudinary.config({
      cloud_name: this.configService
        .getOrThrow<string>('CLOUDINARY_CLOUD_NAME')
        .trim(),
      api_key: this.configService
        .getOrThrow<string>('CLOUDINARY_API_KEY')
        .trim(),
      api_secret: this.configService
        .getOrThrow<string>('CLOUDINARY_API_SECRET')
        .trim(),
    });
    return this.validateCloudinaryConnection()
      .then(() => {
        this.logger.log('Cloudinary startup validation passed');
      })
      .catch((error) => {
        const cloudinaryError = this.getCloudinaryErrorMessage(
          this.getErrorMessage(error),
        );
        this.logger.error(
          `Cloudinary startup validation failed: ${cloudinaryError}`,
        );
        throw new HttpException(
          `Cloudinary startup validation failed: ${cloudinaryError}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  };

  uploadFile = (
    file: Upload | Promise<FileUpload> | FileUpload,
    folder: string,
  ): Promise<UploadResult> => {
    return this.resolveFileUpload(file)
      .then(({ createReadStream }: { createReadStream: () => Readable }) => {
        return new Promise<UploadResult>((resolve, reject) => {
          const stream = createReadStream();
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'auto' },
            (error: UploadApiErrorResponse | undefined, result) => {
              if (error) {
                const cloudinaryError = this.getCloudinaryErrorMessage(
                  error.message,
                );
                this.logger.error(
                  `Cloudinary upload failed: ${cloudinaryError}`,
                );
                return reject(
                  new HttpException(
                    `File upload failed: ${cloudinaryError}`,
                    HttpStatus.BAD_REQUEST,
                  ),
                );
              }
              if (!result) {
                return reject(
                  new HttpException(
                    'File upload failed: empty provider response',
                    HttpStatus.BAD_REQUEST,
                  ),
                );
              }
              resolve({
                ...this.getDeliveryUrl(result),
                publicId: result.public_id,
              });
            },
          );
          stream.pipe(uploadStream);
        });
      })
      .catch((error: unknown) => {
        if (error instanceof HttpException) throw error;
        this.logger.error(
          `Upload processing failed: ${this.getErrorMessage(error)}`,
        );
        throw new HttpException(
          'File upload processing failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  };

  deleteFile = (publicId: string): Promise<void> => {
    return cloudinary.uploader
      .destroy(publicId)
      .then(() => undefined)
      .catch((error: unknown) => {
        const cloudinaryError = this.getCloudinaryErrorMessage(
          this.getErrorMessage(error),
        );
        this.logger.error(`Cloudinary delete failed: ${cloudinaryError}`);
        throw new HttpException(
          `File deletion failed: ${cloudinaryError}`,
          HttpStatus.BAD_REQUEST,
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
        (error: UploadApiErrorResponse | undefined, result) => {
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
          if (!result) {
            return reject(
              new HttpException(
                'Buffer upload failed: empty provider response',
                HttpStatus.BAD_REQUEST,
              ),
            );
          }
          resolve({
            ...this.getDeliveryUrl(result),
            publicId: result.public_id,
          });
        },
      );

      const readable = new Readable();
      readable.push(buffer);
      readable.push(null);
      readable.pipe(uploadStream);
    }).catch((error: unknown) => {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `Buffer upload processing failed: ${this.getErrorMessage(error)}`,
      );
      throw new HttpException(
        'Buffer upload processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  };

  uploadBase64 = (
    base64: string,
    folder: string,
    filename: string,
  ): Promise<UploadResult> => {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    return this.uploadBuffer(buffer, folder, filename);
  };
}
