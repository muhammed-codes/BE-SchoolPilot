import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import type { Request, Response } from 'express';

const createApp = async () => {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:9997',
    'http://localhost:9995',
    'http://localhost:9996',
    'http://localhost:3000',
    'http://127.0.0.1:9997',
    'http://127.0.0.1:9995',
    'http://127.0.0.1:9996',
    'http://127.0.0.1:3000',
  ].filter(Boolean) as string[];

  const isOriginAllowed = (origin?: string): boolean => {
    if (!origin) return true;
    const cleanOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.some((o) => o.replace(/\/$/, '') === cleanOrigin))
      return true;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin))
      return true;
    if (
      /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(
        cleanOrigin,
      )
    )
      return true;
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

  app.setGlobalPrefix('api');
  app.use(graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 }));
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  return app;
};

let cachedServer: ReturnType<typeof import('express')>;

const getServer = async () => {
  if (!cachedServer) {
    const app = await createApp();
    await app.init();
    cachedServer = app.getHttpAdapter().getInstance();
  }
  return cachedServer;
};

export default async (req: Request, res: Response) => {
  const server = await getServer();
  server(req, res);
};

if (!process.env.VERCEL) {
  const bootstrap = async () => {
    const app = await createApp();
    const port = process.env.PORT || 9998;
    await app.listen(port);
  };

  void bootstrap();
}
