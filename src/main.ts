import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { NestFactory } from '@nestjs/core';
import { Logger, RequestMethod, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL_ENV === 'production';

const createApp = async () => {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ALLOWED_ORIGINS || '').split(','),
  ].filter(Boolean) as string[];

  const isOriginAllowed = (origin?: string): boolean => {
    if (!origin) return true;
    const cleanOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.some(
        (allowedOrigin) =>
          allowedOrigin.trim().replace(/\/$/, '') === cleanOrigin,
      )
    )
      return true;
    if (!isProduction && process.env.VERCEL_ENV !== 'preview') {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin))
        return true;
      if (
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
          cleanOrigin,
        )
      )
        return true;
    }
    return false;
  };

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
  });

  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  return app;
};

const bootstrap = async () => {
  const app = await createApp();
  await app.listen(process.env.PORT || 9998);
};

void bootstrap().catch((error: unknown) => {
  const errorStack = error instanceof Error ? error.stack : String(error);
  Logger.error('Application bootstrap failed', errorStack);
  process.exitCode = 1;
});
