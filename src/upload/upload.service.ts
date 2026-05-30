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
  private readonly maxCloudinaryUploadAttempts = 3;
  private readonly getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (error && typeof error === 'object') {
      const obj = error as Record<string, unknown>;
      if (typeof obj['message'] === 'string') return obj['message'];
      if (typeof obj['error'] === 'string') return obj['error'];
    }
    if (typeof error === 'string') return error;
    return 'Unknown error';
  };
  private readonly isRetriableCloudinaryError = (rawMessage?: string) => {
    const normalized = String(rawMessage || '').toLowerCase();
    return (
      normalized.includes('socket hang up') ||
      normalized.includes('econnreset') ||
      normalized.includes('etimedout') ||
      normalized.includes('eai_again') ||
      normalized.includes('tls') ||
      normalized.includes('network')
    );
  };
  private readonly getCloudinaryErrorMessage = (rawMessage?: string) => {
    const message = rawMessage || 'Unknown Cloudinary error';
    this.logger.error(`Cloudinary raw error: ${message}`);
    const normalized = message.toLowerCase();
    if (this.isRetriableCloudinaryError(message)) {
      return 'Cloudinary network error. Please retry.';
    }
    if (
      normalized.includes('invalid cloud_name') ||
      normalized.includes('cloud_name mismatch')
    ) {
      return 'Cloudinary configuration mismatch: CLOUDINARY_CLOUD_NAME must match the same Cloudinary product environment as CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET';
    }
    if (
      normalized.includes('invalid image file') ||
      normalized.includes('invalid file')
    ) {
      return 'Invalid image payload sent to Cloudinary';
    }
    return 'Cloudinary provider error';
  };
  private readonly parseBase64Input = (base64: string) => {
    const rawInput = String(base64 || '').trim();
    if (!rawInput) {
      throw new HttpException('Image payload is required', HttpStatus.BAD_REQUEST);
    }
    const dataUrlMatch = rawInput.match(
      /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([\s\S]+)$/i,
    );
    const mimeType = dataUrlMatch?.[1] || '';
    const payload = (dataUrlMatch?.[2] || rawInput).replace(/\s+/g, '');
    if (!payload) {
      throw new HttpException(
        'Image payload is empty after normalization',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { mimeType, payload };
  };
  private readonly getMimeFormat = (mimeType?: string) => {
    const parts = String(mimeType || '').split('/');
    if (parts.length !== 2) return '';
    return parts[1].split('+')[0].toLowerCase();
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

    const wrappedFile = file as { file?: FileUpload | Promise<FileUpload> };
    if (wrappedFile.file) {
      const innerFile = wrappedFile.file as Promise<FileUpload> | FileUpload;
      if (typeof (innerFile as Promise<FileUpload>).then === 'function') {
        return innerFile as Promise<FileUpload>;
      }
      if (
        typeof (innerFile as FileUpload).createReadStream === 'function'
      ) {
        return Promise.resolve(innerFile as FileUpload);
      }
    }

    return Promise.reject(
      new HttpException(
        'Invalid file upload payload: expected a multipart Upload file',
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
        this.logger.warn(
          `Cloudinary startup ping failed (server will still start): ${cloudinaryError}`,
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
    options?: {
      resourceType?: 'auto' | 'image' | 'raw' | 'video';
      format?: string;
    },
  ): Promise<UploadResult> => {
    const uploadAttempt = (attempt: number): Promise<UploadResult> => {
      return new Promise<UploadResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: options?.resourceType || 'auto',
            public_id: filename,
            format: options?.format || undefined,
          },
          (error: UploadApiErrorResponse | undefined, result) => {
            if (error) {
              if (
                this.isRetriableCloudinaryError(error.message) &&
                attempt < this.maxCloudinaryUploadAttempts
              ) {
                this.logger.warn(
                  `Cloudinary buffer upload retry ${attempt + 1}/${this.maxCloudinaryUploadAttempts} for ${filename}`,
                );
                uploadAttempt(attempt + 1)
                  .then(resolve)
                  .catch(reject);
                return;
              }
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
      });
    };

    return uploadAttempt(1).catch((error: unknown) => {
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
    const parsed = this.parseBase64Input(base64);
    const buffer = Buffer.from(parsed.payload, 'base64');
    if (!buffer.length) {
      throw new HttpException(
        'Image payload could not be decoded from base64',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.uploadBuffer(buffer, folder, filename, {
      resourceType: 'image',
      format: this.getMimeFormat(parsed.mimeType) || undefined,
    });
  };
}
